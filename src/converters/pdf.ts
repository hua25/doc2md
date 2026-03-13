import * as fs from 'fs/promises';
import * as path from 'path';
import type { ConvertOptions, ConversionResult, Converter } from '../types/index.js';
import { Doc2MdError, ErrorCode } from '../types/index.js';
import { getFileSize } from '../utils/fs.js';

// PDF 解析使用动态导入，因为它可能是可选依赖
export class PdfConverter implements Converter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      const outputPath = options.outputPath || inputPath.replace(/\.pdf$/i, '.md');

      // 动态导入 pdf-parse (v2.x API)
      let PDFParse: typeof import('pdf-parse').PDFParse | null = null;
      try {
        const pdfModule = await import('pdf-parse');
        PDFParse = pdfModule.PDFParse;
      } catch {
        throw new Doc2MdError(
          ErrorCode.DEPENDENCY_MISSING,
          'PDF 转换需要 pdf-parse 包。请运行: npm install pdf-parse'
        );
      }
      
      if (!PDFParse) {
        throw new Doc2MdError(
          ErrorCode.DEPENDENCY_MISSING,
          'PDF 转换需要 pdf-parse 包。请运行: npm install pdf-parse'
        );
      }

      // 读取 PDF 文件
      const dataBuffer = await fs.readFile(inputPath);

      // 解析 PDF (v2.x API)
      const parser = new PDFParse({ data: dataBuffer });
      await parser.load();
      const textResult = await parser.getText();
      const pageCount = textResult.pages;
      const text = textResult.text;
      await parser.destroy();

      // 简单的文本清理和格式化
      let markdown = this.formatPdfText(text);

      // 写入输出文件
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, markdown, 'utf-8');

      const fileSize = await getFileSize(inputPath);

      return {
        inputPath,
        outputPath,
        markdown,
        images: [], // PDF 图片提取较复杂，暂不实现
        metadata: {
          sourceFormat: 'pdf',
          fileSize,
          pageCount,
          duration: Date.now() - startTime,
          warnings,
        },
      };
    } catch (error) {
      if (error instanceof Doc2MdError) {
        throw error;
      }
      throw new Doc2MdError(
        ErrorCode.CONVERSION_FAILED,
        `PDF 转换失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private formatPdfText(text: string): string {
    return text
      // 移除多余的空白行
      .replace(/\n{3,}/g, '\n\n')
      // 尝试识别标题（全大写的短行）
      .replace(/\n([A-Z][A-Z\s]{2,50})\n/g, '\n## $1\n')
      // 移除行首行尾空白
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  }
}
