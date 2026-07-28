import type {
  FileHarborState,
  FileHarborStateItem,
} from "@commonTypes/file-harbour.js";
import { basename, join } from "node:path";
import { WSFHRegisterPeerMessage } from "@commonTypes/ws-message.js";
import { SimplePeer } from "peerce";
import { writeFile, readFile } from "fs/promises";
import { homedir } from "os";
import { homeDirFolderName } from "./configProvider.js";
import { mkdir } from "node:fs/promises";

const demoPeerTag = "demo-peer";

interface PeerConnection {
  getState: () => FileHarborStateItem["state"];
  getTransfers: () => Pick<
    FileHarborStateItem,
    "incomingTransfers" | "outgoingTransfers"
  >;
  unregister: () => void;
  addTransfer: (fullFilePath: string) => void;
}

export class FileHarbor {
  constructor(private sendUpdateMessage: () => void) {
    this.peerConnectionMap.set(demoPeerTag, new DemoPeerConnection());

    setInterval(() => {
      this.sendUpdateMessage();
    }, 500);
  }

  peerConnectionMap = new Map<string, PeerConnection>();

  registerPeer = (payload: WSFHRegisterPeerMessage["payload"]) => {
    // todo check if exists

    const connection = new LivePeerConnection(payload);
    this.peerConnectionMap.set(payload.selfTag, connection);
    this.sendUpdateMessage();
  };
  unregisterPeer = (tag: string): void => {
    const peerConn = this.peerConnectionMap.get(tag);
    if (!peerConn) return;
    peerConn.unregister();
    this.sendUpdateMessage();
  };
  addTransfer = (tag: string, fullFilePath: string): void => {
    const peerConn = this.peerConnectionMap.get(tag);
    if (!peerConn) return;
    peerConn.addTransfer(fullFilePath);
    this.sendUpdateMessage();
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
  private outgoingTransfers: FileHarborStateItem["outgoingTransfers"] = [];
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
      case "connectingToRelay":
        return "connecting";
      case "connectedToPeer":
        return "connected";
    }
  };

  unregister = () => {
    this.peer.close();
  };

  addTransfer = async (fullFilePath: string) => {
    const fileName = basename(fullFilePath);
    const payload = await readFile(fullFilePath);
    this.peer.sendData({
      fileName,
      payload,
    });
    this.outgoingTransfers = [
      ...this.outgoingTransfers,
      { fileName, progress: 1 },
    ];
  };

  getTransfers = () => ({
    incomingTransfers: [...this.incomingTransfers.values()],
    outgoingTransfers: this.outgoingTransfers,
  });
}

class DemoPeerConnection implements PeerConnection {
  private state: FileHarborStateItem["state"] = "connected";
  private transferCount = 0;
  private incomingTransfers: FileHarborStateItem["incomingTransfers"] = [];
  private outgoingTransfers: FileHarborStateItem["outgoingTransfers"] = [];

  getState = (): FileHarborStateItem["state"] => this.state;

  getTransfers = () => ({
    incomingTransfers: this.incomingTransfers,
    outgoingTransfers: this.outgoingTransfers,
  });

  unregister = (): void => {
    this.state = "offline";
  };

  addTransfer = (fullFilePath: string): void => {
    this.transferCount += 1;
    this.outgoingTransfers = [
      ...this.outgoingTransfers,
      {
        fileName:
          basename(fullFilePath) || `demo-file-${this.transferCount}.txt`,
        progress: 0.5,
      },
    ];
  };
}
