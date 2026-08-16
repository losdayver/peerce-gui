import { homeDir, join } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type {
  FileHarborCurrentPeerInfo,
  FileHarborState,
} from "@commonTypes/fileHarbour.js";
import type {
  WSFHAddTransferMessage,
  WSFHEditPeerMessage,
  WSFHRegisterPeerMessage,
  WSMessages,
} from "@commonTypes/wsMessage.js";
import { wsClientContext } from "@interop/wsClient";
import { Modal } from "@modal/modal";
import { Form, type FormSchema } from "@form/form";
import { showToastMessage } from "@components/toast/toast";
import {
  addressFormValidator,
  portFormValidator,
  tagFormValidator,
} from "./commonFormValidators";

const transferFormSchema = {
  fullFilePath: { component: "file", title: "File", required: true },
} as const satisfies FormSchema;

const editPeerFormSchema = {
  selfTag: {
    component: "input",
    title: "Self tag",
    required: true,
    validator: tagFormValidator,
    disabled: true,
  },
  distantTag: {
    component: "input",
    title: "Distant tag",
    required: true,
    validator: tagFormValidator,
    disabled: true,
  },
  aggressive: {
    component: "checkbox",
    title: "Aggressive mode",
    divideAfter: true,
    hint: "Upon request timeout will try again and again indefinitely",
  },
  selfAddr: {
    component: "input",
    title: "Self address",
    validator: addressFormValidator,
    hint: "If you want to bind your udp socket to a specific address",
  },
  selfPort: {
    component: "inputNum",
    title: "Self port",
    divideAfter: true,
    validator: portFormValidator,
    hint: "If you want to bind your udp socket to a specific port",
  },
  relayAddr: {
    component: "input",
    title: "Relay address",
    required: true,
    validator: addressFormValidator,
  },
  relayPort: {
    component: "inputNum",
    title: "Relay port",
    required: true,
    validator: portFormValidator,
  },
  encrypt: {
    component: "checkbox",
    title: "Use encryption",
  },
} as const satisfies FormSchema;

// todo tag is not enough
export interface FileHarbourContextValue {
  state: FileHarborState;
  activePeerTag: string | null;
  setActivePeerTag: (tag: string | null) => void;
  registerPeer: (payload: WSFHRegisterPeerMessage["payload"]) => void;
  disconnectPeer: (tag: string) => void;
  unregisterPeer: (tag: string) => void;
  reconnectPeer: (tag: string) => void;
  editPeer: (tag: string) => void;
  addTransfer: (tag: string) => void;
  openPeerFileDir: (tag: string) => Promise<void>;
  getCurrentPeerInfo: () => Promise<FileHarborCurrentPeerInfo>;
}

const FileHarbourContext = createContext<FileHarbourContextValue | null>(null);

export function FileHarbourProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FileHarborState>({ items: [] });
  const [activePeerTag, setActivePeerTag] = useState<string | null>(null);
  const wsClient = useContext(wsClientContext).current;
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingPeerTag, setEditingPeerTag] = useState<string | null>(null);

  useEffect(() => {
    if (!wsClient) return;

    const onMessage = (event: Event): void => {
      const message = (event as CustomEvent<WSMessages>).detail;
      if (message.type == "file-harbour-state") {
        setState(message.payload);
        setActivePeerTag((currentTag) =>
          message.payload.items.some((peer) => peer.tag === currentTag)
            ? currentTag
            : null
        );
      } else if (message.type == "file-harbour-ui-message") {
        showToastMessage({ title: message.payload.message });
      }
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

  const disconnectPeer = (tag: string): void => {
    wsClient?.sendMessage({
      type: "file-harbour-disconnect-peer",
      payload: { tag },
    });
  };

  const unregisterPeer = (tag: string): void => {
    wsClient?.sendMessage({
      type: "file-harbour-unregister-peer",
      payload: { tag },
    });
  };

  const reconnectPeer = (tag: string): void => {
    wsClient?.sendMessage({
      type: "file-harbour-reconnect-peer",
      payload: { tag },
    });
  };

  const editPeer = (tag: string): void => {
    setEditingPeerTag(tag);
  };

  const addTransfer = (tag: string): void => {
    setTransferModalOpen(true);
  };

  const closeTransferModal = (): void => {
    setTransferModalOpen(false);
  };

  const getCurrentPeerInfo = (): Promise<FileHarborCurrentPeerInfo> => {
    return Promise.resolve({
      publicKey: "none",
      fingerprint: "none",
      lastKeyCreationDate: "none",
    });
  };

  const editingPeer = state.items.find((peer) => peer.tag === editingPeerTag);

  const openPeerFileDir = async (tag: string) => {
    try {
      const transmissionsDir = await join(
        await homeDir(),
        ".peerce-gui",
        "file-harbour",
        "transmissions",
        tag
      );
      await openPath(transmissionsDir);
    } catch (error: unknown) {
      showToastMessage({
        title: "Could not open folder",
        content: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <FileHarbourContext.Provider
      value={{
        state,
        activePeerTag,
        setActivePeerTag,
        registerPeer,
        disconnectPeer,
        unregisterPeer,
        reconnectPeer,
        editPeer,
        addTransfer,
        openPeerFileDir,
        getCurrentPeerInfo,
      }}
    >
      <Modal
        onClose={() => setEditingPeerTag(null)}
        open={editingPeerTag !== null}
        title="Edit peer"
      >
        <Form
          schema={editPeerFormSchema}
          initialData={{
            selfTag: editingPeer?.selfTag ?? "",
            distantTag: editingPeer?.tag ?? "",
            aggressive: editingPeer?.aggressive ?? false,
            selfAddr: editingPeer?.selfAddr,
            selfPort: editingPeer?.selfPort,
            relayAddr: editingPeer?.relayAddr ?? "",
            relayPort: editingPeer?.relayPort,
            encrypt: editingPeer?.encrypt ?? false,
          }}
          onConfirm={(data) => {
            if (!editingPeerTag) return;

            const message: WSFHEditPeerMessage = {
              type: "file-harbour-edit-peer",
              payload: {
                ...data,
                distantTag: editingPeerTag,
                aggressive: data.aggressive ?? false,
              },
            };
            wsClient?.sendMessage(message);
            setEditingPeerTag(null);
          }}
        />
      </Modal>
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
