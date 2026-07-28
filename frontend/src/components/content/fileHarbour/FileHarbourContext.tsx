import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { FileHarborState } from "@commonTypes/file-harbour.js";
import type {
  WSFileHarbourState,
  WSGenericMessage,
  WSFHAddTransferMessage,
  WSFHRegisterPeerMessage,
} from "@commonTypes/ws-message.js";
import { wsClientContext } from "@interop/wsClient";
import { Modal } from "@modal/modal";
import { Form, type FormSchema } from "@form/form";

const transferFormSchema = {
  fullFilePath: { component: "file", title: "File", required: true },
} as const satisfies FormSchema;

export interface FileHarbourContextValue {
  state: FileHarborState;
  activePeerTag: string | null;
  setActivePeerTag: (tag: string | null) => void;
  registerPeer: (payload: WSFHRegisterPeerMessage["payload"]) => void;
  unregisterPeer: (tag: string) => void;
  addTransfer: (tag: string) => void;
  
}

const FileHarbourContext = createContext<FileHarbourContextValue | null>(null);

function isFileHarbourState(
  message: WSGenericMessage
): message is WSFileHarbourState {
  return message.type === "file-harbour-state";
}

export function FileHarbourProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FileHarborState>({ items: [] });
  const [activePeerTag, setActivePeerTag] = useState<string | null>(null);
  const wsClient = useContext(wsClientContext).current;
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    if (!wsClient) return;

    const onMessage = (event: Event): void => {
      const message = (event as CustomEvent<WSGenericMessage>).detail;
      if (!isFileHarbourState(message)) return;

      setState(message.payload);
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

  const registerPeer = (payload: WSFHRegisterPeerMessage["payload"]): void => {
    wsClient?.sendMessage({ type: "file-harbour-register-peer", payload });
  };

  const unregisterPeer = (tag: string): void => {
    wsClient?.sendMessage({
      type: "file-harbour-unregister-peer",
      payload: { tag },
    });
  };

  const addTransfer = (tag: string): void => {
    setTransferModalOpen(true);
  };

  const closeTransferModal = (): void => {
    setTransferModalOpen(false);
  };

  return (
    <FileHarbourContext.Provider
      value={{
        state,
        activePeerTag,
        setActivePeerTag,
        registerPeer,
        unregisterPeer,
        addTransfer,
      }}
    >
      <Modal
        onClose={closeTransferModal}
        open={transferModalOpen}
        title="Transfer new file"
      >
        <Form
          schema={transferFormSchema}
          onConfirm={(data) => {
            const fullFilePath = data.fullFilePath;
            if (!activePeerTag || typeof fullFilePath !== "string") return;

            const message: WSFHAddTransferMessage = {
              type: "file-harbour-add-transfer",
              payload: { tag: activePeerTag, fullFilePath },
            };
            wsClient?.sendMessage(message);
            closeTransferModal();
          }}
        />
      </Modal>
      {children}
    </FileHarbourContext.Provider>
  );
}

export function useFileHarbour(): FileHarbourContextValue {
  const context = useContext(FileHarbourContext);
  if (!context) {
    throw new Error("useFileHarbour must be used inside FileHarbourProvider");
  }

  return context;
}
