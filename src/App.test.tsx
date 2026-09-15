import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { SCAN_ACTION_LABEL } from './brand';
import { mockFile } from './test/fixtures';
import type { WorkerOutboundMessage } from './types';

class FakeWorker {
  static latest: FakeWorker | null = null;
  onmessage: ((event: MessageEvent<WorkerOutboundMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();

  constructor() {
    FakeWorker.latest = this;
  }

  emit(data: WorkerOutboundMessage) {
    this.onmessage?.({ data } as MessageEvent<WorkerOutboundMessage>);
  }
}

const sampleRoot = {
  name: 'proj',
  path: 'proj',
  kind: 'directory' as const,
  size: 12,
  fileCount: 1,
  folderCount: 0,
  depth: 0,
  children: [
    {
      name: 'a.ts',
      path: 'proj/a.ts',
      kind: 'file' as const,
      size: 12,
      fileCount: 1,
      folderCount: 0,
      depth: 1,
      extension: '.ts',
    },
  ],
};

describe('App', () => {
  it('shows the package version badge and honest privacy copy', () => {
    vi.stubGlobal('Worker', FakeWorker);
    render(<App />);
    expect(screen.getByTitle(`MacaqueTree ${__APP_VERSION__}`)).toBeInTheDocument();
    expect(screen.getByText(`MacaqueTree ${__APP_VERSION__}`)).toBeInTheDocument();
    expect(screen.getByText('免安裝本機磁碟空間分析')).toBeInTheDocument();
    expect(document.title).toBe('MacaqueTree · 免安裝本機磁碟空間分析');
    expect(screen.getByText(/沒有上傳檔案或掃描結果的邏輯/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: SCAN_ACTION_LABEL })).toHaveLength(1);
    expect(screen.queryByText('Antigravity Team')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('renders dashboard after a fallback scan completes', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const user = userEvent.setup();
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = mockFile('proj/a.ts', 12);
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => expect(FakeWorker.latest).not.toBeNull());
    FakeWorker.latest!.emit({
      type: 'progress',
      totalFiles: 1,
      totalFolders: 0,
      totalSize: 12,
      currentPath: 'proj/a.ts',
      skippedCount: 1,
      processed: 1,
      total: 1,
    });
    FakeWorker.latest!.emit({
      type: 'complete',
      rootNode: sampleRoot,
      executionTime: 40,
      totalFiles: 1,
      totalFolders: 0,
      totalSize: 12,
      skippedCount: 1,
    });

    expect(await screen.findByText(/樹狀目錄表格/)).toBeInTheDocument();
    expect(screen.getByText(/略過 1/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Treemap/i }));
    expect(screen.getByText(/雙擊資料夾可鑽取進入/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Charts/i }));
    expect(screen.getByTitle('a.ts')).toBeInTheDocument();
    URL.createObjectURL = vi.fn(() => 'blob:report');
    URL.revokeObjectURL = vi.fn();
    await user.click(screen.getByRole('button', { name: /下載報告/ }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /重新掃描/ }));
    expect(screen.getByText(/開始分析您的磁碟空間/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('shows determinate fallback progress then lets the user cancel', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: SCAN_ACTION_LABEL }));
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    input.dispatchEvent(new Event('click', { bubbles: true }));
    const file = mockFile('proj/a.ts', 12);
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => expect(FakeWorker.latest).not.toBeNull());
    FakeWorker.latest!.emit({
      type: 'progress',
      totalFiles: 1,
      totalFolders: 0,
      totalSize: 12,
      currentPath: 'proj/a.ts',
      skippedCount: 1,
      processed: 1,
      total: 2,
    });
    expect(await screen.findByText(/進度: 1 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText(/已略過無法讀取的項目/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /停止掃描/ }));
    expect(FakeWorker.latest!.terminate).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('covers File System Access scan, error dismiss, and tree tab', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    window.showDirectoryPicker = vi.fn().mockResolvedValue({ name: 'proj', kind: 'directory' });
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/您的瀏覽器已完美支援 File System Access API/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: SCAN_ACTION_LABEL }));
    expect(await screen.findByText(/正在深度分析磁碟目錄空間/)).toBeInTheDocument();
    FakeWorker.latest!.emit({
      type: 'error',
      error: 'picker failed',
    });
    expect(await screen.findByText('picker failed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /關閉錯誤訊息/ }));
    expect(screen.queryByText('picker failed')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: SCAN_ACTION_LABEL }));
    FakeWorker.latest!.emit({
      type: 'complete',
      rootNode: sampleRoot,
      executionTime: 10,
      totalFiles: 1,
      totalFolders: 0,
      totalSize: 12,
      skippedCount: 0,
    });
    expect(await screen.findByText(/樹狀目錄表格/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Tree Table/i }));
    vi.unstubAllGlobals();
  });

  it('warns when a completed scan exceeds the large-tree threshold', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    window.showDirectoryPicker = vi.fn().mockResolvedValue({ name: 'proj', kind: 'directory' });
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: SCAN_ACTION_LABEL }));
    FakeWorker.latest!.emit({
      type: 'complete',
      rootNode: { ...sampleRoot, fileCount: 50_000 },
      executionTime: 10,
      totalFiles: 50_000,
      totalFolders: 0,
      totalSize: 12,
      skippedCount: 0,
    });
    expect(await screen.findByText(/建議改掃較小的子資料夾/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
