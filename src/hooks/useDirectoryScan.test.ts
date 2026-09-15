import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { isFileSystemAccessSupported, useDirectoryScan } from './useDirectoryScan';
import { mockFile } from '../test/fixtures';
import type { WorkerOutboundMessage } from '../types';

class FakeWorker {
  onmessage: ((event: MessageEvent<WorkerOutboundMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();

  emit(data: WorkerOutboundMessage) {
    this.onmessage?.({ data } as MessageEvent<WorkerOutboundMessage>);
  }
}

describe('isFileSystemAccessSupported', () => {
  it('is false without a picker', () => {
    const original = window.showDirectoryPicker;
    delete window.showDirectoryPicker;
    expect(isFileSystemAccessSupported()).toBe(false);
    window.showDirectoryPicker = original;
  });
});

describe('useDirectoryScan', () => {
  it('forwards complete payloads including skippedCount', async () => {
    const worker = new FakeWorker();
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          return worker;
        }
      }
    );

    const { result } = renderHook(() => useDirectoryScan());
    const files = [mockFile('proj/a.txt', 3)] as unknown as FileList;
    await result.current.startFallbackScan(files);

    expect(worker.postMessage).toHaveBeenCalled();
    worker.emit({
      type: 'complete',
      rootNode: {
        name: 'proj',
        path: 'proj',
        kind: 'directory',
        size: 3,
        fileCount: 1,
        folderCount: 0,
        depth: 0,
        children: [],
      },
      executionTime: 12,
      totalFiles: 1,
      totalFolders: 0,
      totalSize: 3,
      skippedCount: 2,
    });

    await waitFor(() => {
      expect(result.current.rootNode?.name).toBe('proj');
      expect(result.current.skippedCount).toBe(2);
      expect(result.current.focusedPath).toBe('proj');
      expect(result.current.isScanning).toBe(false);
    });

    result.current.cancelScan();
    expect(worker.terminate).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('handles picker abort, worker error, progress, and reset', async () => {
    const worker = new FakeWorker();
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          return worker;
        }
      }
    );
    window.showDirectoryPicker = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('cancel'), { name: 'AbortError' }))
      .mockResolvedValueOnce({ name: 'root', values: async function* () {} });

    const { result } = renderHook(() => useDirectoryScan());
    await result.current.startFileSystemScan();
    expect(result.current.error).toBeNull();
    expect(result.current.isScanning).toBe(false);

    await result.current.startFileSystemScan();
    worker.emit({
      type: 'progress',
      totalFiles: 4,
      totalFolders: 1,
      totalSize: 20,
      currentPath: 'root/x',
      skippedCount: 0,
    });
    await waitFor(() => expect(result.current.totalFiles).toBe(4));

    worker.emit({ type: 'error', error: 'boom' });
    await waitFor(() => expect(result.current.error).toBe('boom'));

    result.current.setError(null);
    result.current.reset();
    expect(result.current.rootNode).toBeNull();
    expect(result.current.focusedPath).toBe('');
    vi.unstubAllGlobals();
  });

  it('ignores empty fallback lists and reports picker or worker failures', async () => {
    const worker = new FakeWorker();
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          return worker;
        }
      }
    );

    const { result } = renderHook(() => useDirectoryScan());
    await result.current.startFallbackScan(null);
    expect(result.current.isScanning).toBe(false);

    const originalPicker = window.showDirectoryPicker;
    window.showDirectoryPicker = undefined;
    await result.current.startFileSystemScan();
    await waitFor(() => {
      expect(result.current.error).toMatch(/不支援 File System Access API/);
    });

    window.showDirectoryPicker = vi.fn().mockRejectedValue(new Error('denied'));
    await result.current.startFileSystemScan();
    await waitFor(() => expect(result.current.error).toBe('denied'));

    window.showDirectoryPicker = vi.fn().mockResolvedValue({ name: 'root', kind: 'directory' });
    await result.current.startFileSystemScan();
    worker.onerror?.({ message: 'script fail' } as ErrorEvent);
    await waitFor(() => expect(result.current.error).toMatch(/掃描引擎載入失敗/));

    window.showDirectoryPicker = originalPicker;
    vi.unstubAllGlobals();
  });
});
