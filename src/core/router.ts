import type { FileType, ConvertOptions, ConversionResult, Converter } from '../types/index.js';
import { Doc2MdError, ErrorCode } from '../types/index.js';
import { DocxConverter } from '../converters/docx.js';
import { XlsxConverter } from '../converters/xlsx.js';
import { PptxConverter } from '../converters/pptx.js';
import { PdfConverter } from '../converters/pdf.js';

const converters: Record<FileType, Converter> = {
  docx: new DocxConverter(),
  doc: new DocxConverter(), // 复用 docx 转换器
  xlsx: new XlsxConverter(),
  pptx: new PptxConverter(),
  ppt: new PptxConverter(), // 复用 pptx 转换器
  pdf: new PdfConverter(),
  csv: new XlsxConverter(), // 复用 xlsx 转换器处理 csv
  unknown: new DocxConverter(), // 不会用到
};

export async function convertFile(
  inputPath: string,
  fileType: FileType,
  options: ConvertOptions = {}
): Promise<ConversionResult> {
  const converter = converters[fileType];
  
  if (!converter) {
    throw new Doc2MdError(
      ErrorCode.UNSUPPORTED_FORMAT,
      `不支持的文件类型: ${fileType}`
    );
  }

  return converter.convert(inputPath, options);
}

export function getConverter(fileType: FileType): Converter | null {
  return converters[fileType] || null;
}
