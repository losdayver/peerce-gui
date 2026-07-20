import { useContext } from "react";
import {
  FileHarbourSidebarItem,
  FileHarbourSidebarItemProps,
} from "./FileHarbourSidebarItem";
import { FileHarbourSidebarContext } from "./FileHarbourContext";

export interface FileHarbourSidebarProps {
  items?: FileHarbourSidebarItemProps[];
}

export const FileHarbourSidebar: React.FC<FileHarbourSidebarProps> = ({ items }) => {
  const fileHarbourSidebarCtx = useContext(FileHarbourSidebarContext);
  const activeItem = fileHarbourSidebarCtx?.getActiveItemKey();

  return (
    <aside className="file-harbour__sidebar">
      <div className="file-harbour__sidebar-header">Peers</div>
      {!!items?.length && (
        <div className="file-harbour__peer-list">
          {items.map((peer) => (
            <FileHarbourSidebarItem
              {...peer}
              active={peer.itemKey == activeItem}
              key={peer.itemKey}
              onClick={() => fileHarbourSidebarCtx?.setActiveItem(peer.itemKey)}
            />
          ))}
        </div>
      )}
    </aside>
  );
};
