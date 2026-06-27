// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import scaffold from './scripts/scaffold-integration.ts';
import stripNotebookHtml from './scripts/remark-strip-notebook-html.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://thecontrarian.in',
integrations: [react(), sitemap(), scaffold()],
  output: 'static',
  markdown: {
    processor: unified({
      remarkPlugins: [stripNotebookHtml],
    }),
  },
  build: {
    inlineStylesheets: 'always'
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'esbuild' // Keep JS minification enabled
    }
  }
});
