import path from 'path';

/**
 * 获取文件扩展名（小写）
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * 获取文件名（不含扩展名）
 */
export function getFileNameWithoutExt(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * 计算从 from 到 to 的相对路径
 */
export function getRelativePath(from: string, to: string): string {
  const relative = path.relative(path.dirname(from), to);
  return relative.startsWith('.') ? relative : `./${relative}`;
}

/**
 * 标准化路径
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath);
}

/**
 * 拼接路径
 */
export function joinPaths(...paths: string[]): string {
  return path.join(...paths);
}
