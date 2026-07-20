import { useContext } from "react";
import { Empty } from "../../misc";
import { FileHarbourSidebarContext } from "./FileHarbourContext";

export const FileHarbourWorkspace: React.FC = () => {
  const fileHarbourSidebarCtx = useContext(FileHarbourSidebarContext);
  const activePeer = fileHarbourSidebarCtx?.getActiveItem();

  return (
    <section className="file-harbour__workspace">
      <Empty>{activePeer?.name ?? "Choose existing or add new peer"}</Empty>
    </section>
  );
};
