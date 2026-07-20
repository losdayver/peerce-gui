export interface FileHarbourSidebarItemProps {
  initials: string;
  name: string;
  itemKey: string;
  status: "connected" | "syncing" | "idle" | "offline" | "pending";
  active?: boolean;
  onClick?: () => void;
}

export const FileHarbourSidebarItem: React.FC<FileHarbourSidebarItemProps> = ({
  initials,
  name,
  status,
  active,
  onClick,
}) => {
  return (
    <button
      className={`file-harbour__peer ${active ? "file-harbour__peer--active" : ""}`}
      onClick={() => onClick?.()}
      type="button"
    >
      <span className="file-harbour__peer-icon">{initials}</span>
      <span className="file-harbour__peer-meta">
        <span className="file-harbour__peer-name">{name}</span>
        <span
          className={`file-harbour__peer-status file-harbour__peer-status--${status}`}
        >
          {status}
        </span>
      </span>
    </button>
  );
};
