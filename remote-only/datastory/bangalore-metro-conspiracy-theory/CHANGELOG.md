# Changelog

## v0.5 — 50-block reveal, hero excluded, prominent citation title (2026-07-16)

The image reveal is now 50 random blocks (up from 20) with a tighter scroll range. The hero image is excluded from the animation — it loads normally on page load. The citation popover's title is now the visual hero of the card: prominent serif, bold, never truncated.

### Image reveal: 50 blocks, tighter range, hero excluded

- The grid is now **5×10 = 50 blocks** (up from 4×5 = 20). Each block is `background-size: 1000% 500%` with a `background-position` targeting its 1/10 × 1/5 portion. The assembly reads as a finer pixelation — the image looks like it resolves out of a denser grid.
- The trigger end is now **`top 50%`** (was `top 30%`). The reveal completes by the time the top edge of an image reaches 50% of the viewport height, instead of waiting until it's well into view. The 50 blocks share the 90% → 50% scroll range so each gets an equal slice.
- **The hero image is excluded from the animation.** `setupImageReveals()` now targets only `.datastory-photo img`. The hero (`<figure class="datastory-header .hero">`) loads immediately on page load with no mask, no block grid, no scroll trigger. The CSS rule for `.datastory-header .hero img` is just `width: 100%; height: auto; display: block` — no opacity: 0, no `img-reveal` wrapper.

### Citation popover: prominent title, default OG thumbnail

- The article title is now the visual hero of the card. It uses the **Fraunces** display serif at **1.02rem, weight 700, line-height 1.2**, letter-spacing `-0.005em`. It never truncates — wraps freely to up to 2 lines (clamped via `-webkit-line-clamp: 2`).
- When a footnote supplies an `og.image`, that's used as the 64×64 thumbnail. When it doesn't, the popover shows a **default document-icon SVG** drawn in Namma Metro purple (`color-mix(in srgb, #5E2D8C 6%, #fff)` background, `currentColor: #5E2D8C` strokes). The icon is a sheet with three lines and a folded corner — the visual metaphor for "an article". Defined as `DEFAULT_THUMB_SVG` in `src/components/footnote.js`.

### Files touched

- `src/motion/image-reveal.js` — `ROWS = 5`, `COLS = 10`, `REVEAL_END = 'top 50%'`, selector narrowed to `.datastory-photo img`
- `src/components/footnote.js` — `DEFAULT_THUMB_SVG` constant, used when `og.image` is absent
- `styles/scrolly.css` — 5×10 grid template, `background-size: 1000% 500%`, prominent title styles, default-thumb styles

---

## v0.4.6 — Alternating chapter backgrounds (2026-07-16)

Chapters now alternate between **paper white** (odd: 1, 3, 5, 7, 9) and a **very light hint of NammaMetro purple** (even: 2, 4, 6, 8) — a `color-mix(in srgb, #5E2D8C 5%, #fff)` that lands at roughly `#f7f4f9`. Just enough to read as a new section without competing with the content.

### How it works

- Each `.chapter` declares a `--chapter-bg` custom property. The base is `var(--paper)`; `:nth-of-type(even)` overrides it to `var(--chapter-bg-soft)`.
- A `::before` pseudo-element on each chapter is `position: absolute; width: 100vw; transform: translateX(-50%)` so the colour bleeds past the centred 960px content column to the viewport edges. The `::before` carries a 1px hairline `box-shadow` at the top and bottom so adjacent sections meet with a soft rule rather than an abrupt seam.
- `isolation: isolate` on the chapter scopes the `::before`'s `z-index: -1` to the chapter (it doesn't drop behind the page background).
- The `.chapter__title` (sticky) inherits `--chapter-bg` for its own background so the title blends seamlessly into its section — no visible edge where the title meets the section colour.
- `body { overflow-x: hidden }` to prevent horizontal scroll from the `100vw`-wide `::before`.

### Tuning

The purple intensity is a single property on `.chapter`:

```css
--chapter-bg-soft: color-mix(in srgb, #5E2D8C 5%, #fff);
```

