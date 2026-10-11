import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import FullReload from 'vite-plugin-full-reload';
import SortCss from 'postcss-sort-media-queries';

export default defineConfig({
  root: 'src',
  base: '/Coffee-Shop-Landingpage/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  plugins: [injectHTML(), FullReload(['./src/**/*.html'])],
  css: { postcss: { plugins: [SortCss({ sort: 'mobile-first' })] } },
});
