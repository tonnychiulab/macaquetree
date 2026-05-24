import React, { useMemo, useState } from 'react';
import type { SerializedFileNode } from '../types';
import { formatBytes, getExtensionColor, getExtensionCategory } from '../utils/helpers';

interface TreemapViewProps {
  rootNode: SerializedFileNode;
  selectedNode: SerializedFileNode | null;
  onSelectNode: (node: SerializedFileNode) => void;
}

interface TreemapRect {
  name: string;
  path: string;
  size: number;
  kind: 'file' | 'directory';
  extension: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  node: SerializedFileNode;
}

export const TreemapView: React.FC<TreemapViewProps> = ({
  rootNode,
  selectedNode,
  onSelectNode
}) => {
  const [hoveredRect, setHoveredRect] = useState<TreemapRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const width = 800;
  const height = 450;

  // Compute the treemap layout using recursive slice-and-dice
  const rects = useMemo(() => {
    const results: TreemapRect[] = [];

    const computeLayout = (
      node: SerializedFileNode,
      x: number,
      y: number,
      w: number,
      h: number,
      depth: number
    ) => {
      // Leaf node, file, or small dimensions
      if (node.kind === 'file' || !node.children || node.children.length === 0 || w < 25 || h < 25) {
        const ext = node.extension || '';
        results.push({
          name: node.name,
          path: node.path,
          size: node.size,
          kind: node.kind,
          extension: ext,
          x,
          y,
          width: w,
          height: h,
          color: node.kind === 'directory' ? 'rgba(79, 172, 254, 0.15)' : getExtensionColor(ext),
          node
        });
        return;
      }

      const isHorizontal = depth % 2 === 0;
      const totalSize = node.size;
      if (totalSize === 0) return;

      let currentX = x;
      let currentY = y;

      const validChildren = node.children.filter(c => c.size > 0);

      for (const child of validChildren) {
        const ratio = child.size / totalSize;
        if (isHorizontal) {
          const childWidth = w * ratio;
          if (childWidth > 1) {
            computeLayout(child, currentX, currentY, childWidth, h, depth + 1);
          }
          currentX += childWidth;
        } else {
          const childHeight = h * ratio;
          if (childHeight > 1) {
            computeLayout(child, currentX, currentY, w, childHeight, depth + 1);
          }
          currentY += childHeight;
        }
      }
    };

    // Begin computing from root node
    computeLayout(rootNode, 0, 0, width, height, 0);
    return results;
  }, [rootNode]);

  const rafRef = React.useRef<number | null>(null);

  // Mouse movement for tooltips
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(e.clientX - rect.left + 15, width - 270);
    const y = Math.min(e.clientY - rect.top + 15, height - 170);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      setTooltipPos({ x, y });
    });
  };

  // Categories Legend
  const legendItems = [
    { name: '影片 (Video)', color: '#FF5722' },
    { name: '音訊 (Audio)', color: '#E91E63' },
    { name: '壓縮檔 (Archive)', color: '#FFEB3B' },
    { name: '圖片 (Image)', color: '#4CAF50' },
    { name: '文件 (Document)', color: '#2196F3' },
    { name: '系統執行檔 (System)', color: '#F44336' },
    { name: '開發程式碼 (Code)', color: '#00BCD4' },
    { name: '資料夾 (Folder)', color: 'rgba(79, 172, 254, 0.4)' },
    { name: '其他 (Other)', color: '#9E9E9E' }
  ];

  return (
    <div style={styles.container}>
      {/* Treemap Description */}
      <div style={styles.header}>
        <h3 style={styles.title}>磁碟空間分佈圖 (Treemap)</h3>
        <p style={styles.description}>
          區塊大小代表檔案/資料夾容量。雙擊資料夾區塊可進入檢視，點擊可選取檔案。
        </p>
      </div>

      {/* SVG Treemap Canvas */}
      <div className="glass-panel" style={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={styles.svg}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredRect(null)}
          role="img"
          aria-label="磁碟空間分佈圖"
        >
          {rects.map((r, idx) => {
            const isSelected = selectedNode?.path === r.path;
            const isHovered = hoveredRect?.path === r.path;

            return (
              <g
                key={`${r.path}-${idx}`}
                onClick={() => onSelectNode(r.node)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredRect(r)}
              >
                {/* Rect Block */}
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  fill={r.color}
                  stroke="rgba(11, 11, 15, 0.8)"
                  strokeWidth={isHovered || isSelected ? 2 : 0.5}
                  rx={2}
                  style={{
                    transition: 'all 0.15s ease',
                    filter: isHovered || isSelected ? 'brightness(1.2) contrast(1.1)' : 'none',
                    opacity: isSelected ? 1 : 0.85
                  }}
                />
                
                {/* Glow Border for selected/hovered item */}
                {(isHovered || isSelected) && (
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    fill="none"
                    stroke={isSelected ? 'var(--accent-cyan)' : '#FFF'}
                    strokeWidth={2}
                    rx={2}
                  />
                )}

                {/* Text Label inside rectangle if big enough */}
                {r.width > 65 && r.height > 25 && (
                  <text
                    x={r.x + 5}
                    y={r.y + 16}
                    fill="#FFF"
                    fontSize="10px"
                    fontWeight="600"
                    style={{
                      pointerEvents: 'none',
                      textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                      userSelect: 'none'
                    }}
                  >
                    {r.name.length > r.width / 7
                      ? `${r.name.substring(0, Math.floor(r.width / 7) - 2)}..`
                      : r.name}
                  </text>
                )}
                {r.width > 55 && r.height > 38 && (
                  <text
                    x={r.x + 5}
                    y={r.y + 30}
                    fill="rgba(255,255,255,0.7)"
                    fontSize="9px"
                    style={{
                      pointerEvents: 'none',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      userSelect: 'none'
                    }}
                  >
                    {formatBytes(r.size)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Interactive Tooltip inside SVG wrapper */}
          {hoveredRect && (
            <foreignObject
              x={tooltipPos.x}
              y={tooltipPos.y}
              width="260"
              height="160"
              style={{ pointerEvents: 'none' }}
            >
              <div className="premium-tooltip" style={{ opacity: 1 }}>
                <div style={styles.tooltipName}>{hoveredRect.name}</div>
                <div style={styles.tooltipPath}>{hoveredRect.path}</div>
                <div style={styles.tooltipDivider} />
                <div style={styles.tooltipRow}>
                  <span>類型:</span>
                  <span style={styles.tooltipValue}>
                    {hoveredRect.kind === 'directory'
                      ? '資料夾'
                      : `${getExtensionCategory(hoveredRect.extension)} (${hoveredRect.extension})`}
                  </span>
                </div>
                <div style={styles.tooltipRow}>
                  <span>大小:</span>
                  <span style={styles.tooltipValue} className="text-gradient">
                    {formatBytes(hoveredRect.size)}
                  </span>
                </div>
                <div style={styles.tooltipRow}>
                  <span>比例:</span>
                  <span style={styles.tooltipValue}>
                    {rootNode.size > 0 ? ((hoveredRect.size / rootNode.size) * 100).toFixed(2) : '0.00'}%
                  </span>
                </div>
              </div>
            </foreignObject>
          )}
        </svg>
      </div>

      {/* Categories Legend Panel */}
      <div className="glass-panel" style={styles.legendContainer}>
        {legendItems.map((item) => (
          <div key={item.name} style={styles.legendItem}>
            <div style={{ ...styles.legendIndicator, backgroundColor: item.color }} />
            <span style={styles.legendText}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    width: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  description: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  svgWrapper: {
    padding: '8px',
    borderRadius: '16px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block',
    overflow: 'visible',
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px',
    padding: '16px',
    justifyContent: 'center',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  legendText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  // Tooltip details
  tooltipName: {
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#FFF',
    wordBreak: 'break-all' as const,
    marginBottom: '2px',
  },
  tooltipPath: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    wordBreak: 'break-all' as const,
    marginBottom: '8px',
  },
  tooltipDivider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '6px 0',
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    margin: '3px 0',
  },
  tooltipValue: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
};
