import { join } from "node:path";
import { appHomeDir } from "../configProvider.js";
import { DatabaseSync } from "node:sqlite";
import type { FHConnectionTable } from "./initAndMigrate.js";

const dbFileBaseName = "persist.db";
const dbFullPath = join(appHomeDir, dbFileBaseName);
export const db = new DatabaseSync(dbFullPath);

export const insertNewConnection = (connection: FHConnectionTable) => {
  const c = connection;
  db.prepare(
    `
    insert into fh_connection 
    (distant_tag, self_tag, self_addr, self_port, relay_addr, relay_port) 
    values (?, ?, ?, ?, ?, ?)
    on conflict(distant_tag) do update set
      self_tag = excluded.self_tag,
      self_addr = excluded.self_addr,
      self_port = excluded.self_port,
      relay_addr = excluded.relay_addr,
      relay_port = excluded.relay_port
    `
  ).run(
    c.distant_tag,
    c.self_tag,
    c.self_addr,
    c.self_port,
    c.relay_addr,
    c.relay_port
  );
};

export const deleteConnection = (
  distant_tag: FHConnectionTable["distant_tag"]
) => {
  db.prepare(`delete from fh_connection where distant_tag = ?;`).run(
    distant_tag
  );
};

export const getAllConnections = (): FHConnectionTable[] =>
  selectAll<FHConnectionTable>(`
    select distant_tag, self_tag, self_addr, self_port, relay_addr, relay_port
    from fh_connection
  `);

/** The migrations are the source of truth for the returned row shape. */
function selectAll<T>(sql: string): T[] {
  return db.prepare(sql).all() as unknown as T[];
}
