# doc2md 设计文档

## 项目概述

**doc2md** 是一个将 Office 文档（Word/PPT/Excel）和 PDF 完美转换为 Markdown 的命令行工具。

### 核心价值主张

- **一站式转换**：单条命令处理所有主流文档格式
- **高质量输出**：语义化解析，保留文档结构和核心样式
- **开发者友好**：纯 TypeScript 实现，零原生依赖，跨平台支持
- **AI 就绪**：针对 LLM/RAG 场景优化的输出格式

---

## 功能规格

### 支持的输入格式

| 格式 | 扩展名 | 优先级 | 状态 |
|------|--------|--------|------|
| Microsoft Word | .docx | P0 | ✅ 核心支持 |
| Microsoft PowerPoint | .pptx | P0 | ✅ 核心支持 |
| Microsoft Excel | .xlsx | P0 | ✅ 核心支持 |
| PDF | .pdf | P0 | ✅ 核心支持 |
| 传统 Word | .doc | P1 | ⚠️ 依赖外部工具 |
| 传统 PPT | .ppt | P2 | ⚠️ 后续支持 |
| CSV | .csv | P1 | ✅ 支持 |
| HTML | .html | P2 | ⚠️ 后续支持 |

### 核心功能

#### 1. 文档转换
- 自动检测文件类型并路由到对应转换器
- 支持批量目录转换
- 保留文档结构（标题层级、列表、表格）
- 提取并处理内嵌图像

#### 2. 图像处理策略
- **统一保存到 images 目录**：所有图片提取到与 Markdown 文件同级目录的 `images/` 文件夹中
- **相对路径引用**：Markdown 中使用 `./images/filename.ext` 相对路径引用图片
- **自动命名**：图片按 `image-{序号}.{扩展名}` 规则自动命名，避免冲突

#### 3. Markdown 格式控制
- 支持 GFM（GitHub Flavored Markdown）
- 表格自动转换为 Markdown 表格格式
- 代码块识别与语言标注
- 任务列表 (`[ ]` / `[x]`) 保留

#### 4. CLI 功能
- 简洁直观的命令行界面
- 丰富的配置选项（输出路径、图像策略、表格样式等）
- 进度显示与详细日志
- 配置文件支持（`.doc2mdrc`）

---

## 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI 入口层                               │
│              Commander.js 命令解析与参数处理                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     核心调度层                                │
│         文件类型检测 → 转换器路由 → 管道处理                    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   DOCX 转换器    │ │   PPTX 转换器    │ │   XLSX 转换器    │
│    Mammoth      │ │ officeparser    │ │     xlsx        │
│   (npm 包)      │ │  (纯 JS)        │ │  (SheetJS)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │    ┌──────────────┴───────────────────┘
         │    │
         ▼    ▼
┌─────────────────────────────────────────────────────────────┐
│                HTML → Markdown 转换层                        │
│              Turndown + GFM Plugin                          │
│         (语义化清理、表格优化、代码块处理)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PDF 转换器（独立路径）                       │
│               pdf-parse (TypeScript)                        │
│         (文本提取、布局分析、表格识别)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     后处理与输出层                            │
│      图像提取、路径重写、Markdown 清理、文件写入               │
└─────────────────────────────────────────────────────────────┘
```

### 模块结构

```
src/
├── cli/
│   ├── index.ts              # CLI 入口
│   ├── commands/
│   │   ├── convert.ts        # convert 命令
│   │   └── batch.ts          # batch 批量转换命令
│   └── options.ts            # 全局选项定义
├── converters/
│   ├── base.ts               # 转换器基类
│   ├── docx.ts               # Word 转换器
│   ├── pptx.ts               # PowerPoint 转换器
│   ├── xlsx.ts               # Excel 转换器
│   └── pdf.ts                # PDF 转换器
├── core/
│   ├── detector.ts           # 文件类型检测
│   ├── router.ts             # 转换器路由
│   ├── pipeline.ts           # 处理管道
│   └── config.ts             # 配置管理
├── processors/
│   ├── html-to-md.ts         # HTML → Markdown
│   ├── image-extractor.ts    # 图像提取
│   ├── table-optimizer.ts    # 表格优化
│   └── markdown-cleaner.ts   # Markdown 清理
├── types/
│   └── index.ts              # TypeScript 类型定义
└── utils/
    ├── fs.ts                 # 文件系统工具
    ├── path.ts               # 路径处理
    └── logger.ts             # 日志工具
