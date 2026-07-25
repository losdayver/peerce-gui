import {
  FileHarbourSidebarItem,
} from "./FileHarbourSidebarItem";
import { useFileHarbour } from "./FileHarbourContext";

export const FileHarbourSidebar: React.FC = () => {
  const { state, activePeerTag, setActivePeerTag } = useFileHarbour();

  return (
    <aside className="file-harbour__sidebar">
      <div className="file-harbour__sidebar-header">Peers</div>
      {state.items.length > 0 && (
        <div className="file-harbour__peer-list">
          {state.items.map((peer) => (
            <FileHarbourSidebarItem
              {...peer}
              active={peer.tag === activePeerTag}
              key={peer.tag}
              onClick={() => setActivePeerTag(peer.tag)}
            />
          ))}
        </div>
      )}
    </aside>
  );
};
