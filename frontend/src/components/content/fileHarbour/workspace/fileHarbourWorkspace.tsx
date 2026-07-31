import { Empty } from "@utils";
import { Button } from "@intrinsic/button";
import type { FileHarborStateItemTransfer } from "@commonTypes/fileHarbour";
import { useFileHarbour } from "@components/content/fileHarbour/fileHarbourContext";

function getInitials(tag: string): string {
  return tag
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface TransferSectionProps {
  id: string;
  title: string;
  emptyMessage: string;
  transfers: FileHarborStateItemTransfer[];
}

function TransferSection({
  id,
  title,
  emptyMessage,
  transfers,
}: TransferSectionProps) {
  return (
    <section className="file-harbour__transfers-section" aria-labelledby={id}>
      <div className="file-harbour__transfers-header">
        <h3 id={id}>{title}</h3>
        <span>{transfers.length}</span>
      </div>
      {transfers.length === 0 ? (
        <p className="file-harbour__transfers-empty">{emptyMessage}</p>
      ) : (
        <div className="file-harbour__transfers-list">
          {transfers.map((transfer) => {
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
  );
}

export const FileHarbourWorkspace: React.FC = () => {
  const {
    state,
    activePeerTag,
    disconnectPeer,
    unregisterPeer,
    addTransfer,
    openPeerFileDir,
  } = useFileHarbour();
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
        {activePeer.state == "offline" ? (
          <>
            <Button onClick={() => unregisterPeer(activePeer.tag)}>
              🗑️ Delete
            </Button>
            <Button onClick={() => {}}>🔄️ Reconnect</Button>
          </>
        ) : (
          <Button onClick={() => disconnectPeer(activePeer.tag)}>
            🔌 Disconnect
          </Button>
        )}
        <Button
          disabled={activePeer.state != "connected"}
          onClick={() => addTransfer(activePeer.tag)}
        >
          ➕ Add transfer
        </Button>
        <Button onClick={() => openPeerFileDir(activePeer.tag)}>
          📂 Open folder
        </Button>
      </div>

      <section className="file-harbour__transfers">
        <TransferSection
          id="incoming-transfers-title"
          title="Incoming"
          emptyMessage="No incoming transfers"
          transfers={activePeer.incomingTransfers}
        />
        <TransferSection
          id="outgoing-transfers-title"
          title="Outgoing"
          emptyMessage="No outgoing transfers"
          transfers={activePeer.outgoingTransfers}
        />
      </section>
    </section>
  );
};
