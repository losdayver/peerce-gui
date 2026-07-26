import { createContext, useEffect, useRef, useState } from "react";
import { SideBar, sidebarContext, SideBarItemProps } from "./sideBar";
import { ContentWindow } from "./contentWindow";
import { FileHarbour } from "./content/fileHarbour/fileHarbour";
import { fileHarbourHeaderActions } from "./content/fileHarbour/fileHarbourAddPeer";
import { WsClient, wsClientContext } from "../interop/wsClient";
import { Empty } from "./misc";

export const App: React.FC = () => {
  const [connectedToBackend, setConnectedToBackend] = useState(false);
  const [activeSideBarItem, setActiveSideBarItem] = useState<
    SideBarItemProps["itemKey"] | null
  >(null);
  const sideBarItems: SideBarItemProps[] = [
    {
      title: "File Harbour",
      itemKey: "file-harbour",
      content: FileHarbour,
      headerActions: fileHarbourHeaderActions,
    },
    { title: "Test Item", itemKey: "test-item" },
  ];

  const wsClientRef = useRef<WsClient | null>(null);

  const connectToBackend = async () => {
    const response = await fetch("http://127.0.0.1:4310/api/health");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const ws = new WebSocket("ws://127.0.0.1:4310");
    const wsClient = new WsClient(ws);
    wsClient.eventEmitter.addEventListener("open", () => {
      wsClientRef.current = wsClient;
      setConnectedToBackend(true);
    });
  };

  useEffect(() => {
    void connectToBackend();
  }, []);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {connectedToBackend ? (
        <wsClientContext.Provider value={wsClientRef}>
          <sidebarContext.Provider
            value={{
              setActiveItem: (key) => {
                setActiveSideBarItem(key);
              },
              getActiveItemKey: () => activeSideBarItem,
              getActiveItem: () =>
                sideBarItems.find(
                  (item) => item.itemKey == activeSideBarItem
                ) ?? null,
            }}
          >
            <SideBar header="Services" items={sideBarItems} />
            <ContentWindow />
          </sidebarContext.Provider>
        </wsClientContext.Provider>
      ) : (
        <Empty>loading</Empty>
      )}
    </div>
  );
};
