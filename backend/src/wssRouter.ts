import { WebSocketServer } from "ws";
import type { WSGenericMessage, WSMessages } from "@commonTypes/ws-message.js";
import { FileHarbor } from "./fileHarbour.js";

type WsMessageHandler<M extends WSGenericMessage = WSGenericMessage> = (
  webSocket: WebSocket,
  message: M
) => void | Promise<void>;

export class WssRouter {
  private wsSet = new Set<WebSocket>();
  private fileHarbour = new FileHarbor(() => {
    const state = this.fileHarbour.getConstructedState();
    this.sendMessage({ type: "file-harbour-state", payload: state });
  });

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

  sendMessage = (message: WSMessages, ws?: WebSocket) => {
    const wsList = ws ? [ws] : this.wsSet;
    this.wsSet.forEach((ws) => ws.send(JSON.stringify(message)));
  };

  private wsMessageTypeHandlerMap: Partial<{
    [Type in WSMessages["type"]]: WsMessageHandler<
      Extract<WSMessages, { type: Type }>
    >;
  }> = {
    "file-harbour-register-peer": (_, message) =>
      this.fileHarbour.registerPeer(message.payload),
    "file-harbour-unregister-peer": (_, message) =>
      this.fileHarbour.unregisterPeer(message.payload.tag),
    "file-harbour-add-transfer": (_, message) =>
      this.fileHarbour.addTransfer(
        message.payload.tag,
        message.payload.fullFilePath
      ),
    "file-harbour-request-state": (ws) => {
      const state = this.fileHarbour.getConstructedState();
      this.sendMessage({ type: "file-harbour-state", payload: state });
    },
  };

  constructor(private wss: WebSocketServer) {
    wss.addListener("connection", this.onWsConnection);
    wss.addListener("close", this.onWsClose);
    wss.addListener("error", this.onWsClose);
  }
}
