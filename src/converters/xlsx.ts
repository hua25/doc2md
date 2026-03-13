import * as XLSX from 'xlsx';
import * as path from 'path';
import type { ConvertOptions, ConversionResult, Converter } from '../types/index.js';
import { Doc2MdError, ErrorCode } from '../types/index.js';
import { getFileSize } from '../utils/fs.js';

export class XlsxConverter implements Converter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      const outputPath = options.outputPath || inputPath.replace(/\.xlsx?$/i, '.md');

      const workbook = XLSX.readFile(inputPath);
      let markdown = '';

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        
        const data = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        }) as (string | number | null)[][];

        if (data.length === 0) {
          warnings.push(`工作表 "${sheetName}" 为空`);
          continue;
        }

        markdown += `## ${sheetName}\n\n`;
        markdown += this.generateMarkdownTable(data);
        markdown += '\n\n';
      }

      await this.writeOutput(outputPath, markdown.trim());

      const fileSize = await getFileSize(inputPath);

      return {
        inputPath,
        outputPath,
        markdown: markdown.trim(),
        images: [],
        metadata: {
          sourceFormat: 'xlsx',
          fileSize,
          pageCount: workbook.SheetNames.length,
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
        `XLSX 转换失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private generateMarkdownTable(data: (string | number | null)[][]): string {
    if (data.length < 1) return '';

    const [headers, ...rows] = data;

    const headerLine = '| ' + headers.map(h => String(h || '')).join(' | ') + ' |';
    const separator = '| ' + headers.map(() => '---').join(' | ') + ' |';
    const dataLines = rows.map(row =>
      '| ' + row.map(cell => String(cell || '').replace(/\|/g, '\\|')).join(' | ') + ' |'
    );

    return [headerLine, separator, ...dataLines].join('\n');
  }

  private async writeOutput(filePath: string, content: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }
}
