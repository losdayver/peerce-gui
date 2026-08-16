import { FileHarborStateItem } from "@commonTypes/fileHarbour";

export interface FileHarbourSidebarItemProps extends FileHarborStateItem {
  active?: boolean;
  onClick?: () => void;
}

export const FileHarbourSidebarItem: React.FC<FileHarbourSidebarItemProps> = ({
  tag,
  state,
  active,
  onClick,
  aggressive,
  encrypt,
}) => {
  return (
    <button
      className={`file-harbour__peer${active ? " file-harbour__peer--active" : ""}${aggressive ? " file-harbour__peer--aggressive" : ""}`}
      data-state={state}
      onClick={() => onClick?.()}
      type="button"
    >
      <span className="file-harbour__peer-icon">
        <span className="file-harbour__peer-initials">{tag.slice(0, 2)}</span>
      </span>
      <span className="file-harbour__peer-meta">
        <span className="file-harbour__peer-name">{tag}</span>
        {!encrypt && (
          <span className="file-harbour__peer-unencrypted">unencrypted</span>
        )}
        <span
          className={`file-harbour__peer-status file-harbour__peer-status--${state}`}
        >
          {state}
        </span>
      </span>
    </button>
  );
};
