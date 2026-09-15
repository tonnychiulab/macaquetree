import type { SerializedFileNode } from '../types';
import { formatBytes, type SizeUnit } from './helpers';
import { aggregateFileStats } from './stats';

export const MAX_REPORT_DIRS = 20;

export function sanitizeReportFilename(name: string): string {
  const trimmed = name.trim() || 'scan';
  let out = '';
  for (const ch of trimmed) {
    const code = ch.charCodeAt(0);
    if (code < 32 || '<>:"/\\|?*'.includes(ch)) {
      out += '_';
    } else {
      out += ch;
    }
  }
  return out.slice(0, 80) || 'scan';
}

export function reportStamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildReportFilename(rootName: string, date: Date = new Date()): string {
  return `MacaqueTree-${sanitizeReportFilename(rootName)}-${reportStamp(date)}.md`;
}

export function escapeMarkdownCell(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/`/g, "'")
    .replace(/\r?\n/g, ' ');
}

export function buildScanReportMarkdown(input: {
  rootNode: SerializedFileNode;
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  skippedCount: number;
  scanTimeMs: number;
  generatedAt?: Date;
  appVersion?: string;
  sizeUnit?: SizeUnit;
}): string {
  const generatedAt = input.generatedAt ?? new Date();
  const version = input.appVersion ?? (typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'unknown');
  const unit = input.sizeUnit ?? 'auto';
  const size = (bytes: number) => formatBytes(bytes, 2, unit);
  const { extStats, largestFiles } = aggregateFileStats(input.rootNode);
  const topDirs = (input.rootNode.children ?? [])
    .filter((child) => child.kind === 'directory')
    .sort((a, b) => b.size - a.size)
    .slice(0, MAX_REPORT_DIRS);

  const lines = [
    `# MacaqueTree 掃描報告`,
    '',
    `- 工具版本：${version}`,
    `- 產生時間：${generatedAt.toISOString()}`,
    `- 根目錄：${escapeMarkdownCell(input.rootNode.name)}`,
    `- 根路徑：\`${escapeMarkdownCell(input.rootNode.path)}\``,
    `- 容量單位：${unit === 'auto' ? '自動' : unit}`,
    '',
    '本檔由瀏覽器在本機產生，沒有上傳到應用程式伺服器。內容含目錄與檔名，請勿把他人磁碟的報告傳出去。',
    '',
    '## 摘要',
    '',
    `| 項目 | 數值 |`,
    `| --- | --- |`,
    `| 總容量 | ${size(input.totalSize)}（${input.totalSize.toLocaleString()} bytes） |`,
    `| 檔案數 | ${input.totalFiles.toLocaleString()} |`,
    `| 資料夾數 | ${input.totalFolders.toLocaleString()} |`,
    `| 略過（無法讀取） | ${input.skippedCount.toLocaleString()} |`,
    `| 掃描耗時 | ${(input.scanTimeMs / 1000).toFixed(2)} 秒 |`,
    '',
    '## 最大檔案 TOP 10',
    '',
  ];

  if (largestFiles.length === 0) {
    lines.push('（沒有檔案）', '');
  } else {
    lines.push('| 檔案 | 大小 |', '| --- | --- |');
    for (const file of largestFiles) {
      lines.push(`| \`${escapeMarkdownCell(file.path)}\` | ${size(file.size)} |`);
    }
    lines.push('');
  }

  lines.push('## 副檔名佔用', '');
  if (extStats.length === 0) {
    lines.push('（沒有副檔名統計）', '');
  } else {
    lines.push('| 副檔名 | 分類 | 數量 | 大小 |', '| --- | --- | --- | --- |');
    for (const stat of extStats.slice(0, 20)) {
      lines.push(`| ${escapeMarkdownCell(stat.ext)} | ${escapeMarkdownCell(stat.category)} | ${stat.count.toLocaleString()} | ${size(stat.size)} |`);
    }
    lines.push('');
  }

  lines.push('## 第一層資料夾', '');
  if (topDirs.length === 0) {
    lines.push('（根目錄沒有子資料夾）', '');
  } else {
    lines.push('| 資料夾 | 檔案數 | 大小 |', '| --- | --- | --- |');
    for (const dir of topDirs) {
      lines.push(`| \`${escapeMarkdownCell(dir.name)}\` | ${dir.fileCount.toLocaleString()} | ${size(dir.size)} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function triggerTextDownload(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
