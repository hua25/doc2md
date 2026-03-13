import { Command } from 'commander';
import * as path from 'path';
import { detectFileType } from './core/detector.js';
import { convertFile } from './core/router.js';
import { Doc2MdError } from './types/index.js';
import { createLogger } from './utils/logger.js';
import { fileExists } from './utils/fs.js';

const program = new Command();

program
  .name('doc2md')
  .description('将 Office 文档和 PDF 转换为 Markdown')
  .version('1.0.0');

program
  .command('convert <file>')
  .description('转换单个文档为 Markdown')
  .option('-o, --output <path>', '输出文件路径')
  .option('--table-style <style>', '表格样式 (gfm|simple|html)', 'gfm')
  .option('--heading-style <style>', '标题样式 (atx|setext)', 'atx')
  .option('--code-style <style>', '代码块样式 (fenced|indented)', 'fenced')
  .option('--strict', '严格模式，保留更多格式')
  .option('--verbose', '显示详细日志')
  .action(async (file: string, options) => {
    const logger = createLogger(options.verbose);

    try {
      // 检查输入文件
      if (!(await fileExists(file))) {
        logger.error(`文件不存在: ${file}`);
        process.exit(1);
      }

      // 检测文件类型
      const fileType = detectFileType(file);
      logger.info(`检测到文件类型: ${fileType}`);

      // 构建转换选项
      const convertOptions = {
        outputPath: options.output,
        tableStyle: options.tableStyle,
        headingStyle: options.headingStyle,
        codeStyle: options.codeStyle,
        strict: options.strict,
        verbose: options.verbose,
      };

      logger.info('开始转换...');
      const startTime = Date.now();

      // 执行转换
      const result = await convertFile(file, fileType, convertOptions);

      const duration = Date.now() - startTime;
      logger.success(`转换完成！(${duration}ms)`);
      logger.info(`输出文件: ${result.outputPath}`);

      if (result.images.length > 0) {
        logger.info(`提取了 ${result.images.length} 张图片`);
      }

      if (result.metadata.warnings.length > 0) {
        logger.warn(`警告 (${result.metadata.warnings.length}):`);
        result.metadata.warnings.forEach((w: string) => logger.warn(`  - ${w}`));
      }
    } catch (error: unknown) {
      if (error instanceof Doc2MdError) {
        logger.error(`[${error.code}] ${error.message}`);
        if (options.verbose && error.cause) {
          logger.error(`原因: ${error.cause.message}`);
        }
      } else {
        logger.error(`未知错误: ${error instanceof Error ? error.message : String(error)}`);
      }
      process.exit(1);
    }
  });

program
  .command('batch <dir>')
  .description('批量转换目录中的文档')
  .option('-o, --output-dir <dir>', '输出目录')
  .option('-p, --pattern <pattern>', '文件匹配模式', '*.{docx,xlsx,pptx,pdf}')
  .option('--table-style <style>', '表格样式 (gfm|simple|html)', 'gfm')
  .option('--heading-style <style>', '标题样式 (atx|setext)', 'atx')
  .option('--code-style <style>', '代码块样式 (fenced|indented)', 'fenced')
  .option('--strict', '严格模式')
  .option('--verbose', '显示详细日志')
  .action(async (dir: string, options) => {
    const logger = createLogger(options.verbose);

    try {
      const fs = await import('fs/promises');
      const glob = await import('glob');

      // 检查目录
      if (!(await fileExists(dir))) {
        logger.error(`目录不存在: ${dir}`);
        process.exit(1);
      }

      // 查找匹配的文件
      const files = await glob.glob(options.pattern, { cwd: dir });
      
      if (files.length === 0) {
        logger.warn(`未找到匹配的文件: ${options.pattern}`);
        process.exit(0);
      }

      logger.info(`找到 ${files.length} 个文件`);

      const outputDir = options.outputDir || dir;

      // 批量转换
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputPath = path.join(dir, file);
        
        logger.info(`[${i + 1}/${files.length}] 转换: ${file}`);

        try {
          const fileType = detectFileType(inputPath);
          const fileName = path.basename(file, path.extname(file));
          const outputPath = path.join(outputDir, `${fileName}.md`);

          await convertFile(inputPath, fileType, {
            outputPath,
            tableStyle: options.tableStyle,
            headingStyle: options.headingStyle,
            codeStyle: options.codeStyle,
            strict: options.strict,
            verbose: options.verbose,
          });

          successCount++;
        } catch (error: unknown) {
          failCount++;
          if (error instanceof Doc2MdError) {
            logger.error(`  失败: [${error.code}] ${error.message}`);
          } else {
            logger.error(`  失败: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      logger.success(`批量转换完成: ${successCount} 成功, ${failCount} 失败`);
    } catch (error: unknown) {
      logger.error(`批量转换失败: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse();
