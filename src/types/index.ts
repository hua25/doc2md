/**
 * 文件类型枚举
 */
export type FileType = 'docx' | 'pptx' | 'xlsx' | 'pdf' | 'doc' | 'ppt' | 'csv' | 'unknown';

/**
 * 提取的图片信息
 */
export interface ExtractedImage {
  /** 图像序号 */
  id: string;
  /** 保存的文件名 */
  fileName: string;
  /** 完整文件路径 */
  path: string;
  /** 内容类型 */
  contentType: string;
  /** 文件大小（字节） */
  size: number;
}

/**
 * 转换选项
 */
export interface ConvertOptions {
  /** 输出文件路径 */
  outputPath?: string;
  /** 表格样式 */
  tableStyle?: 'gfm' | 'simple' | 'html';
  /** 标题样式 */
  headingStyle?: 'atx' | 'setext';
  /** 代码块样式 */
  codeStyle?: 'fenced' | 'indented';
  /** 严格模式 */
  strict?: boolean;
  /** 详细日志 */
  verbose?: boolean;
  /** 进度回调 */
  onProgress?: (progress: ConversionProgress) => void;
  /** DOCX 样式映射 */
  styleMap?: string[];
}

/**
 * 转换进度
 */
export interface ConversionProgress {
  /** 百分比 */
  percent: number;
  /** 当前阶段 */
  stage: string;
  /** 已处理项目数 */
  processed?: number;
  /** 总项目数 */
  total?: number;
}

/**
 * 转换结果
 */
export interface ConversionResult {
  /** 原始文件路径 */
  inputPath: string;
  /** 输出文件路径 */
  outputPath: string;
  /** 生成的 Markdown 内容 */
  markdown: string;
  /** 提取的图像信息 */
  images: ExtractedImage[];
  /** 转换元数据 */
  metadata: ConversionMetadata;
}

/**
 * 转换元数据
 */
export interface ConversionMetadata {
  /** 原始格式 */
  sourceFormat: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 页数/幻灯片数/工作表数 */
  pageCount?: number;
  /** 转换耗时（毫秒） */
  duration: number;
  /** 警告信息 */
  warnings: string[];
}

/**
 * 批量转换选项
 */
export interface BatchConvertOptions extends ConvertOptions {
  /** 输出目录 */
  outputDir?: string;
  /** 文件匹配模式 */
  pattern?: string;
  /** 并发数 */
  concurrency?: number;
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 文件错误
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  CORRUPTED_FILE = 'CORRUPTED_FILE',

  // 转换错误
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  TIMEOUT = 'TIMEOUT',

  // 输出错误
  OUTPUT_WRITE_FAILED = 'OUTPUT_WRITE_FAILED',
  INVALID_OUTPUT_PATH = 'INVALID_OUTPUT_PATH',
}

/**
 * 自定义错误类
 */
export class Doc2MdError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'Doc2MdError';
  }
}

/**
 * 转换器接口
 */
export interface Converter {
  convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult>;
}

/**
 * 图片提取器选项
 */
export interface ImageExtractorOptions {
  /** Markdown 输出文件路径 */
  outputPath: string;
}

/**
 * Mammoth 图片对象
 */
export interface MammothImage {
  read(): Promise<Buffer>;
  contentType: string;
}
