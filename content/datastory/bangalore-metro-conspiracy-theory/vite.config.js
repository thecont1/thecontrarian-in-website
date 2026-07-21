import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Simple HTML partial include plugin.
 *
 * During both dev and build, any comment in index.html of the form:
 *   <!-- @include partials/chapter-1.html -->
 * is replaced with the contents of that file (read from the project root).
 * This lets us keep each scrollytelling chapter in its own file while still
 * shipping a single assembled index.html.
 */
function htmlIncludes() {
  const includeRe = /<!--\s*@include\s+(.+?)\s*-->/g;
  return {
    name: 'html-includes',
    transformIndexHtml(html, ctx) {
      const root = path.dirname(ctx.filename);
      return html.replace(includeRe, (_match, file) => {
        const filePath = path.resolve(root, file.trim());
        return fs.readFileSync(filePath, 'utf8');
      });
    },
  };
}

export default defineConfig({
  // The site is served at thecontrarian.in/datastory/bangalore-metro-conspiracy-theory/
  // (the file system path /Users/home/DEV/.../remote-only/datastory/bangalore-metro-conspiracy-theory-scrolly/
  // is a separate scrolly project that builds into the Astro project's public/ tree).
  //
  // The `scripts/build_scrolly.mjs` step in the Astro project's prebuild
  // overrides this with `vite build --base=$BASE_URL` so the deployment
  // URL is always correct. This `base` here is only the default for
  // local dev (`npm run dev` / `npm run preview`).
  base: '/datastory/bangalore-metro-conspiracy-theory/',
  plugins: [htmlIncludes()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
  },
});
