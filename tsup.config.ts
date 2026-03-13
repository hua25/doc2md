import { defineConfig } from 'tsup';
import { glob } from 'glob';

const entryFiles = glob.sync('src/**/*.ts', {
  ignore: ['src/**/*.d.ts'],
});

export default defineConfig({
  entry: entryFiles,
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  platform: 'node',
  shims: true,
  bundle: false,
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  banner: {
    js: '#!/usr/bin/env node',
  },
});
