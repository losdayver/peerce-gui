import { createContext, useContext } from "react";
import type { FileHarborState } from "@commonTypes/file-harbour.js";

export interface FileHarbourContextValue {
  state: FileHarborState;
  activePeerTag: string | null;
  setActivePeerTag: (tag: string | null) => void;
}

export const FileHarbourContext = createContext<FileHarbourContextValue | null>(
  null
);

export function useFileHarbour(): FileHarbourContextValue {
  const context = useContext(FileHarbourContext);
  if (!context) {
    throw new Error("useFileHarbour must be used inside FileHarbourContext");
  }

  return context;
}