```

---

## 技术选型

### 核心依赖

| 用途 | 库/工具 | 版本 | 理由 |
|------|---------|------|------|
| CLI 框架 | commander | ^12.x | 零依赖、TypeScript 原生、5000万周下载 |
| DOCX 解析 | mammoth | ^1.x | 语义化转换、190万周下载、活跃维护 |
| HTML→MD | turndown | ^7.x | 最成熟的 HTML 转 Markdown 库 |
| GFM 支持 | @truto/turndown-plugin-gfm | ^1.x | GitHub 风格表格和代码块支持 |
| XLSX 解析 | xlsx | ^0.18.x | SheetJS，680万周下载，最全面的电子表格库 |
| PDF 解析 | pdf-parse | ^1.x | 纯 TypeScript，跨平台，无 native 依赖 |
| PPTX 解析 | officeparser | latest | 纯 JavaScript，支持多种 Office 格式 |

### 开发依赖

| 用途 | 库/工具 | 版本 |
|------|---------|------|
| 语言 | TypeScript | ^5.x |
| 构建 | tsup / esbuild | latest |
| 测试 | vitest | ^1.x |
| 代码规范 | @biomejs/biome | ^1.x |
| 类型检查 | tsc | ^5.x |

---

## 接口设计

### CLI 命令

#### 1. 基本转换命令

```bash
# 单文件转换
doc2md convert document.docx
doc2md convert presentation.pptx
doc2md convert data.xlsx
doc2md convert report.pdf

# 指定输出路径
doc2md convert document.docx -o output.md

# 批量转换目录
doc2md batch ./documents/ -o ./markdown/
```

#### 2. 高级选项

```bash
doc2md convert document.docx \
  --output ./output.md \
  --table-style gfm \               # gfm | simple | html
  --heading-style atx \             # atx | setext
  --code-style fenced \             # fenced | indented
  --strict \                        # 严格模式，保留更多格式
  --verbose                         # 详细日志
```

#### 3. 配置文件

支持 `.doc2mdrc.json` 配置文件：

```json
{
  "outputDir": "./markdown",
  "tableStyle": "gfm",
  "headingStyle": "atx",
  "codeStyle": "fenced",
  "strict": false,
  "converters": {
    "docx": {
      "styleMap": [
        "p[style-name='Important'] => strong.warning"
      ]
    },
    "xlsx": {
      "maxRows": 1000,
      "includeEmptySheets": false
    }
  }
}
```

### TypeScript API

```typescript
import { doc2md } from 'doc2md';

// 基本用法
const result = await doc2md.convert('document.docx');
console.log(result.markdown);

// 高级配置
const result = await doc2md.convert('document.docx', {
  outputPath: './output.md',
  tableStyle: 'gfm',
  onProgress: (progress) => {
    console.log(`${progress.percent}% - ${progress.stage}`);
  }
});

// 批量转换
const results = await doc2md.batch('./documents/', {
  outputDir: './markdown/',
  pattern: '*.{docx,pptx,pdf}'
});
```

### 输出结果类型

```typescript
interface ConversionResult {
  /** 原始文件路径 */
  inputPath: string;
  /** 输出文件路径 */
  outputPath: string;
  /** 生成的 Markdown 内容 */
  markdown: string;
  /** 提取的图像信息 */
  images: ExtractedImage[];
  /** 转换元数据 */
  metadata: {
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
  };
}

