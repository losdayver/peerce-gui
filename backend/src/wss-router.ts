import { WebSocketServer } from "ws";
import type {
  WSAddPeerMessage,
  WSGenericMessage,
  WSMessages,
  WSTestMessage,
  WSUpdatePeerListMessage,
} from "@commonTypes/ws-message.js";
import { SimplePeer } from "peerce";

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

  sendMessage = (message: WSMessages) => {
    this.wsSet.forEach((ws) => ws.send(JSON.stringify(message)));
  };

  peerMap: Record<string, any> = {};
  addPeer: WsMessageHandler<WSAddPeerMessage> = (ws, message) => {
    const peer = new SimplePeer(message.payload);
    this.peerMap[message.payload.distantTag] = peer;
    this.sendMessage({
      type: "update-peer-list",
      payload: Object.entries(this.peerMap).map(([tag, peer]) => ({
        tag: tag ?? "unknown",
      })),
    } as any);
  };

  private wsMessageTypeHandlerMap: Partial<{
    [Type in WSMessages["type"]]: WsMessageHandler<
      Extract<WSMessages, { type: Type }>
    >;
  }> = {
    "add-peer": this.addPeer,
    "request-update-peer-list": () => {
      this.sendMessage({
        type: "update-peer-list",
        payload: Object.entries(this.peerMap).map(([tag, peer]) => ({
          tag: tag ?? "unknown",
        })),
      } as any);
    },
  };

  constructor(private wss: WebSocketServer) {
    wss.addListener("connection", this.onWsConnection);
    wss.addListener("close", this.onWsClose);
    wss.addListener("error", this.onWsClose);
  }
}
