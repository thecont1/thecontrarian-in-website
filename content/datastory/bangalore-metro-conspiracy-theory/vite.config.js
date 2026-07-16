import { defineConfig } from 'vite';

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
