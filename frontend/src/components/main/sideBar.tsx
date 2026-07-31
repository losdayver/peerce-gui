import { Form, FormSchema } from "@components/form/form";
import { Button } from "@components/intrinsic/button";
import { Modal } from "@components/modal/modal";
import { createContext, useContext, useState } from "react";
import { GlobalAppConfig } from "@commonTypes/app";
import { useApp } from "./app";

export interface SideBarProps {
  header?: React.ReactNode;
  items?: SideBarItemProps[];
  style?: React.CSSProperties;
}

/** fn implementations are assigned later in designated content window content components
 * @example See FileHarbour component useEffect
 */
export interface ContentWindowHeaderAction {
  title: string;
  fn: (() => void) | null;
}

export interface SideBarItemProps {
  title: string;
  itemKey: string;
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  content?: React.FC;
  headerActions?: ContentWindowHeaderAction[];
}

export interface SidebarContextType {
  setActiveItem: (key: SideBarItemProps["itemKey"] | null) => void;
  getActiveItem: () => SideBarItemProps | null;
  getActiveItemKey: () => SideBarItemProps["itemKey"] | null;
}

export const sidebarContext = createContext<SidebarContextType | null>(null);

export const SideBar: React.FC<SideBarProps> = ({ header, items, style }) => {
  const sideBarCtx = useContext(sidebarContext);
  const activeItem = sideBarCtx?.getActiveItemKey();

  return (
    <div className="sidebar" {...(style as any)}>
      {header && <div className="sidebar__header">{header}</div>}
      {items?.length && (
        <div className="sidebar__content">
          {items.map((item) => (
            <SideBarItem
              {...item}
              key={item.itemKey}
              active={item.itemKey == activeItem}
              onClick={() => sideBarCtx?.setActiveItem(item.itemKey)}
            />
          ))}
        </div>
      )}
      <div className="sidebar__footer"></div>
    </div>
  );
};

const SideBarItem: React.FC<SideBarItemProps> = ({
  title,
  onClick,
  active,
}) => {
  return (
    <div
      onClick={() => onClick?.()}
      className={`sidebar__content__item ${active ? "sidebar__content__item--active" : ""}`}
    >
      {title}
    </div>
  );
};

export interface SideBarFooterProps {}

export const SideBarFooter: React.FC<SideBarFooterProps> = () => {
  const { saveConfig, getConfig } = useApp();
  const [config, setConfig] = useState<GlobalAppConfig>({});

  const [configModalOpen, setConfigModalOpen] = useState(false);
  return (
    <div className="sidebar-footer">
      <Modal open={configModalOpen} onClose={() => setConfigModalOpen(false)}>
        <Form<FormSchema<GlobalAppConfig>>
          initialData={config as any}
          schema={{
            relayAddr: {
              component: "input",
              title: "Default relay address",
            },
            relayPort: {
              component: "input",
              title: "Default relay port",
            },
            selfTag: {
              component: "input",
              title: "Self tag",
            },
          }}
          onConfirm={(data) => {
            saveConfig(data as any);
            setConfigModalOpen(false);
          }}
        />
      </Modal>
      <Button
        onClick={async () => {
          const config = await getConfig();
          setConfig(config);
          setConfigModalOpen(true);
        }}
      >
        ⚙️
      </Button>
    </div>
  );
};
