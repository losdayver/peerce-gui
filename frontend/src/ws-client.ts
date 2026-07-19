import type {
  WSGenericMessage,
  WSMessages,
  WSTestMessage,
} from "@commonTypes/ws-message.js";

type WsMessageHandler<M extends WSGenericMessage = WSGenericMessage> = (
  message: M
) => void | Promise<void>;

export class WsClient {
  constructor(private ws: WebSocket) {
    ws.onopen = () => {
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
      await this.wsMessageTypeHandlerMap[genericMessage.type]?.(genericMessage);
    } catch (e) {
      console.error(e);
    }
  };

  private wsTestMessage: WsMessageHandler<WSTestMessage> = (message) => {
    if (message.payload == "pong") alert("got pong!");
  };

  private wsMessageTypeHandlerMap: Partial<{
    [Type in WSMessages["type"]]: WsMessageHandler<
      Extract<WSMessages, { type: Type }>
    >;
  }> = {
    test: this.wsTestMessage,
  };
}
