import { FileHarbourActions } from "./FileHarbourActions";
import { FileHarbourProvider } from "./fileHarbourContext";
import { FileHarbourSidebar } from "./fileHarbourSideBar";
import { FileHarbourWorkspace } from "./workspace/fileHarbourWorkspace";

export const FileHarbour: React.FC = () => {
  return (
    <FileHarbourProvider>
      <FileHarbourActions />
      <div className="file-harbour">
        <FileHarbourSidebar />
        <FileHarbourWorkspace />
      </div>
    </FileHarbourProvider>
  );
};
