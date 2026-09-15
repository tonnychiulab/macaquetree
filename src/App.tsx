import { useEffect, useState } from 'react';
import { StatsView } from './components/StatsView';
import { TreeTable } from './components/TreeTable';
import { TreemapView } from './components/TreemapView';
import { ChartsView } from './components/ChartsView';
import { WelcomeView } from './components/WelcomeView';
import { LargeScanNotice, ScanProgress } from './components/ScanProgress';
import { SizeUnitSelect } from './components/SizeUnitSelect';
import { SizeUnitProvider, useSizeUnit } from './hooks/useSizeUnit';
import { isFileSystemAccessSupported, useDirectoryScan } from './hooks/useDirectoryScan';
import { appStyles as styles } from './appStyles';
import { APP_NAME, APP_TAGLINE, APP_TITLE } from './brand';
import { buildReportFilename, buildScanReportMarkdown, triggerTextDownload } from './utils/report';
import type { SerializedFileNode } from './types';
import {
  Terminal,
  RefreshCw,
  LayoutGrid,
  BarChart3,
  Layers,
  X,
  Download,
} from 'lucide-react';

type TabType = 'tree' | 'treemap' | 'charts';

export default function App() {
  return (
    <SizeUnitProvider>
      <AppShell />
    </SizeUnitProvider>
  );
}

function AppShell() {
  const [selectedNode, setSelectedNode] = useState<SerializedFileNode | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('tree');
  const isApiSupported = isFileSystemAccessSupported();
  const scan = useDirectoryScan();
  const {
    isScanning,
    rootNode,
    focusedPath,
    setFocusedPath,
    totalFiles,
    totalFolders,
    totalSize,
    scanTime,
    currentScanningPath,
    error,
    setError,
    scanSpeed,
    skippedCount,
    processed,
    knownTotal,
    fileInputRef,
    startFileSystemScan,
    startFallbackScan,
    cancelScan,
    reset,
  } = scan;
  const { sizeUnit, formatSize } = useSizeUnit();

  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  const progressPercent =
    knownTotal && knownTotal > 0 ? Math.min(100, (processed / knownTotal) * 100) : null;

  const downloadReport = () => {
    if (!rootNode) return;
    const markdown = buildScanReportMarkdown({
      rootNode,
      totalFiles,
      totalFolders,
      totalSize,
      skippedCount,
      scanTimeMs: scanTime,
      appVersion: __APP_VERSION__,
      sizeUnit,
    });
    triggerTextDownload(buildReportFilename(rootNode.name), markdown);
  };

  return (
    <div style={styles.appContainer}>
      <header className="glass-panel" style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <img
              src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
              width={40}
              height={40}
              alt=""
            />
          </div>
          <div>
            <h1 style={styles.logoText}>
              {APP_NAME}{' '}
              <span style={styles.badge} title={`${APP_NAME} ${__APP_VERSION__}`}>
                {__APP_VERSION__}
              </span>
            </h1>
            <p style={styles.logoSub}>{APP_TAGLINE}</p>
          </div>
        </div>

        <div style={styles.controlsSection}>
          <SizeUnitSelect />
          {isScanning ? (
            <button onClick={cancelScan} className="glow-btn" style={{ ...styles.scanBtn, background: 'var(--btn-danger)', color: 'var(--btn-text)' }}>
              <X size={16} />
              停止掃描
            </button>
          ) : rootNode ? (
            <div style={styles.buttonGroup}>
              <button onClick={downloadReport} className="secondary-btn">
                <Download size={16} />
                下載報告
              </button>
              <button onClick={() => { setSelectedNode(null); reset(); }} className="secondary-btn">
                <RefreshCw size={16} />
                重新掃描
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main style={styles.mainContent}>
        {error && (
          <div className="glass-panel" style={styles.errorBanner} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <Terminal size={18} color="var(--color-critical)" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} style={styles.closeBtn} aria-label="關閉錯誤訊息">✕</button>
          </div>
        )}

        {isScanning && (
          <ScanProgress
            totalFiles={totalFiles}
            totalFolders={totalFolders}
            totalSizeLabel={formatSize(totalSize)}
            scanSpeed={scanSpeed}
            progressPercent={progressPercent}
            processed={processed}
            knownTotal={knownTotal}
            skippedCount={skippedCount}
            currentScanningPath={currentScanningPath}
          />
        )}

        {!isScanning && !rootNode && (
          <WelcomeView
            isApiSupported={isApiSupported}
            fileInputRef={fileInputRef}
            onFileSystemScan={startFileSystemScan}
            onFallbackScan={(files) => { void startFallbackScan(files); }}
          />
        )}

        {rootNode && (
          <div style={styles.dashboard}>
            {skippedCount > 0 && (
              <div className="glass-panel" style={styles.errorBanner} role="status">
                掃描時略過 {skippedCount.toLocaleString()} 個無法讀取的項目，容量可能被低估。
              </div>
            )}
            <LargeScanNotice fileCount={totalFiles} />
            <StatsView
              totalSize={totalSize}
              totalFiles={totalFiles}
              totalFolders={totalFolders}
              scanTime={scanTime}
              isScanning={isScanning}
              scanSpeed={scanSpeed}
            />

            <div className="glass-panel" style={styles.tabsContainer} role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'tree'}
                onClick={() => setActiveTab('tree')}
                style={{
                  ...styles.tabItem,
                  color: activeTab === 'tree' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'tree' ? '2px solid var(--accent-cyan)' : 'none',
                }}
              >
                <Layers size={16} />
                樹狀目錄表格 (Tree Table)
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'treemap'}
                onClick={() => setActiveTab('treemap')}
                style={{
                  ...styles.tabItem,
                  color: activeTab === 'treemap' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'treemap' ? '2px solid var(--accent-cyan)' : 'none',
                }}
              >
                <LayoutGrid size={16} />
                磁碟分佈矩形圖 (Treemap)
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'charts'}
                onClick={() => setActiveTab('charts')}
                style={{
                  ...styles.tabItem,
                  color: activeTab === 'charts' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'charts' ? '2px solid var(--accent-cyan)' : 'none',
                }}
              >
                <BarChart3 size={16} />
                副檔名佔用與統計圖 (Charts)
              </button>
            </div>

            <div style={styles.tabContent}>
              {activeTab === 'tree' && (
                <TreeTable
                  key={rootNode.path}
                  rootNode={rootNode}
                  focusedPath={focusedPath}
                  onFocusPath={setFocusedPath}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                />
              )}

              {activeTab === 'treemap' && (
                <TreemapView
                  rootNode={rootNode}
                  focusedPath={focusedPath}
                  onFocusPath={setFocusedPath}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                />
              )}

              {activeTab === 'charts' && (
                <ChartsView rootNode={rootNode} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span>{APP_NAME} {__APP_VERSION__}</span>
        <span>•</span>
        <span>本機處理，無上傳邏輯</span>
        <span>•</span>
        <span>MIT License</span>
      </footer>
    </div>
  );
}
