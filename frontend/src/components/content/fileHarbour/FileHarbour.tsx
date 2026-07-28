import { FileHarbourAddPeer } from "./fileHarbourAddPeer";
import { FileHarbourProvider } from "./fileHarbourContext";
import { FileHarbourSidebar } from "./fileHarbourSideBar";
import { FileHarbourWorkspace } from "./workspace/FileHarbourWorkspace";

export const FileHarbour: React.FC = () => {
  return (
    <FileHarbourProvider>
      <FileHarbourAddPeer />
      <div className="file-harbour">
        <FileHarbourSidebar />
        <FileHarbourWorkspace />
      </div>
    </FileHarbourProvider>
  );
};
