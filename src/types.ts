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
