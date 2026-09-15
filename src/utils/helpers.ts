export type FileCategory =
  | 'Video'
  | 'Audio'
  | 'Archive'
  | 'Image'
  | 'Document'
  | 'System/Executable'
  | 'Code/Dev'
  | 'Other';

interface ExtensionMeta {
  category: FileCategory;
  color: string;
}

const CATEGORY_COLOR: Record<FileCategory, string> = {
  Video: '#FF5722',
  Audio: '#E91E63',
  Archive: '#FFEB3B',
  Image: '#4CAF50',
  Document: '#2196F3',
  'System/Executable': '#F44336',
  'Code/Dev': '#00BCD4',
  Other: '#9E9E9E',
};

const EXTENSION_META: Record<string, ExtensionMeta> = {
  '.mp4': { category: 'Video', color: '#FF5722' },
  '.mkv': { category: 'Video', color: '#FF5722' },
  '.avi': { category: 'Video', color: '#FF5722' },
  '.mov': { category: 'Video', color: '#FF7043' },
  '.wmv': { category: 'Video', color: '#FF8A65' },
  '.flv': { category: 'Video', color: '#FF5722' },
  '.webm': { category: 'Video', color: '#FF5722' },
  '.mp3': { category: 'Audio', color: '#E91E63' },
  '.wav': { category: 'Audio', color: '#E91E63' },
  '.flac': { category: 'Audio', color: '#EC407A' },
  '.ogg': { category: 'Audio', color: '#F48FB1' },
  '.m4a': { category: 'Audio', color: '#E91E63' },
  '.aac': { category: 'Audio', color: '#E91E63' },
  '.zip': { category: 'Archive', color: '#FFEB3B' },
  '.rar': { category: 'Archive', color: '#FFEB3B' },
  '.7z': { category: 'Archive', color: '#FBC02D' },
  '.tar': { category: 'Archive', color: '#FDD835' },
  '.gz': { category: 'Archive', color: '#FFEE58' },
  '.bz2': { category: 'Archive', color: '#FBC02D' },
  '.iso': { category: 'Archive', color: '#FFEB3B' },
  '.png': { category: 'Image', color: '#4CAF50' },
  '.jpg': { category: 'Image', color: '#4CAF50' },
  '.jpeg': { category: 'Image', color: '#4CAF50' },
  '.gif': { category: 'Image', color: '#66BB6A' },
  '.svg': { category: 'Image', color: '#81C784' },
  '.webp': { category: 'Image', color: '#A5D6A7' },
  '.ico': { category: 'Image', color: '#4CAF50' },
  '.tiff': { category: 'Image', color: '#4CAF50' },
  '.bmp': { category: 'Image', color: '#4CAF50' },
  '.pdf': { category: 'Document', color: '#2196F3' },
  '.docx': { category: 'Document', color: '#2196F3' },
  '.doc': { category: 'Document', color: '#1E88E5' },
  '.xlsx': { category: 'Document', color: '#42A5F5' },
  '.xls': { category: 'Document', color: '#2196F3' },
  '.pptx': { category: 'Document', color: '#90CAF9' },
  '.ppt': { category: 'Document', color: '#2196F3' },
  '.txt': { category: 'Document', color: '#BBDEFB' },
  '.md': { category: 'Document', color: '#BBDEFB' },
  '.rtf': { category: 'Document', color: '#2196F3' },
  '.exe': { category: 'System/Executable', color: '#F44336' },
  '.msi': { category: 'System/Executable', color: '#F44336' },
  '.dmg': { category: 'System/Executable', color: '#EF5350' },
  '.pkg': { category: 'System/Executable', color: '#F44336' },
  '.sh': { category: 'System/Executable', color: '#E57373' },
  '.bat': { category: 'System/Executable', color: '#EF9A9A' },
  '.cmd': { category: 'System/Executable', color: '#F44336' },
  '.js': { category: 'Code/Dev', color: '#00BCD4' },
  '.ts': { category: 'Code/Dev', color: '#00BCD4' },
  '.tsx': { category: 'Code/Dev', color: '#00ACC1' },
  '.jsx': { category: 'Code/Dev', color: '#26C6DA' },
  '.html': { category: 'Code/Dev', color: '#80DEEA' },
  '.css': { category: 'Code/Dev', color: '#4DD0E1' },
  '.json': { category: 'Code/Dev', color: '#006064' },
  '.py': { category: 'Code/Dev', color: '#00BCD4' },
  '.cpp': { category: 'Code/Dev', color: '#00BCD4' },
  '.h': { category: 'Code/Dev', color: '#00BCD4' },
  '.java': { category: 'Code/Dev', color: '#00BCD4' },
  '.go': { category: 'Code/Dev', color: '#00BCD4' },
  '.rs': { category: 'Code/Dev', color: '#00BCD4' },
};

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, idx)).toFixed(dm)) + ' ' + sizes[idx];
}

export function getRatioColorClass(ratio: number): 'critical' | 'warning' | 'safe' {
  if (ratio >= 0.5) return 'critical';
  if (ratio >= 0.15) return 'warning';
  return 'safe';
}

export function getExtensionCategory(ext: string): FileCategory {
  return EXTENSION_META[ext.toLowerCase()]?.category ?? 'Other';
}

export function getExtensionColor(ext: string): string {
  const meta = EXTENSION_META[ext.toLowerCase()];
  if (meta) return meta.color;
  return CATEGORY_COLOR[getExtensionCategory(ext)];
}

export function fileExtension(fileName: string): string {
  return fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase() : '';
}
