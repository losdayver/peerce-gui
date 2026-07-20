export interface WSGenericMessage {
  type: string;
  payload?: any;
}

export type WSMessages =
  | WSTestMessage
  | WSAddPeerMessage
  | WSRequestUpdatePeerListMessage;

//#region mutual exchange
export interface WSTestMessage {
  type: "test";
  payload: "ping" | "pong";
}
//#endregion

//#region client => server
export interface WSAddPeerMessage {
  type: "add-peer";
  payload: {
    relayAddr: string;
    relayPort: number;
    selfTag: string;
    distantTag: string;
    selfAddr: string;
    selfPort: number;
  };
}

export interface WSRequestUpdatePeerListMessage {
  type: "request-update-peer-list";
}
//#endregion

//#region server => client
export interface WSUpdatePeerListMessage {
  type: "update-peer-list";
  payload: { tag: string }[];
}
//#endregion
