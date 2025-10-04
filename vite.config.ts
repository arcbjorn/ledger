import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/server.ts'),
      formats: ['es'],
      fileName: 'server',
    },
    outDir: 'dist',
    ssr: true,
    rollupOptions: {
      external: ['node:http', 'node:crypto'],
    },
  },
  resolve: {
    alias: {
      '@models': path.resolve(__dirname, './src/models'),
      '@services': path.resolve(__dirname, './src/services'),
      '@handlers': path.resolve(__dirname, './src/handlers'),
    },
  },
});
