import { FileHarborStateItem } from "@commonTypes/file-harbour";

export interface FileHarbourSidebarItemProps extends FileHarborStateItem {
  active?: boolean;
  onClick?: () => void;
}

export const FileHarbourSidebarItem: React.FC<FileHarbourSidebarItemProps> = ({
  tag,
  state,
  active,
  onClick,
}) => {
  return (
    <button
      className={`file-harbour__peer ${active ? "file-harbour__peer--active" : ""}`}
      onClick={() => onClick?.()}
      type="button"
    >
      <span className="file-harbour__peer-icon">{tag.slice(0, 2)}</span>
      <span className="file-harbour__peer-meta">
        <span className="file-harbour__peer-name">{tag}</span>
        <span
          className={`file-harbour__peer-status file-harbour__peer-status--${state}`}
        >
          {state}
        </span>
      </span>
    </button>
  );
};