interface ExtractedImage {
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
```

---

## 各格式转换详细设计

### 1. Word (.docx) 转换

**技术方案**：Mammoth → HTML → Turndown → Markdown

**转换流程**：

```
docx
  │
  ▼
┌─────────────────┐
│ Mammoth         │  ← 语义化解析，提取文档结构
│ - 样式映射      │
│ - 图像提取      │
└────────┬────────┘
         │ HTML
         ▼
┌─────────────────┐
│ Turndown        │  ← 转换为 Markdown
│ + GFM Plugin    │
└────────┬────────┘
         │ Markdown
         ▼
┌─────────────────┐
│ 后处理          │  ← 清理、优化
└─────────────────┘
```

**关键实现**：

```typescript
// src/converters/docx.ts
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from '@truto/turndown-plugin-gfm';

export class DocxConverter extends BaseConverter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    // 1. 配置 Turndown
    const turndown = new TurndownService({
      headingStyle: options.headingStyle || 'atx',
      codeBlockStyle: options.codeStyle || 'fenced',
      bulletListMarker: '-',
    });
    turndown.use(gfm);

    // 2. 配置 Mammoth 图像处理
    const imageExtractor = this.createImageExtractor(options);

    // 3. 转换 DOCX → HTML
    const result = await mammoth.convertToHtml(
      { path: inputPath },
      {
        styleMap: options.styleMap,
        convertImage: mammoth.images.imgElement(imageExtractor),
      }
    );

    // 4. HTML → Markdown
    let markdown = turndown.turndown(result.value);

    // 5. 后处理
    markdown = this.postProcess(markdown);

    return {
      inputPath,
      markdown,
      images: imageExtractor.getImages(),
      metadata: {
        sourceFormat: 'docx',
        warnings: result.messages.map(m => m.message),
      },
    };
  }
}
```

**支持的 Word 元素**：

| Word 元素 | Markdown 输出 | 备注 |
|-----------|---------------|------|
| 标题 1-6 | `#` - `######` | 层级映射 |
| 粗体 | `**text**` | |
| 斜体 | `*text*` | |
| 删除线 | `~~text~~` | |
| 无序列表 | `- item` | |
| 有序列表 | `1. item` | |
| 表格 | GFM 表格 | 简单表格 |
| 代码块 | ` ```code` ` | |
| 超链接 | `[text](url)` | |
| 图像 | `![alt](src)` | 支持提取 |
| 水平线 | `---` | |

### 2. PowerPoint (.pptx) 转换

**技术方案**：officeparser (纯 JavaScript)

**架构说明**：
使用 `officeparser` 库解析 PPTX 文件，提取幻灯片内容和元数据，无需外部依赖。

**转换流程**：

```
pptx
  │
  ▼
┌─────────────────┐
│ officeparser    │  ← 纯 JavaScript 库
│ parseOffice()   │
└────────┬────────┘
         │ 结构化对象
         ▼
┌─────────────────┐
│ 文本提取与格式化 │  ← 标题识别、列表处理
└────────┬────────┘
         │ Markdown
         ▼
┌─────────────────┐
│ 输出文件        │
└─────────────────┘
```

**实现要点**：

```typescript
// src/converters/pptx.ts
import officeparser from 'officeparser';

export class PptxConverter implements Converter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    const result = await officeparser.parseOffice(inputPath);
    
    // 提取幻灯片内容
    const slides = result.content;
    
    // 格式化为 Markdown
    for (const slide of slides) {
      // 处理每张幻灯片
    }

      // 处理图像路径
      const { markdown: processedMd, images } = await this.processImages(
        markdown,
        tempDir,
        options
      );

      return {
        inputPath,
        markdown: processedMd,
        images,
        metadata: {
          sourceFormat: 'pptx',
        },
      };
    } finally {
      // 清理临时目录
      await fs.rm(tempDir, { recursive: true });
    }
  }
}
```