Bump the `5%` up for a more visible hint, down to `3%` for even more subtle, or swap `#5E2D8C` for a different brand colour. The override cascades to the title automatically.

---

## v0.4.5 — Block reveal, OpenGraph citations, global counter (2026-07-16)

### Block-based image reveal (20 random blocks)

The reveal effect was a top-to-bottom mask wipe. It's now **20 blocks** fading in **random order** as the user scrolls. Each image is wrapped in a 4×5 grid of divs, each div the same image as `background-image` with `background-size: 500% 400%` and a `background-position` that targets its 1/5 × 1/4 portion. The blocks animate from opacity 0 → 1 in a shuffled order — a different sequence per page load.

The reveal range is the same as the chart triggers: image top at 90% of viewport → image top at 30%. Each of the 20 blocks gets an equal slice of that scroll range. With `scrub: 0.4` the assembly feels unhurried, not jumpy.

The original `<img>` stays in the DOM (opacity 0) for screen readers and to provide the container's aspect ratio. The visible image is the block grid.

### Continuous citation numbering across chapters

`footnote.js` now uses a module-level counter that keeps incrementing across `wireFootnotes` calls. Previously, each chapter started its footnotes at 1, so the 4 footnotes in Ch 8 were numbered 1–4 instead of continuing from where Ch 7 left off. Now the first footnote in the document is "1", the second is "2", …, the 8th (the first in Ch 8) is "8".

`wireFootnotes` also now walks all `.fn-slot` elements in document order each time it's called, so even if a later chapter scrolls into view before an earlier one, the numbering comes out correct.

### OpenGraph in the citation modal

The footnote popover used to show only a title, optional quote, and "View source →" link — sparse for a 3:1 rectangle. It now displays OpenGraph-style metadata when the chapter provides it: a 64×64 thumbnail on the left, a 2-line description, the site name in the bottom-left, and the link in the bottom-right. Layout:

```
+----------------------------------------------------+
| Title                                              |
| [thumb]  description text...                       |
|         SITE NAME              View source →       |
+----------------------------------------------------+
```

The title is clamped to one line with ellipsis; the description to two lines. Footnote dicts now accept an `og: { title, description, image, siteName }` block. The three chapters that have footnotes (Ch 1, Ch 2, Ch 8) supply `og` data for each. When `og` is missing, the modal falls back to the old `quote` field for the description.

### H1 includes "NammaMetro"

The visible H1 was `The Conspiracy Theory 😈` — missing the `NammaMetro:` prefix that the source notebook title has. Now it reads `NammaMetro: The Conspiracy Theory 😈`, matching the notebook. The browser tab `<title>` was already correct; this was the in-page H1.

### Files touched

- `src/motion/image-reveal.js` — full rewrite: 4×5 block grid with shuffled reveal order
- `styles/scrolly.css` — block-grid CSS, footnote popover new layout
- `src/components/footnote.js` — global counter, `renderFootnote()` with OpenGraph layout, single-attached global handlers
- `src/chapters/ch1-one-day.js`, `ch2-crowded.js`, `ch8-fare-hike.js` — `og:` data on each footnote
- `index.html` — H1 now includes "NammaMetro"

---

## v0.4.4 — Image reveal everywhere, sticky titles, tooltip persistence (2026-07-16)

A grab bag of polish from a single editing session.

### Image reveal extended to all content images

The top-to-bottom scroll-driven reveal was previously scoped to `.datastory-photo img` (chapter photos only). It's now applied to **every static image in the content** — the hero in `.datastory-header .hero` and every chapter photo. The CSS selector is `.datastory-header .hero img, .datastory-photo img`; the JS selector matches. The hero is at the top of the page, so its ScrollTrigger fires at progress 1 on initial load and the image is revealed immediately.

### Animation triggers pulled closer to the viewport bottom

Every chart animation's ScrollTrigger `start` was `top 80%` (viz top at 20% from the bottom of the viewport). Now it's **`top 90%`** (viz top at 10% from the bottom) — "50% closer to the bottom" as the user put it. The animation has less scroll distance to complete, so it finishes faster relative to when the viz comes into view. 17 trigger points across 9 chapter files were updated:

