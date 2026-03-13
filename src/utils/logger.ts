/**
 * 简单的日志工具
 */
export class Logger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  /**
   * 信息日志
   */
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  /**
   * 详细日志（仅在 verbose 模式输出）
   */
  debug(message: string): void {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  /**
   * 警告日志
   */
  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  /**
   * 错误日志
   */
  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }

  /**
   * 成功日志
   */
  success(message: string): void {
    console.log(`[SUCCESS] ${message}`);
  }
}

/**
 * 创建默认日志实例
 */
export function createLogger(verbose = false): Logger {
  return new Logger(verbose);
}
