import { GlobalAppConfig } from "./app.js";
import {
  FileHarborCurrentPeerInfo,
  FileHarborState,
} from "./fileHarbour.js";

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
  | WSFHReconnectPeerMessage
  | WSFileHarbourUIMessage
  | WSFHEditPeerMessage
  | WSFHGetCurrentPeerInfoMessage;

//#region mutual exchange
export interface WSTestMessage {
  type: "test";
  payload: "ping" | "pong";
}

export interface WSAppGetConfigMessage {
  type: "app-get-config";
  payload?: GlobalAppConfig;
}

export interface WSFHGetCurrentPeerInfoMessage {
  type: "file-harbour-get-current-peer-info";
  payload?: FileHarborCurrentPeerInfo;
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
    aggressive?: boolean;
    encrypt?: boolean;
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

export interface WSFHEditPeerMessage {
  type: "file-harbour-edit-peer";
  payload: {
    selfTag: string;
    distantTag: string;
    relayAddr: string;
    relayPort: number;
    selfAddr?: string;
    selfPort?: number;
    aggressive?: boolean;
    encrypt?: boolean;
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

export interface WSFileHarbourUIMessage {
  type: "file-harbour-ui-message";
  payload: { message: string };
}
//#endregion
