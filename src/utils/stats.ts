import type { ExtensionStat, SerializedFileNode } from '../types';
import { getExtensionCategory, getExtensionColor } from './helpers';

const TOP_N = 10;

function insertLargest(list: SerializedFileNode[], file: SerializedFileNode): void {
  if (list.length < TOP_N) {
    list.push(file);
    list.sort((a, b) => b.size - a.size);
    return;
  }
  const last = list[list.length - 1];
  if (!last || file.size <= last.size) return;
  list[list.length - 1] = file;
  list.sort((a, b) => b.size - a.size);
}

export function aggregateFileStats(root: SerializedFileNode): {
  extStats: ExtensionStat[];
  largestFiles: SerializedFileNode[];
} {
  const extMap = new Map<string, { size: number; count: number }>();
  const largestFiles: SerializedFileNode[] = [];

  const walk = (node: SerializedFileNode) => {
    if (node.kind === 'file') {
      const ext = node.extension || '.unknown';
      const bucket = extMap.get(ext) ?? { size: 0, count: 0 };
      bucket.size += node.size;
      bucket.count += 1;
      extMap.set(ext, bucket);
      insertLargest(largestFiles, node);
      return;
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };

  walk(root);

  const extStats: ExtensionStat[] = [...extMap.entries()]
    .map(([ext, data]) => ({
      ext,
      category: getExtensionCategory(ext),
      size: data.size,
      count: data.count,
      color: getExtensionColor(ext),
    }))
    .sort((a, b) => b.size - a.size);

  return { extStats, largestFiles };
}
