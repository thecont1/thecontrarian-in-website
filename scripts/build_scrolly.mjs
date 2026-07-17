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

import { readFile, readdir, stat, writeFile } from "node:fs/promises";
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

let isBunAvailable = false;
try {
  execSync('bun --version', { stdio: 'ignore' });
  isBunAvailable = true;
} catch (_) {
  // bun not available
}
const pkgCmd = isBunAvailable ? "bun" : "npm";
const runScript = isBunAvailable ? "bun run" : "npm run";
const binCmd = isBunAvailable ? "bunx" : "npx";

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
      frontmatter: data,
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// HTML patching: replace hardcoded title/description/H1 with .md values.
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function patchScrollyHtml(distDir, fm, slug) {
  const indexHtml = join(distDir, "index.html");
  if (!existsSync(indexHtml)) {
    log(`  ${slug}: no dist/index.html, skipping HTML patch`);
    return;
  }
  const title = fm.title;
  const description = fm.metaDescription || fm.subtitle;
  if (!title) {
    throw new Error(`${slug}: .md frontmatter is missing 'title' — cannot patch scrolly HTML`);
  }
  let html = await readFile(indexHtml, "utf8");
  const before = html;

  // <title>...</title>
  if (/<title>[^<]*<\/title>/.test(html)) {
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(title)}</title>`,
    );
  } else {
    log(`  ${slug}: warn — no <title> tag found in dist/index.html`);
  }

  // <meta name="description" content="..." />
  if (description) {
    if (/<meta name="description" content="[^"]*" \/>/.test(html)) {
      html = html.replace(
        /<meta name="description" content="[^"]*" \/>/,
        `<meta name="description" content="${escapeHtml(description)}" />`,
      );
    } else if (/<meta name="description" content="[^"]*">/.test(html)) {
      // Some templates use the unclosed form.
      html = html.replace(
        /<meta name="description" content="[^"]*">/,
        `<meta name="description" content="${escapeHtml(description)}">`,
      );
    } else {
      log(`  ${slug}: warn — no <meta name="description"> found in dist/index.html`);
    }
  } else {
    log(`  ${slug}: warn — .md has no metaDescription or subtitle; keeping scrolly's default description`);
  }

  // <h1 class="title">...</h1> (the visible article title in the body)
  if (/<h1 class="title">[^<]*<\/h1>/.test(html)) {
    html = html.replace(
      /<h1 class="title">[^<]*<\/h1>/,
      `<h1 class="title">${escapeHtml(title)}</h1>`,
    );
  } else {
    log(`  ${slug}: warn — no <h1 class="title"> found in dist/index.html`);
  }

  if (html === before) {
    log(`  ${slug}: HTML patch no-op (nothing matched)`);
    return;
  }
  await writeFile(indexHtml, html, "utf8");
  log(`  ${slug}: patched <title>, <meta description>, <h1.title> from .md frontmatter`);
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