**幻灯片转换规则**：

- 每张幻灯片转换为二级标题 `## Slide N: Title`
- 幻灯片内容按文本框顺序排列
- 列表保持层级结构
- 表格转换为 GFM 表格
- 图像提取并处理

### 3. Excel (.xlsx) 转换

**技术方案**：xlsx (SheetJS) → 自定义表格生成

**转换策略**：

```
xlsx
  │
  ▼
┌─────────────────┐
│ xlsx            │  ← 解析工作簿
│ - 读取数据      │
│ - 遍历工作表    │
└────────┬────────┘
         │ JSON 数据
         ▼
┌─────────────────┐
│ 表格生成器       │  ← 构建 Markdown 表格
│ - 表头处理      │
│ - 数据格式化    │
│ - 对齐优化      │
└─────────────────┘
```

**实现要点**：

```typescript
// src/converters/xlsx.ts
import * as XLSX from 'xlsx';

export class XlsxConverter extends BaseConverter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    // 读取工作簿
    const workbook = XLSX.readFile(inputPath);

    let markdown = '';
    const warnings: string[] = [];

    // 遍历每个工作表
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      // 转换为 JSON 数组
      const data = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
      }) as (string | number)[][];

      if (data.length === 0) {
        warnings.push(`工作表 "${sheetName}" 为空`);
        continue;
      }

      // 添加工作表标题
      markdown += `## ${sheetName}\n\n`;

      // 生成 Markdown 表格
      markdown += this.generateMarkdownTable(data, options.tableStyle);
      markdown += '\n\n';
    }

    return {
      inputPath,
      markdown: markdown.trim(),
      images: [],
      metadata: {
        sourceFormat: 'xlsx',
        pageCount: workbook.SheetNames.length,
        warnings,
      },
    };
  }

  private generateMarkdownTable(
    data: (string | number)[][]
  ): string {
    if (data.length < 2) return '';

    const [headers, ...rows] = data;

    // 表头
    const headerLine = '| ' + headers.join(' | ') + ' |';

    // 分隔线
    const separator = '| ' + headers.map(() => '---').join(' | ') + ' |';

    // 数据行
    const dataLines = rows.map(row =>
      '| ' + row.map(cell => String(cell).replace(/\|/g, '\\|')).join(' | ') + ' |'
    );

    return [headerLine, separator, ...dataLines].join('\n');
  }
}
```

**Excel 转换规则**：

- 每个工作表转换为单独的 Markdown 表格
- 工作表名称作为二级标题
- 第一行作为表头
- 空单元格显示为空
- 支持简单格式化（粗体、颜色暂不支持）

### 4. PDF 转换

**技术方案**：pdf-parse (TypeScript 版)

**转换流程**：

```
pdf
  │
  ▼
┌─────────────────┐
│ pdf-parse       │  ← 提取文本和布局
│ - 文本提取      │
│ - 页面分析      │
│ - 表格识别      │
└────────┬────────┘
         │ 结构化数据
         ▼
┌─────────────────┐
│ 布局重建        │  ← 分析文档结构
│ - 标题检测      │
│ - 段落合并      │
│ - 表格重建      │
└────────┬────────┘
         │ Markdown
         ▼
┌─────────────────┐
│ 后处理          │  ← 清理和优化
└─────────────────┘
```

**实现要点**：

```typescript
// src/converters/pdf.ts
import { parsePdf } from 'pdf-parse';

