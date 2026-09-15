export const MAX_SCAN_DEPTH = 64;
export const MAX_SEARCH_ROWS = 2000;
export const FILE_BATCH_SIZE = 500;

export interface SerializedFileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  size: number;
  fileCount: number;
  folderCount: number;
  depth: number;
  extension?: string;
  lastModified?: number;
  children?: SerializedFileNode[];
}

export interface FileSystemHandleLike {
  name: string;
  kind: string;
  getFile?: () => Promise<File>;
  values?: () => AsyncIterable<FileSystemHandleLike>;
  isSameEntry?: (other: FileSystemHandleLike) => Promise<boolean>;
}

export type DirectoryHandleLike = FileSystemHandleLike;

export interface ScanProgressPayload {
  type: 'progress';
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  currentPath: string;
  skippedCount: number;
  processed?: number;
  total?: number;
}

export interface ScanCompletePayload {
  type: 'complete';
  rootNode: SerializedFileNode;
  executionTime: number;
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  skippedCount: number;
}

export interface ScanErrorPayload {
  type: 'error';
  error: string;
}

export type WorkerOutboundMessage =
  | ScanProgressPayload
  | ScanCompletePayload
  | ScanErrorPayload;

export type WorkerInboundMessage =
  | { type: 'start'; directoryHandle: DirectoryHandleLike }
  | {
      type: 'start-files';
      files: File[];
      batchIndex: number;
      done: boolean;
      totalFiles: number;
    };

export interface ExtensionStat {
  ext: string;
  category: string;
  size: number;
  count: number;
  color: string;
}
