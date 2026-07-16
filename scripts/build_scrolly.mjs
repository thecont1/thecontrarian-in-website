#!/usr/bin/env node
/**
 * build_scrolly.mjs — Build script for `format: scrolly` datastory entries.
 *
 * Walks content/datastory/*.md, finds entries with `format: scrolly` and a
 * `scrolly: { source, baseUrl }` block, and for each:
 *   1. Resolves the source directory (relative to the Astro project root).
 *   2. Installs dependencies (skips if node_modules already exists).
 *   3. Runs `data` (fetches JSONs from GitHub into the scrolly's public/data/).
 *   4. Runs `vite build --base=<baseUrl>` (overrides the scrolly's own
 *      vite.config.js `base` so the bundled asset URLs match the deployment URL).
 *   5. Copies dist/* to public/<baseUrl>/. Astro's build then copies these
 *      into dist/ during `astro build`, and they get served at /<baseUrl>/*.
 *
 * Wired into the `prebuild` step of package.json, so `npm run build` /
 * `bun run build` produces the scrolly outputs as part of the Astro build.
 *
 * The `format` field NEVER appears in the public URL, title, or any
 * public-facing artifact — the slug in the .md file is the URL slug, and
 * "scrolly" only appears here in this internal script.
 */

import { readFile, readdir, rm, mkdir, cp, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { load as parseYaml } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content", "datastory");
const PUBLIC_DIR = join(ROOT, "public");

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
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
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
    const text = await readFile(join(CONTENT_DIR, file), "utf8");
    const data = parseFrontmatter(text);
    if (!data) continue;
    if (data.format !== "scrolly") continue;
    if (!data.source || !data.baseUrl) {
      console.warn(`  [skip] ${slug}: format=scrolly but missing source or baseUrl`);
      continue;
    }
    entries.push({
      slug,
      source: data.source,
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

async function buildOne({ slug, source, baseUrl }) {
  const srcDir = resolve(ROOT, source);
  const targetDir = join(PUBLIC_DIR, baseUrl);

  log(`${slug}`);
  log(`  source:  ${source}`);
  log(`  baseUrl: ${baseUrl}`);

  if (!existsSync(srcDir)) {
    throw new Error(`source dir not found: ${srcDir}`);
  }
  const pkgJson = join(srcDir, "package.json");
  if (!existsSync(pkgJson)) {
    throw new Error(`package.json not found in source dir: ${srcDir}`);
  }

  // 1. Install (skip if node_modules already exists)
  const nodeModules = join(srcDir, "node_modules");
  if (!existsSync(nodeModules)) {
    log(`  installing dependencies (${pkgCmd})...`);
    const installCmd = isBun ? `${pkgCmd} install --frozen-lockfile` : `${pkgCmd} install`;
    run(installCmd, srcDir);
  } else {
    log(`  node_modules exists, skipping install`);
  }

  // 2. Fetch data (the scrolly project's own `data` script pulls JSONs)
  log(`  fetching data...`);
  run(`${runScript} data`, srcDir);

  // 3. Build with --base override
  log(`  building (vite --base=${baseUrl})...`);
  run(`${binCmd} vite build --base=${baseUrl}`, srcDir);

  // 4. Copy dist/* to public/<baseUrl>/
  const distDir = join(srcDir, "dist");
  if (!existsSync(distDir)) {
    throw new Error(`dist/ not found after build: ${distDir}`);
  }
  const distStat = await stat(distDir);
  if (!distStat.isDirectory()) {
    throw new Error(`dist/ is not a directory: ${distDir}`);
  }

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(distDir, targetDir, { recursive: true });

  // Summarise what landed
  const files = await readdir(targetDir);
  log(`  copied ${files.length} entries to public${baseUrl}`);
  for (const f of files) {
    const full = join(targetDir, f);
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
