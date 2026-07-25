import type { FileHarborState } from "@commonTypes/file-harbour.js";
import { WSAddPeerMessage } from "@commonTypes/ws-message.js";

export class FileHarbor {
  registerPeer = (payload: WSAddPeerMessage["payload"]) => {};
  unregisterPeer = (tag: string) => {};
  getConstructedState = (): FileHarborState => ({
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
  });
}
