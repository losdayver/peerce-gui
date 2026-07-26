import type { FileHarborState } from "@commonTypes/file-harbour.js";
import { WSFHRegisterPeerMessage } from "@commonTypes/ws-message.js";

export class FileHarbor {
  constructor(private sendUpdateMessage: () => void) {}

  private state: FileHarborState = {
    items: [
      {
        tag: "anna-keller",
        state: "connected",
        transfers: [{ fileName: "project-brief.pdf", progress: 0.42 }],
      },
      {
        tag: "mikhail-romanov",
        state: "connecting",
        transfers: [],
      },
      {
        tag: "olga-petrova",
        state: "offline",
        transfers: [],
      },
    ],
  };

  registerPeer = (payload: WSFHRegisterPeerMessage["payload"]) => {};
  unregisterPeer = (tag: string): void => {
    this.state.items = this.state.items.filter((item) => item.tag !== tag);
    this.sendUpdateMessage();
  };
  getConstructedState = (): FileHarborState => this.state;
}
