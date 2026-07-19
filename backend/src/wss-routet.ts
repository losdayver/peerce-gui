import { WebSocketServer } from "ws";
import type {
  WSGenericMessage,
  WSMessages,
  WSTestMessage,
} from "@commonTypes/ws-message.js";

type WsMessageHandler<M extends WSGenericMessage = WSGenericMessage> = (
  webSocket: WebSocket,
  message: M
) => void | Promise<void>;

export class WssRouter {
  private wsSet = new Set<WebSocket>();

  private genericMessageHandler = async (webSocket: WebSocket, message) => {
    console.log("received generic message", message);
    try {
      const genericMessage = JSON.parse(message) as WSGenericMessage;
      await this.wsMessageTypeHandlerMap[genericMessage.type]?.(
        webSocket,
        genericMessage
      );
    } catch (e) {
      const err = e instanceof Error ? `${e.name}\n${e.message}\n` : String(e);
      webSocket.send(`SERVER ERROR: ${err}`);
    }
  };
  private onWsConnection = (webSocket: WebSocket) => {
    console.log("connected web socket");
    this.wsSet.add(webSocket);
    webSocket.addEventListener("message", (event) => {
      this.genericMessageHandler(webSocket, event.data);
    });
  };
  private onWsClose = (webSocket: WebSocket) => {
    this.wsSet.delete(webSocket);
  };

  wsTestMessage: WsMessageHandler<WSTestMessage> = (ws, message) => {
    if (message.payload == "ping")
      ws.send(
        JSON.stringify({
          type: "test",
          payload: "pong",
        } satisfies WSTestMessage)
      );
  };

  private wsMessageTypeHandlerMap: Partial<{
    [Type in WSMessages["type"]]: WsMessageHandler<
      Extract<WSMessages, { type: Type }>
    >;
  }> = {
    test: this.wsTestMessage,
  };

  constructor(private wss: WebSocketServer) {
    wss.addListener("connection", this.onWsConnection);
    wss.addListener("close", this.onWsClose);
    wss.addListener("error", this.onWsClose);
  }
}
