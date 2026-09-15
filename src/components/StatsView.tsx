import React from 'react';
import { HardDrive, File, Folder, Activity, Info } from 'lucide-react';
import { useSizeUnit } from '../hooks/useSizeUnit';

interface StatsViewProps {
  totalSize: number;
  totalFiles: number;
  totalFolders: number;
  scanTime: number; // in ms
  isScanning: boolean;
  scanSpeed: number; // files per second
}

export const StatsView: React.FC<StatsViewProps> = React.memo(({
  totalSize,
  totalFiles,
  totalFolders,
  scanTime,
  isScanning,
  scanSpeed
}) => {
  const { formatSize } = useSizeUnit();
  const avgFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

  return (
    <div style={styles.statsGrid}>
      {/* Total Scanned Card */}
      <div className="glass-panel" style={styles.card}>
        <div style={styles.iconContainer('#8FAE93')}>
          <HardDrive size={24} color="#8FAE93" />
        </div>
        <div style={styles.info}>
          <span style={styles.label}>總掃描空間</span>
          <span style={styles.value} className="text-gradient">
            {formatSize(totalSize)}
          </span>
        </div>
      </div>

      {/* Total Files Card */}
      <div className="glass-panel" style={styles.card}>
        <div style={styles.iconContainer('#8FAE93')}>
          <File size={24} color="#8FAE93" />
        </div>
        <div style={styles.info}>
          <span style={styles.label}>檔案總數</span>
          <span style={styles.value}>
            {totalFiles.toLocaleString()} <span style={styles.unit}>個</span>
          </span>
        </div>
      </div>

      {/* Total Folders Card */}
      <div className="glass-panel" style={styles.card}>
        <div style={styles.iconContainer('#8FAE93')}>
          <Folder size={24} color="#8FAE93" />
        </div>
        <div style={styles.info}>
          <span style={styles.label}>資料夾總數</span>
          <span style={styles.value}>
            {totalFolders.toLocaleString()} <span style={styles.unit}>個</span>
          </span>
        </div>
      </div>

      {/* Scan Performance Card */}
      <div className="glass-panel" style={styles.card}>
        <div style={styles.iconContainer(isScanning ? '#8FAE93' : '#D4B07A')}>
          <Activity size={24} color={isScanning ? '#8FAE93' : '#D4B07A'} className={isScanning ? 'scan-glow' : ''} />
        </div>
        <div style={styles.info}>
          <span style={styles.label}>{isScanning ? '掃描速度' : '掃描耗時'}</span>
          <span style={styles.value}>
            {isScanning ? (
              <>
                {scanSpeed.toLocaleString()} <span style={styles.unit}>檔/秒</span>
              </>
            ) : (
              <>
                {(scanTime / 1000).toFixed(2)} <span style={styles.unit}>秒</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Average File Size Card */}
      <div className="glass-panel" style={styles.card}>
        <div style={styles.iconContainer('#D4867A')}>
          <Info size={24} color="#D4867A" />
        </div>
        <div style={styles.info}>
          <span style={styles.label}>平均檔案大小</span>
          <span style={styles.value}>{formatSize(avgFileSize)}</span>
        </div>
      </div>
    </div>
  );
});

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    width: '100%',
  },
  card: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconContainer: (shadowColor: string) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `inset 0 0 10px ${shadowColor}1A`,
    border: '1px solid rgba(255, 255, 255, 0.05)',
  }),
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  value: {
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  unit: {
    fontSize: '0.85rem',
    fontWeight: 400,
    color: 'var(--text-secondary)',
    marginLeft: '2px',
  },
};
