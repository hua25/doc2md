# AGENTS.md - doc2md Project Guidelines

## Project Overview

**doc2md** is a TypeScript CLI tool that converts Office documents (Word/PPT/Excel) and PDFs to Markdown format.

## Build Commands

```bash
# Build the project (outputs to dist/)
npm run build

# Watch mode for development
npm run dev

# Type check without emitting
npm run typecheck
```

## Test Commands

```bash
# Run all tests
npm test

# Run a single test file
npx vitest run tests/detector.test.ts

# Run tests in watch mode
npx vitest

# Run tests with coverage
npx vitest run --coverage
```

## Lint Commands

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022
- Module: ES2022 with bundler resolution
- Strict mode enabled
- Source maps enabled

### Import Conventions
- Use `.js` extension for all relative imports (ESM requirement)
  ```typescript
  // Correct
  import { detectFileType } from '../core/detector.js';
  
  // Incorrect
  import { detectFileType } from '../core/detector';
  ```
- Use `import type` for type-only imports
- Prefer named exports over default exports

### Naming Conventions
- **Files**: kebab-case (e.g., `image-extractor.ts`)
- **Classes**: PascalCase (e.g., `DocxConverter`)
- **Interfaces/Types**: PascalCase (e.g., `ConvertOptions`)
- **Functions/Variables**: camelCase (e.g., `detectFileType`)
- **Constants**: UPPER_SNAKE_CASE for enums (e.g., `ErrorCode`)

### Error Handling
- Use custom `Doc2MdError` class with error codes
- Always wrap errors with context
- Use `unknown` type for catch clauses

```typescript
import { Doc2MdError, ErrorCode } from '../types/index.js';

try {
  // operation
} catch (error: unknown) {
  if (error instanceof Doc2MdError) {
    throw error;
  }
  throw new Doc2MdError(
    ErrorCode.CONVERSION_FAILED,
    `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    error instanceof Error ? error : undefined
  );
}
```

### Comments and Documentation
- JSDoc comments required for public APIs
- Chinese comments acceptable for internal documentation
- Comments explaining "why" not "what"

### Project Structure
```
src/
├── cli.ts              # CLI entry point
├── index.ts            # Public API exports
├── converters/         # Format-specific converters
├── core/               # Core logic (detector, router)
├── processors/         # Post-processors (html-to-md, image-extractor)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Dependencies
- `commander` - CLI framework
- `mammoth` - DOCX parsing
- `turndown` - HTML to Markdown conversion
- `xlsx` - Excel parsing
- `pdf-parse` - PDF text extraction
- `glob` - File pattern matching

## Testing Guidelines

- Use Vitest for testing
- Place tests in `tests/` directory
- Use fixtures in `tests/fixtures/`
- Test files should mirror source structure

## Build Output

- Output directory: `dist/`
- Format: ESM (.mjs files)
- Source maps included
- CLI entry: `dist/cli.mjs`
- Library entry: `dist/index.mjs`

## Important Notes

1. This is an ESM-only project - no CommonJS
2. Node.js >= 18.0.0 required
3. PPTX conversion requires external `pptx-to-md` Rust tool
4. Images are extracted to `./images/` directory relative to output
5. All relative imports in source must use `.js` extension
