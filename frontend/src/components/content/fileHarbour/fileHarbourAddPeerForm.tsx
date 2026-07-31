import { useEffect, useState } from "react";
import type { WSFHRegisterPeerMessage } from "@commonTypes/wsMessage.js";
import type { ContentWindowHeaderAction } from "@main/sideBar";
import { Modal } from "@modal/modal";
import { useFileHarbour } from "./fileHarbourContext";
import { Form, type FormSchema, type InferDataFromSchema } from "@form/form";
import { useApp } from "@components/main/app";
import { GlobalAppConfig } from "@commonTypes/app";

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
    component: "inputNum",
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
    component: "inputNum",
    divideAfter: true,
    required: true,
  },
} as const satisfies FormSchema;

type FormData = InferDataFromSchema<typeof formSchema>;

function toRegisterPeerPayload(
  data: Partial<FormData>
): WSFHRegisterPeerMessage["payload"] | null {
  return {
    selfTag: (data.selfTag ?? "").trim(),
    distantTag: (data.distantTag ?? "").trim(),
    selfPort: Number(data.selfPort) || undefined,
    selfAddr: data.selfAddr ? data.selfAddr.trim() : undefined,
    relayAddr: (data.relayAddr ?? "").trim(),
    relayPort: Number(data.relayPort)!,
  };
}

export const FileHarbourAddPeerForm: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { registerPeer } = useFileHarbour();
  const { getConfig } = useApp();
  const [config, setConfig] = useState<GlobalAppConfig>({});

  useEffect(() => {
    const addPeerAction = fileHarbourHeaderActions[0];
    addPeerAction.fn = async () => {
      setConfig(await getConfig());
      setModalOpen(true);
    };

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
        initialData={config as any}
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
