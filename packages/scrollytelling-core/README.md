# @thecontrarian/scrollytelling-core

Shared core for thecontrarian.in's D3 + GSAP scrollytelling pieces. Story-specific code (chapters, viz, data, narrative) lives in each scrolly's own directory under `content/datastory/<slug>/`. This package holds the parts that don't change between stories.

## What's in here

```
src/
  motion/
    image-reveal.js      — scroll-driven 50-block image reveal
    scroll-trigger.js    — thin GSAP + ScrollTrigger wrapper
  components/
    footnote.js          — in-line citation popovers (numbered globally)
styles/
  reset.css              — minimal CSS reset
  typography.css         — font stacks (Fraunces, Inter, DM Sans, JetBrains Mono)
  scrolly.css            — chapter layout, image-reveal mechanics, callouts, footnote popover
  index.css              — re-exports the three above
```

## Usage from a scrolly project

```js
// src/main.js
import '@thecontrarian/scrollytelling-core/styles';
import { setupImageReveals, wireFootnotes } from '@thecontrarian/scrollytelling-core';
```

Or by subpath for tree-shaking:

```js
import { wireFootnotes } from '@thecontrarian/scrollytelling-core/components/footnote';
import { setupImageReveals } from '@thecontrarian/scrollytelling-core/motion/image-reveal';
```

CSS imports are one line — `import '@thecontrarian/scrollytelling-core/styles';` — and Vite bundles the three files into the scrolly's CSS asset.

## Theming

The scrolly's brand colour is set via the `--accent-color` CSS custom property. Each scrolly's own `index.html` sets this on `:root` (e.g. `--accent-color: #5E2D8C` for the NammaMetro scrolly). The core's styles use `var(--accent-color)` in the few places a brand colour shows up (chapter background tint, default footnote thumbnail).

## Peer dependencies

The core does not bundle `d3` or `gsap`. Each consuming scrolly lists them in its own `package.json` — they get hoisted by the bun workspace to the root `node_modules`. This way a scrolly that doesn't need D3 (e.g. a pure-prose scrolly) doesn't pull it in.
