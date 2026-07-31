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
  getAllConnections,
  insertNewConnection,
} from "./db/provider.js";

interface PeerConnection {
  getState: () => FileHarborStateItem["state"];
  getTransfers: () => Pick<
    FileHarborStateItem,
    "incomingTransfers" | "outgoingTransfers"
  >;
  disconnect: () => void;
  clearListeners: () => void;
  addTransfer: (fullFilePath: string) => void;
}

export class FileHarbor {
  constructor(private sendUpdateMessage: (state: FileHarborState) => void) {
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

    setInterval(() => {
      this.notifyState();
    }, 500);
  }

  peerConnectionMap = new Map<string, PeerConnection>();

  private notifyState = (): void => {
    this.sendUpdateMessage(this.getConstructedState());
  };

  registerPeer = (
    payload: WSFHRegisterPeerMessage["payload"],
    doNotInsert = false
  ) => {
    // todo check if exists

    const connection = new LivePeerConnection(payload);
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
  addTransfer = (tag: string, fullFilePath: string): void => {
    const peerConn = this.peerConnectionMap.get(tag);
    if (!peerConn) return;
    peerConn.addTransfer(fullFilePath);
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

  constructor(payload: WSFHRegisterPeerMessage["payload"]) {
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
    void this.peer.requestSessionViaRelayAsync();
  }

  onIncomingTransmissionStart = (fileName: string) => {
    this.incomingTransfers.set(fileName, { fileName, progress: 0 });
  };

  onIncomingTransmissionPercentageChange = (
    fileName: string,
    progress: number
  ) => {
    const transfer = this.incomingTransfers.get(fileName);
    if (!transfer) return;
    transfer.progress = progress;
  };

  onOutgoingTransmissionPercentageChange = (
    fileName: string,
    progress: number
  ) => {
    const transfer = this.outgoingTransfers.get(fileName);
    if (!transfer) return;
    transfer.progress = progress;
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

  disconnect = () => {
    this.peer.close();
  };

  clearListeners = (): void => {
    this.peer.removeAllListeners();
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
