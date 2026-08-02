import type {
  FileHarborState,
  FileHarborStateItem,
} from "@commonTypes/fileHarbour.js";
import { basename, join } from "node:path";
import { WSFHRegisterPeerMessage } from "@commonTypes/wsMessage.js";
import { SimplePeer } from "peerce";
import { writeFile, readFile } from "fs/promises";
import { homedir } from "os";
import { homeDirFolderName } from "./configProvider.js";
import { mkdir } from "node:fs/promises";
import {
  deleteConnection,
  getAllConnectionTransfers,
  getAllConnections,
  getConnectionTransfersByDistantTag,
  getConnectionsByDistantTag,
  insertNewConnection,
  insertNewConnectionTransfer,
} from "./db/provider.js";
import {
  FHConnectionTransferTableIncoming,
  FHConnectionTransferTableState,
} from "./db/initAndMigrate.js";
import type { FHConnectionTransferTable } from "./db/initAndMigrate.js";

interface PeerConnection {
  getState: () => FileHarborStateItem["state"];
  getTransfers: () => Pick<
    FileHarborStateItem,
    "incomingTransfers" | "outgoingTransfers"
  >;
  disconnect: () => Promise<void>;
  clearListeners: () => void;
  restoreTransfer: (transfer: FHConnectionTransferTable) => void;
  addTransfer: (fullFilePath: string) => void;
}

export class FileHarbor {
  constructor(
    private sendUpdateMessage: (state: FileHarborState) => void,
    public sendUIMessage: (message: string) => void
  ) {
    const connections = getAllConnections();
    connections.forEach(
      ({
        distant_tag,
        relay_addr,
        relay_port,
        self_addr,
        self_port,
        self_tag,
      }) =>
        this.registerPeer(
          {
            distantTag: distant_tag,
            relayAddr: relay_addr,
            relayPort: relay_port,
            selfAddr: self_addr ?? undefined,
            selfPort: self_port ?? undefined,
            selfTag: self_tag,
          },
          true
        )
    );

    getAllConnectionTransfers().forEach((transfer) => {
      this.peerConnectionMap
        .get(transfer.distant_tag)
        ?.restoreTransfer(transfer);
    });

    setInterval(() => {
      this.notifyState();
    }, 500);
  }

  peerConnectionMap = new Map<string, PeerConnection>();
  private reconnectingPeerTags = new Set<string>();

  private notifyState = (): void => {
    this.sendUpdateMessage(this.getConstructedState());
  };

  registerPeer = (
    payload: WSFHRegisterPeerMessage["payload"],
    doNotInsert = false
  ) => {
    // todo check if exists

    const connection = new LivePeerConnection(this, payload);
    this.peerConnectionMap.set(payload.distantTag, connection);
    const { distantTag, relayAddr, relayPort, selfTag, selfAddr, selfPort } =
      payload;
    if (!doNotInsert)
      insertNewConnection({
        distant_tag: distantTag,
        self_tag: selfTag,
        relay_addr: relayAddr,
        relay_port: relayPort,
        self_addr: selfAddr ?? null,
        self_port: selfPort ?? null,
      });
    this.notifyState();
  };
  unregisterPeer = (tag: string): void => {
    const peerConn = this.peerConnectionMap.get(tag);
    if (!peerConn) return;
    peerConn.clearListeners();
    this.peerConnectionMap.delete(tag);
    deleteConnection(tag);
    this.notifyState();
  };
  disconnectPeer = (tag: string): void => {
    const peerConn = this.peerConnectionMap.get(tag);
    if (!peerConn) return;
    peerConn.disconnect();
    this.notifyState();
  };
  reconnectPeer = async (tag: string): Promise<void> => {
    const peerConn = this.peerConnectionMap.get(tag);
    if (!peerConn || this.reconnectingPeerTags.has(tag)) return;

    this.reconnectingPeerTags.add(tag);
    try {
      const dbConnection = getConnectionsByDistantTag(tag);
      if (!dbConnection) return;

      const transfers = getConnectionTransfersByDistantTag(tag);
      await peerConn.disconnect();
      peerConn.clearListeners();

      if (this.peerConnectionMap.get(tag) !== peerConn) return;

      const {
        distant_tag,
        relay_addr,
        relay_port,
        self_addr,
        self_port,
        self_tag,
      } = dbConnection;

      const connection = new LivePeerConnection(this, {
        distantTag: distant_tag,
        relayAddr: relay_addr,
        relayPort: relay_port,
        selfTag: self_tag,
        selfAddr: self_addr ?? undefined,
        selfPort: self_port ?? undefined,
      });

      transfers.forEach((transfer) => connection.restoreTransfer(transfer));
      this.peerConnectionMap.set(tag, connection);
      this.notifyState();
    } finally {
      this.reconnectingPeerTags.delete(tag);
    }
  };
  addTransfer = (tag: string, fullFilePath: string): void => {
    const peerConn = this.peerConnectionMap.get(tag);
    if (!peerConn) return;
    peerConn.addTransfer(fullFilePath);
    insertNewConnectionTransfer({
      distant_tag: tag,
      file_name: basename(fullFilePath),
      incoming: FHConnectionTransferTableIncoming.FALSE,
    });
    this.notifyState();
  };
  getConstructedState = (): FileHarborState => {
    const items: FileHarborStateItem[] = Array.from(
      this.peerConnectionMap.entries(),
      ([tag, peerConn]) => ({
        tag,
        state: peerConn.getState(),
        ...peerConn.getTransfers(),
      })
    );
    return { items };
  };
}

