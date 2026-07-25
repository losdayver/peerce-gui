import { useEffect, useContext, useState } from "react";
import type {
  WSFileHarbourState,
  WSGenericMessage,
} from "@commonTypes/ws-message.js";
import type { FileHarborState } from "@commonTypes/file-harbour.js";
import { wsClientContext } from "../../../interop/ws-client";
import { FileHarbourAddPeer } from "./FileHarbourAddPeer";
import { FileHarbourContext } from "./FileHarbourContext";
import { FileHarbourSidebar } from "./FileHarbourSideBar";
import { FileHarbourWorkspace } from "./workspace/FileHarbourWorkspace";

function isFileHarbourState(
  message: WSGenericMessage
): message is WSFileHarbourState {
  return message.type === "file-harbour-state";
}

export const FileHarbour: React.FC = () => {
  const [harbourState, setHarbourState] = useState<FileHarborState>({
    items: [],
  });
  const [activePeerTag, setActivePeerTag] = useState<string | null>(null);
  const wsClient = useContext(wsClientContext).current;

  useEffect(() => {
    if (!wsClient) return;

    const onMessage = (event: Event) => {
      const message = (event as CustomEvent<WSGenericMessage>).detail;
      if (!isFileHarbourState(message)) return;

      setHarbourState(message.payload);
      setActivePeerTag((currentTag) =>
        message.payload.items.some((peer) => peer.tag === currentTag)
          ? currentTag
          : null
      );
    };

    wsClient.eventEmitter.addEventListener("message", onMessage);
    wsClient.sendMessage({ type: "file-harbour-request-state" });

    return () => {
      wsClient.eventEmitter.removeEventListener("message", onMessage);
    };
  }, [wsClient]);

  return (
    <FileHarbourContext.Provider
      value={{
        state: harbourState,
        activePeerTag,
        setActivePeerTag,
      }}
    >
      <FileHarbourAddPeer />
      <div className="file-harbour">
        <FileHarbourSidebar />
        <FileHarbourWorkspace />
      </div>
    </FileHarbourContext.Provider>
  );
};
