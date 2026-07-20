import { createContext } from "react";
import { FileHarbourSidebarItemProps } from "./FileHarbourSidebarItem";

export interface FileHarbourSidebarContextType {
  setActiveItem: (key: FileHarbourSidebarItemProps["itemKey"] | null) => void;
  getActiveItem: () => FileHarbourSidebarItemProps | null;
  getActiveItemKey: () => FileHarbourSidebarItemProps["itemKey"] | null;
}

export const FileHarbourSidebarContext =
  createContext<FileHarbourSidebarContextType | null>(null);
