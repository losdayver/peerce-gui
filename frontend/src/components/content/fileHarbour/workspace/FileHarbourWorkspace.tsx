import { Empty } from "../../../misc";
import { Button } from "../../../intrinsic/button";
import { useFileHarbour } from "../fileHarbourContext";
import { useContext } from "react";
import { wsClientContext } from "../../../../interop/wsClient";

function getInitials(tag: string): string {
  return tag
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const FileHarbourWorkspace: React.FC = () => {
  const { state, activePeerTag } = useFileHarbour();
  const wsClientRef = useContext(wsClientContext);
  const wsClient = wsClientRef.current!;
  const activePeer = state.items.find((peer) => peer.tag === activePeerTag);

  if (!activePeer) {
    return (
      <section className="file-harbour__workspace">
        <Empty>Choose an existing or add a new peer</Empty>
      </section>
    );
  }

  return (
    <section className="file-harbour__workspace">
      <header className="file-harbour__workspace-peer">
        <span className="file-harbour__workspace-avatar" aria-hidden="true">
          {getInitials(activePeer.tag)}
        </span>
        <div>
          <h2>{activePeer.tag}</h2>
          <p
            className={`file-harbour__workspace-status file-harbour__workspace-status--${activePeer.state}`}
          >
            {activePeer.state}
          </p>
        </div>
      </header>

      <div className="file-harbour__workspace-actions">
        <Button
          onClick={() => {
            wsClient.sendMessage({
              type: "file-harbour-unregister-peer",
              payload: { tag: activePeer.tag },
            });
          }}
        >
          🔌 Disconnect
        </Button>
        <Button
          onClick={() => {
            wsClient.sendMessage({
              type: "file-harbour-add-transfer",
              payload: { tag: activePeer.tag },
            });
          }}
        >
          ➕ Add transfer
        </Button>
      </div>

      <section
        className="file-harbour__transfers"
        aria-labelledby="transfers-title"
      >
        <div className="file-harbour__transfers-header">
          <h3 id="transfers-title">Transfers</h3>
          <span>{activePeer.transfers.length}</span>
        </div>

        {activePeer.transfers.length === 0 ? (
          <p className="file-harbour__transfers-empty">No active transfers</p>
        ) : (
          <div className="file-harbour__transfers-list">
            {activePeer.transfers.map((transfer) => {
              const progress = Math.round(
                Math.min(1, Math.max(0, transfer.progress)) * 100
              );

              return (
                <article
                  className="file-harbour__transfer"
                  key={transfer.fileName}
                >
                  <span className="file-harbour__transfer-name">
                    📁 {transfer.fileName}
                  </span>
                  <div className="file-harbour__transfer-progress">
                    <div
                      className="file-harbour__transfer-progress-bar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="file-harbour__transfer-percent">
                    {progress}%
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};