```
src/chapters/ch1-one-day.js        (2)
src/chapters/ch2-crowded.js        (2)
src/chapters/ch3-one-week.js       (2)
src/chapters/ch4-traffic-bands.js  (1)
src/chapters/ch5-one-month.js      (2)
src/chapters/ch6-long-weekend.js   (1)
src/chapters/ch7-visitor-economy.js(1)
src/chapters/ch8-fare-hike.js      (3)
src/chapters/ch9-conspiracy.js     (3)
```

To adjust this yourself, the value lives in the `start:` field of each `ScrollTrigger.create({...})` in those files. Search for `start: 'top 90%'` (or any other `top N%` you want to try) to find them. Each chapter is independent — you can tune them per-chapter if some need a different threshold.

### Tooltip persistence on the calendar

The Ch 1 "120 days" calendar tooltip used to vanish the moment the mouse left a cell. Dragging the mouse across a row would flicker the tooltip through the gaps. Now the tooltip hides with an **80ms delay** on `mouseleave`/`blur`; if the mouse enters another cell within that window, the hide is cancelled and the tooltip just updates its content for the new cell. The delay is in `src/viz/calendar-strip.js` as `HIDE_DELAY_MS` (top of the hover-handler block) — adjust if you want a different feel.

### Chapter title: kicker folded into the title

The two-line chapter heading ("Chapter 1" / "One Day on NammaMetro") was eating too much vertical space. The kicker is gone; the chapter number is now prefixed into the title: "1. One Day on NammaMetro", "2. \"The Metro is Getting Crowded!\"", …, "9. The Conspiracy Theory 😈". All 9 chapter HTML blocks in `index.html` were updated; the `.chapter__kicker` CSS rule is no longer used (left in place in case you want to restore it).

### Sticky chapter title

Each chapter title now freezes below the site header as the user scrolls through the chapter. Implementation: `position: sticky; top: calc(var(--site-header-height) + 0.5rem)` on `.chapter__title`, with a `var(--surface)` background and a `0 1px 0 var(--hairline)` underline so content scrolling under the title is hidden, not visible through it. The title unsticks automatically when the chapter scrolls out of view (the natural behaviour of `position: sticky`).

---

## v0.4.3 — Footnote popover reshaped to 3:1 (2026-07-16)

The footnote citation popover used to be a tall, narrow column (`max-width: 320px`, no height control, content stacked vertically) — it ended up looking thin and stretched on most content. It's been reshaped into a proper **3:1 rectangle** with horizontal content flow.

### Layout

```
+----------------------------------------------------+
| Title (spans full width, top row)                  |
| Quote text here...                  View source →  |
+----------------------------------------------------+
```

A 2×2 CSS grid places:

- **Title** on the top row, spanning both columns (`grid-column: 1 / -1`)
- **Quote** on the bottom-left (`grid-column: 1`)
- **Link** on the bottom-right, aligned to the bottom-right corner (`grid-column: 2; align-self: end; justify-self: end`)

### Sizing

- `width: 480px` (fixed)
- `aspect-ratio: 3 / 1` (height = width / 3 = 160px on desktop)
- `max-width: min(90vw, 520px)` so the popover caps at 90% of the viewport on small screens and never exceeds 520px. The 3:1 aspect ratio is preserved at every width.
- Compact typography: title 0.86rem, quote/link 0.78rem, line-height 1.3. Fits comfortably in the 160px height with breathing room.

The popover is now confident and wide — a proper rectangle — not a tall thin column.

---

## v0.4.2 — Scroll-driven image reveal (2026-07-16)

Every chapter photo (`.datastory-photo img`) now reveals itself from the top row of pixels to the bottom as the user scrolls it into view. The reveal is gentle — an 8% soft fade at the leading edge — so it never feels like a hard clip.

### How it works

A CSS custom property `--reveal` (unitless, 0–100) drives a `linear-gradient` mask on each image. The mask's white (visible) zone extends from `0%` to `calc(var(--reveal) * 1%)`, then transitions to transparent over the next 8%, then stays transparent to the bottom. As `--reveal` grows from 0 to 100, the white zone sweeps down, wiping the image into view.

