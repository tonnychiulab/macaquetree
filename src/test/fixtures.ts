import type { DirectoryHandleLike, FileSystemHandleLike, SerializedFileNode } from '../types';

export function fileNode(
  name: string,
  size: number,
  extras: Partial<SerializedFileNode> = {}
): SerializedFileNode {
  return {
    name,
    path: extras.path ?? name,
    kind: 'file',
    size,
    fileCount: 1,
    folderCount: 0,
    depth: extras.depth ?? 1,
    extension: extras.extension ?? (name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''),
    ...extras,
  };
}

export function dirNode(
  name: string,
  children: SerializedFileNode[],
  extras: Partial<SerializedFileNode> = {}
): SerializedFileNode {
  const size = children.reduce((sum, child) => sum + child.size, 0);
  const fileCount = children.reduce(
    (sum, child) => sum + (child.kind === 'file' ? 1 : child.fileCount),
    0
  );
  const folderCount = children.reduce(
    (sum, child) => sum + (child.kind === 'directory' ? 1 + child.folderCount : 0),
    0
  );
  return {
    name,
    path: extras.path ?? name,
    kind: 'directory',
    size,
    fileCount,
    folderCount,
    depth: extras.depth ?? 0,
    children,
    ...extras,
  };
}

export function mockFile(relativePath: string, size: number, lastModified = 1_700_000_000_000): File {
  const name = relativePath.split('/').pop() ?? relativePath;
  const file = new File([new Uint8Array(0)], name, { lastModified });
  Object.defineProperty(file, 'size', { value: size });
  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });
  return file;
}

export function mockFileHandle(name: string, size: number): FileSystemHandleLike {
  return {
    name,
    kind: 'file',
    getFile: async () => mockFile(name, size),
  };
}

export function mockDirHandle(name: string, children: FileSystemHandleLike[]): DirectoryHandleLike {
  return {
    name,
    kind: 'directory',
    values: async function* values() {
      yield* children;
    },
  };
}
