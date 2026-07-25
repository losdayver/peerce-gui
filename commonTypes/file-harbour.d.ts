export interface FileHarborStateItem {
  tag: string;
  state: "offline" | "connected" | "connecting";
  transfers: FileHarborStateItemTransfer[];
}

export interface FileHarborStateItemTransfer {
  fileName: string;
  /** 0 => 1 */
  progress: number;
}

export interface FileHarborState {
  items: FileHarborStateItem[];
}
