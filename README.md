# doc2md

将 Office 文档（Word/PPT/Excel）和 PDF 转换为 Markdown 的命令行工具。

[![npm version](https://img.shields.io/npm/v/doc2md.svg)](https://www.npmjs.com/package/doc2md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 功能特性

- **一站式转换**：单条命令处理 Word、PowerPoint、Excel、PDF 等多种格式
- **高质量输出**：语义化解析，保留文档结构、表格、列表等核心样式
- **图片自动提取**：内嵌图片自动保存到 `images/` 目录，使用相对路径引用
- **开发者友好**：纯 TypeScript 实现，提供 CLI 和 API 两种使用方式
- **AI 就绪**：针对 LLM/RAG 场景优化的 Markdown 输出格式

## 支持的格式

| 格式 | 扩展名 | 状态 |
|------|--------|------|
| Microsoft Word | .docx | ✅ 支持 |
| Microsoft PowerPoint | .pptx | ✅ 支持 |
| Microsoft Excel | .xlsx | ✅ 支持 |
| PDF | .pdf | ✅ 支持 |
| CSV | .csv | ✅ 支持 |

## 安装

### 全局安装（推荐）

```bash
npm install -g doc2md
```

### 本地安装

```bash
npm install --save-dev doc2md
```

### 使用 npx（无需安装）

```bash
npx doc2md convert document.docx
```

## 使用方法

### 命令行界面 (CLI)

#### 转换单个文件

```bash
doc2md convert document.docx
doc2md convert presentation.pptx
doc2md convert data.xlsx
doc2md convert report.pdf
```

#### 指定输出路径

```bash
doc2md convert document.docx -o ./output/report.md
```

#### 批量转换目录

```bash
doc2md batch ./documents/ -o ./markdown/
doc2md batch ./documents/ -p "*.{docx,pptx,pdf}"
```

#### 高级选项

```bash
doc2md convert document.docx \
  --output ./output.md \
  --table-style gfm \
  --heading-style atx \
  --code-style fenced \
  --verbose
```

### 选项说明

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-o, --output <path>` | 输出文件路径 | 同目录下同文件名 |
| `--table-style <style>` | 表格样式 (gfm/simple/html) | gfm |
| `--heading-style <style>` | 标题样式 (atx/setext) | atx |
| `--code-style <style>` | 代码块样式 (fenced/indented) | fenced |
| `--strict` | 严格模式，保留更多格式 | false |
| `--verbose` | 显示详细日志 | false |

### 编程 API

```typescript
import { doc2md, detectFileType } from 'doc2md';

// 基本用法
const result = await doc2md.convert('document.docx');
console.log(result.markdown);

// 高级配置
const result = await doc2md.convert('document.docx', {
  outputPath: './output.md',
  tableStyle: 'gfm',
  headingStyle: 'atx',
  verbose: true,
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

## 图片处理

doc2md 会自动提取文档中的图片：

- 图片保存到与 Markdown 文件同级目录的 `images/` 文件夹中
- Markdown 中使用相对路径引用，如 `./images/image-001.png`
- 图片按 `image-{序号}.{扩展名}` 规则自动命名

转换后的目录结构：

```
documents/
├── report.md              # 生成的 Markdown 文件
└── images/                # 提取的图片
    ├── image-001.png
    ├── image-002.jpg
    └── ...
```

## 转换示例

### Word 转换

**输入 (document.docx)**：
- 标题层级
- 粗体/斜体文本
- 表格
- 图片

**输出 (document.md)**：

```markdown
# 文档标题

这是一段**粗体**和*斜体*文本。

## 子标题

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |

![图片描述](./images/image-001.png)
```

### Excel 转换

每个工作表转换为单独的 Markdown 表格：

```markdown
## Sheet1

| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25   | 北京 |
| 李四 | 30   | 上海 |

## Sheet2

| 产品 | 价格 | 库存 |
|------|------|------|
| 苹果 | 5.00 | 100  |
| 香蕉 | 3.00 | 200  |
```

## 系统要求

- Node.js >= 18.0.0
- PowerPoint 转换需要安装 [pptx-to-md](https://crates.io/crates/pptx-to-md)（可选）

```bash
# 安装 pptx-to-md（用于 PPTX 转换）
cargo install pptx-to-md
```

## 本地测试

### 环境准备

```bash
# 1. 确保 Node.js >= 18.0.0
node --version

# 2. 克隆仓库并进入目录
git clone https://github.com/yourusername/doc2md.git
cd doc2md

# 3. 安装依赖
npm install

# 4. 构建项目
npm run build
```

### 运行单元测试

```bash
# 运行所有测试
npm test

# 运行单个测试文件
npx vitest run tests/detector.test.ts
npx vitest run tests/image-extractor.test.ts

# 监听模式（文件变化时自动重新运行）
npx vitest

# 生成测试覆盖率报告
npx vitest run --coverage
```

### 使用 npm link 测试（推荐）

`npm link` 可以将本地项目链接到全局，让你像使用已发布的包一样测试 CLI：

```bash
# 1. 进入项目目录
cd doc2md

# 2. 构建项目（确保 dist/ 目录存在）
npm run build

# 3. 链接到全局
npm link

# 4. 现在可以在任意位置使用 doc2md 命令了
doc2md convert /path/to/document.docx
doc2md --help
```

#### 更新测试

修改代码后，需要重新构建并测试：

```bash
# 在项目目录重新构建
npm run build

# 全局链接会自动指向最新构建的版本
# 直接测试即可
doc2md convert document.docx
```

#### 取消链接

测试完成后，可以取消全局链接：

```bash
# 取消全局链接
npm unlink -g doc2md

# 或在项目目录执行
npm unlink
```

### 其他测试方式

如果不使用 `npm link`，也可以通过以下方式测试：

```bash
# 方式一：使用 npx（无需安装）
npx tsx src/cli.ts convert /path/to/document.docx

# 方式二：直接使用构建后的文件
node dist/cli.js convert /path/to/document.docx

# 方式三：在项目中使用 npx 运行
npx doc2md convert document.docx
```

#### 测试用例示例

```bash
# 转换 Word 文档
doc2md convert document.docx
doc2md convert document.docx -o ./output/report.md

# 转换 PowerPoint
doc2md convert presentation.pptx

# 转换 Excel
doc2md convert data.xlsx

# 转换 PDF
doc2md convert report.pdf

# 批量转换目录
doc2md batch ./documents/ -o ./markdown/
doc2md batch ./documents/ -p "*.{docx,pptx,pdf}"

# 显示详细日志
doc2md convert document.docx --verbose
```

### 测试 API 功能

创建一个测试脚本 `test-api.ts`：

```typescript
import { doc2md } from './src/index.js';

async function test() {
  // 测试单文件转换
  const result = await doc2md.convert('./tests/fixtures/sample.docx');
  console.log('Markdown output:', result.markdown);
  console.log('Images extracted:', result.images);
  
  // 测试批量转换
  const results = await doc2md.batch('./tests/fixtures/', {
    pattern: '*.{docx,pdf}'
  });
  console.log('Batch results:', results);
}

test().catch(console.error);
```

运行测试脚本：

```bash
npx tsx test-api.ts
```

### 代码质量检查

```bash
# 检查代码风格
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# 类型检查
npm run typecheck
```

### 开发模式

```bash
# 监听文件变化并自动重新构建
npm run dev
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/doc2md.git
cd doc2md

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
npm run lint:fix

# 类型检查
npm run typecheck
```

## 技术栈

- **TypeScript**：类型安全的 JavaScript 超集
- **Commander.js**：CLI 框架
- **Mammoth**：DOCX 解析
- **SheetJS**：Excel 解析
- **Turndown**：HTML 转 Markdown
- **pdf-parse**：PDF 文本提取
- **Vitest**：单元测试框架

## 许可证

[MIT](LICENSE) © doc2md Contributors

## 相关项目

- [Pandoc](https://pandoc.org/) - 通用文档转换器
- [MarkItDown](https://github.com/microsoft/markitdown) - 微软的文档转换工具
- [Marker](https://github.com/VikParuchuri/marker) - 高精度 PDF 转换工具

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0

- ✨ 初始版本发布
- 支持 DOCX、PPTX、XLSX、PDF 格式转换
- 图片自动提取功能
- CLI 和 API 两种使用方式
