import { describe, expect, it } from 'vitest';
import { aggregateFileStats } from './stats';
import { dirNode, fileNode } from '../test/fixtures';
import type { SerializedFileNode } from '../types';

function collectThenSort(root: SerializedFileNode): SerializedFileNode[] {
  const files: SerializedFileNode[] = [];
  const walk = (node: SerializedFileNode) => {
    if (node.kind === 'file') files.push(node);
    node.children?.forEach(walk);
  };
  walk(root);
  return [...files].sort((a, b) => b.size - a.size).slice(0, 10);
}

describe('aggregateFileStats', () => {
  it('returns empty ranking when there are no files', () => {
    const root = dirNode('empty', []);
    const result = aggregateFileStats(root);
    expect(result.largestFiles).toEqual([]);
    expect(result.extStats).toEqual([]);
  });

  it('matches a full collect-and-sort top 10', () => {
    const files = Array.from({ length: 15 }, (_, i) =>
      fileNode(`f${i}.bin`, (i + 1) * 100, {
        path: `root/f${i}.bin`,
        extension: '.bin',
      })
    );
    const root = dirNode('root', files, { path: 'root' });
    const result = aggregateFileStats(root);
    expect(result.largestFiles.map((f) => f.path)).toEqual(
      collectThenSort(root).map((f) => f.path)
    );
    expect(result.largestFiles).toHaveLength(10);
    expect(result.extStats[0]?.ext).toBe('.bin');
    expect(result.extStats[0]?.count).toBe(15);
  });
});