```css
mask-image: linear-gradient(
  to bottom,
  #fff 0%,
  #fff calc(var(--reveal) * 1%),
  transparent calc(var(--reveal) * 1% + 8%),
  transparent 100%
);
```

A new module `src/motion/image-reveal.js` sets up a `ScrollTrigger` per image. The trigger range is wide (image top at 90% of viewport → image top at 30%) so the reveal is gradual, not jumpy. `scrub: 0.5` smooths the leading edge.

### Other changes

- **Image height cap**: every chapter photo is now capped at `max-height: 90vh`. A wide landscape photo keeps its column width; a tall portrait photo will be clamped to 90vh with `width: 100%` and `height: auto`. (The drop shadow now correctly surrounds only the visible portion of the image, since `filter: drop-shadow` respects the mask.)
- The hero image (`.datastory-header .hero img`) is intentionally excluded — it lives at the top of the page and renders normally.

### Files touched

- `styles/scrolly.css` — added the mask and the `max-height: 90vh` cap on `.datastory-photo img`
- `src/motion/image-reveal.js` — new module
- `src/main.js` — imports and calls `setupImageReveals()` alongside the chapter mount

---

## v0.4.1 — Calendar polish + hover tooltip (2026-07-16)

The Ch 1 "120 days at a glance" calendar gets a few more rounds of refinement.

### Visual polish

- **Missing days** (in-range, not reported) now show a visible **X** mark drawn as two diagonal SVG lines. Background is a slightly more visible `rgba(0, 0, 0, 0.08)`. With the current data all 120 in-range days are reported, so the X won't appear unless a future notebook run has missing days — but the chart is now robust to that.
- **Days outside the editorial window** (the partial weeks at the edges of the calendar) have **no border** and no fill. They're truly empty — just the grid structure holding the calendar together.
- **Y-axis labels** (Mon, Tue, …) reduced from 11px / weight 600 to 9px / weight 400 with a faint letter-spacing — quieter, less competing with the data.
- **Chart-to-caption gap** reduced from 3rem to 0.5rem on the bottom of `.viz` (the caption has its own 0.75rem top margin, so the effective gap is now ~12px instead of ~48px).

### Hover tooltip

Hovering or keyboard-focusing any in-range cell now pops up a confident tooltip with:

1. **Date** in long human-readable form ("Saturday, November 16, 2024")
2. **Value** in Indian-grouped numerals ("8,36,751 riders") — or "Not reported by BMRCL" for missing days
3. **Vertical bar** on a 110×100 mini chart, scaled to 0 … (max + 10%). The bar is the Namma Metro deep purple (`#5E2D8C`); missing days show a stub 4% grey bar.

The tooltip is positioned above the cell by default, falling back to **below** for cells in the top row (Mon, Tue) where above would clip. It's keyboard-accessible — cells are now `tabindex="0"` and respond to focus/blur in addition to mouseenter/mouseleave. Native `<title>` is retained for screen readers.

The tooltip is built as a sibling div inside `.viz` (the container has `position: relative`); it has `pointer-events: none` so it never interferes with the cell hover.

---

## v0.4 — Calendar grid, Namma Metro purple, refined chrome (2026-07-16)

### Calendar strip rewrite (Chapter 1)

The "191 days at a glance" viz was previously a 28×7 grid with days along the columns and 7 payment channels as rows. It's been restructured as a true **calendar grid**:

- **7 rows = days of the week** (Mon at the top, Sun at the bottom), labelled on the Y-axis.
- **N columns = weeks**. The first column starts on the Monday on or before the editorial window's start date; the last column ends on the Sunday on or after the end date. Cells outside the window are rendered as empty (transparent); cells inside the window that BMRCL didn't publish are faint placeholders.
- **Animation** now reveals rows top to bottom as you scroll: progress `0 → 1/7` reveals Mon, `1/7 → 2/7` reveals Tue, and so on. The row is the unit of reveal — no more column-by-column.
- **Colour scale** is now a sequential **Namma Metro purple** gradient (`#f0e6f7` light → `#5E2D8C` deep, matching BMRCL Purple Line signage). Cells coloured by total ridership.
- Adapts dynamically to whatever data range the notebook produces — no hardcoded `COLS=28` or `ROWS=7` for the data; the grid is computed from the data's start/end dates.

