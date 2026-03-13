export { convertFile } from './core/router.js';
export { detectFileType } from './core/detector.js';
export type {
  ConvertOptions,
  ConversionResult,
  ConversionMetadata,
  ExtractedImage,
  ConversionProgress,
  BatchConvertOptions,
  FileType,
  Converter,
} from './types/index.js';
export { Doc2MdError, ErrorCode } from './types/index.js';