class LivePeerConnection implements PeerConnection {
  peer: SimplePeer;
  private incomingTransfers = new Map<
    string,
    { fileName: string; progress: number }
  >();
  private outgoingTransfers = new Map<
    string,
    { fileName: string; progress: number }
  >();
  private distantTag: string;

  constructor(
    private fileHarbour: FileHarbor,
    payload: WSFHRegisterPeerMessage["payload"]
  ) {
    this.peer = new SimplePeer(payload);
    this.distantTag = payload.distantTag;
    this.peer.on("onFullMessage", this.onFullMessage);
    this.peer.on(
      "onIncomingTransmissionStart",
      this.onIncomingTransmissionStart
    );
    this.peer.on(
      "onIncomingTransmissionPercentageChange",
      this.onIncomingTransmissionPercentageChange
    );
    this.peer.on(
      "onOutgoingTransmissionPercentageChange",
      this.onOutgoingTransmissionPercentageChange
    );
    this.peer.on("onConnectedToPeer", () => {
      this.fileHarbour.sendUIMessage(`🔌 Connected to "${this.distantTag}"`);
    });
    this.peer.on("onClosing", () => {
      this.fileHarbour.sendUIMessage(
        `🔌 Disconnected from "${this.distantTag}"`
      );
    });
    void this.peer.requestSessionViaRelayAsync();
  }

  onIncomingTransmissionStart = (fileName: string) => {
    this.incomingTransfers.set(fileName, { fileName, progress: 0 });
    insertNewConnectionTransfer({
      distant_tag: this.distantTag,
      file_name: basename(fileName),
      incoming: FHConnectionTransferTableIncoming.TRUE,
    });
    this.fileHarbour.sendUIMessage(
      `📩 New incoming transmission from ${this.distantTag}, sending "${fileName}"`
    );
  };

  onIncomingTransmissionPercentageChange = (
    fileName: string,
    progress: number
  ) => {
    const transfer = this.incomingTransfers.get(fileName);
    if (!transfer) return;
    transfer.progress = progress;
    if (progress == 1)
      insertNewConnectionTransfer({
        distant_tag: this.distantTag,
        file_name: basename(transfer.fileName),
        incoming: FHConnectionTransferTableIncoming.TRUE,
        state: FHConnectionTransferTableState.COMPLETED,
      });
  };

  onOutgoingTransmissionPercentageChange = (
    fileName: string,
    progress: number
  ) => {
    const transfer = this.outgoingTransfers.get(fileName);
    if (!transfer) return;
    transfer.progress = progress;
    if (progress == 1)
      insertNewConnectionTransfer({
        distant_tag: this.distantTag,
        file_name: basename(transfer.fileName),
        incoming: FHConnectionTransferTableIncoming.FALSE,
        state: FHConnectionTransferTableState.COMPLETED,
      });
  };

  onFullMessage = async ({ buffer, fileName }) => {
    const distantPeerDir = join(
      homedir(),
      homeDirFolderName,
      "file-harbour",
      "transmissions",
      this.distantTag
    );
    await mkdir(distantPeerDir, { recursive: true });
    await writeFile(join(distantPeerDir, basename(fileName)), buffer);
    this.fileHarbour.sendUIMessage(`📁 "${fileName}" saved`);
  };

  getState = (): FileHarborStateItem["state"] => {
    const state = this.peer.stateMachine.getCurrentState();

    switch (state) {
      case null:
      case "idle":
      case "closing":
      case "closed":
      case "error":
        return "offline";
      case "connectingToPeer":
        return "request sent";
      case "connectingToRelay":
        return "connecting";
      case "connectedToPeer":
        return "connected";
    }
  };

  disconnect = (): Promise<void> => this.peer.close();

  clearListeners = (): void => {
    this.peer.removeAllListeners();
  };

  restoreTransfer = (transfer: FHConnectionTransferTable): void => {
    const restoredTransfer = {
      fileName: transfer.file_name,
      progress:
        transfer.state === FHConnectionTransferTableState.COMPLETED ? 1 : 0,
    };

    if (transfer.incoming === FHConnectionTransferTableIncoming.TRUE) {
      this.incomingTransfers.set(transfer.file_name, restoredTransfer);
    } else {
      this.outgoingTransfers.set(transfer.file_name, restoredTransfer);
    }
  };

  addTransfer = async (fullFilePath: string) => {
    const fileName = basename(fullFilePath);
    const payload = await readFile(fullFilePath);
    this.peer.createOutgoingTransmission({
      fileName,
      payload,
    });
    this.outgoingTransfers.set(fileName, { fileName, progress: 0 });
  };

  getTransfers = () => ({
    incomingTransfers: [...this.incomingTransfers.values()],
    outgoingTransfers: [...this.outgoingTransfers.values()],
  });
}
