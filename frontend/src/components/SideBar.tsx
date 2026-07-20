import { createContext, useContext } from "react";

export interface SideBarProps {
  header?: React.ReactNode;
  items?: SideBarItemProps[];
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
  content?: React.FC<unknown>;
  headerActions?: ContentWindowHeaderAction[];
}

export interface SidebarContextType {
  setActiveItem: (key: SideBarItemProps["itemKey"] | null) => void;
  getActiveItem: () => SideBarItemProps | null;
  getActiveItemKey: () => SideBarItemProps["itemKey"] | null;
}

export const sidebarContext = createContext<SidebarContextType | null>(null);

export const SideBar: React.FC<SideBarProps> = ({ header, items }) => {
  const sideBarCtx = useContext(sidebarContext);
  const activeItem = sideBarCtx?.getActiveItemKey();

  return (
    <div className="sidebar">
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
