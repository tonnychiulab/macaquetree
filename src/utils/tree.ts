import { MAX_SEARCH_ROWS } from '../types';
import type { SerializedFileNode } from '../types';
import { fileExtension } from './helpers';

export function findNodeByPath(
  root: SerializedFileNode,
  targetPath: string
): SerializedFileNode | null {
  if (!targetPath || targetPath === root.path) return root;

  const relPath = targetPath.startsWith(root.path)
    ? targetPath.substring(root.path.length)
    : targetPath;
  const parts = relPath.split('/').filter(Boolean);
  let current: SerializedFileNode = root;

  for (const part of parts) {
    const found = current.children?.find(
      (child) => child.name === part && child.kind === 'directory'
    );
    if (!found) return current;
    current = found;
  }
  return current;
}

export function collectSearchMatches(
  root: SerializedFileNode,
  query: string,
  maxRows: number = MAX_SEARCH_ROWS
): { matches: SerializedFileNode[]; truncated: boolean } {
  const needle = query.trim().toLowerCase();
  const matches: SerializedFileNode[] = [];
  if (!needle) return { matches, truncated: false };

  let truncated = false;
  const walk = (node: SerializedFileNode, isRoot: boolean) => {
    if (truncated) return;
    if (!isRoot && node.name.toLowerCase().includes(needle)) {
      if (matches.length >= maxRows) {
        truncated = true;
        return;
      }
      matches.push(node);
    }
    if (node.children) {
      for (const child of node.children) walk(child, false);
    }
  };

  walk(root, true);
  return { matches, truncated };
}

export function relativePathFrom(rootPath: string, nodePath: string): string {
  if (nodePath === rootPath) return nodePath;
  if (nodePath.startsWith(`${rootPath}/`)) return nodePath.slice(rootPath.length + 1);
  return nodePath;
}

export function sortChildren(
  children: SerializedFileNode[],
  field: 'name' | 'size' | 'fileCount' | 'lastModified',
  order: 'asc' | 'desc'
): SerializedFileNode[] {
  const sorted = [...children].sort((a, b) => {
    const comparison =
      field === 'name'
        ? a.name.localeCompare(b.name)
        : field === 'size'
          ? a.size - b.size
          : field === 'fileCount'
            ? a.fileCount - b.fileCount
            : (a.lastModified || 0) - (b.lastModified || 0);
    return order === 'asc' ? comparison : -comparison;
  });
  return sorted;
}

export function sortTreeBySize(node: SerializedFileNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => b.size - a.size);
  for (const child of node.children) sortTreeBySize(child);
}

function ensureFolder(
  folderMap: Map<string, SerializedFileNode>,
  root: SerializedFileNode,
  folderPath: string,
  pathParts: string[]
): SerializedFileNode {
  if (folderMap.has(folderPath)) return folderMap.get(folderPath)!;

  let currentPath = root.path;
  for (let j = 1; j < pathParts.length - 1; j++) {
    const part = pathParts[j];
    const nextPath = `${currentPath}/${part}`;
    if (!folderMap.has(nextPath)) {
      const newFolder: SerializedFileNode = {
        name: part,
        path: nextPath,
        kind: 'directory',
        size: 0,
        fileCount: 0,
        folderCount: 0,
        depth: j,
        children: [],
      };
      folderMap.set(nextPath, newFolder);
      folderMap.get(currentPath)!.children!.push(newFolder);
      root.folderCount++;
    }
    currentPath = nextPath;
  }
  return folderMap.get(folderPath)!;
}

export function buildTreeFromFiles(
  files: Array<Pick<File, 'name' | 'size' | 'lastModified'> & { webkitRelativePath: string }>,
  onProgress?: (processed: number, currentPath: string) => void
): SerializedFileNode | null {
  if (files.length === 0) return null;

  const rootPathName = files[0].webkitRelativePath.split('/')[0] || 'Selected Folder';
  const root: SerializedFileNode = {
    name: rootPathName,
    path: rootPathName,
    kind: 'directory',
    size: 0,
    fileCount: 0,
    folderCount: 0,
    depth: 0,
    children: [],
  };

  const folderMap = new Map<string, SerializedFileNode>();
  folderMap.set(root.path, root);

  files.forEach((file, index) => {
    const pathParts = file.webkitRelativePath.split('/');
    const folderPath = pathParts.slice(0, -1).join('/');
    const parentFolder = ensureFolder(folderMap, root, folderPath, pathParts);

    const fileNode: SerializedFileNode = {
      name: file.name,
      path: `${parentFolder.path}/${file.name}`,
      kind: 'file',
      size: file.size,
      fileCount: 1,
      folderCount: 0,
      depth: parentFolder.depth + 1,
      extension: fileExtension(file.name),
      lastModified: file.lastModified,
    };

    parentFolder.children!.push(fileNode);

    let currentBubblePath: string | null = folderPath;
    while (currentBubblePath && currentBubblePath.length >= root.path.length) {
      const nodeToUpdate = folderMap.get(currentBubblePath);
      if (nodeToUpdate) {
        nodeToUpdate.size += file.size;
        nodeToUpdate.fileCount++;
      }
      const lastSlashIdx = currentBubblePath.lastIndexOf('/');
      currentBubblePath = lastSlashIdx > 0 ? currentBubblePath.substring(0, lastSlashIdx) : null;
    }

    onProgress?.(index + 1, file.webkitRelativePath);
  });

  sortTreeBySize(root);
  return root;
}
