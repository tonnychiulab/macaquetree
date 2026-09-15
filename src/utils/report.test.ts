import { describe, expect, it, vi } from 'vitest';
import {
  buildReportFilename,
  buildScanReportMarkdown,
  escapeMarkdownCell,
  sanitizeReportFilename,
  triggerTextDownload,
} from './report';
import { dirNode, fileNode } from '../test/fixtures';

describe('scan report markdown', () => {
  it('sanitizes filenames and stamps the root name', () => {
    expect(sanitizeReportFilename('CAD 圖解析')).toBe('CAD 圖解析');
    expect(sanitizeReportFilename('a/b:c')).toBe('a_b_c');
    expect(sanitizeReportFilename('')).toBe('scan');
    expect(buildReportFilename('proj', new Date(2026, 8, 15))).toBe(
      'MacaqueTree-proj-2026-09-15.md'
    );
  });

  it('escapes pipes, backticks, and newlines in table cells', () => {
    expect(escapeMarkdownCell('a|b`c\nd')).toBe("a\\|b'c d");
    const root = dirNode('a|b', [fileNode('x|y`.ts', 10, { path: 'a|b/x|y`.ts', extension: '.ts' })], {
      path: 'a|b',
    });
    const markdown = buildScanReportMarkdown({
      rootNode: root,
      totalFiles: 1,
      totalFolders: 0,
      totalSize: 10,
      skippedCount: 0,
      scanTimeMs: 1,
      appVersion: '1.1.0',
    });
    expect(markdown).toContain('a\\|b');
    expect(markdown).not.toContain('| a|b |');
  });

  it('includes summary, skipped count, and top files', () => {
    const root = dirNode(
      'proj',
      [
        dirNode('src', [fileNode('a.ts', 40, { path: 'proj/src/a.ts', extension: '.ts' })], {
          path: 'proj/src',
        }),
        fileNode('readme.md', 10, { path: 'proj/readme.md', extension: '.md' }),
      ],
      { path: 'proj' }
    );
    const markdown = buildScanReportMarkdown({
      rootNode: root,
      totalFiles: 2,
      totalFolders: 1,
      totalSize: 50,
      skippedCount: 3,
      scanTimeMs: 80,
      generatedAt: new Date('2026-09-15T09:00:00.000Z'),
      appVersion: '1.1.0',
    });
    expect(markdown).toContain('工具版本：1.1.0');
    expect(markdown).toContain('略過（無法讀取） | 3');
    expect(markdown).toContain('proj/src/a.ts');
    expect(markdown).toContain('src');
    expect(markdown).toContain('沒有上傳');
  });

  it('writes empty-state copy when there are no files or folders', () => {
    const root = dirNode('empty', [], { path: 'empty' });
    const markdown = buildScanReportMarkdown({
      rootNode: root,
      totalFiles: 0,
      totalFolders: 0,
      totalSize: 0,
      skippedCount: 0,
      scanTimeMs: 0,
      appVersion: '1.1.0',
    });
    expect(markdown).toContain('沒有檔案');
    expect(markdown).toContain('沒有副檔名統計');
    expect(markdown).toContain('根目錄沒有子資料夾');
  });

  it('triggers a local markdown download', () => {
    const click = vi.fn();
    const remove = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      remove,
      rel: '',
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:report',
      revokeObjectURL: vi.fn(),
    });

    triggerTextDownload('report.md', '# hi');
    expect(click).toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