### Chrome refinements

- **Hero image** is no longer full-bleed. It's now capped at `max-width: 1080px` (a little wider than the 960px content column) and centred, so it sits inside the content width with margin on both sides.
- **Photo drop shadow** reduced from 5px to 2px. Same offset, same hard black — just lighter.
- **Chapter 1 prose** updated to match the new data window (Nov 16 2024 → Apr 14 2025, 120 days, Namma Metro purple).

### Bug fix

- `ch1-one-day.js`'s hardcoded `FALLBACK_DAY_ISO = '2025-04-30'` is no longer in the data (window now ends Apr 14). The fallback now walks backwards from the last day and picks the most recent Mon–Thu. The representative weekday is no longer pinned to a specific ISO date.

---

## v0.3.2 — Dev server integration fix (2026-07-16)

The dev server (`bun run dev`) was returning 404 on the scrolly URL because the dynamic route `src/pages/datastory/[...slug].astro` was shadowing the `public/datastory/<slug>/index.html` file. Three things fixed it:

1. **`predev` script** added to `package.json` so `node scripts/build_scrolly.mjs` runs before the dev server starts. Without this, the `public/` scrolly files don't exist in dev, and the route 404s.

2. **Route file** (`src/pages/datastory/[...slug].astro`) updated: instead of filtering scrolly entries out of `getStaticPaths`, it now generates a path for every published datastory and dispatches by format. For scrolly entries, the route reads the prebuilt `public/<baseUrl>/index.html` and serves it via `Response`. For notebook entries, it renders via `Datastory.astro` as before. The same code path works in dev and in production build.

