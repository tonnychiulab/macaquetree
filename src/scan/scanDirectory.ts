import { MAX_SCAN_DEPTH, type DirectoryHandleLike, type FileSystemHandleLike, type SerializedFileNode } from '../types';
import { fileExtension } from '../utils/helpers';
import { sortTreeBySize } from '../utils/tree';

export interface ScanStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  skippedCount: number;
}

export interface ScanDirectoryResult {
  rootNode: SerializedFileNode;
  stats: ScanStats;
}

interface ScanContext extends ScanStats {
  lastReportTime: number;
  visitedPaths: Set<string>;
  visitedHandles: DirectoryHandleLike[];
  onProgress?: (path: string, stats: ScanStats) => void;
  maxDepth: number;
}

async function alreadyVisited(
  handle: DirectoryHandleLike,
  path: string,
  ctx: ScanContext
): Promise<boolean> {
  if (ctx.visitedPaths.has(path)) return true;
  if (handle.isSameEntry) {
    for (const prev of ctx.visitedHandles) {
      try {
        if (await handle.isSameEntry(prev)) return true;
      } catch {
        // Some browsers throw; fall back to path identity.
      }
    }
  }
  return false;
}

function report(ctx: ScanContext, path: string, force = false): void {
  const now = Date.now();
  if (!force && now - ctx.lastReportTime <= 100) return;
  ctx.lastReportTime = now;
  ctx.onProgress?.(path, {
    totalFiles: ctx.totalFiles,
    totalFolders: ctx.totalFolders,
    totalSize: ctx.totalSize,
    skippedCount: ctx.skippedCount,
  });
}

async function scanHandle(
  handle: DirectoryHandleLike,
  currentPath: string,
  depth: number,
  ctx: ScanContext
): Promise<SerializedFileNode> {
  const node: SerializedFileNode = {
    name: handle.name,
    path: currentPath ? `${currentPath}/${handle.name}` : handle.name,
    kind: 'directory',
    size: 0,
    fileCount: 0,
    folderCount: 0,
    depth,
    children: [],
  };

  if (depth > 0) ctx.totalFolders++;
  report(ctx, node.path);

  if (depth > ctx.maxDepth) {
    ctx.skippedCount++;
    report(ctx, node.path, true);
    return node;
  }

  if (await alreadyVisited(handle, node.path, ctx)) {
    ctx.skippedCount++;
    return node;
  }
  ctx.visitedPaths.add(node.path);
  ctx.visitedHandles.push(handle);

  try {
    if (!handle.values) {
      ctx.skippedCount++;
      return node;
    }
    const dirEntries: FileSystemHandleLike[] = [];
    for await (const entry of handle.values()) {
      dirEntries.push(entry);
    }

    for (const entry of dirEntries) {
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile?.();
          if (!file) {
            ctx.skippedCount++;
            continue;
          }
          const fileNode: SerializedFileNode = {
            name: file.name,
            path: `${node.path}/${file.name}`,
            kind: 'file',
            size: file.size,
            fileCount: 1,
            folderCount: 0,
            depth: depth + 1,
            extension: fileExtension(file.name),
            lastModified: file.lastModified,
          };
          node.children!.push(fileNode);
          node.size += file.size;
          node.fileCount += 1;
          ctx.totalFiles++;
          ctx.totalSize += file.size;
          report(ctx, fileNode.path);
        } catch {
          ctx.skippedCount++;
        }
      } else if (entry.kind === 'directory' && entry.values) {
        try {
          const sub = await scanHandle(
            entry as DirectoryHandleLike,
            node.path,
            depth + 1,
            ctx
          );
          node.children!.push(sub);
          node.size += sub.size;
          node.fileCount += sub.fileCount;
          node.folderCount += 1 + sub.folderCount;
        } catch {
          ctx.skippedCount++;
        }
      } else {
        ctx.skippedCount++;
      }
    }

    sortTreeBySize(node);
  } catch {
    ctx.skippedCount++;
  }

  return node;
}

export async function scanDirectory(
  handle: DirectoryHandleLike,
  options: { maxDepth?: number; onProgress?: ScanContext['onProgress'] } = {}
): Promise<ScanDirectoryResult> {
  const ctx: ScanContext = {
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    skippedCount: 0,
    lastReportTime: 0,
    visitedPaths: new Set(),
    visitedHandles: [],
    onProgress: options.onProgress,
    maxDepth: options.maxDepth ?? MAX_SCAN_DEPTH,
  };

  const rootNode = await scanHandle(handle, '', 0, ctx);
  report(ctx, rootNode.path, true);
  return {
    rootNode,
    stats: {
      totalFiles: ctx.totalFiles,
      totalFolders: ctx.totalFolders,
      totalSize: ctx.totalSize,
      skippedCount: ctx.skippedCount,
    },
  };
}
