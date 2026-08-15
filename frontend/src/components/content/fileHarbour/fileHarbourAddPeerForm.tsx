import { useEffect, useState } from "react";
import type { WSFHRegisterPeerMessage } from "@commonTypes/wsMessage.js";
import type { ContentWindowHeaderAction } from "@main/sideBar";
import { Modal } from "@modal/modal";
import { useFileHarbour } from "./fileHarbourContext";
import { Form, type FormSchema, type InferDataFromSchema } from "@form/form";
import { useApp } from "@components/main/app";
import { GlobalAppConfig } from "@commonTypes/app";
import {
  addressFormValidator,
  portFormValidator,
  tagFormValidator,
} from "./commonFormValidators";
import { showToastMessage } from "@components/toast/toast";

export const fileHarbourHeaderActions: ContentWindowHeaderAction[] = [
  { title: "Add new peer", fn: null },
];

const formSchema = {
  selfTag: {
    title: "Self tag",
    component: "input",
    required: true,
    validator: tagFormValidator,
    disabled: true,
  },
  distantTag: {
    title: "Distant tag",
    component: "input",
    required: true,
    validator: tagFormValidator,
  },
  aggressive: {
    title: "Aggressive mode",
    component: "checkbox",
    divideAfter: true,
    hint: "Upon request timeout will try again and again indefinitely",
  },
  selfAddr: {
    title: "Self address",
    component: "input",
    placeholder: "XXX.XXX.XXX.XXX",
    validator: addressFormValidator,
    hint: "If you want to bind your udp socket to a specific address",
  },
  selfPort: {
    title: "Self port",
    component: "inputNum",
    divideAfter: true,
    validator: portFormValidator,
    hint: "If you want to bind your udp socket to a specific port",
  },
  relayAddr: {
    title: "Relay address",
    component: "input",
    placeholder: "XXX.XXX.XXX.XXX",
    required: true,
    validator: addressFormValidator,
  },
  relayPort: {
    title: "Relay port",
    component: "inputNum",
    required: true,
    validator: portFormValidator,
  },
  encrypt: {
    component: "checkbox",
    title: "Use encryption",
  },
} as const satisfies FormSchema;

type FormData = InferDataFromSchema<typeof formSchema>;

function toRegisterPeerPayload(
  data: FormData
): WSFHRegisterPeerMessage["payload"] | null {
  return {
    selfTag: data.selfTag.trim(),
    distantTag: data.distantTag.trim(),
    selfPort: data.selfPort,
    selfAddr: data.selfAddr,
    relayAddr: data.relayAddr,
    relayPort: data.relayPort,
    aggressive: data.aggressive,
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
        customValidate={({ distantTag, selfTag }) => {
          if (distantTag == selfTag)
            return [
              {
                fld: "distantTag",
                severity: "warning",
                message: "Distant tag cannot be the same as self tag",
              },
            ];
          return [];
        }}
        onConfirm={(data) => {
          const payload = toRegisterPeerPayload(data);
          if (payload) {
            registerPeer(payload);
            setModalOpen(false);
            showToastMessage({ title: "🔌 New peer registered" });
          }
        }}
      />
    </Modal>
  );
};
