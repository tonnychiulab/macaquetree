import { LARGE_SCAN_WARN_FILES } from '../types';
import { appStyles as styles } from '../appStyles';

export function LargeScanNotice({ fileCount }: { fileCount: number }) {
  if (fileCount < LARGE_SCAN_WARN_FILES) return null;
  return (
    <div className="glass-panel" style={styles.warnBanner} role="status">
      已掃描 {fileCount.toLocaleString()} 個檔案，超過建議的 {LARGE_SCAN_WARN_FILES.toLocaleString()} 個。
      分頁可能變慢或耗盡記憶體，建議改掃較小的子資料夾。
    </div>
  );
}

interface ScanProgressProps {
  totalFiles: number;
  totalFolders: number;
  totalSizeLabel: string;
  scanSpeed: number;
  progressPercent: number | null;
  processed: number;
  knownTotal: number | null;
  skippedCount: number;
  currentScanningPath: string;
}

export function ScanProgress({
  totalFiles,
  totalFolders,
  totalSizeLabel,
  scanSpeed,
  progressPercent,
  processed,
  knownTotal,
  skippedCount,
  currentScanningPath,
}: ScanProgressProps) {
  return (
    <div className="glass-panel" style={styles.scanningPanel}>
      <div style={styles.scanHeader}>
        <div style={styles.pulseIndicator} />
        <h3>正在深度分析磁碟目錄空間...</h3>
      </div>
      <LargeScanNotice fileCount={totalFiles} />
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
          <span style={styles.metricVal}>{totalSizeLabel}</span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>目前速度</span>
          <span style={styles.metricVal} className="text-gradient">
            {scanSpeed.toLocaleString()} 檔/秒
          </span>
        </div>
      </div>
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
  );
}
