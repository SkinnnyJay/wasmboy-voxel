import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@wasmboy/api': path.resolve(__dirname, '../../packages/api/src/index.ts'),
    },
  },
});
