import { Empty } from "../../misc";
import { useFileHarbour } from "./FileHarbourContext";

export const FileHarbourWorkspace: React.FC = () => {
  const { state, activePeerTag } = useFileHarbour();
  const activePeer = state.items.find(
    (peer) => peer.tag === activePeerTag
  );

  return (
    <section className="file-harbour__workspace">
      <Empty>{activePeer?.tag ?? "Choose existing or add new peer"}</Empty>
    </section>
  );
};
