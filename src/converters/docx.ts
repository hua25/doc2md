import mammoth from 'mammoth';
import * as path from 'path';
import type { ConvertOptions, ConversionResult, Converter } from '../types/index.js';
import { Doc2MdError, ErrorCode } from '../types/index.js';
import { ImageExtractor } from '../processors/image-extractor.js';
import { createHtmlToMarkdownConverter, cleanMarkdown } from '../processors/html-to-md.js';
import { getFileSize } from '../utils/fs.js';

export class DocxConverter implements Converter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // 确定输出路径
      const outputPath = options.outputPath || inputPath.replace(/\.docx$/i, '.md');
      
      // 创建图片提取器
      const imageExtractor = new ImageExtractor({ outputPath });
      await imageExtractor.ensureDirectory();

      // 创建 HTML 到 Markdown 转换器
      const htmlToMd = createHtmlToMarkdownConverter(options);

      // 转换 DOCX 到 HTML
      const result = await mammoth.convertToHtml(
        { path: inputPath },
        {
          styleMap: options.styleMap || [],
          convertImage: mammoth.images.imgElement(async (image) => {
            const src = await imageExtractor.extract({
              read: () => image.read(),
              contentType: image.contentType,
            });
            return { src };
          }),
        }
      );

      // 收集警告
      result.messages.forEach(msg => warnings.push(msg.message));

      // HTML 转 Markdown
      let markdown = htmlToMd.turndown(result.value);
      markdown = cleanMarkdown(markdown);

      // 写入文件
      await this.writeOutput(outputPath, markdown);

      const fileSize = await getFileSize(inputPath);

      return {
        inputPath,
        outputPath,
        markdown,
        images: imageExtractor.getImages(),
        metadata: {
          sourceFormat: 'docx',
          fileSize,
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
        `DOCX 转换失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async writeOutput(filePath: string, content: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }
}
