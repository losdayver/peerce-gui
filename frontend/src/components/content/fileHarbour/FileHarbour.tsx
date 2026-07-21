import { useEffect, useContext, useState } from "react";
import type {
  WSAddPeerMessage,
  WSUpdatePeerListMessage,
} from "@commonTypes/ws-message.js";
import { ContentWindowHeaderAction } from "../../SideBar";
import { wsClientContext } from "../../../interop/ws-client";
import { FileHarbourSidebarItemProps } from "./FileHarbourSidebarItem";
import { FileHarbourSidebarContext } from "./FileHarbourContext";
import { FileHarbourSidebar } from "./FileHarbourSideBar";
import { FileHarbourWorkspace } from "./FileHarbourWorkspace";
import { Modal } from "../../Modal";
import { Form } from "../../form/Form";

// const initialPeers: FileHarbourSidebarItemProps[] = [
//   {
//     initials: "AK",
//     name: "Anna Keller",
//     itemKey: "anna-keller",
//     status: "connected",
//   },
//   {
//     initials: "MR",
//     name: "Mikhail Romanov",
//     itemKey: "mikhail-romanov",
//     status: "syncing",
//   },
//   {
//     initials: "LS",
//     name: "Lena Sokolova",
//     itemKey: "lena-sokolova",
//     status: "connected",
//   },
//   {
//     initials: "DN",
//     name: "Daniel Novak",
//     itemKey: "daniel-novak",
//     status: "idle",
//   },
//   {
//     initials: "OP",
//     name: "Olga Petrova",
//     itemKey: "olga-petrova",
//     status: "offline",
//   },
//   {
//     initials: "IV",
//     name: "Ivan Volkov",
//     itemKey: "ivan-volkov",
//     status: "connected",
//   },
//   {
//     initials: "NM",
//     name: "Nora Miles",
//     itemKey: "nora-miles",
//     status: "pending",
//   },
//   {
//     initials: "SR",
//     name: "Sofia Reed",
//     itemKey: "sofia-reed",
//     status: "connected",
//   },
//   {
//     initials: "TK",
//     name: "Timur Karimov",
//     itemKey: "timur-karimov",
//     status: "offline",
//   },
//   {
//     initials: "EC",
//     name: "Eva Chen",
//     itemKey: "eva-chen",
//     status: "syncing",
//   },
// ];

export const fileHarbourHeaderActions: ContentWindowHeaderAction[] = [
  { title: "Add new peer", fn: null },
];

export const FileHarbour: React.FC<any> = () => {
  const [peerItems, setPeerItems] = useState<FileHarbourSidebarItemProps[]>([]);
  const [activePeerKey, setActivePeerKey] = useState<
    FileHarbourSidebarItemProps["itemKey"] | null
  >(null);
  const wsClientRef = useContext(wsClientContext);
  const wsClient = wsClientRef.current!;
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fileHarbourHeaderActions[0].fn = () => {
      // wsClient.addPeer({
      //   type: "add-peer",
      //   payload: {} as any,
      // });
      setModalOpen(true);
    };

    const updatePeerList = (event: Event) => {
      const message = (event as CustomEvent<WSUpdatePeerListMessage>).detail;
      const nextPeerItems = message.payload.map((peer) => ({
        initials: peer.tag.slice(0, 2).toUpperCase(),
        name: peer.tag,
        itemKey: peer.tag,
        status: "connected" as const,
      }));

      setPeerItems(nextPeerItems);
      setActivePeerKey((activeKey) =>
        nextPeerItems.some((peer) => peer.itemKey == activeKey)
          ? activeKey
          : null
      );
    };

    wsClient.eventEmitter.addEventListener("update-peer-list", updatePeerList);

    wsClient.requestPeerList({ type: "request-update-peer-list" });

    return () => {
      fileHarbourHeaderActions.forEach((action) => (action.fn = null));
      wsClient.eventEmitter.removeEventListener(
        "update-peer-list",
        updatePeerList
      );
    };
  }, [wsClient]);

  return (
    <FileHarbourSidebarContext.Provider
      value={{
        setActiveItem: (key) => setActivePeerKey(key),
        getActiveItemKey: () => activePeerKey,
        getActiveItem: () =>
          peerItems.find((peer) => peer.itemKey == activePeerKey) ?? null,
      }}
    >
      <Modal
        title="Add new peer"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <Form
          schema={{
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
          }}
          onConfirm={(data) => {
            setModalOpen(false);
            wsClient.addPeer({
              type: "add-peer",
              payload: data as any,
            });
          }}
        />
      </Modal>
      <div className="file-harbour">
        <FileHarbourSidebar items={peerItems} />
        <FileHarbourWorkspace />
      </div>
    </FileHarbourSidebarContext.Provider>
  );
};
