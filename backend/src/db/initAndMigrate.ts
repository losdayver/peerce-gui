import { db } from "./provider.js";

export interface FHConnectionTable {
  distant_tag: string;
  self_tag: string;
  self_addr: string | null;
  self_port: number | null;
  relay_addr: string;
  relay_port: number;
}

export const enum FHConnectionTransferTableIncoming {
  FALSE = 0,
  TRUE = 1,
}

export const enum FHConnectionTransferTableState {
  COMPLETED = 1,
  INTERRUPTED = 2,
}

export interface FHConnectionTransferTable {
  distant_tag: string;
  file_name: string;
  incoming: FHConnectionTransferTableIncoming;
  state: FHConnectionTransferTableState;
}

export const init = () => {
  db.exec(`
    create table if not exists fh_connection (
      distant_tag   text primary key,
      self_tag      text,
      self_addr     text,
      self_port     integer,
      relay_addr    text,
      relay_port    integer
    );
    `);
  db.exec(`
    create table if not exists fh_connection_transfer (
      distant_tag   text references fh_connection(distant_tag),
      file_name     text,
      incoming      integer,
      state         integer
    );
    create index if not exists ix_fh_conn_distant_tag on fh_connection_transfer(distant_tag);
    `);
};
