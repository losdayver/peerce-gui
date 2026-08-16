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
import { FileHarborCurrentPeerInfo } from "@commonTypes/fileHarbour";

export const fileHarbourHeaderActions: ContentWindowHeaderAction[] = [
  { title: "📄 Peer info", fn: null },
  { title: "➕ Add new peer", fn: null },
];

const addPeerFormSchema = {
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

type FormData = InferDataFromSchema<typeof addPeerFormSchema>;

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
    encrypt: data.encrypt,
  };
}

export const FileHarbourActions: React.FC = () => {
  const [addPeerModalOpen, setAddPeerModalOpen] = useState(false);
  const [showPeerInfoModalOpen, setShowPeerInfoModalOpen] = useState(false);
  const [peerInfo, setPeerInfo] = useState<
    FileHarborCurrentPeerInfo | undefined
  >(undefined);
  const { registerPeer, getCurrentPeerInfo } = useFileHarbour();
  const { getConfig } = useApp();
  const [config, setConfig] = useState<GlobalAppConfig>({});

  useEffect(() => {
    const addPeerAction = fileHarbourHeaderActions[1];
    addPeerAction.fn = async () => {
      setConfig(await getConfig());
      setAddPeerModalOpen(true);
    };

    const showPeerInfo = fileHarbourHeaderActions[0];
    showPeerInfo.fn = async () => {
      const peerInfo = await getCurrentPeerInfo();
      setShowPeerInfoModalOpen(true);
      setPeerInfo(peerInfo);
    };

    return () => {
      addPeerAction.fn = null;
      showPeerInfo.fn = null;
    };
  }, []);

  return (
    <>
      <Modal
        title="Peer info"
        open={showPeerInfoModalOpen}
        onClose={() => setShowPeerInfoModalOpen(false)}
      >
        <div style={{ whiteSpaceCollapse: "break-spaces" }}>
          {JSON.stringify(peerInfo, null, 2)}
        </div>
      </Modal>
      <Modal
        title="Add new peer"
        open={addPeerModalOpen}
        onClose={() => setAddPeerModalOpen(false)}
      >
        <Form
          schema={addPeerFormSchema}
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
              setAddPeerModalOpen(false);
              showToastMessage({ title: "🔌 New peer registered" });
            }
          }}
        />
      </Modal>
    </>
  );
};
