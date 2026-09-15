export type FileCategory =
  | 'Video'
  | 'Audio'
  | 'Archive'
  | 'Image'
  | 'Document'
  | 'System/Executable'
  | 'Code/Dev'
  | 'Other';

export const CATEGORY_COLOR: Record<FileCategory, string> = {
  Video: '#D4785A',
  Audio: '#C47A9A',
  Archive: '#C9B56A',
  Image: '#7A9E72',
  Document: '#7A9BB8',
  'System/Executable': '#C46B62',
  'Code/Dev': '#6A9E9A',
  Other: '#9AA39A',
};

function categoryMap(category: FileCategory, extensions: string[]): Record<string, FileCategory> {
  return Object.fromEntries(extensions.map((ext) => [ext, category]));
}

const EXTENSION_CATEGORY: Record<string, FileCategory> = {
  ...categoryMap('Video', ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm']),
  ...categoryMap('Audio', ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac']),
  ...categoryMap('Archive', ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso']),
  ...categoryMap('Image', ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.tiff', '.bmp']),
  ...categoryMap('Document', ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.md', '.rtf']),
  ...categoryMap('System/Executable', ['.exe', '.msi', '.dmg', '.pkg', '.sh', '.bat', '.cmd']),
  ...categoryMap('Code/Dev', ['.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.py', '.cpp', '.h', '.java', '.go', '.rs']),
};

export type SizeUnit = 'auto' | 'KB' | 'MB' | 'GB';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

export function formatBytes(bytes: number, decimals: number = 2, unit: SizeUnit = 'auto'): string {
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const safeBytes = !Number.isFinite(bytes) || bytes < 0 ? 0 : bytes;

  if (unit !== 'auto') {
    const idx = BYTE_UNITS.indexOf(unit);
    return `${(safeBytes / Math.pow(k, idx)).toFixed(dm)} ${unit}`;
  }

  if (safeBytes === 0) return '0 B';
  const i = Math.floor(Math.log(safeBytes) / Math.log(k));
  const idx = Math.min(i, BYTE_UNITS.length - 1);
  return `${parseFloat((safeBytes / Math.pow(k, idx)).toFixed(dm))} ${BYTE_UNITS[idx]}`;
}

export function getRatioColorClass(ratio: number): 'critical' | 'warning' | 'safe' {
  if (ratio >= 0.5) return 'critical';
  if (ratio >= 0.15) return 'warning';
  return 'safe';
}

export function getExtensionCategory(ext: string): FileCategory {
  return EXTENSION_CATEGORY[ext.toLowerCase()] ?? 'Other';
}

export function getExtensionColor(ext: string): string {
  return CATEGORY_COLOR[getExtensionCategory(ext)];
}

export function fileExtension(fileName: string): string {
  return fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase() : '';
}