3. **Scrolly source watcher** in `scripts/scaffold-integration.ts`: when running in dev, watches each scrolly source directory for changes and re-runs `node scripts/build_scrolly.mjs` (debounced 200ms). Edits to the scrolly source hot-rebuild and the dev server picks up the new public/ file. The watcher ignores `node_modules/`, `dist/`, and `public/data/*.json` (the JSONs are regenerated by the scrolly's own `data` step).

### Side fixes

- The scrolly source directory was renamed from `bangalore-metro-conspiracy-theory-scrolly` to `bangalore-metro-conspiracy-theory` (matching the slug). The `.md` `source:` field updated to match. This is consistent with the user's earlier directive that "scrolly" is an internal reference and should not appear in the public URL — the source dir is internal too, so dropping the suffix keeps the naming uniform.
- A subtle path bug in the route file: `path.resolve("public", story.data.baseUrl, "index.html")` was treating the absolute `baseUrl` (e.g. `/datastory/...`) as the new root, ignoring `public`. Fixed by stripping the leading slash with `replace(/^\/+/, "")` and using `path.resolve(process.cwd(), "public", relativePath, "index.html")`.

### Verified

- `bun run dev` → predev runs build_scrolly.mjs, dev server starts
- `/datastory/bangalore-metro-conspiracy-theory/` → 200 (scrolly, served via route + public/ read)
- `/datastory/<other-slug>/` → 200 (notebook, served via route + Datastory.astro)
- `/datastory/bangalore-metro-conspiracy-theory-scrolly/` → 404 (the suffix never appears in the public URL)
- Editing a file in the scrolly source → dev server rebuilds within 200ms, refresh picks up the change

---

## v0.3.1 — Schema flattened (2026-07-16)

The Astro datastory schema is now a Zod **discriminated union** keyed on `format`. The `notebook:` and `scrolly:` wrappers are gone — all format-specific fields appear at the top level of the frontmatter.

### Before

```yaml
format: scrolly
scrolly:
  source: "./remote-only/datastory/..."
  baseUrl: "/datastory/.../"
```

```yaml
format: notebook       # or implicit
notebook:
  engine: jupyter
  entry: "https://..."
  excludeCodeCells: true
```

### After

```yaml
format: scrolly
source: "./remote-only/datastory/..."
baseUrl: "/datastory/.../"
```

```yaml
format: notebook
engine: jupyter
entry: "https://..."
excludeCodeCells: true
```

The discriminator is `format` itself. TypeScript narrows correctly: when `data.format === 'scrolly'`, `data.source` and `data.baseUrl` are typed as required strings; when `data.format === 'notebook'`, `data.engine`, `data.entry`, `data.excludeCodeCells` are typed.

### Files touched

- `src/content.config.ts` — schema switched to `z.discriminatedUnion("format", [...])`
- `scripts/render_notebook.py` — frontmatter parser now reads `entry` and `excludeCodeCells` at the top level; skips entries with `format !== "notebook"`
- `scripts/build_scrolly.mjs` — frontmatter reader now reads `source` and `baseUrl` at the top level
- `scripts/scaffold-integration.ts` — datastory template flattened
- All 5 `.md` files migrated to the flat format

### Why

A redundant wrapper is noise. The format is already the discriminator; the wrapper added a level of indentation for no reason. Flat is cleaner.

---

## v0.3 — Integrated with Astro (2026-07-16)

The scrolly is now a first-class output of `thecontrarian.in`'s Astro build. Production deploys go through `bun run build` (CI), not through a manual scrolly-side build.

### What changed

1. **Public URL is now format-agnostic.** The scrolly is served at `/datastory/bangalore-metro-conspiracy-theory/` — the same URL the notebook version used. The previous `-scrolly` suffix was an internal reference, not a public one. The "scrolly" word appears only in `content/datastory/*.md` frontmatter (the `format: scrolly` field) and never in any public-facing artifact (URL, title, listing, meta).
2. **Astro content schema** (`src/content.config.ts`) now has a `format: 'notebook' | 'scrolly'` field. Defaults to `notebook` (so all existing datastory entries are unaffected). A `scrolly: { source, baseUrl }` block is required when `format === 'scrolly'`.
3. **A new build script** `scripts/build_scrolly.mjs` runs as part of the Astro `prebuild` step. It walks `content/datastory/*.md`, finds scrolly entries, and for each: installs deps (skips if `node_modules` exists), runs `data`, runs `vite build --base=<baseUrl>` (overrides the scrolly's own `vite.config.js` `base`), and copies `dist/*` to `public/<baseUrl>/`. The Astro build then copies that to `dist/<baseUrl>/` automatically.
4. **The slug route** (`src/pages/datastory/[...slug].astro`) filters out scrolly entries from `getStaticPaths`, so Astro does not emit a route HTML for them — the static files in `public/<baseUrl>/` are served directly.
5. **The existing notebook HTML** at `content/datastory/bangalore-metro-conspiracy-theory.notebook.html` is now dead (the format is scrolly). Kept on disk for archival. To restore the notebook, revert the format field in the .md and re-render with `render_notebook.py`.
6. **Scrolly's `vite.config.js`** `base` is now `/datastory/bangalore-metro-conspiracy-theory/` (the public URL). Local dev runs at this URL pattern too.

### For future scrolly pieces

1. Copy this directory (or make a new one with the same structure: `package.json`, `vite.config.js`, `src/`, `scripts/fetch-data.mjs`, `public/data/`).
2. Update `vite.config.js` `base` to the new URL.
3. Update `scripts/fetch-data.mjs` to point at the new JSONs on GitHub (or whatever data source).
4. Write the chapters in `index.html` and the viz modules in `src/viz/`.
5. Add a content file `content/datastory/<slug>.md` with:
   ```md
   ---
   title: "..."
   format: scrolly
   scrolly:
     source: "./remote-only/datastory/<slug>"
     baseUrl: "/datastory/<slug>/"
   ---
   ```
6. Run `bun run build` (or `npm run build`). The prebuild step handles the scrolly build automatically.

### Verification

- `dist/datastory/bangalore-metro-conspiracy-theory/index.html` ✓
- `dist/datastory/bangalore-metro-conspiracy-theory/assets/index-*.js` (243 KB) ✓
- `dist/datastory/bangalore-metro-conspiracy-theory/assets/*.jpg` (8 photos) ✓
- `dist/datastory/bangalore-metro-conspiracy-theory/data/*.json` (7 JSONs) ✓
- All asset URLs in the scrolly's HTML reference `/datastory/bangalore-metro-conspiracy-theory/...` (no `-scrolly` suffix) ✓
- The 0 occurrences of the word "scrolly" in `dist/datastory/index.html` and `dist/index.html` ✓
- Other datastory entries (notebook format) unaffected: `aditya-L1-solar-explorer`, `bangalore-metro-phenomena-inspector`, `rolling-relative-route-scoring-system`, `traffic-monitor-lizard` all build at their original URLs ✓

---

## v0.2 — Datastory design + viz-centered scroll (2026-07-16)

### Bug fixes

1. **Adopted the existing datastory design** from the Astro project's `src/styles/datastory.css`. The header is now a data-journalism masthead:
   - 3px top rule above the kicker
   - "Data Story" kicker chip (Inter 700, black background, white text, 0.22em letter-spacing)
   - Inter 900 title with -0.05em letter-spacing
   - Fraunces italic subtitle (light weight, max-width 55ch)
   - Byline + date
   - Full-bleed hero image below the text (no cinematic overlay, no min-height 100vh)
   - Site header is now always dark gray (`#2a2a2a`) with white text, matching the Astro datastory layout
2. **ScrollTrigger now per-viz, viz-centered.** Every chapter's viz now has its own ScrollTrigger:
   - `trigger: <vizSlot>` (the viz element, not the whole chapter)
   - `start: 'top 80%'`
   - `end: 'center center'` (animation completes when the viz center is at viewport center)
   - Removed the staggered-progress logic — each viz animates independently as it scrolls into view
3. **Content container widened** from 720px to 960px (the datastory's default). Removed the `chapter--wide` modifier since the default is now wide.

### Files changed

- `styles/scrolly.css` — full rewrite to match the datastory design
- `index.html` — new `.datastory-header` structure (kicker chip, Inter 900 title, italic subtitle, byline, date, full-bleed hero below)
- `src/main.js` — site-header is now always dark (no scroll observer, removed the hero IntersectionObserver)
- All 9 `src/chapters/ch*.js` — viz-as-trigger pattern with `end: 'center center'`

### Build stats

- 29.4KB HTML (gzipped 9.7KB)
- 10.2KB CSS (gzipped 2.9KB) — up from 7.9KB because the datastory design has more typography rules
- 243KB JS (gzipped 87KB) — unchanged
- 1.0s build time

---

## v0.1 — Initial build (2026-07-16)

First end-to-end build. All 9 chapters of the notebook rendered as a scrollytelling experience.

### What's in the box

- **9 chapters**, with notebook prose preserved verbatim (emoji callouts `👆🏼 💡 ✨ 📘`, yellow highlights, etc.)
- **11 D3 viz modules** in `src/viz/`:
  - `calendar-strip.js` — 191-day × 7-row grid, color = ridership (Ch 1)
  - `stacked-bar.js` — 7-mode stacked bar for a single day (Ch 1)
  - `horizontal-bar.js` — top-10 busiest/quietest (Ch 2)
  - `ridership-line.js` — generic line chart (Ch 3, 5, 8)
  - `day-of-week.js` — bar chart by day of week (Ch 3)
  - `stacked-area.js` — Commute vs Casual over time (Ch 4, 5, 8)
  - `event-line.js` — line with event markers (Ch 7)
  - `boxplot.js` — by month (Ch 5)
  - `ci-bar.js` — horizontal bar with confidence intervals (Ch 8, 9)
  - `before-after.js` — paired bars for hypothesis test (Ch 9)
  - `multi-ridership-line.js` — multi-line for the Jan 15-16 anomaly (Ch 9)
- **8 chapter mount modules** in `src/chapters/`, each wiring data + viz + ScrollTrigger
- **In-line footnote popovers** (`src/components/footnote.js`) — keyboard-accessible, click-outside-to-close
- **Photo polaroid** CSS in `styles/scrolly.css` — preserves the notebook's colored drop-shadows
- **GSAP ScrollTrigger** drives all scroll choreography (no D3 transitions compete with it)
- **Site chrome** — header (white-on-transparent, darkens on scroll) and footer (socials + ©) replicated from thecontrarian.in's Astro site

### Architecture

- **Standalone Vite 5** + vanilla JS. No React, no Astro.
- **Data flow:** notebook → GitHub JSONs → `npm run data` → `public/data/*.json` → fetched at runtime
- **D3 ↔ GSAP contract:** viz modules are pure (input data → rendered SVG + `update(progress)`); GSAP is the only thing that calls `requestAnimationFrame`

### Decisions made (without asking, documented for review)

1. **Header is white-on-transparent, darkens on scroll**, exactly like the Astro site. Pinned at top with `position: fixed; z-index: 10000;`. Same nav (Home / The Projects / About Me / Contact) pointing to `/#...` which lands on the main site. (v0.2: changed to always-dark-gray, no scroll-based darkening, matching the Astro datastory layout.)
2. **Footer** has X / LinkedIn / WhatsApp / Instagram / GitHub icons, plus the © line.
3. **Photo placement** matches the notebook: each photo at the same narrative moment with the same caption and the same colored box-shadow.
4. **Yellow highlights** (`<span class="highlight">`) and **emoji callouts** (`> 👆🏼 ...`) are preserved as in the notebook.
5. **In-line footnotes** are superscript numbers that open a popover on click, not end-of-piece citations. Each chapter defines its own footnotes.
6. **Lazy chapter mounting** via IntersectionObserver: D3 viz don't render until the chapter is about to scroll into view (1500px rootMargin). Initial bundle cost is just the CSS + main.js + lightbox-style chrome.
7. **CI bar values for Ch 8 and Ch 9 are illustrative** — they follow the pattern from the notebook's hypothesis tests (e.g., NCMC +39.4%, Smart Card -9.4% for Ch 8) but the exact numbers should be verified against the notebook's actual t-test output.
8. **`prefers-reduced-motion`** is honoured at the CSS level (all animations become 0.01ms). ScrollTrigger still works, just no scrubbing.
9. **No "Last Major Update: 2025-02-28" line** in the scrolly — that line lives in the notebook's first cell. The scrolly drops it.
10. **The Jan 15-16 anomaly is the analytical climax** (Ch 9), not Feb 9. The notebook's data analysis is anchored on the *pre-hike* anomaly, with the Feb 9 hike as either cover or the second wave.

### Things to verify before deploy

- [ ] Open `dist/index.html` via `npm run preview` and walk the full scroll. Confirm scroll feel, viz reveal timing, footnote popover positioning, photo shadows.
- [ ] Check the CI bar values in Ch 8 and Ch 9 against the notebook's actual t-test output. I used illustrative values based on the pattern.
- [ ] Confirm the 14-day hypothesis window JSON (`hypothesis-window.json`) is what you want — I chose 14 days each side per the earlier sign-off.
- [ ] Consider compressing the hero image (3MB → 100-200KB WebP) for faster first paint.
- [ ] Add a favicon (the Astro site has one at `dist/favicon.ico`).

### Known limitations

- The nav links point to `/#...` and `/`, which only work if the scrolly is hosted at the same domain as the main site (which it is, but worth noting for any future deploy to a different host).
- The big photos (3-4MB each) are loaded as-is. With 7 of them, that's ~20MB of image data on the page. Browsers lazy-load off-screen images by default, so this is OK, but compression would be a big win.
- The scrolly is a static site, so any future updates to the data require a re-build (`npm run data && npm run build`).

### Reusability

This is designed to be a template for future notebook-based scrollytelling pieces:
- **Reusable parts** (header, footer, photo polaroid, footnote popover, viz library, motion wrapper) stay
- **Per-instance parts** (chapter prose, data, photos) get replaced

To make a new scrolly from a different notebook:
1. Copy this directory
2. Update `package.json` (name, description)
3. Replace `public/data/*.json` with new data (via `scripts/fetch-data.mjs` pointed at a new repo path)
4. Replace `index.html` with new chapters
5. Replace `src/chapters/*.js` with new chapter mounts
6. Update the title in `index.html` and `<title>`

The viz library, motion wrapper, footnote popover, photo polaroid, and site chrome are all reusable as-is.
