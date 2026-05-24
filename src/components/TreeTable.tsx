import React, { useState, useMemo, useDeferredValue } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Search, ArrowUp, ArrowDown, FolderUp } from 'lucide-react';
import type { SerializedFileNode } from '../types';
import { formatBytes, getRatioColorClass } from '../utils/helpers';

interface TreeTableProps {
  rootNode: SerializedFileNode;
  onSelectNode?: (node: SerializedFileNode) => void;
  selectedNode: SerializedFileNode | null;
}

type SortField = 'name' | 'size' | 'fileCount' | 'lastModified';
type SortOrder = 'asc' | 'desc';

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const TreeTable: React.FC<TreeTableProps> = ({
  rootNode,
  onSelectNode,
  selectedNode
}) => {
  // Breadcrumb navigation state
  const [currentRootPath, setCurrentRootPath] = useState<string>('');
  // Expanded directories path map
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    [rootNode.path]: true // Expand root by default
  });
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('size');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Reset state when rootNode changes
  React.useEffect(() => {
    setExpandedPaths({ [rootNode.path]: true });
    setCurrentRootPath('');
    setSearchQuery('');
  }, [rootNode.path]);

  // Find the sub-node that matches the current breadcrumb root path
  const activeRootNode = useMemo(() => {
    if (!currentRootPath || currentRootPath === rootNode.path) return rootNode;

    const parts = currentRootPath.split('/').slice(1); // Skip root name
    let current: SerializedFileNode = rootNode;

    for (const part of parts) {
      if (current.children) {
        const found = current.children.find(child => child.name === part);
        if (found) {
          current = found;
        } else {
          break;
        }
      }
    }
    return current;
  }, [rootNode, currentRootPath]);

  // Toggle expand / collapse path
  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Double click a directory to drill down
  const handleDoubleClick = (node: SerializedFileNode) => {
    if (node.kind === 'directory') {
      setCurrentRootPath(node.path);
      // Auto-expand the newly focused folder
      setExpandedPaths(prev => ({
        ...prev,
        [node.path]: true
      }));
    }
  };

  // Breadcrumb navigation click
  const navigateToBreadcrumb = (path: string) => {
    setCurrentRootPath(path);
  };

  // Generate breadcrumb items
  const breadcrumbs = useMemo(() => {
    if (!currentRootPath) return [{ name: rootNode.name, path: rootNode.path }];
    
    const parts = currentRootPath.split('/');
    const items = [];
    let currentAcc = '';
    
    for (let i = 0; i < parts.length; i++) {
      currentAcc = currentAcc ? `${currentAcc}/${parts[i]}` : parts[i];
      items.push({
        name: parts[i],
        path: currentAcc
      });
    }
    return items;
  }, [rootNode, currentRootPath]);

  // Handle header sorting click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Build the flattened, sorted list of visible rows
  const visibleRows = useMemo(() => {
    const list: { node: SerializedFileNode; depth: number }[] = [];

    const traverse = (node: SerializedFileNode, currentDepth: number) => {
      // Don't render the active root node in the rows list itself (it is in breadcrumbs)
      const isCurrentRoot = node.path === activeRootNode.path;
      
      if (!isCurrentRoot) {
        // If searching, only include nodes matching search query
        if (deferredSearchQuery) {
          const match = node.name.toLowerCase().includes(deferredSearchQuery.toLowerCase());
          if (match) {
            list.push({ node, depth: currentDepth });
          }
        } else {
          list.push({ node, depth: currentDepth });
        }
      }

      const isExpanded = expandedPaths[node.path];
      
      // If node is expanded or we are searching (search expands everything), traverse children
      if (node.children && (isExpanded || deferredSearchQuery || isCurrentRoot)) {
        // Copy and sort children based on sorting parameters
        const sortedChildren = [...node.children].sort((a, b) => {
          let comparison = 0;
          if (sortField === 'name') {
            comparison = a.name.localeCompare(b.name);
          } else if (sortField === 'size') {
            comparison = a.size - b.size;
          } else if (sortField === 'fileCount') {
            comparison = a.fileCount - b.fileCount;
          } else if (sortField === 'lastModified') {
            comparison = (a.lastModified || 0) - (b.lastModified || 0);
          }

          return sortOrder === 'asc' ? comparison : -comparison;
        });

        for (const child of sortedChildren) {
          traverse(child, isCurrentRoot ? 0 : currentDepth + 1);
        }
      }
    };

    traverse(activeRootNode, 0);
    return list;
  }, [activeRootNode, expandedPaths, deferredSearchQuery, sortField, sortOrder]);

  return (
    <div style={styles.container}>
      {/* Search & Action Bar */}
      <div style={styles.actionBar}>
        {/* Breadcrumbs */}
        <div style={styles.breadcrumbContainer}>
          {currentRootPath && currentRootPath !== rootNode.path && (
            <button
              onClick={() => {
                const idx = currentRootPath.lastIndexOf('/');
                setCurrentRootPath(idx > 0 ? currentRootPath.substring(0, idx) : rootNode.path);
              }}
              style={styles.upBtn}
              title="返回上一層"
            >
              <FolderUp size={16} />
            </button>
          )}
          <div style={styles.breadcrumbs}>
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={bc.path}>
                {idx > 0 && <span style={styles.separator}>/</span>}
                <button
                  style={idx === breadcrumbs.length - 1 ? styles.bcActive : styles.bcLink}
                  onClick={() => navigateToBreadcrumb(bc.path)}
                >
                  {bc.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div style={styles.searchBox}>
          <Search size={16} color="var(--text-secondary)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="搜尋檔案或資料夾名稱..."
            aria-label="搜尋檔案或資料夾名稱"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.clearBtn} aria-label="清除搜尋">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel" style={styles.tableWrapper}>
        <table className="tree-table" role="treegrid">
          <thead>
            <tr>
              <th style={{ width: '40%', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                <div style={styles.thContent}>
                  名稱
                  {sortField === 'name' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
              </th>
              <th style={{ width: '25%', cursor: 'pointer' }} onClick={() => handleSort('size')}>
                <div style={styles.thContent}>
                  大小 / 佔用比例
                  {sortField === 'size' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
              </th>
              <th style={{ width: '12%', cursor: 'pointer' }} onClick={() => handleSort('fileCount')}>
                <div style={styles.thContent}>
                  檔案數
                  {sortField === 'fileCount' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
              </th>
              <th style={{ width: '23%', cursor: 'pointer' }} onClick={() => handleSort('lastModified')}>
                <div style={styles.thContent}>
                  修改日期
                  {sortField === 'lastModified' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={4} style={styles.emptyCell}>
                  {searchQuery ? '沒有找到相符的檔案或資料夾。' : '目錄為空。'}
                </td>
              </tr>
            ) : (
              visibleRows.map(({ node, depth }) => {
                const ratioOfParent = activeRootNode.size > 0 ? node.size / activeRootNode.size : 0;
                const ratioPercentage = (ratioOfParent * 100).toFixed(1);
                const isSelected = selectedNode?.path === node.path;
                const isExpanded = !!expandedPaths[node.path];

                return (
                  <tr
                    key={node.path}
                    className={`tree-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectNode?.(node)}
                    onDoubleClick={() => handleDoubleClick(node)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDoubleClick(node);
                      if (e.key === 'ArrowRight' && node.kind === 'directory' && !isExpanded) toggleExpand(node.path, e as any);
                      if (e.key === 'ArrowLeft' && node.kind === 'directory' && isExpanded) toggleExpand(node.path, e as any);
                    }}
                  >
                    {/* Name Column */}
                    <td>
                      <div style={{ ...styles.nameCell, paddingLeft: `${depth * 20}px` }}>
                        {node.kind === 'directory' ? (
                          <button
                            onClick={(e) => toggleExpand(node.path, e)}
                            style={styles.expander}
                            aria-expanded={isExpanded}
                            aria-label={`展開${node.name}`}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : (
                          <span style={styles.indentSpacer} />
                        )}
                        {node.kind === 'directory' ? (
                          <Folder size={16} className="icon-directory" style={styles.fileIcon} />
                        ) : (
                          <File size={16} className="icon-file" style={styles.fileIcon} />
                        )}
                        <span
                          style={{
                            ...styles.nodeName,
                            fontWeight: node.kind === 'directory' ? 500 : 400,
                            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)'
                          }}
                          title={node.name}
                        >
                          {node.name}
                        </span>
                      </div>
                    </td>

                    {/* Size and Percentage Column */}
                    <td>
                      <div style={styles.sizeCell}>
                        <span style={styles.sizeText}>{formatBytes(node.size)}</span>
                        <div style={styles.barWrapper}>
                          <div
                            className={`ratio-bar ${getRatioColorClass(ratioOfParent)}`}
                            style={{ width: `${Math.max(ratioOfParent * 100, 1.5)}%` }}
                          />
                          <span style={styles.percentageText}>{ratioPercentage}%</span>
                        </div>
                      </div>
                    </td>

                    {/* Files Count Column */}
                    <td>
                      <span style={styles.mutedText}>
                        {node.kind === 'directory' ? node.fileCount.toLocaleString() : '-'}
                      </span>
                    </td>

                    {/* Date Modified Column */}
                    <td>
                      <span style={styles.mutedText}>
                        {node.lastModified
                          ? dateFormatter.format(node.lastModified)
                          : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    height: '100%',
    width: '100%',
  },
  actionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  breadcrumbContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  upBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '4px',
    fontSize: '0.9rem',
  },
  separator: {
    color: 'var(--text-muted)',
    userSelect: 'none' as const,
  },
  bcLink: {
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: 500,
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    background: 'transparent',
    border: 'none',
    fontSize: 'inherit',
    fontFamily: 'inherit',
  },
  bcActive: {
    color: 'var(--accent-cyan)',
    fontWeight: 600,
    padding: '2px 6px',
    textShadow: '0 0 10px rgba(0, 242, 254, 0.2)',
    background: 'transparent',
    border: 'none',
    fontSize: 'inherit',
    fontFamily: 'inherit',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0 12px',
    height: '36px',
    width: '300px',
    position: 'relative' as const,
    transition: 'all 0.2s ease',
  },
  searchIcon: {
    marginRight: '8px',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '4px',
  },
  tableWrapper: {
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 290px)',
    width: '100%',
  },
  thContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nodeName: {
    fontSize: '0.925rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  expander: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    marginRight: '4px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
  },
  indentSpacer: {
    display: 'inline-block',
    width: '26px',
  },
  fileIcon: {
    marginRight: '8px',
    flexShrink: 0,
  },
  sizeCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  sizeText: {
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  barWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  percentageText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    width: '36px',
    textAlign: 'right' as const,
  },
  mutedText: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
  },
  emptyCell: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '40px 0',
  },
};
