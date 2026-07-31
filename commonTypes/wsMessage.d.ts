import { GlobalAppConfig } from "./app.js";
import { FileHarborState } from "./fileHarbour.js";

export interface WSGenericMessage {
  type: string;
  payload?: any;
}

export type WSMessages =
  | WSTestMessage
  | WSFHRegisterPeerMessage
  | WSFHDisconnectPeerMessage
  | WSFHRequestStateMessage
  | WSFHAddTransferMessage
  | WSFileHarbourState
  | WSAppSaveConfigMessage
  | WSAppGetConfigMessage
  | WSFHUnregisterPeerMessage
  | WSFHReconnectPeerMessage;

//#region mutual exchange
export interface WSTestMessage {
  type: "test";
  payload: "ping" | "pong";
}

export interface WSAppGetConfigMessage {
  type: "app-get-config";
  payload?: GlobalAppConfig;
}
//#endregion

//#region client => server
export interface WSFHRegisterPeerMessage {
  type: "file-harbour-register-peer";
  payload: {
    relayAddr: string;
    relayPort: number;
    selfTag: string;
    distantTag: string;
    selfAddr?: string;
    selfPort?: number;
  };
}

export interface WSFHDisconnectPeerMessage {
  type: "file-harbour-disconnect-peer";
  payload: {
    tag: string;
  };
}

export interface WSFHUnregisterPeerMessage {
  type: "file-harbour-unregister-peer";
  payload: {
    tag: string;
  };
}

export interface WSFHReconnectPeerMessage {
  type: "file-harbour-reconnect-peer";
  payload: {
    tag: string;
  };
}

export interface WSFHAddTransferMessage {
  type: "file-harbour-add-transfer";
  payload: {
    tag: string;
    fullFilePath: string;
  };
}

export interface WSFHRequestStateMessage {
  type: "file-harbour-request-state";
}

export interface WSAppSaveConfigMessage {
  type: "app-save-config";
  payload: GlobalAppConfig;
}
//#endregion

//#region server => client
export interface WSFileHarbourState {
  type: "file-harbour-state";
  payload: FileHarborState;
}
//#endregion
