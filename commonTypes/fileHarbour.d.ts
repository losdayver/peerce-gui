export interface FileHarborStateItem {
  tag: string;
  selfTag: string;
  selfAddr?: string;
  selfPort?: number;
  relayAddr: string;
  relayPort: number;
  state: "offline" | "request sent" | "connected" | "connecting";
  aggressive: boolean;
  incomingTransfers: FileHarborStateItemTransfer[];
  outgoingTransfers: FileHarborStateItemTransfer[];
}

export interface FileHarborStateItemTransfer {
  fileName: string;
  /** 0 => 1 */
  progress: number;
}

export interface FileHarborState {
  items: FileHarborStateItem[];
}
