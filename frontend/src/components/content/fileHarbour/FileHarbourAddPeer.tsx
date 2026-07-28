import { useEffect, useState } from "react";
import type { WSFHRegisterPeerMessage } from "@commonTypes/ws-message.js";
import type { ContentWindowHeaderAction } from "@main/sideBar";
import { Modal } from "@modal/modal";
import { useFileHarbour } from "./fileHarbourContext";
import {
  Form,
  type FormSchema,
  type InferDataFromSchema,
} from "@form/form";

export const fileHarbourHeaderActions: ContentWindowHeaderAction[] = [
  { title: "Add new peer", fn: null },
];

const formSchema = {
  selfTag: { title: "Self tag", component: "input", required: true },
  distantTag: {
    title: "Peer tag",
    component: "input",
    divideAfter: true,
    required: true,
  },
  selfAddr: {
    title: "Self address",
    component: "input",
    placeholder: "XXX.XXX.XXX.XXX",
  },
  selfPort: {
    title: "Self port",
    component: "input",
    divideAfter: true,
  },
  relayAddr: {
    title: "Relay address",
    component: "input",
    placeholder: "XXX.XXX.XXX.XXX",
    required: true,
  },
  relayPort: {
    title: "Relay port",
    component: "input",
    divideAfter: true,
    required: true,
  },
  doNotAcceptFiles: {
    title: "Only allow file send",
    component: "checkbox",
  },
} as const satisfies FormSchema;

type FormData = InferDataFromSchema<typeof formSchema>;

function toRegisterPeerPayload(
  data: Partial<FormData>
): WSFHRegisterPeerMessage["payload"] | null {
  return {
    selfTag: data.selfTag!,
    distantTag: data.distantTag!,
    selfPort: Number(data.selfPort) || undefined,
    selfAddr: data.selfAddr || undefined,
    relayAddr: data.relayAddr!,
    relayPort: Number(data.relayPort)!,
  };
}

export const FileHarbourAddPeer: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { registerPeer } = useFileHarbour();

  useEffect(() => {
    const addPeerAction = fileHarbourHeaderActions[0];
    addPeerAction.fn = () => setModalOpen(true);

    return () => {
      addPeerAction.fn = null;
    };
  }, []);

  return (
    <Modal
      title="Add new peer"
      open={modalOpen}
      onClose={() => setModalOpen(false)}
    >
      <Form
        schema={formSchema}
        data={{ relayPort: "56443", relayAddr: "127.0.0.1" } as any}
        onConfirm={(data) => {
          const payload = toRegisterPeerPayload(data);
          if (payload) {
            registerPeer(payload);
            setModalOpen(false);
          }
        }}
      />
    </Modal>
  );
};
