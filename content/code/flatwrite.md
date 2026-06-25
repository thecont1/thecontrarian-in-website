---
status: published
title: flatwrite
description: FlatWrite turns plain markdown into beautiful, shareable documents you actually enjoy reading. Makes markdown publishing feel effortless.
repoOwner: thecont1
repoName: flatwrite
repoEmail: ms@thecontrarian.in
author: Mahesh Shantaram
createdDate: 2026-06-24
lastUpdated: 2026-06-25
repoUrl: "https://github.com/thecont1/flatwrite"
readmeUrl: "https://raw.githubusercontent.com/thecont1/flatwrite/main/README.md"
branch: main
appUrl: "https://flatwrite.md/"
fileTree:
  - ".DS_Store"
  - ".gitignore"
  - "PLAN.md"
  - "README.md"
  - "api/render.js"
  - "api/s.js"
  - "api/share.js"
  - "content/projects/flatwrite.yaml"
  - "core/auth.js"
  - "core/doc-engines.js"
  - "core/document-css.js"
  - "core/font-loader.js"
  - "core/inline-assets.js"
  - "core/io.js"
  - "core/rate-limit.js"
  - "core/render.js"
  - "core/scale-map.js"
  - "index.js"
  - "package-lock.json"
  - "package.json"
  - "public/.DS_Store"
  - "public/app.js"
  - "public/assets/apple-touch-icon.png"
  - "public/assets/demo-solar.md"
  - "public/assets/favicon-16.png"
  - "public/assets/favicon-32.png"
  - "public/assets/favicon.svg"
  - "public/assets/og-image.png"
  - "public/assets/og-twitter.png"
  - "public/assets/pagedjs-logo.svg"
  - "public/assets/vivliostyle-logo.svg"
  - "public/fonts.css"
  - "public/fonts/inter-latin.woff2"
  - "public/fonts/jetbrains-mono-latin.woff2"
  - "public/fonts/lato-latin-300.woff2"
  - "public/fonts/lato-latin-400.woff2"
  - "public/fonts/lato-latin-700.woff2"
  - "public/fonts/unbounded-latin.woff2"
  - "public/index.html"
  - "public/server.js"
  - "public/styles.css"
  - "scripts/render_remote.py"
  - "test/TEST-CASES.md"
  - "test/export-parity.test.js"
  - "test/render.test.js"
  - "vercel.json"
  - "workers/flatwrite-render/.gitignore"
  - "workers/flatwrite-render/package-lock.json"
  - "workers/flatwrite-render/package.json"
  - "workers/flatwrite-render/src/index.js"
  - "workers/flatwrite-render/wrangler.toml"
  - "wrangler.jsonc"
tags:
  - "frameworks"
  - "markdown"
  - "mini-css"
  - "spectre-css"
  - "text-editor"
  - "ui-components"
license: ""
---

# FlatWrite

Markdown is one of the greatest cross-platform information formats ever invented. Ironically, while it is easy to read, it is also somehow difficult to read.

**FlatWrite** makes it easy — and actually pleasant — to work with markdown files. It renders your markdown in the most pleasing, customisable viewing format. From there, it is one quick step to becoming the markdown editor you reach for by default. And once the file looks and reads the way you love it, export it as **HTML** or **PDF**, or send it around as a **shareable URL**.

> **Write once, style many worlds.**

## What it does

- **Load** markdown from a URL or straight from your disk.
- **Edit** markdown with a clean, minimal editor and a helpful formatting toolbar.
- **View** your rendered markdown with a choice of lightweight CSS frameworks.
- **Read** mode gives you a focused, distraction-free preview you can resize to taste.
- **Export** to `.md`, `.html`, or `.pdf` whenever you are ready.
- **Share** your document as a real URL — the server stores the markdown and gives you a short link anyone can open.

## Share & publish

The share button is the jewel in the crown. Instead of stuffing a long document into a URL hash, FlatWrite saves the markdown to a paste bin backend and returns a short, readable link. The recipient can open the link and immediately see the document in the same preview style you chose.

- Links are short enough to paste into a chat, email, or tweet.
- The document is stored server-side, so it works with large files and survives URL-length limits.
- Opening a shared link loads the exact content, ready to read, edit, or re-export.

## UI frameworks

FlatWrite ships with a small but curated set of frameworks:

- **Spectre.css** — a lightweight, responsive framework with useful components.
- **PoshUI** — an elegant, modern class-light option.
- **Oat** — minimal and tasteful.
- **Pico CSS** — classless, semantic-first styling.
- **Milligram** — tiny, typography-focused.
- **Chota** — a micro framework with a simple grid.
- **Simple.css** — classless, sensible defaults.

Switching between them is instant, so you can see the same content in entirely different clothes.

## Typography and layout

The preview is not just skinned by the framework. You also get fine-grained controls:

- Choose from a handful of quality fonts: Inter, Merriweather, Playfair Display, Lora, Lato, Plus Jakarta Sans, and JetBrains Mono.
- Tweak size, weight, and line spacing until the reading rhythm feels right.
- Adjust UI zoom when the chrome needs to be a little larger or smaller.

## Components

Some frameworks expose small UI components — cards, forms, badges, alerts, avatars, grids, and so on. FlatWrite lets you insert them through a simple picker that writes the correct markup for you. This means your markdown can look like a polished document rather than a wall of text.

## How to run it

FlatWrite is now a small Node.js/Vercel app. The frontend lives in `public/`, and the share feature uses the API routes in `api/`.

```bash
# Start the local server (serves public/ at the root)
bun run start
# or
node public/server.js
```

Then open the printed URL in a browser.

The local server only serves the static frontend. When deployed to Vercel, `index.js` and the `api/` routes handle the share backend. To use the **Share** feature locally, run the API routes through the Vercel CLI (`vercel dev`) or set the `DUSTEBIN_BASE_URL` environment variable and wire the API endpoints into your local setup.

```bash
# On Vercel, the share API is live automatically
DUSTEBIN_BASE_URL=https://your-dustebin-instance.example.com vercel dev
```

## Tests

```bash
bun test
```

The test suite lives in `test/` and includes parity checks that make sure the exported HTML and PDF styles stay in sync with the live preview.

## Project structure

- `public/` — static app files (`index.html`, `app.js`, `styles.css`, fonts, etc.).
- `api/` — Vercel serverless API routes (`share.js`, `s.js`) for creating and reading shared links.
- `index.js` — Vercel root request handler (static files + API fallbacks).
- `public/server.js` — tiny static file server for local development.
- `demo-kashmir.md` — sample document that shows off components, cards, grids, and badges.

## The demo file

The repo includes `demo-solar.md` (a README file from another repo, a solar explorer project). Load it in FlatWrite and play around with it. See how markdown can be used to create a professional-looking document for humans and an easily digestible one for agents.

## Tech stack

- [marked.js](https://marked.js.org/) for Markdown → HTML.
- [DOMPurify](https://github.com/cure53/DOMPurify) to keep the rendered output safe.
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) for PDF export.
- Dustebin (or any compatible paste backend with `/api/pastes`) for temporarily storing shared documents.
- Browser-native `CompressionStream` for compact local URL fallbacks.

## Why another markdown editor?

Because most editors either look like a code playground or a publishing pipeline. FlatWrite sits somewhere sweeter: close enough to the raw text that you still control it, but polished enough that you actually enjoy reading and sharing what you create.

---

© 2026 [Mahesh Shantaram](https://thecontrarian.in)

