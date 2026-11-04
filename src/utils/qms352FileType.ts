export type Qms352PreviewKind =
  | 'image'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'ppt'
  | 'video'
  | 'audio'
  | 'archive'
  | 'text'
  | 'markdown'
  | 'code'
  | 'other'
  | '';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'svg', 'tif', 'tiff', 'ico', 'heic', 'heif', 'avif']);
const VIDEO_EXT = new Set(['mp4', 'm2v', 'mkv', 'rmvb', 'wmv', 'avi', 'flv', 'mov', 'm4v', 'webm', 'mpeg', 'mpg', '3gp', 'ts']);
const AUDIO_EXT = new Set(['mp3', 'wav', 'wma', 'aac', 'flac', 'ogg', 'm4a', 'ape', 'amr', 'opus']);
const ARCHIVE_EXT = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'cab', 'iso']);
const WORD_EXT = new Set(['doc', 'docx', 'docm', 'dot', 'dotx', 'wps', 'odt', 'rtf']);
const EXCEL_EXT = new Set(['xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'et', 'ods']);
const PPT_EXT = new Set(['ppt', 'pptx', 'pptm', 'pps', 'ppsx', 'dps', 'odp']);
const TEXT_EXT = new Set(['txt', 'log']);
const MARKDOWN_EXT = new Set(['md', 'markdown']);
const CODE_EXT = new Set([
  'json',
  'xml',
  'yml',
  'yaml',
  'js',
  'jsx',
  'ts',
  'tsx',
  'vue',
  'css',
  'scss',
  'less',
  'html',
  'htm',
  'java',
  'kt',
  'py',
  'go',
  'sql',
  'sh',
  'bat',
  'cmd',
  'ps1',
  'properties',
  'ini',
  'conf'
]);

/** 获取不带查询参数的文件扩展名。 */
export function getFileExtension(fileName?: string): string {
  if (!fileName) return '';
  const cleanName = fileName.split(/[?#]/, 1)[0].replace(/\\/g, '/').split('/').pop() || '';
  const dotIndex = cleanName.lastIndexOf('.');
  return dotIndex > 0 && dotIndex < cleanName.length - 1 ? cleanName.slice(dotIndex + 1).toLowerCase() : '';
}

/**
 * 与 QMS PC 端 getFileType 一致，用于选择预览方式。
 */
export function getQms352FileType(fileName?: string): Qms352PreviewKind {
  if (!fileName) {
    return '';
  }
  const ext = getFileExtension(fileName);
  if (!ext) {
    return 'other';
  }
  if (IMAGE_EXT.has(ext)) {
    return 'image';
  }
  if (MARKDOWN_EXT.has(ext)) {
    return 'markdown';
  }
  if (TEXT_EXT.has(ext)) {
    return 'text';
  }
  if (EXCEL_EXT.has(ext)) {
    return 'excel';
  }
  if (WORD_EXT.has(ext)) {
    return 'word';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }
  if (PPT_EXT.has(ext)) {
    return 'ppt';
  }
  if (VIDEO_EXT.has(ext)) {
    return 'video';
  }
  if (AUDIO_EXT.has(ext)) {
    return 'audio';
  }
  if (ARCHIVE_EXT.has(ext)) {
    return 'archive';
  }
  if (CODE_EXT.has(ext)) {
    return 'code';
  }
  return 'other';
}

export function isQms352PdfViewerType(kind: Qms352PreviewKind): boolean {
  return kind === 'pdf' || kind === 'word' || kind === 'excel' || kind === 'ppt';
}

export function isQms352NoPreviewType(kind: Qms352PreviewKind): boolean {
  return kind === 'text' || kind === 'markdown' || kind === 'code' || kind === 'audio' || kind === 'archive' || kind === 'other';
}
