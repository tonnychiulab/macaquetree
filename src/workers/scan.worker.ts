// Web Worker for scanning directories in a separate thread.

import type { SerializedFileNode } from '../types';

// Global stats for progress reporting
let totalFiles = 0;
let totalFolders = 0;
let totalSize = 0;
let lastReportTime = 0;

// Listen for messages from the main thread
self.onmessage = async (e: MessageEvent) => {
  const { type, directoryHandle } = e.data;

  if (type === 'start') {
    try {
      totalFiles = 0;
      totalFolders = 0;
      totalSize = 0;
      lastReportTime = Date.now();

      const startTime = Date.now();
      const rootNode = await scanHandle(directoryHandle, '', 0);
      const executionTime = Date.now() - startTime;

      // Send final success message with root node
      self.postMessage({
        type: 'complete',
        rootNode,
        executionTime,
        totalFiles,
        totalFolders,
        totalSize
      });
    } catch (err: any) {
      self.postMessage({
        type: 'error',
        error: err.message || 'Unknown error occurred during scanning'
      });
    }
  }
};

// Recursive function to scan a directory handle
async function scanHandle(
  handle: any, // FileSystemDirectoryHandle
  currentPath: string,
  depth: number
): Promise<SerializedFileNode> {
  const node: SerializedFileNode = {
    name: handle.name,
    path: currentPath ? `${currentPath}/${handle.name}` : handle.name,
    kind: 'directory',
    size: 0,
    fileCount: 0,
    folderCount: 0,
    depth,
    children: []
  };

  if (depth > 0) {
    totalFolders++;
  }
  
  // Throttled progress updates to main thread
  reportProgress(node.path);

  try {
    const dirEntries: any[] = [];
    
    // Read all entries in directory
    for await (const entry of (handle as any).values()) {
      dirEntries.push(entry);
    }

    // Process all entries recursively
    for (const entry of dirEntries) {
      const entryPath = node.path;
      
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
          
          const fileNode: SerializedFileNode = {
            name: file.name,
            path: `${entryPath}/${file.name}`,
            kind: 'file',
            size: file.size,
            fileCount: 1,
            folderCount: 0,
            depth: depth + 1,
            extension: ext,
            lastModified: file.lastModified
          };

          node.children!.push(fileNode);
          node.size += file.size;
          node.fileCount += 1;
          
          totalFiles++;
          totalSize += file.size;
          
          // Throttled progress report
          reportProgress(fileNode.path);
        } catch (fileErr) {
          // Gracefully skip files with permission or locked errors
          console.warn(`Failed to read file: ${entry.name}`, fileErr);
        }
      } else if (entry.kind === 'directory') {
        try {
          const subDirNode = await scanHandle(entry, entryPath, depth + 1);
          node.children!.push(subDirNode);
          node.size += subDirNode.size;
          node.fileCount += subDirNode.fileCount;
          node.folderCount += 1 + subDirNode.folderCount;
        } catch (dirErr) {
          console.warn(`Failed to read directory: ${entry.name}`, dirErr);
        }
      }
    }
    
    // Sort children by size descending for easier display
    node.children!.sort((a, b) => b.size - a.size);
    
  } catch (err) {
    console.error(`Failed to list directory contents for: ${handle.name}`, err);
  }

  return node;
}

function reportProgress(currentPath: string) {
  const now = Date.now();
  // Limit progress reports to once every 100ms to avoid overwhelming main thread
  if (now - lastReportTime > 100) {
    self.postMessage({
      type: 'progress',
      totalFiles,
      totalFolders,
      totalSize,
      currentPath
    });
    lastReportTime = now;
  }
}
