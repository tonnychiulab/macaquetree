import type {
  DirectoryHandleLike,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from '../types';
import { buildTreeFromFiles } from '../utils/tree';
import { scanDirectory } from './scanDirectory';

export type PostMessage = (message: WorkerOutboundMessage) => void;

export function createScanWorkerRuntime(post: PostMessage) {
  let fileBuffer: File[] = [];
  let lastReport = 0;

  const reportFilesProgress = (currentPath: string, processed: number, total: number) => {
    const now = Date.now();
    if (now - lastReport <= 100 && processed < total) return;
    lastReport = now;
    post({
      type: 'progress',
      totalFiles: processed,
      totalFolders: 0,
      totalSize: 0,
      currentPath,
      skippedCount: 0,
      processed,
      total,
    });
  };

  return {
    async handle(data: WorkerInboundMessage): Promise<void> {
      try {
        if (data.type === 'start') {
          const started = Date.now();
          const { rootNode, stats } = await scanDirectory(data.directoryHandle, {
            onProgress: (currentPath, live) => {
              post({
                type: 'progress',
                totalFiles: live.totalFiles,
                totalFolders: live.totalFolders,
                totalSize: live.totalSize,
                currentPath,
                skippedCount: live.skippedCount,
              });
            },
          });
          post({
            type: 'complete',
            rootNode,
            executionTime: Date.now() - started,
            totalFiles: stats.totalFiles,
            totalFolders: stats.totalFolders,
            totalSize: stats.totalSize,
            skippedCount: stats.skippedCount,
          });
          return;
        }

        if (data.type === 'start-files') {
          if (data.batchIndex === 0) {
            fileBuffer = [];
            lastReport = 0;
          }
          fileBuffer.push(...data.files);
          const last = data.files.at(-1);
          const relative =
            last && 'webkitRelativePath' in last && typeof last.webkitRelativePath === 'string'
              ? last.webkitRelativePath
              : last?.name ?? '';
          reportFilesProgress(relative, fileBuffer.length, data.totalFiles);

          if (!data.done) return;

          const started = Date.now();
          const rootNode = buildTreeFromFiles(fileBuffer);
          if (!rootNode) {
            post({ type: 'error', error: '沒有可分析的檔案。' });
            fileBuffer = [];
            return;
          }
          post({
            type: 'complete',
            rootNode,
            executionTime: Date.now() - started,
            totalFiles: rootNode.fileCount,
            totalFolders: rootNode.folderCount,
            totalSize: rootNode.size,
            skippedCount: 0,
          });
          fileBuffer = [];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred during scanning';
        post({ type: 'error', error: message });
      }
    },
    // Expose for tests that need a typed handle without going through File System Access.
    async scanHandleForTest(handle: DirectoryHandleLike) {
      return scanDirectory(handle);
    },
  };
}
