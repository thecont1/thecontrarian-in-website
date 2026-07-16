#!/usr/bin/env node
/**
 * build_scrolly.mjs — Build script for `format: scrolly` datastory entries.
 *
 * Walks content/datastory/*.md, finds entries with `format: scrolly`, and
 * for each:
 *   1. Resolves the source directory (the scrolly's Vite project, colocated
 *      next to the .md entry under content/datastory/<slug>/).
 *   2. Installs dependencies (skips if node_modules already exists).
 *   3. Runs `data` (fetches JSONs from GitHub into the scrolly's public/data/).
 *   4. Runs `vite build --base=<baseUrl>` (overrides the scrolly's own
 *      vite.config.js `base` so the bundled asset URLs match the deployment URL).
 *
 * Vite builds into the scrolly's own `dist/` directory. That `dist/` is
 * gitignored by the scrolly's local .gitignore. The Astro integration then
 *   - Reads <source>/dist/index.html and returns it via the route's Response
 *     (this becomes dist/datastory/<slug>/index.html in the final site)
 *   - Copies <source>/dist/{assets,data}/ into dist/datastory/<slug>/
 *     (handled by the astro:build:done hook in scaffold-integration.ts)
 *
 * Nothing is ever written to the Astro project's public/. The public/
 * folder is reserved for site assets (fonts, image archive, .htaccess,
 * _headers, ads.txt, robots.txt, favicon, etc.) — not generated page
 * content.
 *
 * Wired into the `prebuild` step of package.json, so `npm run build` /
 * `bun run build` produces the scrolly outputs as part of the Astro build.
 * The `predev` step does the same for `npm run dev`.
 *
 * The `format` field NEVER appears in the public URL, title, or any
 * public-facing artifact — the slug in the .md file is the URL slug, and
 * "scrolly" only appears here in this internal script.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { load as parseYaml } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content", "datastory");

// ---------------------------------------------------------------------------
// Runtime detection: prefer bun (faster), fall back to node + npm/npx.
// ---------------------------------------------------------------------------

const isBun = typeof globalThis.Bun !== "undefined";
const pkgCmd = isBun ? "bun" : "npm";
const runScript = isBun ? "bun run" : "npm run";
const binCmd = isBun ? "bunx" : "npx";

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

function parseFrontmatter(text) {
  const m = text.match(/---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try {
    return parseYaml(m[1]) || null;
  } catch (err) {
    throw new Error(`YAML parse error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Discovery: find all .md entries with format: scrolly
// ---------------------------------------------------------------------------

async function findScrollyEntries() {
  const entries = [];
  if (!existsSync(CONTENT_DIR)) return entries;

  for (const file of await readdir(CONTENT_DIR)) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    const mdPath = join(CONTENT_DIR, file);
    const text = await readFile(mdPath, "utf8");
    const data = parseFrontmatter(text);
    if (!data) continue;
    if (data.format !== "scrolly") continue;
    if (!data.source || !data.baseUrl) {
      console.warn(`  [skip] ${slug}: format=scrolly but missing source or baseUrl`);
      continue;
    }
    // `source` is relative to the .md file's location (the content dir).
    // Each scrolly lives at content/datastory/<slug>/ as a sibling of its
    // .md entry.
    const sourceAbs = resolve(CONTENT_DIR, data.source);
    entries.push({
      slug,
      mdPath,
      source: data.source,
      sourceAbs,
      baseUrl: data.baseUrl,
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Per-entry build
// ---------------------------------------------------------------------------

function log(msg) {
  console.log(`[scrolly] ${msg}`);
}

function run(cmd, cwd) {
  log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

async function buildOne({ slug, source, sourceAbs, baseUrl }) {
  log(`${slug}`);
  log(`  source:  ${source}`);
  log(`  baseUrl: ${baseUrl}`);

  if (!existsSync(sourceAbs)) {
    throw new Error(`source dir not found: ${sourceAbs}`);
  }
  const pkgJson = join(sourceAbs, "package.json");
  if (!existsSync(pkgJson)) {
    throw new Error(`package.json not found in source dir: ${sourceAbs}`);
  }

  // 1. Install (skip if node_modules already exists)
  const nodeModules = join(sourceAbs, "node_modules");
  if (!existsSync(nodeModules)) {
    log(`  installing dependencies (${pkgCmd})...`);
    const installCmd = isBun ? `${pkgCmd} install --frozen-lockfile` : `${pkgCmd} install`;
    run(installCmd, sourceAbs);
  } else {
    log(`  node_modules exists, skipping install`);
  }

  // 2. Fetch data (the scrolly project's own `data` script pulls JSONs)
  log(`  fetching data...`);
  run(`${runScript} data`, sourceAbs);

  // 3. Build with --base override. Vite writes to <sourceAbs>/dist/ by default.
  log(`  building (vite --base=${baseUrl})...`);
  run(`${binCmd} vite build --base=${baseUrl}`, sourceAbs);

  // Verify dist/ exists and is a directory.
  const distDir = join(sourceAbs, "dist");
  if (!existsSync(distDir)) {
    throw new Error(`dist/ not found after build: ${distDir}`);
  }
  const distStat = await stat(distDir);
  if (!distStat.isDirectory()) {
    throw new Error(`dist/ is not a directory: ${distDir}`);
  }

  // Summarise what landed
  const files = await readdir(distDir);
  log(`  ${slug}/dist: ${files.length} entries`);
  for (const f of files) {
    const full = join(distDir, f);
    const s = await stat(full);
    if (s.isDirectory()) {
      const sub = await readdir(full);
      log(`    ${f}/ (${sub.length} entries)`);
    } else {
      log(`    ${f} (${(s.size / 1024).toFixed(1)} KB)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log(`scanning ${relative(ROOT, CONTENT_DIR)}...`);
  const entries = await findScrollyEntries();
  if (entries.length === 0) {
    log(`no scrolly entries found, nothing to build`);
    return;
  }
  log(`found ${entries.length} scrolly entr${entries.length === 1 ? "y" : "ies"}:`);
  for (const e of entries) {
    log(`  - ${e.slug} → ${e.baseUrl}`);
  }

  for (const entry of entries) {
    await buildOne(entry);
  }
  log(`done`);
}

main().catch((err) => {
  console.error(`[scrolly] BUILD FAILED: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