async function buildOne({ slug, source, sourceAbs, baseUrl, frontmatter }, opts = {}) {
  const { skipData = false, skipCitations = false, skipVite = false, patchOnly = false } = opts;
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
    const installCmd = isBunAvailable ? `${pkgCmd} install --frozen-lockfile` : `${pkgCmd} install`;
    run(installCmd, sourceAbs);
  } else {
    log(`  node_modules exists, skipping install`);
  }

  // 2. Fetch data (the scrolly project's own `data` script pulls
  //    JSONs from GitHub). Skipped when --skip-data or --patch-only
  //    is set, or when the local data files are already fresh
  //    (newer than the source's package.json or any source file).
  const dataDir = join(sourceAbs, "public", "data");
  const dataFiles = ["daily-by-mode.json", "mode-shares.json", "significant-events.json",
    "anomalies.json", "stations.geojson", "hypothesis-window.json", "fare-hike-window.json"];
  const dataIsFresh = await isDataFresh(sourceAbs, dataDir, dataFiles);
  if (skipData || patchOnly) {
    log(`  data: skipped (flag)`);
  } else if (dataIsFresh) {
    log(`  data: skipped (local JSONs are fresh; delete one to refetch)`);
  } else {
    log(`  fetching data...`);
    run(`${runScript} data`, sourceAbs);
  }

  // 2b. Fetch citation OG metadata. The fetch itself is idempotent
  //     (URLs already in #article-citations are not re-fetched), so
  //     even on a full run this is cheap. Skipped with
  //     --skip-citations or --patch-only.
  if (skipCitations || patchOnly) {
    log(`  citations: skipped (flag)`);
  } else {
    log(`  fetching citations...`);
    run(`${runScript} citations`, sourceAbs);
  }

  // 3. Build with --base override. Vite writes to <sourceAbs>/dist/
  //    by default. Skipped when --skip-vite or --patch-only is set
  //    (i.e. only the .md frontmatter changed, so we just need to
  //    re-patch the existing dist/).
  const distDir = join(sourceAbs, "dist");
  if (skipVite || patchOnly) {
    log(`  vite: skipped (flag)`);
    if (!existsSync(distDir)) {
      throw new Error(`--skip-vite set but no dist/ exists; run a full build first`);
    }
  } else {
    log(`  building (vite --base=${baseUrl})...`);
    run(`${binCmd} vite build --base=${baseUrl}`, sourceAbs);
  }

  // Verify dist/ exists and is a directory.
  if (!existsSync(distDir)) {
    throw new Error(`dist/ not found after build: ${distDir}`);
  }
  const distStat = await stat(distDir);
  if (!distStat.isDirectory()) {
    throw new Error(`dist/ is not a directory: ${distDir}`);
  }

  // 4. Patch the built HTML with the .md frontmatter so the article's
  // title and description are sourced from the .md (not hardcoded in
  // the scrolly's index.html). Replaces:
  //   - <title>...</title>
  //   - <meta name="description" content="..." />
  //   - <h1 class="title">...</h1>
  // The format NEVER appears anywhere (no "— A scrollytelling investigation"
  // suffix, no "Scrollytelling version." in the description). The .md
  // is the single source of truth.
  await patchScrollyHtml(distDir, frontmatter, slug);

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

/**
 * isDataFresh: returns true if all the expected data JSONs exist in
 * public/data/ AND are at least as new as the most recently changed
 * source file. This lets us skip the GitHub fetch on rebuilds where
 * the user only edited source files.
 */
async function isDataFresh(sourceAbs, dataDir, dataFiles) {
  if (!existsSync(dataDir)) return false;
  let oldestMtime = Infinity;
  for (const f of dataFiles) {
    const p = join(dataDir, f);
    if (!existsSync(p)) return false;
    const s = await stat(p);
    if (s.mtimeMs < oldestMtime) oldestMtime = s.mtimeMs;
  }
  // Compare against the most recently changed source file. We check
  // package.json + every src/** file. If any of them is newer than
  // the oldest data file, treat the data as stale.
  const pkg = join(sourceAbs, "package.json");
  if (existsSync(pkg)) {
    const s = await stat(pkg);
    if (s.mtimeMs > oldestMtime) return false;
  }
  const srcDir = join(sourceAbs, "src");
  if (existsSync(srcDir)) {
    const newest = await newestMtime(srcDir);
    if (newest > oldestMtime) return false;
  }
  return true;
}

async function newestMtime(dir) {
  const { readdir, stat } = await import("node:fs/promises");
  let newest = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = await readdir(cur, { withFileTypes: true }); }
    catch { continue; }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
      const p = join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else {
        const s = await stat(p);
        if (s.mtimeMs > newest) newest = s.mtimeMs;
      }
    }
  }
  return newest;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // CLI flags for granular skipping. The chokidar watcher fires
  // rebuilds on every save; full data + citation + vite-build is
  // wasteful when the user only edited a .md or a CSS file. The
  // flags let scaffold-integration.ts (or the user) call us with
  // exactly the work that needs doing.
  const args = new Set(process.argv.slice(2));
  const skipData = args.has("--skip-data");
  const skipCitations = args.has("--skip-citations");
  const skipVite = args.has("--skip-vite");
  const patchOnly = args.has("--patch-only");  // implies all of the above

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
  if (patchOnly) {
    log(`flags: --patch-only (skip data, citations, vite build)`);
  } else {
    const flags = [];
    if (skipData) flags.push("--skip-data");
    if (skipCitations) flags.push("--skip-citations");
    if (skipVite) flags.push("--skip-vite");
    if (flags.length) log(`flags: ${flags.join(" ")}`);
  }

  for (const entry of entries) {
    await buildOne(entry, { skipData, skipCitations, skipVite, patchOnly });
  }
  log(`done`);
}

main().catch((err) => {
  console.error(`[scrolly] BUILD FAILED: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
