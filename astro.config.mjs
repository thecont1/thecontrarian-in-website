// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
// markdown-remark is the default, no import needed
import scaffold from './scripts/scaffold-integration.ts';
import stripNotebookHtml from './scripts/remark-strip-notebook-html.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://thecontrarian.in',
  integrations: [react(), sitemap(), scaffold()],
  output: 'static',
  build: {
    inlineStylesheets: 'always'
  },
markdown: {
    remarkPlugins: [stripNotebookHtml],
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'esbuild' // Keep JS minification enabled
    }
  }
});
