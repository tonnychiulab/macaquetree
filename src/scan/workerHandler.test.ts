import { describe, expect, it } from 'vitest';
import { createScanWorkerRuntime } from './workerHandler';
import { mockDirHandle, mockFile, mockFileHandle } from '../test/fixtures';
import type { WorkerOutboundMessage } from '../types';

describe('createScanWorkerRuntime', () => {
  it('includes skippedCount on complete', async () => {
    const messages: WorkerOutboundMessage[] = [];
    const runtime = createScanWorkerRuntime((msg) => messages.push(msg));
    await runtime.handle({
      type: 'start',
      directoryHandle: mockDirHandle('root', [
        {
          name: 'bad',
          kind: 'file',
          getFile: async () => {
            throw new Error('nope');
          },
        },
        mockFileHandle('ok.txt', 8),
      ]),
    });
    const complete = messages.find((m) => m.type === 'complete');
    expect(complete?.type).toBe('complete');
    if (complete?.type === 'complete') {
      expect(complete.skippedCount).toBe(1);
      expect(complete.totalFiles).toBe(1);
    }
  });

  it('builds a tree from start-files batches', async () => {
    const messages: WorkerOutboundMessage[] = [];
    const runtime = createScanWorkerRuntime((msg) => messages.push(msg));
    await runtime.handle({
      type: 'start-files',
      files: [mockFile('proj/a.txt', 4)],
      batchIndex: 0,
      done: false,
      totalFiles: 2,
    });
    await runtime.handle({
      type: 'start-files',
      files: [mockFile('proj/b.txt', 6)],
      batchIndex: 1,
      done: true,
      totalFiles: 2,
    });
    const complete = messages.find((m) => m.type === 'complete');
    expect(complete?.type).toBe('complete');
    if (complete?.type === 'complete') {
      expect(complete.rootNode.size).toBe(10);
      expect(complete.totalFiles).toBe(2);
      expect(complete.skippedCount).toBe(0);
    }
  });

  it('posts an error when the file list is empty on done', async () => {
    const messages: WorkerOutboundMessage[] = [];
    const runtime = createScanWorkerRuntime((msg) => messages.push(msg));
    await runtime.handle({
      type: 'start-files',
      files: [],
      batchIndex: 0,
      done: true,
      totalFiles: 0,
    });
    expect(messages.some((m) => m.type === 'error')).toBe(true);
  });

  it('exposes scanHandleForTest for the same scan path', async () => {
    const runtime = createScanWorkerRuntime(() => undefined);
    const { stats } = await runtime.scanHandleForTest(
      mockDirHandle('root', [mockFileHandle('ok.txt', 2)])
    );
    expect(stats.totalFiles).toBe(1);
  });

  it('posts an error when scanning throws', async () => {
    const messages: WorkerOutboundMessage[] = [];
    const runtime = createScanWorkerRuntime((msg) => messages.push(msg));
    await runtime.handle({
      type: 'start',
      directoryHandle: null as never,
    });
    expect(messages.some((m) => m.type === 'error')).toBe(true);
  });
});
