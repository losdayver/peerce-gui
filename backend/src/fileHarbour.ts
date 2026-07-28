import type {
  FileHarborState,
  FileHarborStateItem,
} from "@commonTypes/file-harbour.js";
import path, { basename } from "node:path";
import { WSFHRegisterPeerMessage } from "@commonTypes/ws-message.js";
import { SimplePeer } from "peerce";
import { readFileSync, writeFileSync, mkdir } from "node:fs";

const demoPeerTag = "demo-peer";

interface PeerConnection {
  getState: () => FileHarborStateItem["state"];
  getTransfers: () => FileHarborStateItem["transfers"];
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
        transfers: peerConn.getTransfers(),
      })
    );
    return { items };
  };
}

class LivePeerConnection implements PeerConnection {
  peer: SimplePeer;
  transfers = new Map<string, { fileName: string; progress: number }>();

  constructor(payload: WSFHRegisterPeerMessage["payload"]) {
    this.peer = new SimplePeer(payload);
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
    this.transfers.set(fileName, { fileName, progress: 0 });
  };

  onIncomingTransmissionPercentageChange = (
    fileName: string,
    progress: number
  ) => {
    const transfer = this.transfers.get(fileName);
    if (!transfer) return;
    transfer.progress = progress;
  };

  onFullMessage = ({ buffer, fileName }) => {
    writeFileSync(path.join("./out", basename(fileName)), buffer);
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

  addTransfer = (fullFilePath: string) => {
    this.peer.sendData({
      fileName: basename(fullFilePath),
      payload: readFileSync(fullFilePath),
    });
  };

  getTransfers = (): FileHarborStateItem["transfers"] => [
    ...this.transfers.values(),
  ];
}

class DemoPeerConnection implements PeerConnection {
  private state: FileHarborStateItem["state"] = "connected";
  private transferCount = 0;
  private transfers: FileHarborStateItem["transfers"] = [];

  getState = (): FileHarborStateItem["state"] => this.state;

  getTransfers = (): FileHarborStateItem["transfers"] => this.transfers;

  unregister = (): void => {
    this.state = "offline";
  };

  addTransfer = (fullFilePath: string): void => {
    this.transferCount += 1;
    this.transfers = [
      ...this.transfers,
      {
        fileName:
          basename(fullFilePath) || `demo-file-${this.transferCount}.txt`,
        progress: 0.5,
      },
    ];
  };
}
