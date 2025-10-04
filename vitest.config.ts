import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@/types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants.ts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@handlers': path.resolve(__dirname, './src/handlers'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
