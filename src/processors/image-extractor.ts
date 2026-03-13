import * as path from 'path';
import * as fs from 'fs/promises';
import type { ExtractedImage, ImageExtractorOptions } from '../types/index.js';

export class ImageExtractor {
  private images: ExtractedImage[] = [];
  private imageIndex = 0;
  private imagesDir: string;
  private mdFileDir: string;

  constructor(options: ImageExtractorOptions) {
    this.mdFileDir = path.dirname(options.outputPath);
    this.imagesDir = path.join(this.mdFileDir, 'images');
  }

  async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.imagesDir, { recursive: true });
  }

  private generateFileName(contentType: string): string {
    this.imageIndex++;
    const ext = this.getExtension(contentType);
    return `image-${String(this.imageIndex).padStart(3, '0')}.${ext}`;
  }

  private getExtension(contentType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
    };
    return mimeToExt[contentType] || 'png';
  }

  async extract(image: { read(): Promise<Buffer>; contentType: string }): Promise<string> {
    const buffer = await image.read();
    const fileName = this.generateFileName(image.contentType);
    const filePath = path.join(this.imagesDir, fileName);

    await fs.writeFile(filePath, buffer);

    this.images.push({
      id: String(this.imageIndex),
      fileName,
      path: filePath,
      contentType: image.contentType,
      size: buffer.length,
    });

    return `./images/${fileName}`;
  }

  getImages(): ExtractedImage[] {
    return this.images;
  }
}
