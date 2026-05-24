import React, { useMemo } from 'react';
import type { SerializedFileNode } from '../types';
import { formatBytes, getExtensionColor, getExtensionCategory } from '../utils/helpers';

interface ChartsViewProps {
  rootNode: SerializedFileNode;
}

interface ExtensionStat {
  ext: string;
  category: string;
  size: number;
  count: number;
  color: string;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ rootNode }) => {
  
  // Recursively gather all files and aggregate stats
  const { extStats, largestFiles } = useMemo(() => {
    const extMap: Record<string, { size: number; count: number }> = {};
    const filesList: SerializedFileNode[] = [];

    const traverse = (node: SerializedFileNode) => {
      if (node.kind === 'file') {
        filesList.push(node);
        const ext = node.extension || '.unknown';
        if (!extMap[ext]) {
          extMap[ext] = { size: 0, count: 0 };
        }
        extMap[ext].size += node.size;
        extMap[ext].count += 1;
      } else if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(rootNode);

    // Convert map to sorted stats array
    const extStats: ExtensionStat[] = Object.entries(extMap)
      .map(([ext, data]) => ({
        ext,
        category: getExtensionCategory(ext),
        size: data.size,
        count: data.count,
        color: getExtensionColor(ext),
      }))
      .sort((a, b) => b.size - a.size);

    // Get top 10 largest files
    const largestFiles = [...filesList]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return { extStats, largestFiles };
  }, [rootNode]);

  // Compute ring chart angles for Top 6 categories, group the rest
  const ringSegments = useMemo(() => {
    const segments: { label: string; percentage: number; color: string; size: number }[] = [];
    const totalSize = rootNode.size;
    if (totalSize === 0) return [];

    let accumulatedSize = 0;
    const topLimit = 5;

    for (let i = 0; i < Math.min(extStats.length, topLimit); i++) {
      const stat = extStats[i];
      const percentage = (stat.size / totalSize) * 100;
      segments.push({
        label: stat.ext,
        percentage,
        color: stat.color,
        size: stat.size,
      });
      accumulatedSize += stat.size;
    }

    if (extStats.length > topLimit) {
      const otherSize = totalSize - accumulatedSize;
      const percentage = (otherSize / totalSize) * 100;
      if (percentage > 0.1) {
        segments.push({
          label: '其他檔案 (Others)',
          percentage,
          color: '#9E9E9E',
          size: otherSize,
        });
      }
    }

    return segments;
  }, [extStats, rootNode.size]);

  // SVG circular calculations for circular chart
  const radius = 70;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  const computedRingSegments = useMemo(() => {
    let offset = 0;
    return ringSegments.map(seg => {
      const strokeDash = (seg.percentage / 100) * circumference;
      const strokeOffset = circumference - offset;
      offset += strokeDash;
      return { ...seg, strokeDash, strokeOffset };
    });
  }, [ringSegments, circumference]);

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {/* Left Card: Extension Distribution Ring Chart */}
        <div className="glass-panel" style={styles.card}>
          <h3 style={styles.cardTitle}>檔案副檔名佔用比例 (Extension Share)</h3>
          
          <div style={styles.ringChartContainer}>
            {/* SVG Ring Chart */}
            <div style={styles.svgWrapper}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 200 200"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0, 242, 254, 0.1))' }}
                role="img"
                aria-label="檔案類型比例環形圖"
              >
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth={strokeWidth}
                />
                {computedRingSegments.map((seg, idx) => {
                  return (
                    <circle
                      key={idx}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${seg.strokeDash} ${circumference - seg.strokeDash}`}
                      strokeDashoffset={seg.strokeOffset}
                      transform="rotate(-90 100 100)"
                      strokeLinecap={seg.percentage > 1.5 ? 'round' : 'butt'}
                      style={{
                        transition: 'all 0.5s ease',
                      }}
                    />
                  );
                })}
              </svg>
              {/* Inner Stats Text */}
              <div style={styles.ringInner}>
                <span style={styles.ringLabel}>檔案類型</span>
                <span style={styles.ringVal} className="text-gradient">
                  {extStats.length} 種
                </span>
              </div>
            </div>

            {/* List Legends */}
            <div style={styles.ringLegend}>
              {ringSegments.map((seg, idx) => (
                <div key={idx} style={styles.legendItem}>
                  <div style={{ ...styles.colorIndicator, backgroundColor: seg.color }} />
                  <div style={styles.legendText}>
                    <div style={styles.legendLabel}>
                      <strong>{seg.label}</strong> ({seg.percentage.toFixed(1)}%)
                    </div>
                    <div style={styles.legendValue}>{formatBytes(seg.size)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Top 10 Largest Files */}
        <div className="glass-panel" style={styles.card}>
          <h3 style={styles.cardTitle}>最大檔案排行 TOP 10 (Largest Files)</h3>
          <div style={styles.barsContainer}>
            {largestFiles.length === 0 ? (
              <div style={styles.emptyText}>無檔案資料。</div>
            ) : (
              largestFiles.map((file, idx) => {
                const maxFileSize = largestFiles[0]?.size || 1;
                const ratio = file.size / maxFileSize;
                const color = getExtensionColor(file.extension || '');

                return (
                  <div key={file.path} style={styles.barRow}>
                    <div style={styles.barLabelContainer}>
                      <span style={styles.barIndex}>{idx + 1}</span>
                      <span style={styles.barFileName} title={file.name}>
                        {file.name}
                      </span>
                      <span style={styles.barFileSize}>{formatBytes(file.size)}</span>
                    </div>
                    <div style={styles.barTrack}>
                      <div
                        style={{
                          ...styles.barFill,
                          width: `${ratio * 100}%`,
                          background: `linear-gradient(135deg, color-mix(in srgb, ${color} 30%, transparent), transparent)`,
                          borderLeft: `3px solid ${color}`,
                          boxShadow: `inset 0 0 20px color-mix(in srgb, ${color} 10%, transparent)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detailed File Extensions Breakdown Table */}
      <div className="glass-panel" style={styles.tableCard}>
        <h3 style={styles.cardTitle}>詳細副檔名統計表 (Detailed Extension Report)</h3>
        <div style={styles.tableWrapper}>
          <table className="tree-table">
            <thead>
              <tr>
                <th>副檔名</th>
                <th>類型分類</th>
                <th>檔案數量</th>
                <th>累積大小</th>
                <th>佔總大小比例</th>
              </tr>
            </thead>
            <tbody>
              {extStats.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    無資料。
                  </td>
                </tr>
              ) : (
                extStats.map((stat) => (
                  <tr key={stat.ext} className="tree-row">
                    <td>
                      <div style={styles.extCol}>
                        <div style={{ ...styles.colorIndicator, backgroundColor: stat.color, marginRight: '8px' }} />
                        <strong style={{ color: 'var(--text-primary)' }}>{stat.ext}</strong>
                      </div>
                    </td>
                    <td>{stat.category}</td>
                    <td>{stat.count.toLocaleString()}</td>
                    <td>{formatBytes(stat.size)}</td>
                    <td>
                      <div style={styles.tableRatioCell}>
                        <span>{rootNode.size > 0 ? ((stat.size / rootNode.size) * 100).toFixed(2) : '0.00'}%</span>
                        <div style={styles.miniBarTrack}>
                          <div
                            style={{
                              height: '100%',
                              width: `${rootNode.size > 0 ? (stat.size / rootNode.size) * 100 : 0}%`,
                              backgroundColor: stat.color,
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  ringChartContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  svgWrapper: {
    position: 'relative' as const,
    width: '200px',
    height: '200px',
  },
  ringInner: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    pointerEvents: 'none' as const,
  },
  ringLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  ringVal: {
    fontSize: '1.3rem',
    fontWeight: 700,
  },
  ringLegend: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    flex: 1,
    minWidth: '150px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  colorIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    marginTop: '5px',
    flexShrink: 0,
  },
  legendText: {
    display: 'flex',
    flexDirection: 'column' as const,
    fontSize: '0.85rem',
  },
  legendLabel: {
    color: 'var(--text-primary)',
  },
  legendValue: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  barsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  emptyText: {
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '40px 0',
  },
  barRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  barLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
  },
  barIndex: {
    color: 'var(--accent-cyan)',
    fontWeight: 700,
    width: '20px',
  },
  barFileName: {
    color: 'var(--text-primary)',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    marginRight: '12px',
  },
  barFileSize: {
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  barTrack: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '3px',
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tableCard: {
    padding: '24px',
  },
  tableWrapper: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  extCol: {
    display: 'flex',
    alignItems: 'center',
  },
  tableRatioCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  miniBarTrack: {
    height: '6px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '3px',
    flex: 1,
    maxWidth: '120px',
    overflow: 'hidden',
  },
};
