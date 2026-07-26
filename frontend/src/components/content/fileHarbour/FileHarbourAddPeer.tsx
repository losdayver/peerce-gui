import { useContext, useEffect, useState } from "react";
import type { WSFHRegisterPeerMessage } from "@commonTypes/ws-message.js";
import { wsClientContext } from "../../../interop/wsClient";
import type { ContentWindowHeaderAction } from "../../sideBar";
import { Modal } from "../../modal";
import {
  Form,
  type FormSchema,
  type InferDataFromSchema,
} from "../../form/form";

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

function toRegisterPeerMessage(
  data: Partial<FormData>
): WSFHRegisterPeerMessage | null {
  const relayPort = Number(data.relayPort);
  const selfPort = data.selfPort === undefined ? 0 : Number(data.selfPort);

  if (
    !data.selfTag ||
    !data.distantTag ||
    !data.relayAddr ||
    !Number.isInteger(relayPort) ||
    relayPort < 1 ||
    relayPort > 65_535 ||
    !Number.isInteger(selfPort) ||
    selfPort < 0 ||
    selfPort > 65_535
  ) {
    return null;
  }

  return {
    type: "file-harbour-register-peer",
    payload: {
      selfTag: data.selfTag,
      distantTag: data.distantTag,
      selfAddr: data.selfAddr ?? "",
      selfPort,
      relayAddr: data.relayAddr,
      relayPort,
    },
  };
}

export const FileHarbourAddPeer: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const wsClient = useContext(wsClientContext).current;

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
        onConfirm={(data) => {
          const message = toRegisterPeerMessage(data);
          if (message && wsClient) {
            wsClient.sendMessage(message);
            setModalOpen(false);
          }
        }}
      />
    </Modal>
  );
};
