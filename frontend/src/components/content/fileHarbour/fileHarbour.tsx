import { FileHarbourAddPeerForm } from "./fileHarbourAddPeerForm";
import { FileHarbourProvider } from "./fileHarbourContext";
import { FileHarbourSidebar } from "./fileHarbourSideBar";
import { FileHarbourWorkspace } from "./workspace/fileHarbourWorkspace";

export const FileHarbour: React.FC = () => {
  return (
    <FileHarbourProvider>
      <FileHarbourAddPeerForm />
      <div className="file-harbour">
        <FileHarbourSidebar />
        <FileHarbourWorkspace />
      </div>
    </FileHarbourProvider>
  );
};
