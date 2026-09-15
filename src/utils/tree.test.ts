import { describe, expect, it } from 'vitest';
import { MAX_SEARCH_ROWS } from '../types';
import {
  buildTreeFromFiles,
  collectSearchMatches,
  findNodeByPath,
  relativePathFrom,
  sortChildren,
} from './tree';
import { dirNode, fileNode, mockFile } from '../test/fixtures';

describe('findNodeByPath', () => {
  const nested = dirNode('root', [
    dirNode('photos', [fileNode('a.jpg', 10, { path: 'root/photos/a.jpg' })], {
      path: 'root/photos',
      depth: 1,
    }),
  ], { path: 'root' });

  it('returns the nested directory', () => {
    expect(findNodeByPath(nested, 'root/photos')?.name).toBe('photos');
  });

  it('returns the last found node when a segment is missing', () => {
    expect(findNodeByPath(nested, 'root/photos/missing')?.name).toBe('photos');
  });
});

describe('collectSearchMatches', () => {
  it('does not emit every descendant as a visible row', () => {
    const children = Array.from({ length: 50 }, (_, i) =>
      fileNode(`noise${i}.txt`, 1, { path: `root/noise${i}.txt` })
    );
    children.push(fileNode('target.log', 9, { path: 'root/target.log' }));
    const root = dirNode('root', children, { path: 'root' });
    const { matches, truncated } = collectSearchMatches(root, 'target');
    expect(matches).toHaveLength(1);
    expect(matches[0]?.name).toBe('target.log');
    expect(truncated).toBe(false);
  });

  it('truncates at MAX_SEARCH_ROWS', () => {
    const children = Array.from({ length: MAX_SEARCH_ROWS + 5 }, (_, i) =>
      fileNode(`hit${i}.txt`, 1, { path: `root/hit${i}.txt` })
    );
    const root = dirNode('root', children, { path: 'root' });
    const { matches, truncated } = collectSearchMatches(root, 'hit');
    expect(matches).toHaveLength(MAX_SEARCH_ROWS);
    expect(truncated).toBe(true);
  });
});

describe('buildTreeFromFiles', () => {
  it('builds folders and bubbles size', () => {
    const root = buildTreeFromFiles([
      mockFile('proj/src/a.ts', 40),
      mockFile('proj/src/b.ts', 60),
      mockFile('proj/readme.md', 10),
    ]);
    expect(root?.name).toBe('proj');
    expect(root?.size).toBe(110);
    expect(root?.fileCount).toBe(3);
    expect(root?.folderCount).toBe(1);
    const src = findNodeByPath(root!, 'proj/src');
    expect(src?.size).toBe(100);
  });

  it('returns null for an empty list', () => {
    expect(buildTreeFromFiles([])).toBeNull();
  });
});

describe('sortChildren and relativePathFrom', () => {
  it('sorts by size descending', () => {
    const sorted = sortChildren(
      [fileNode('a', 1), fileNode('b', 9)],
      'size',
      'desc'
    );
    expect(sorted.map((n) => n.name)).toEqual(['b', 'a']);
  });

  it('strips the root prefix', () => {
    expect(relativePathFrom('root', 'root/a/b')).toBe('a/b');
  });
});
