import { Doc2MdError, ErrorCode } from '../types/index.js';

/**
 * 检查文件是否存在
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 确保目录存在，不存在则创建
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Doc2MdError(
      ErrorCode.OUTPUT_WRITE_FAILED,
      `Failed to create directory: ${dirPath}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * 写入文件，自动创建目录
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 获取文件大小
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

// 导入 fs 和 path
import fs from 'fs/promises';
import path from 'path';

export { fs, path };
