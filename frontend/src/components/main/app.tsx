import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  SideBar,
  sidebarContext,
  SideBarFooter,
  SideBarItemProps,
} from "./sideBar";
import { ContentWindow } from "./contentWindow";
import { FileHarbour } from "@content/fileHarbour/fileHarbour";
import { fileHarbourHeaderActions } from "@content/fileHarbour/fileHarbourAddPeer";
import { WsClient, wsClientContext } from "@interop/wsClient";
import { Empty } from "@utils";
import { GlobalAppConfig } from "@commonTypes/app";

export interface AppContextValue {
  saveConfig: (config: GlobalAppConfig) => void;
}

export const AppContext = createContext<AppContextValue>(null as any);

export const AppContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const wsClient = useContext(wsClientContext).current;

  useEffect(() => {
    if (!wsClient) return;
  });

  const contextValue: AppContextValue = {
    saveConfig: (data) =>
      wsClient?.sendMessage({ type: "app-save-config", payload: data }),
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  return context;
}

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
          <AppContextProvider>
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
              <div style={{ display: "flex", flexDirection: "column" }}>
                <SideBar header="Services" items={sideBarItems} />
                <SideBarFooter />
              </div>
              <ContentWindow />
            </sidebarContext.Provider>
          </AppContextProvider>
        </wsClientContext.Provider>
      ) : (
        <Empty>loading</Empty>
      )}
    </div>
  );
};