export class PdfConverter extends BaseConverter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    // 解析 PDF
    const pdfData = await parsePdf(inputPath, {
      // 启用布局分析
      includeTextLayout: true,
    });

    // 分析文档结构
    const structure = this.analyzeStructure(pdfData);

    // 重建 Markdown
    let markdown = this.rebuildMarkdown(structure, options);

    // 后处理
    markdown = this.postProcess(markdown);

    return {
      inputPath,
      markdown,
      images: [], // PDF 图像提取较复杂，后续版本支持
      metadata: {
        sourceFormat: 'pdf',
        pageCount: pdfData.numpages,
      },
    };
  }

  private analyzeStructure(pdfData: PdfData): DocumentStructure {
    // 分析文本布局，检测标题、段落、表格等
    // ...
  }

  private rebuildMarkdown(
    structure: DocumentStructure,
    options: ConvertOptions
  ): string {
    // 根据结构重建 Markdown
    // ...
  }
}
```

**PDF 转换挑战与应对**：

| 挑战 | 应对策略 |
|------|----------|
| 复杂布局 | 启发式分析：字体大小、位置、间距 |
| 扫描件/图片 PDF | 提示用户，建议使用 OCR 工具预处理 |
| 表格识别 | 基于文本对齐的表格检测算法 |
| 多栏布局 | 分析文本流，识别栏边界 |
| 页眉页脚 | 位置分析，过滤固定区域 |

---

## 图像处理设计

### 图像存储规则

所有文档中的图片统一保存到 **Markdown 文件同级目录的 `images/` 文件夹**中：

```
输入文件: /path/to/document.docx
输出文件: /path/to/document.md
图片目录: /path/to/images/
          ├── image-001.png
          ├── image-002.jpg
          └── ...
```

### 图像处理实现

```typescript
// src/processors/image-extractor.ts
import * as path from 'path';
import * as fs from 'fs/promises';
import { createHash } from 'crypto';

interface ImageExtractorOptions {
  /** Markdown 输出文件路径 */
  outputPath: string;
}

export class ImageExtractor {
  private images: ExtractedImage[] = [];
  private imageIndex = 0;
  private imagesDir: string;
  private mdFileDir: string;

  constructor(options: ImageExtractorOptions) {
    // 计算 images 目录路径（与 Markdown 文件同级）
    this.mdFileDir = path.dirname(options.outputPath);
    this.imagesDir = path.join(this.mdFileDir, 'images');
  }

  /**
   * 确保 images 目录存在
   */
  async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.imagesDir, { recursive: true });
  }

  /**
   * 生成唯一的图片文件名
   */
  private generateFileName(contentType: string): string {
    this.imageIndex++;
    const ext = this.getExtension(contentType);
    return `image-${String(this.imageIndex).padStart(3, '0')}.${ext}`;
  }

  /**
   * 根据 contentType 获取文件扩展名
   */
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

  /**
   * 提取并保存图片
   * @returns 返回 Markdown 中引用的相对路径
   */
  async extract(image: { read(): Promise<Buffer>; contentType: string }): Promise<string> {
    const buffer = await image.read();
    const fileName = this.generateFileName(image.contentType);
    const filePath = path.join(this.imagesDir, fileName);

    // 保存图片文件
    await fs.writeFile(filePath, buffer);

    // 记录图片信息
    this.images.push({
      id: String(this.imageIndex),
      fileName,
      contentType: image.contentType,
      size: buffer.length,
      path: filePath,
    });

    // 返回相对路径（用于 Markdown 引用）
    return `./images/${fileName}`;
  }

  /**
   * 获取所有提取的图片信息
   */
  getImages(): ExtractedImage[] {
    return this.images;
  }
}
```

### Mammoth 集成示例

```typescript
// src/converters/docx.ts
import mammoth from 'mammoth';
import { ImageExtractor } from '../processors/image-extractor';

export class DocxConverter {
  async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
    // 创建图片提取器
    const imageExtractor = new ImageExtractor({
      outputPath: options.outputPath,
    });

    // 确保 images 目录存在
    await imageExtractor.ensureDirectory();

