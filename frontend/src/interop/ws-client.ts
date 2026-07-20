import type {
  WSAddPeerMessage,
  WSGenericMessage,
  WSMessages,
  WSRequestUpdatePeerListMessage,
  WSTestMessage,
} from "@commonTypes/ws-message.js";
import { createContext, RefObject } from "react";

export const wsClientContext = createContext<RefObject<WsClient | null>>({
  current: null,
});

type WsMessageHandler<M extends WSGenericMessage = WSGenericMessage> = (
  message: M
) => void | Promise<void>;

export class WsClient {
  readonly eventEmitter = new EventTarget();

  constructor(private ws: WebSocket) {
    ws.onopen = () => {
      this.eventEmitter.dispatchEvent(new Event("open"));
      ws.onmessage = this.genericMessageHandler;
    };
  }

  private genericMessageHandler = async (message: any) => {
    if (
      typeof message.data == "string" &&
      message.data.startsWith("SERVER ERROR")
    )
      throw new Error(message.data);
    try {
      const genericMessage = JSON.parse(message.data) as WSGenericMessage;
      if (genericMessage.type == "update-peer-list") {
        this.eventEmitter.dispatchEvent(
          new CustomEvent("update-peer-list", {
            detail: genericMessage,
          })
        );
      }
      await this.wsMessageTypeHandlerMap[genericMessage.type]?.(genericMessage);
    } catch (e) {
      console.error(e);
    }
  };

  private sendMessage = (message: object) => {
    this.ws.send(JSON.stringify(message));
  };

  private wsTestMessage: WsMessageHandler<WSTestMessage> = (message) => {
    if (message.payload == "pong") alert("got pong!");
  };

  addPeer: WsMessageHandler<WSAddPeerMessage> = (message) => {
    this.sendMessage(message);
  };

  requestPeerList: WsMessageHandler<WSRequestUpdatePeerListMessage> = (
    message = { type: "request-update-peer-list" }
  ) => {
    this.sendMessage(message);
  };

  private wsMessageTypeHandlerMap: Partial<{
    [Type in WSMessages["type"]]: WsMessageHandler<
      Extract<WSMessages, { type: Type }>
    >;
  }> = {
    test: this.wsTestMessage,
  };
}
