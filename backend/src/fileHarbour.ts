import type {
  FileHarborState,
  FileHarborStateItem,
} from "@commonTypes/fileHarbour.js";
import { basename, join } from "node:path";
import { WSFHRegisterPeerMessage } from "@commonTypes/wsMessage.js";
import { getKnownTagsEntry, SimplePeer } from "peerce";
import { writeFile, readFile } from "fs/promises";
import { homedir } from "os";
import { homeDirFolderName, peerceHomeDir } from "./configProvider.js";
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
import { FHConnectionTransferTableState } from "./db/initAndMigrate.js";
import type { FHConnectionTransferTable } from "./db/initAndMigrate.js";
import { setTimeout as sleep } from "node:timers/promises";

const RELAY_REQUEST_TIMEOUT_MS = 40_000;

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
        aggressive,
        encrypt,
      }) =>
        this.registerPeer(
          {
            distantTag: distant_tag,
            relayAddr: relay_addr,
            relayPort: relay_port,
            selfAddr: self_addr ?? undefined,
            selfPort: self_port ?? undefined,
            selfTag: self_tag,
            aggressive: !!aggressive,
            encrypt: !!encrypt,
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

  peerConnectionMap = new Map<string, LivePeerConnection>();
  private reconnectingPeerTags = new Set<string>();

  private notifyState = async (): Promise<void> => {
    this.sendUpdateMessage(await this.getConstructedState());
  };

  registerPeer = (
    payload: WSFHRegisterPeerMessage["payload"],
    doNotInsert = false,
    isUpdate = false
  ) => {
    const { distantTag, relayAddr, relayPort, selfTag, selfAddr, selfPort } =
      payload;

    const liveConn = this.peerConnectionMap.get(distantTag);
    if (
      !isUpdate &&
      liveConn?.distantTag == distantTag &&
      liveConn?.relayAddr == relayAddr &&
      liveConn?.relayPort == relayPort
    ) {
      this.sendUIMessage("🚨 Peer already registered");
      return;
    }

    const transfers = isUpdate
      ? getConnectionTransfersByDistantTag(distantTag)
      : [];

    const connection = new LivePeerConnection(this, payload, isUpdate);
    transfers.forEach((transfer) => connection.restoreTransfer(transfer));
    if (isUpdate) liveConn?.clearListeners();
    this.peerConnectionMap.set(payload.distantTag, connection);
    if (!doNotInsert) {
      console.log(payload);
      insertNewConnection({
        distant_tag: distantTag,
        self_tag: selfTag,
        relay_addr: relayAddr,
        relay_port: relayPort,
        self_addr: selfAddr ?? null,
        self_port: selfPort ?? null,
        aggressive: payload.aggressive ? 1 : 0,
        encrypt: payload.encrypt ? 1 : 0,
      });
    }
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
        aggressive,
        encrypt,
      } = dbConnection;

      const connection = new LivePeerConnection(this, {
        distantTag: distant_tag,
        relayAddr: relay_addr,
        relayPort: relay_port,
        selfTag: self_tag,
        selfAddr: self_addr ?? undefined,
        selfPort: self_port ?? undefined,
        aggressive: !!aggressive,
        encrypt: !!encrypt,
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
      incoming: 0,
    });
    this.notifyState();
  };

  getConstructedState = async (): Promise<FileHarborState> => {
    const items: FileHarborStateItem[] = await Promise.all(
      Array.from(this.peerConnectionMap.entries(), async ([tag, peerConn]) => {
        const knownTagsEntry = await getKnownTagsEntry(
          tag,
          join(peerceHomeDir, "vault")
        ); // todo this is bad, cache this or something
        return {
          tag,
          selfTag: peerConn.selfTag,
          selfAddr: peerConn.selfAddr,
          selfPort: peerConn.selfPort,
          relayAddr: peerConn.relayAddr,
          relayPort: peerConn.relayPort,
          aggressive: peerConn.aggressive,
          encrypt: peerConn.encrypt,
          state: peerConn.getState(),
          fingerprint: knownTagsEntry ? knownTagsEntry.fingerprint : undefined,
          ...peerConn.getTransfers(),
        };
      })
    );
    return { items };
  };
}

