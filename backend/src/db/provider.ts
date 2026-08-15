import { join } from "node:path";
import { appHomeDir } from "../configProvider.js";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { FHConnectionTransferTableState } from "./initAndMigrate.js";
import type {
  FHConnectionTable,
  FHConnectionTransferTable,
} from "./initAndMigrate.js";

const dbFileBaseName = "persist.db";
const dbFullPath = join(appHomeDir, dbFileBaseName);
export const db = new DatabaseSync(dbFullPath);

export const insertNewConnection = (connection: FHConnectionTable) => {
  const c = connection;
  db.prepare(
    `
    insert into fh_connection 
    (distant_tag, self_tag, self_addr, self_port, relay_addr, relay_port, aggressive)
    values (?, ?, ?, ?, ?, ?, ?)
    on conflict(distant_tag) do update set
      self_tag = excluded.self_tag,
      self_addr = excluded.self_addr,
      self_port = excluded.self_port,
      relay_addr = excluded.relay_addr,
      relay_port = excluded.relay_port,
      aggressive = excluded.aggressive,
      encrypt = excluded.encrypt
    `
  ).run(
    c.distant_tag,
    c.self_tag,
    c.self_addr,
    c.self_port,
    c.relay_addr,
    c.relay_port,
    c.aggressive,
    c.encrypt
  );
};

export const deleteConnection = (
  distant_tag: FHConnectionTable["distant_tag"]
) => {
  db.prepare(`delete from fh_connection where distant_tag = ?;`).run(
    distant_tag
  );
};

export const insertNewConnectionTransfer = (
  transfer: Omit<FHConnectionTransferTable, "state"> & {
    state?: FHConnectionTransferTable["state"];
  }
): void => {
  db.prepare(
    `
      insert into fh_connection_transfer (distant_tag, file_name, incoming, state)
      values (?, ?, ?, ?)
      on conflict(distant_tag, file_name, incoming) do update set
        state = excluded.state
    `
  ).run(
    transfer.distant_tag,
    transfer.file_name,
    transfer.incoming,
    transfer.state ?? FHConnectionTransferTableState.INTERRUPTED
  );
};

export const getAllConnections = (): FHConnectionTable[] =>
  selectAll<FHConnectionTable>(`
    select distant_tag, self_tag, self_addr, self_port, relay_addr, relay_port, aggressive, encrypt
    from fh_connection
  `);

export const getConnectionsByDistantTag = (
  distant_tag: FHConnectionTable["distant_tag"]
): FHConnectionTable | undefined =>
  selectAll<FHConnectionTable>(
    `
      select distant_tag, self_tag, self_addr, self_port, relay_addr, relay_port, aggressive, encrypt
      from fh_connection
      where distant_tag = ?
    `,
    [distant_tag]
  )[0];

export const getAllConnectionTransfers = (): FHConnectionTransferTable[] =>
  selectAll<FHConnectionTransferTable>(`
    select distant_tag, file_name, incoming, state
    from fh_connection_transfer
  `);

export const getConnectionTransfersByDistantTag = (
  distant_tag: FHConnectionTable["distant_tag"]
): FHConnectionTransferTable[] =>
  selectAll<FHConnectionTransferTable>(
    `
      select distant_tag, file_name, incoming, state
      from fh_connection_transfer
      where distant_tag = ?
    `,
    [distant_tag]
  );

/** The migrations are the source of truth for the returned row shape. */
function selectAll<T>(sql: string, params?: SQLInputValue[]): T[] {
  return db.prepare(sql).all(...(params ?? [])) as unknown as T[];
}
