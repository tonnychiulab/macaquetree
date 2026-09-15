import { describe, expect, it } from 'vitest';
import { scanDirectory } from './scanDirectory';
import { mockDirHandle, mockFileHandle } from '../test/fixtures';

function nest(depth: number) {
  let current = mockDirHandle('leaf', [mockFileHandle('deep.bin', 4)]);
  for (let i = depth; i >= 1; i--) {
    current = mockDirHandle(`d${i}`, [current]);
  }
  return mockDirHandle('root', [current]);
}

describe('scanDirectory', () => {
  it('counts files and folders', async () => {
    const handle = mockDirHandle('root', [
      mockFileHandle('a.txt', 10),
      mockDirHandle('sub', [mockFileHandle('b.txt', 5)]),
    ]);
    const { rootNode, stats } = await scanDirectory(handle);
    expect(stats.totalFiles).toBe(2);
    expect(stats.totalFolders).toBe(1);
    expect(rootNode.size).toBe(15);
    expect(stats.skippedCount).toBe(0);
  });

  it('skips files that fail to open', async () => {
    const handle = mockDirHandle('root', [
      {
        name: 'locked.bin',
        kind: 'file',
        getFile: async () => {
          throw new Error('locked');
        },
      },
      mockFileHandle('ok.txt', 3),
    ]);
    const { stats } = await scanDirectory(handle);
    expect(stats.totalFiles).toBe(1);
    expect(stats.skippedCount).toBe(1);
  });

  it('truncates depth 65 when maxDepth is 64', async () => {
    const { stats, rootNode } = await scanDirectory(nest(65), { maxDepth: 64 });
    expect(stats.skippedCount).toBeGreaterThan(0);
    let node = rootNode;
    for (let i = 0; i < 70; i++) {
      const next = node.children?.find((c) => c.kind === 'directory');
      if (!next) break;
      node = next;
    }
    expect(node.children?.some((c) => c.name === 'deep.bin')).toBeFalsy();
  });

  it('skips directories already seen via isSameEntry', async () => {
    const shared: ReturnType<typeof mockDirHandle> = mockDirHandle('loop', []);
    shared.isSameEntry = async (other) => other === shared;
    shared.values = async function* values() {
      yield shared;
      yield mockFileHandle('once.txt', 2);
    };
    const { stats } = await scanDirectory(shared);
    expect(stats.totalFiles).toBe(1);
    expect(stats.skippedCount).toBeGreaterThan(0);
  });

  it('skips unknown handle kinds and missing getFile', async () => {
    const handle = mockDirHandle('root', [
      { name: 'odd', kind: 'symlink' },
      { name: 'ghost', kind: 'file' },
    ]);
    const { stats } = await scanDirectory(handle);
    expect(stats.skippedCount).toBeGreaterThanOrEqual(2);
  });

  it('skips a directory handle that cannot list children', async () => {
    const { stats } = await scanDirectory({
      name: 'root',
      kind: 'directory',
    });
    expect(stats.skippedCount).toBeGreaterThan(0);
  });

  it('counts a directory listing failure as skipped', async () => {
    const handle: ReturnType<typeof mockDirHandle> = mockDirHandle('root', []);
    handle.values = () => ({
      [Symbol.asyncIterator]() {
        return {
          next() {
            return Promise.reject(new Error('denied'));
          },
        };
      },
    });
    const { stats } = await scanDirectory(handle);
    expect(stats.skippedCount).toBeGreaterThan(0);
  });
});
