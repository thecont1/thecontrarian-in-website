# NammaMetro Scrollytelling

A scrollytelling version of the *NammaMetro: The Conspiracy Theory* data story.

**Standalone** — decoupled from the Astro site, decoupled from the data project. Lives at `thecontrarian.in/datastory/bangalore-metro-conspiracy-theory-scrolly/`.

## Stack

- **Vite 5** + vanilla JS (no React, no Astro)
- **D3.js 7.9** for the visualizations
- **GSAP 3.13+** for scroll choreography (all plugins free)
- Hand-written CSS, no framework

## Project layout

```
.
├── public/
│   ├── data/              # JSONs, fetched from GitHub via `npm run data`
│   └── images/            # photos (Mahesh's archive)
├── scripts/
│   └── fetch-data.mjs     # `npm run data` — fetches the latest JSONs from GitHub
├── src/
│   ├── main.js            # entry
│   ├── chapters/          # 9 chapter modules (one per notebook section)
│   ├── viz/               # D3 viz library
│   ├── motion/            # GSAP wrappers
│   ├── components/        # header, footer, photo, footnote
│   └── data/              # data loaders
├── styles/
│   ├── reset.css
│   ├── typography.css
│   └── scrolly.css        # site chrome + scrolly chapter layout
├── index.html             # single-page entry
├── package.json
└── vite.config.js
```

## Workflow

```bash
# 1. Install deps
npm install

# 2. Fetch the latest JSONs from the public data repo
npm run data

# 3. Dev (Vite dev server with HMR)
npm run dev   # → http://localhost:5173/datastory/bangalore-metro-conspiracy-theory-scrolly/

# 4. Build (produces dist/)
npm run build   # → dist/

# 5. Preview the build
npm run preview
```

## Data source

The scrolly consumes 7 JSONs, all of which live in
[`thecont1/namma-metro-ridership-tracker/scrolly-article/`](https://github.com/thecont1/namma-metro-ridership-tracker/tree/main/scrolly-article).

To refresh the data after the notebook is re-run and pushed:

```bash
npm run data
```

## Deploy

The `dist/` folder is the deliverable. The `remote-only/.../bangalore-metro-conspiracy-theory-scrolly/` path on disk is mirrored to the live site on GitHub push, so committing `dist/` plus the source is what makes it go live.

## See also

- Editorial plan: `/Users/home/.mavis/workspace/editorial-plan.md` (v0.4)
- Tech plan: `/Users/home/.mavis/workspace/tech-plan.md` (v0.4)
- The original analysis: <https://thecontrarian.in/datastory/bangalore-metro-conspiracy-theory/>
- The data + notebook: <https://github.com/thecont1/namma-metro-ridership-tracker>
