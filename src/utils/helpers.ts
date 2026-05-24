// Utility functions for MacaqueTree

/**
 * Format bytes to a human-readable string (e.g., 10.24 GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Keep index within bounds
  const idx = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, idx)).toFixed(dm)) + ' ' + sizes[idx];
}

/**
 * Determine severity color class based on the ratio of parent size
 */
export function getRatioColorClass(ratio: number): 'critical' | 'warning' | 'safe' {
  if (ratio >= 0.5) return 'critical'; // More than 50%
  if (ratio >= 0.15) return 'warning'; // 15% - 50%
  return 'safe'; // Under 15%
}

/**
 * Standard colors for D3 Treemap and Charts based on extension type
 */
export function getExtensionColor(ext: string): string {
  const extensionMap: { [key: string]: string } = {
    // Videos (Orange-Red)
    '.mp4': '#FF5722', '.mkv': '#FF5722', '.avi': '#FF5722', '.mov': '#FF7043', '.wmv': '#FF8A65',
    // Audio (Pink)
    '.mp3': '#E91E63', '.wav': '#E91E63', '.flac': '#EC407A', '.ogg': '#F48FB1',
    // Archives/Compressed (Yellow)
    '.zip': '#FFEB3B', '.rar': '#FFEB3B', '.7z': '#FBC02D', '.tar': '#FDD835', '.gz': '#FFEE58',
    // Images (Green)
    '.png': '#4CAF50', '.jpg': '#4CAF50', '.jpeg': '#4CAF50', '.gif': '#66BB6A', '.svg': '#81C784', '.webp': '#A5D6A7',
    // Documents (Blue)
    '.pdf': '#2196F3', '.docx': '#2196F3', '.doc': '#1E88E5', '.xlsx': '#42A5F5', '.pptx': '#90CAF9', '.txt': '#BBDEFB',
    // Executables/System (Red)
    '.exe': '#F44336', '.msi': '#F44336', '.dmg': '#EF5350', '.sh': '#E57373', '.bat': '#EF9A9A',
    // Development/Code (Teal)
    '.js': '#00BCD4', '.ts': '#00BCD4', '.tsx': '#00ACC1', '.jsx': '#26C6DA', '.html': '#80DEEA', '.css': '#4DD0E1', '.json': '#006064'
  };

  return extensionMap[ext.toLowerCase()] || '#9E9E9E'; // Gray fallback
}

/**
 * Get display category name for file extension
 */
export function getExtensionCategory(ext: string): string {
  const extension = ext.toLowerCase();
  if (['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(extension)) return 'Video';
  if (['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'].includes(extension)) return 'Audio';
  if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso'].includes(extension)) return 'Archive';
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.tiff', '.bmp'].includes(extension)) return 'Image';
  if (['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.md', '.rtf'].includes(extension)) return 'Document';
  if (['.exe', '.msi', '.dmg', '.pkg', '.sh', '.bat', '.cmd'].includes(extension)) return 'System/Executable';
  if (['.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.py', '.cpp', '.h', '.java', '.go', '.rs'].includes(extension)) return 'Code/Dev';
  return 'Other';
}
