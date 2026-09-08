import { useEffect, useState } from "react";
import type { WSFHRegisterPeerMessage } from "@commonTypes/wsMessage.js";
import type { ContentWindowHeaderAction } from "@main/sideBar";
import { Modal } from "@modal/modal";
import { useFileHarbour } from "./fileHarbourContext";
import { useApp } from "@components/main/app";
import { GlobalAppConfig } from "@commonTypes/app";
import {
  addressFormValidator,
  portFormValidator,
  tagFormValidator,
} from "./commonFormValidators";
import { showToastMessage } from "@components/toast/toast";
import { FileHarborCurrentPeerInfo } from "@commonTypes/fileHarbour";
import {
  DataForm,
  FormSchema,
  GFI,
  GridGroup,
  InferDataFromSchema,
} from "formutate";
import { componentFactory } from "@components/intrinsic/componentFactory";
import { dataFormDefaultStyle } from "@components/utils";

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

function formatKeyCreationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
        style={{ width: 800, maxWidth: "100%" }}
      >
        {peerInfo && (
          <section
            className="file-harbour__peer-info"
            aria-label="Local peer identity"
          >
            <header className="file-harbour__peer-info-summary">
              <span className="file-harbour__peer-info-mark" aria-hidden="true">
                ID
              </span>
              <div className="file-harbour__peer-info-heading">
                <div className="file-harbour__peer-info-title-row">
                  <h3>Local peer identity</h3>
                  <span className="file-harbour__peer-info-status">
                    Active key
                  </span>
                </div>
                <p>
                  Use the fingerprint to verify this peer on another device.
                </p>
              </div>
            </header>

            <dl className="file-harbour__peer-info-fields">
              <div className="file-harbour__peer-info-field">
                <dt>Fingerprint</dt>
                <dd>
                  <code>{peerInfo.fingerprint}</code>
                </dd>
              </div>

              <div className="file-harbour__peer-info-field">
                <dt>Key created</dt>
                <dd>
                  <time dateTime={peerInfo.lastKeyCreationDate}>
                    {formatKeyCreationDate(peerInfo.lastKeyCreationDate)}
                  </time>
                </dd>
              </div>

              <div className="file-harbour__peer-info-field file-harbour__peer-info-field--key">
                <dt>Public key</dt>
                <dd>
                  <pre>
                    <code>{peerInfo.publicKey.trim()}</code>
                  </pre>
                </dd>
              </div>
            </dl>

            <p className="file-harbour__peer-info-note">
              This public key is safe to share. Your private key is not shown.
            </p>
          </section>
        )}
      </Modal>
      <Modal
        title="Add new peer"
        open={addPeerModalOpen}
        onClose={() => setAddPeerModalOpen(false)}
        style={{ width: "600px" }}
      >
        <DataForm
          componentFactory={componentFactory}
          schema={addPeerFormSchema}
          initialData={config}
          gridStyle={{
            ...dataFormDefaultStyle,
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr));",
            gridAutoColumns: "unset",
          }}
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
        >
          <GridGroup header="Tags">
            {GFI("selfTag")}
            {GFI("distantTag")}
          </GridGroup>
          <GridGroup header="Socket binding">
            {GFI("selfAddr")}
            {GFI("selfPort")}
          </GridGroup>
          <GridGroup header="Relay configuration">
            {GFI("relayAddr")}
            {GFI("relayPort")}
          </GridGroup>
          <GridGroup split header="Miscellaneous">
            {GFI("aggressive")}
            {GFI("encrypt")}
          </GridGroup>
        </DataForm>
      </Modal>
    </>
  );
};
