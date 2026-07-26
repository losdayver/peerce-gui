import type { WSGenericMessage } from "@commonTypes/ws-message.js";
import { createContext, RefObject } from "react";

export const wsClientContext = createContext<RefObject<WsClient | null>>({
  current: null,
});

export class WsClient {
  readonly eventEmitter = new EventTarget();

  constructor(private ws: WebSocket) {
    ws.onopen = () => {
      this.eventEmitter.dispatchEvent(new Event("open"));
      ws.onmessage = this.genericMessageHandler;
    };
  }

  private genericMessageHandler = (event: MessageEvent<unknown>) => {
    try {
      if (typeof event.data !== "string") {
        throw new Error("WebSocket message must be a string");
      }

      const message = JSON.parse(event.data) as WSGenericMessage;
      this.eventEmitter.dispatchEvent(
        new CustomEvent<WSGenericMessage>("message", { detail: message })
      );
    } catch (e) {
      console.error(e);
    }
  };

  sendMessage = (message: WSGenericMessage): void => {
    this.ws.send(JSON.stringify(message));
  };
}
