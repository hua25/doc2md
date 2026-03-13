import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import type { ConvertOptions, ConversionResult, Converter } from '../types/index.js';
import { Doc2MdError, ErrorCode } from '../types/index.js';
import { getFileSize } from '../utils/fs.js';

export class PptxConverter implements Converter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      const outputPath = options.outputPath || inputPath.replace(/\.pptx$/i, '.md');

      // 检查 pptx-to-md 是否已安装
      if (!this.isPptxToMdInstalled()) {
        throw new Doc2MdError(
          ErrorCode.DEPENDENCY_MISSING,
          '未找到 pptx-to-md 工具。请运行: cargo install pptx-to-md'
        );
      }

      // 创建临时目录
      const tempDir = await fs.mkdtemp('/tmp/pptx-convert-');

      try {
        // 调用 pptx-to-md
        execSync(`pptx-to-md "${inputPath}" -o "${tempDir}/output.md"`, {
          stdio: options.verbose ? 'inherit' : 'pipe',
        });

        // 读取生成的 Markdown
        const markdown = await fs.readFile(
          path.join(tempDir, 'output.md'),
          'utf-8'
        );

        // 处理图像
        const { markdown: processedMd, images } = await this.processImages(
          markdown,
          tempDir,
          path.dirname(outputPath)
        );

        // 写入最终输出
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, processedMd, 'utf-8');

        const fileSize = await getFileSize(inputPath);

        return {
          inputPath,
          outputPath,
          markdown: processedMd,
          images,
          metadata: {
            sourceFormat: 'pptx',
            fileSize,
            duration: Date.now() - startTime,
            warnings,
          },
        };
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
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

  private isPptxToMdInstalled(): boolean {
    try {
      execSync('which pptx-to-md', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  private async processImages(
    markdown: string,
    tempDir: string,
    outputDir: string
  ): Promise<{ markdown: string; images: Array<{ id: string; fileName: string; path: string; contentType: string; size: number }> }> {
    const images: Array<{ id: string; fileName: string; path: string; contentType: string; size: number }> = [];
    const imagesDir = path.join(outputDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // 查找 Markdown 中的图像引用
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let imageIndex = 0;
    let processedMarkdown = markdown;

    while ((match = imageRegex.exec(markdown)) !== null) {
      const [, alt, src] = match;
      
      if (src.startsWith('./') || !src.startsWith('http')) {
        const srcPath = path.join(tempDir, src);
        
        try {
          const stats = await fs.stat(srcPath);
          if (stats.isFile()) {
            imageIndex++;
            const ext = path.extname(src) || '.png';
            const fileName = `image-${String(imageIndex).padStart(3, '0')}${ext}`;
            const destPath = path.join(imagesDir, fileName);

            await fs.copyFile(srcPath, destPath);

            images.push({
              id: String(imageIndex),
              fileName,
              path: destPath,
              contentType: this.getContentType(ext),
              size: stats.size,
            });

            processedMarkdown = processedMarkdown.replace(
              src,
              `./images/${fileName}`
            );
          }
        } catch {
          // 图像文件不存在，跳过
        }
      }
    }

    return { markdown: processedMarkdown, images };
  }

  private getContentType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext.toLowerCase()] || 'image/png';
  }
}
