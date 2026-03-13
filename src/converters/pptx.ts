import * as fs from 'fs/promises';
import * as path from 'path';
import officeparser from 'officeparser';
import type { ConvertOptions, ConversionResult, Converter } from '../types/index.js';
import { Doc2MdError, ErrorCode } from '../types/index.js';
import { getFileSize } from '../utils/fs.js';

const { parseOffice } = officeparser;

interface OfficeParserSlide {
  type: 'slide';
  children: Array<{ type: string; text?: string; children?: Array<{ text?: string }> }>;
  metadata?: { slideNumber?: number };
}

interface OfficeParserResult {
  type: string;
  metadata?: { title?: string };
  content: OfficeParserSlide[];
  toText: () => string;
}

export class PptxConverter implements Converter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      const outputPath = options.outputPath || inputPath.replace(/\.pptx$/i, '.md');
      const result = await parseOffice(inputPath) as OfficeParserResult;
      
      if (!result || !result.content || result.content.length === 0) {
        warnings.push('演示文稿为空或无法提取内容');
      }

      const markdown = this.generateMarkdown(result, inputPath);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, markdown, 'utf-8');

      return {
        inputPath,
        outputPath,
        markdown,
        images: [],
        metadata: {
          sourceFormat: 'pptx',
          fileSize: await getFileSize(inputPath),
          pageCount: result?.content?.length || 0,
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
        `PPTX 转换失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private generateMarkdown(result: OfficeParserResult, inputPath: string): string {
    const title = result.metadata?.title || path.basename(inputPath, '.pptx');
    let markdown = `# ${title}\n\n`;

    if (!result.content || result.content.length === 0) {
      return markdown;
    }

    for (let i = 0; i < result.content.length; i++) {
      const slide = result.content[i];
      markdown += this.formatSlide(slide, i + 1);
      markdown += '\n---\n\n';
    }

    return markdown.trim();
  }

  private formatSlide(slide: OfficeParserSlide, slideNumber: number): string {
    const texts = this.extractTexts(slide);
    
    if (texts.length === 0) {
      return `## 幻灯片 ${slideNumber}\n\n（空白幻灯片）`;
    }

    const firstText = texts[0];
    const isTitle = firstText.length < 60 && !firstText.startsWith('•') && !firstText.startsWith('-');
    
    let markdown = '';
    
    if (isTitle) {
      markdown += `## ${firstText}\n\n`;
      texts.shift();
    } else {
      markdown += `## 幻灯片 ${slideNumber}\n\n`;
    }

    for (const text of texts) {
      const trimmedText = text.trim();
      if (trimmedText.startsWith('•') || trimmedText.startsWith('-')) {
        markdown += `- ${trimmedText.substring(1).trim()}\n`;
      } else {
        markdown += `${trimmedText}\n\n`;
      }
    }

    return markdown.trim();
  }

  private extractTexts(slide: OfficeParserSlide): string[] {
    const texts: string[] = [];
    
    for (const child of slide.children || []) {
      if (child.text) {
        texts.push(child.text);
      } else if (child.children) {
        for (const grandChild of child.children) {
          if (grandChild.text) {
            texts.push(grandChild.text);
          }
        }
      }
    }

    return texts.filter(t => t && t.trim());
  }
}
