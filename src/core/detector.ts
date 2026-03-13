import * as path from 'path';
import { FileType, Doc2MdError, ErrorCode } from '../types/index.js';

const mimeTypes: Record<string, FileType> = {
  '.docx': 'docx',
  '.doc': 'doc',
  '.pptx': 'pptx',
  '.ppt': 'ppt',
  '.xlsx': 'xlsx',
  '.xls': 'xlsx',
  '.csv': 'csv',
  '.pdf': 'pdf',
};

export function detectFileType(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext];
  
  if (!type) {
    throw new Doc2MdError(
      ErrorCode.UNSUPPORTED_FORMAT,
      `不支持的文件格式: ${ext || '未知'}. 支持的格式: ${Object.keys(mimeTypes).join(', ')}`
    );
  }
  
  return type;
}

export function isSupportedFormat(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext in mimeTypes;
}

export function getSupportedExtensions(): string[] {
  return Object.keys(mimeTypes);
}