    // 转换 DOCX
    const result = await mammoth.convertToHtml(
      { path: inputPath },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          // 提取并保存图片，返回相对路径
          const src = await imageExtractor.extract({
            read: () => image.read(),
            contentType: image.contentType,
          });
          return { src };
        }),
      }
    );

    // ... 后续转换为 Markdown

    return {
      inputPath,
      markdown: /* ... */,
      images: imageExtractor.getImages(),
      metadata: { /* ... */ },
    };
  }
}
```

### 目录结构示例

转换前：
```
documents/
└── report.docx
```

转换后：
```
documents/
├── report.md              # 生成的 Markdown 文件
└── images/                # 图片目录（与 report.md 同级）
    ├── image-001.png      # 文档中的第一张图
    ├── image-002.jpg      # 文档中的第二张图
    └── image-003.png      # 文档中的第三张图
```

Markdown 中的引用：
```markdown
# 报告标题

这是一段文字。

![图片描述](./images/image-001.png)

继续下一段文字。

![另一个图片](./images/image-002.jpg)
```

---

## 后处理与优化

### Markdown 清理规则

```typescript
// src/processors/markdown-cleaner.ts

export class MarkdownCleaner {
  clean(markdown: string): string {
    return markdown
      // 移除多余的空行（超过2个）
      .replace(/\n{3,}/g, '\n\n')
      // 修复表格分隔符
      .replace(/\|\s*[-]+\s*\|/g, (match) =>
        match.replace(/\s+/g, ' ')
      )
      // 移除行尾空格
      .replace(/[ \t]+$/gm, '')
      // 标准化代码块语言标记
      .replace(/```(\w+)[ \t]*\n/g, '```$1\n')
      // 修复链接空格
      .replace(/\]\s+\(/g, '](')
      .trim();
  }
}
```

### 表格优化

```typescript
// src/processors/table-optimizer.ts

export class TableOptimizer {
  optimize(markdown: string): string {
    // 检测并修复对齐问题
    // 处理合并单元格的降级方案
    // 优化过宽表格（添加横向滚动提示）
    return markdown;
  }
}
```

---

## 错误处理

### 错误类型定义

```typescript
// src/types/errors.ts

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
```

### 错误处理策略

| 场景 | 处理方式 | 用户提示 |
|------|----------|----------|
| 文件不存在 | 抛出 FILE_NOT_FOUND | "文件不存在: {path}" |
| 格式不支持 | 抛出 UNSUPPORTED_FORMAT | "不支持的格式: {ext}" |
| PPTX 解析失败 | 抛出转换错误 | "PPTX 转换失败: {error}" |
| 转换失败 | 保留部分结果，记录警告 | 输出警告列表 |
| 图像提取失败 | 跳过该图像，继续处理 | "部分图像提取失败" |

---

## 性能考虑

### 优化策略

1. **流式处理**：大文件使用流式读取，减少内存占用
2. **并发控制**：批量转换时限制并发数（默认 4 个）
3. **缓存**：对重复转换的文件使用缓存
4. **惰性加载**：按需加载转换器，减少启动时间

### 性能基准（目标）

| 文件类型 | 大小 | 目标转换时间 |
|----------|------|-------------|
| Word | 1MB | < 1s |
| Word | 10MB | < 5s |
| PowerPoint | 5MB | < 3s |
| Excel | 1000 行 | < 1s |
| PDF | 10 页 | < 2s |
| PDF | 100 页 | < 10s |

---

## 测试策略

### 测试覆盖

```
tests/
├── unit/
│   ├── converters/
│   │   ├── docx.test.ts
│   │   ├── pptx.test.ts
│   │   ├── xlsx.test.ts
│   │   └── pdf.test.ts
│   ├── processors/
│   │   ├── html-to-md.test.ts
│   │   └── markdown-cleaner.test.ts
│   └── utils/
├── integration/
│   ├── cli.test.ts
│   └── batch-convert.test.ts
├── fixtures/
│   ├── sample.docx
│   ├── sample.pptx
│   ├── sample.xlsx
│   └── sample.pdf
└── snapshots/
```

### 测试用例

1. **单元测试**：每个转换器的核心功能
2. **集成测试**：完整转换流程
3. **快照测试**：验证输出格式稳定性
4. **边界测试**：空文件、大文件、损坏文件

---

## 发布与分发

### NPM 包

```json
{
  "name": "doc2md",
  "version": "1.0.0",
  "description": "Convert Office documents and PDFs to Markdown",
  "bin": {
    "doc2md": "./dist/cli.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 安装方式

```bash
# NPM 全局安装
npm install -g doc2md

# NPX 直接使用
npx doc2md convert document.docx

# 项目本地安装
npm install --save-dev doc2md
```

### 系统依赖

- **Node.js**: >= 18.0.0

无需额外系统依赖，所有转换功能均使用纯 JavaScript/TypeScript 实现。

---

## 路线图

### v1.0 (MVP)
- [x] DOCX 转换
- [x] PPTX 转换（纯 JavaScript）
- [x] XLSX 转换
- [x] PDF 基础转换
- [x] 图像提取
- [x] CLI 基础功能

### v1.1
- [ ] 配置文件支持
- [ ] 批量转换优化
- [ ] 进度显示
- [ ] 更好的 PDF 表格识别

### v1.2
- [ ] .doc 格式支持
- [ ] 图像 OCR（可选集成）
- [ ] 插件系统
- [ ] VS Code 插件

### v2.0
- [x] PPTX 解析器（纯 JavaScript，已实现）
- [ ] AI 增强转换（可选集成 LLM）
- [ ] 所见即所得预览模式
- [ ] 企业版（Web UI + 权限管理）

---

## 竞品对比

| 特性 | doc2md | Pandoc | MarkItDown | Marker |
|------|:------:|:------:|:----------:|:------:|
| Node.js 原生 | ✅ | ❌ | ❌ | ❌ |
| 零依赖 | ✅ | ❌ | ❌ | ❌ |
| DOCX | ✅ | ✅ | ✅ | ✅ |
| PPTX | ✅ | ❌ | ✅ | ✅ |
| XLSX | ✅ | ❌ | ✅ | ✅ |
| PDF | ✅ | ⚠️ | ✅ | ✅ |
| 批量转换 | ✅ | ✅ | ❌ | ❌ |
| 图像提取 | ✅ | ✅ | ✅ | ✅ |
| 配置文件 | ✅ | ✅ | ❌ | ❌ |
| TypeScript API | ✅ | ❌ | ❌ | ❌ |

**差异化优势**：
- 纯 Node.js 生态，无需 Python/Rust 环境即可运行核心功能
- TypeScript 原生支持，可作为库集成到项目中
- 针对开发者工作流优化，CLI 体验优先
- 轻量级，核心功能无重量级 AI 依赖

---

## 附录

### A. 术语表

| 术语 | 解释 |
|------|------|
| GFM | GitHub Flavored Markdown，GitHub 风格的 Markdown 扩展 |
| Mammoth | 一个专注于语义化 DOCX 转换的 JavaScript 库 |
| SheetJS | 最流行的 JavaScript 电子表格处理库（xlsx 包） |
| Turndown | 将 HTML 转换为 Markdown 的 JavaScript 库 |
| AST | Abstract Syntax Tree，抽象语法树 |

### B. 参考资料

- [Mammoth Documentation](https://github.com/mwilliamson/mammoth.js)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [Turndown Documentation](https://github.com/domchristie/turndown)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Pandoc User Guide](https://pandoc.org/manual.html)

### C. 相关项目

- [microsoft/markitdown](https://github.com/microsoft/markitdown)
- [VikParuchuri/marker](https://github.com/VikParuchuri/marker)
- [opendatalab/MinerU](https://github.com/opendatalab/MinerU)
- [jgm/pandoc](https://github.com/jgm/pandoc)

---

**文档版本**: 1.0.0  
**最后更新**: 2026-03-13  
**作者**: Sisyphus
