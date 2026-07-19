export interface WSGenericMessage {
  type: string;
  payload: any;
}

export type WSMessages = WSTestMessage;

//#region mutual exchange
export interface WSTestMessage {
  type: "test";
  payload: "ping" | "pong";
}
//#endregion

//#region client => server
//#endregion

//#region server => client
//#endregion