class LivePeerConnection {
  peer: SimplePeer;
  private incomingTransfers = new Map<
    string,
    { fileName: string; progress: number }
  >();
  private outgoingTransfers = new Map<
    string,
    { fileName: string; progress: number }
  >();
  distantTag: string;
  selfTag: string;
  selfAddr?: string;
  selfPort?: number;
  relayAddr: string;
  relayPort: number;
  aggressive: boolean;
  encrypt: boolean;
  private relayRequestTimeout?: NodeJS.Timeout;

  constructor(
    private fileHarbour: FileHarbor,
    payload: WSFHRegisterPeerMessage["payload"],
    doNotConnect = false
  ) {
    this.peer = new SimplePeer(payload);
    this.distantTag = payload.distantTag;
    this.selfTag = payload.selfTag;
    this.selfAddr = payload.selfAddr;
    this.selfPort = payload.selfPort;
    this.aggressive = !!payload.aggressive;
    this.encrypt = !!payload.encrypt;
    this.relayAddr = payload.relayAddr;
    this.relayPort = payload.relayPort;
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
    this.peer.once("onConnectedToRelay", this.startRelayRequestTimeout);
    this.peer.on("onConnectedToPeer", () => {
      this.clearRelayRequestTimeout();
      this.fileHarbour.sendUIMessage(`🔌 Connected to "${this.distantTag}"`);
    });
    this.peer.on("onClosing", (reason) => {
      this.clearRelayRequestTimeout();
      if (reason == "RELAY_CLOSE") {
        if (this.aggressive)
          sleep(2000).then(() =>
            this.fileHarbour.reconnectPeer(this.distantTag)
          );
        return;
      }
      this.fileHarbour.sendUIMessage(
        `🔌 Disconnected from "${this.distantTag}"`
      );
    });
    this.peer.on("onEncryptionNegotiationFailed", () => {
      this.fileHarbour.sendUIMessage(
        `❌ Negotiation failed with "${this.distantTag}" due to encryption settings mismatch`
      );
    });
    this.peer.on("onPublicKeyMismatch", () => {
      this.peer.close("SELF_CLOSE");
      this.fileHarbour.sendUIMessage(
        `⚠️ "${this.distantTag}" fingerprint check failed! This peer might be an impostor! Force disconnected...`
      );
    });
    if (!doNotConnect) void this.peer.requestSessionViaRelayAsync();
  }

  private startRelayRequestTimeout = (): void => {
    this.relayRequestTimeout = setTimeout(() => {
      this.relayRequestTimeout = undefined;
      if (this.peer.stateMachine.getCurrentState() !== "connectingToPeer") {
        return;
      }

      void this.peer.close("RELAY_CLOSE").catch((error: unknown) => {
        console.error(
          `Failed to close timed-out relay request for "${this.distantTag}"`,
          error
        );
      });
    }, RELAY_REQUEST_TIMEOUT_MS);
    this.relayRequestTimeout.unref();
  };

  private clearRelayRequestTimeout = (): void => {
    clearTimeout(this.relayRequestTimeout);
    this.relayRequestTimeout = undefined;
  };

  onIncomingTransmissionStart = (fileName: string) => {
    this.incomingTransfers.set(fileName, { fileName, progress: 0 });
    insertNewConnectionTransfer({
      distant_tag: this.distantTag,
      file_name: basename(fileName),
      incoming: 1,
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
        incoming: 0,
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
        incoming: 1,
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
    this.fileHarbour.sendUIMessage(`📄 "${fileName}" saved`);
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
    this.clearRelayRequestTimeout();
    this.peer.removeAllListeners();
  };

  restoreTransfer = (transfer: FHConnectionTransferTable): void => {
    const restoredTransfer = {
      fileName: transfer.file_name,
      progress:
        transfer.state === FHConnectionTransferTableState.COMPLETED ? 1 : 0,
    };

    if (transfer.incoming === 1) {
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
