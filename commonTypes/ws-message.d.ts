import { FileHarborState } from "./file-harbour.js";

export interface WSGenericMessage {
  type: string;
  payload?: any;
}

export type WSMessages =
  | WSTestMessage
  | WSAddPeerMessage
  | WSRequestUpdatePeerListMessage
  | WSRemovePeerMessage
  | WSFileHarbourState;

//#region mutual exchange
export interface WSTestMessage {
  type: "test";
  payload: "ping" | "pong";
}
//#endregion

//#region client => server
export interface WSAddPeerMessage {
  type: "file-harbour-register-peer";
  payload: {
    relayAddr: string;
    relayPort: number;
    selfTag: string;
    distantTag: string;
    selfAddr: string;
    selfPort: number;
  };
}

export interface WSRemovePeerMessage {
  type: "file-harbour-unregister-peer";
  payload: {
    tag: string;
  };
}

export interface WSRequestUpdatePeerListMessage {
  type: "file-harbour-request-state";
}
//#endregion

//#region server => client
export interface WSFileHarbourState {
  type: "file-harbour-state";
  payload: FileHarborState;
}
//#endregion
