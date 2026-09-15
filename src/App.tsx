import { useState } from 'react';
import { StatsView } from './components/StatsView';
import { TreeTable } from './components/TreeTable';
import { TreemapView } from './components/TreemapView';
import { ChartsView } from './components/ChartsView';
import type { SerializedFileNode } from './types';
import { 
  FolderSearch, 
  Terminal, 
  RefreshCw, 
  FolderOpen, 
  LayoutGrid, 
  BarChart3, 
  Info,
  ShieldCheck,
  Zap,
  Layers,
  X
} from 'lucide-react';
import { formatBytes } from './utils/helpers';
import { isFileSystemAccessSupported, useDirectoryScan } from './hooks/useDirectoryScan';

type TabType = 'tree' | 'treemap' | 'charts';

function App() {
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

  const progressPercent =
    knownTotal && knownTotal > 0 ? Math.min(100, (processed / knownTotal) * 100) : null;

  return (
    <div style={styles.appContainer}>
      {/* Top Navigation Bar */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <FolderSearch size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <h1 style={styles.logoText}>
              MacaqueTree <span style={styles.badge}>Web v{__APP_VERSION__}</span>
            </h1>
            <p style={styles.logoSub}>免安裝、跨平台、極速本機磁碟容量分析器</p>
          </div>
        </div>

        <div style={styles.controlsSection}>
          {isScanning ? (
            <button onClick={cancelScan} className="glow-btn" style={{ ...styles.scanBtn, background: 'var(--color-critical)', boxShadow: '0 0 15px rgba(255, 74, 107, 0.3)' }}>
              <X size={16} color="#FFF" />
              停止掃描
            </button>
          ) : rootNode ? (
            <div style={styles.buttonGroup}>
              <button onClick={() => { setSelectedNode(null); reset(); }} className="secondary-btn">
                <RefreshCw size={16} />
                重新掃描
              </button>
            </div>
          ) : (
            <>
              {isApiSupported ? (
                <button onClick={startFileSystemScan} className="glow-btn" style={styles.scanBtn}>
                  <FolderOpen size={16} />
                  選擇資料夾並掃描
                </button>
              ) : (
                <div>
                  <button onClick={() => fileInputRef.current?.click()} className="glow-btn" style={styles.scanBtn}>
                    <FolderOpen size={16} />
                    瀏覽資料夾
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    webkitdirectory=""
                    directory=""
                    onChange={(e) => { void startFallbackScan(e.target.files); }}
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
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
          <div className="glass-panel" style={styles.scanningPanel}>
            <div style={styles.scanHeader}>
              <div style={styles.pulseIndicator} />
              <h3>正在深度分析磁碟目錄空間...</h3>
            </div>
            
            {/* Speed Gauge & Metrcis */}
            <div style={styles.scanMetrics}>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>已掃描檔案</span>
                <span style={styles.metricVal}>{totalFiles.toLocaleString()}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>已掃描資料夾</span>
                <span style={styles.metricVal}>{totalFolders.toLocaleString()}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>累積容量</span>
                <span style={styles.metricVal}>{formatBytes(totalSize)}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>目前速度</span>
                <span style={styles.metricVal} className="text-gradient">
                  {scanSpeed.toLocaleString()} 檔/秒
                </span>
              </div>
            </div>

            {/* Glowing progress line */}
            <div className="progress-container" style={{ margin: '16px 0' }}>
              <div
                className={`progress-bar${progressPercent == null ? ' indeterminate' : ''}`}
                style={progressPercent == null ? undefined : { width: `${progressPercent}%` }}
              >
                <div className="progress-glow-bar" />
              </div>
            </div>
            {progressPercent != null && (
              <div style={styles.scanningPath}>
                進度: {processed.toLocaleString()} / {knownTotal?.toLocaleString()}
              </div>
            )}
            {skippedCount > 0 && (
              <div style={styles.scanningPath}>已略過無法讀取的項目: {skippedCount.toLocaleString()}</div>
            )}

            <div style={styles.scanningPath} title={currentScanningPath}>
              <strong>掃描中:</strong> {currentScanningPath || '建立檔案索引中...'}
            </div>
          </div>
        )}

        {!isScanning && !rootNode && (
          <div style={styles.welcomeGrid}>
            {/* Welcome banner */}
            <div className="glass-panel" style={styles.welcomeCard}>
              <h2 style={styles.welcomeTitle}>開始分析您的磁碟空間</h2>
              <p style={styles.welcomeSubtitle}>
                MacaqueTree 是一款純前端開發的免安裝高效硬碟分析工具。
                只需選取您欲掃描的硬碟分區或專案目錄，即可立即為您繪製空間佔用圖譜。
              </p>

              {/* API Support details */}
              <div style={styles.supportAlert}>
                <Info size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>
                  {isApiSupported ? (
                    <>
                      <strong>您的瀏覽器已完美支援 File System Access API！</strong> 掃描時可完整保證檔案樹排序與本機多執行緒效率。
                    </>
                  ) : (
                    <>
                      <strong>當前瀏覽器將使用 Fallback 掃描模式。</strong>（由於 Firefox/Safari 尚未全面開放 Directory API，本工具已貼心實作了本地檔案流處理技術，功能不受影響）。
                    </>
                  )}
                </span>
              </div>

              {/* Launch Action */}
              <div style={styles.actionCenter}>
                {isApiSupported ? (
                  <button onClick={startFileSystemScan} className="glow-btn" style={styles.hugeBtn}>
                    <FolderOpen size={20} />
                    立刻選擇資料夾並掃描
                  </button>
                ) : (
                  <div>
                    <button onClick={() => fileInputRef.current?.click()} className="glow-btn" style={styles.hugeBtn}>
                      <FolderOpen size={20} />
                      選取本地目錄以掃描
                    </button>
                  </div>
                )}
                <span style={styles.securityHint}>
                  <ShieldCheck size={14} color="var(--color-safe)" />
                  目錄中繼資料只在這個瀏覽器分頁處理，應用程式沒有上傳檔案或掃描結果的邏輯。開啟本頁仍會向託管靜態網站的主機下載 HTML/JS。
                </span>
              </div>
            </div>

            {/* Benefits detail cards */}
            <div style={styles.featureCards}>
              <div className="glass-panel" style={styles.featureCard}>
                <Zap size={22} color="var(--accent-cyan)" />
                <h4>極速多執行緒效能</h4>
                <p>將繁複的磁碟遍歷任務完全託付於背景 Web Worker，不佔用 UI 主線程，流暢無卡頓。</p>
              </div>

              <div className="glass-panel" style={styles.featureCard}>
                <LayoutGrid size={22} color="var(--accent-purple)" />
                <h4>WinDirStat 等級視覺化</h4>
                <p>支援經典的區塊圖譜（Treemap）與圓環圖，色彩完美對應各類副檔名，一眼看出空間殺手。</p>
              </div>

              <div className="glass-panel" style={styles.featureCard}>
                <Layers size={22} color="#C572EF" />
                <h4>深度樹狀鑽取 (Drill down)</h4>
                <p>雙擊資料夾可像檔案總管一樣深度聚焦，配備動態麵包屑導航，追蹤大檔案簡單直覺。</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Analytics View */}
        {rootNode && (
          <div style={styles.dashboard}>
            {skippedCount > 0 && (
              <div className="glass-panel" style={styles.errorBanner} role="status">
                掃描時略過 {skippedCount.toLocaleString()} 個無法讀取的項目，容量可能被低估。
              </div>
            )}
            <StatsView
              totalSize={totalSize}
              totalFiles={totalFiles}
              totalFolders={totalFolders}
              scanTime={scanTime}
              isScanning={isScanning}
              scanSpeed={scanSpeed}
            />

            {/* Tabs Selector Navigation */}
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

            {/* Tab Contents */}
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

      {/* Simple Legal/Privacy Footer */}
      <footer style={styles.footer}>
        <span>Total Files Scanned: {totalFiles.toLocaleString()}</span>
        <span>•</span>
        <span>Local Sandbox Processing (No Upload Logic)</span>
        <span>•</span>
        <span>Developed for High Performance</span>
      </footer>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    maxWidth: '1440px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(0, 242, 254, 0.08)',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px rgba(0, 242, 254, 0.15)',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    padding: '2px 6px',
    color: 'var(--text-secondary)',
  },
  logoSub: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  controlsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  scanBtn: {
    padding: '10px 20px',
    fontSize: '0.9rem',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  errorBanner: {
    background: 'rgba(255, 74, 107, 0.08)',
    borderColor: 'rgba(255, 74, 107, 0.2)',
    padding: '12px 18px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#FF6B8B',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#FF6B8B',
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  scanningPanel: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    gap: '20px',
    marginBottom: '24px',
    borderStyle: 'dashed',
    borderColor: 'var(--accent-cyan)',
    animation: 'pulse-glow 2s infinite alternate',
  },
  scanHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pulseIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#00E676',
    boxShadow: '0 0 10px #00E676',
    animation: 'blink 1s infinite alternate',
  },
  scanMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  metricLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  metricVal: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  scanningPath: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
  },
  welcomeGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    alignItems: 'stretch',
    marginTop: '20px',
  },
  welcomeCard: {
    padding: '48px 36px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '20px',
  },
  welcomeTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  welcomeSubtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    maxWidth: '700px',
    lineHeight: '1.6',
  },
  supportAlert: {
    background: 'rgba(0, 242, 254, 0.04)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    maxWidth: '800px',
    textAlign: 'left' as const,
    lineHeight: '1.5',
  },
  actionCenter: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
  },
  hugeBtn: {
    padding: '16px 36px',
    fontSize: '1.1rem',
    borderRadius: '16px',
  },
  securityHint: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  featureCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  dashboard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  tabsContainer: {
    display: 'flex',
    padding: '6px',
    borderRadius: '12px',
    gap: '8px',
  },
  tabItem: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  tabContent: {
    flex: 1,
  },
  footer: {
    marginTop: '40px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    flexWrap: 'wrap' as const,
  },
};

export default App;
