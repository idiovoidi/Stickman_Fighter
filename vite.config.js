import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild'
  },
  server: {
    host: 'localhost',
    port: 3000,
    open: false,
    https: false
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
