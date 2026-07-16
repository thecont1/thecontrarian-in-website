import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../content');

const AUTHOR = "Vikram Nair";

function today() {
  return new Date().toISOString().split('T')[0];
}

/* ── Frontmatter parser (no deps) ────────────────────────────────────── */

interface ParseResult {
  raw: string;           // full file content
  frontmatter: string;   // text between --- markers
  body: string;          // everything after closing ---
  fields: Record<string, any>;
}

function parseFrontmatter(content: string): ParseResult {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { raw: content, frontmatter: '', body: content, fields: {} };

  const fmText = match[1];
  const body = match[2];
  const fields: Record<string, any> = {};

  let currentKey = '';
  let inArray = false;

  for (const line of fmText.split('\n')) {
    const arrayItem = line.match(/^\s+-\s+"?(.+?)"?\s*$/);
    const kv = line.match(/^(\w+):\s*(.*)$/);

    if (inArray && arrayItem) {
      if (Array.isArray(fields[currentKey])) fields[currentKey].push(arrayItem[1]);
      continue;
    }

    inArray = false;
    if (!kv) continue;

    const [, key, rawVal] = kv;
    currentKey = key;
    const val = rawVal.trim();

    if (val === '[]') {
      fields[key] = [];
      inArray = true;
    } else if (val === '') {
      fields[key] = [];
      inArray = true;
    } else if (val.startsWith('[') && val.endsWith(']')) {
      fields[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    } else {
      fields[key] = val.replace(/^"|"$/g, '');
    }
  }

  return { raw: content, frontmatter: fmText, body, fields };
}

function buildFrontmatter(fields: Record<string, any>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;                    // skip null/undefined
    if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${k}: []`);
      } else {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - "${item}"`);
      }
    } else if (v === '') {
      lines.push(`${k}: ""`);
    } else if (typeof v === 'string' && (v.includes(':') || v.includes('#'))) {
      lines.push(`${k}: "${v}"`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  return lines.join('\n');
}

/* ── Templates ───────────────────────────────────────────────────────── */

const TEMPLATES: Record<string, () => string> = {
  post: () => `---
title: ""
subtitle: ""
author: "${AUTHOR}"
status: draft
date: ${today()}
heroImage: ""
metaDescription: ""
geography: []
theme: []
---
`,

  essay: () => `---
title: ""
subtitle: ""
author: "${AUTHOR}"
status: draft
date: ${today()}
heroImage: ""
metaDescription: ""
geography: []
theme: []
toc: false
readingTime: 5
lightbox:
  gallery: true
---
`,

  longform: () => `---
title: ""
subtitle: ""
author: "${AUTHOR}"
status: draft
date: ${today()}
heroImage: ""
metaDescription: ""
geography: []
theme: []
toc: false
currentPart: 1
totalParts: 1
parts:
  - title: ""
    slug: ""
lightbox:
  gallery: true
---
`,

  datastory: () => `---
title: ""
subtitle: ""
author: "${AUTHOR}"
status: draft
date: ${today()}
heroImage: ""
metaDescription: ""
geography: []
theme: []
toc: false
format: notebook
engine: jupyter
entry: ""
excludeCodeCells: false
lightbox:
  gallery: true
---
`,

  photogallery: () => `---
title: ""
subtitle: ""
author: "${AUTHOR}"
status: draft
date: ${today()}
heroImage: ""
metaDescription: ""
geography: []
theme: []
layoutType: tile
images: []
lightbox:
  gallery: true
---
`,

  project: () => `---
title: ""
subtitle: ""
author: "${AUTHOR}"
status: draft
date: ${today()}
heroImage: ""
geography: []
theme: []
photogalleries: []
essays: []
longforms: []
posts: []
datastories: []
code: []
---
`,
};

/* ── Scaffold: populate empty files ──────────────────────────────────── */

const GITHUB_OWNER = "thecont1";

function scaffoldFile(filePath: string) {
  const ext = path.extname(filePath);
  if (ext !== '.md' && ext !== '.mdx') return;

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.trim().length > 0) return;

  const relativePath = path.relative(CONTENT_DIR, filePath);
  const collectionName = relativePath.split(path.sep)[0];
  const fileName = path.basename(filePath, ext);

  if (collectionName === 'code') {
    // Code template: pre-fill repoOwner and repoName from filename
    const template = `---
status: draft
title: ""
description: ""
repoOwner: "${GITHUB_OWNER}"
repoName: "${fileName}"
repoEmail: ""
author: ""
createdDate: ${today()}
lastUpdated: ${today()}
repoUrl: ""
readmeUrl: ""
branch: main
appUrl: ""
tags: []
license: ""
---
`;
    console.log(`[Scaffold] Populating code: ${relativePath} (thecont1/${fileName})`);
    fs.writeFileSync(filePath, template);
    // Immediately enrich from GitHub (single-step)
    setTimeout(() => enrichCodeFile(filePath), 200);
    return;
  }

  const templateFn = TEMPLATES[collectionName];
  if (templateFn) {
    console.log(`[Scaffold] Populating ${collectionName}: ${relativePath}`);
    fs.writeFileSync(filePath, templateFn());
  } else {
    console.warn(`[Scaffold] No template for collection "${collectionName}", skipping.`);
  }
}

/* ── GitHub enrichment for code collection ───────────────────────────── */

function ghApi(endpoint: string): any {
  try {
    const out = execSync(`gh api "${endpoint}"`, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    return JSON.parse(out);
  } catch { return null; }
}

// Cache user profiles to avoid repeated calls for the same owner
const userCache = new Map<string, any>();
function ghUser(login: string): any {
  if (userCache.has(login)) return userCache.get(login);
  const profile = ghApi(`/users/${login}`);
  userCache.set(login, profile);
  return profile;
}

// Track what we last fetched per file to avoid redundant requests
const fetchedRepos = new Map<string, string>(); // filePath → "owner/repo"

async function enrichCodeFile(filePath: string) {
  const ext = path.extname(filePath);
  if (ext !== '.md' && ext !== '.mdx') return;

  const relativePath = path.relative(CONTENT_DIR, filePath);
  const collectionName = relativePath.split(path.sep)[0];
  if (collectionName !== 'code') return;

  const content = fs.readFileSync(filePath, 'utf8');
  const { fields, body } = parseFrontmatter(content);

  const owner = fields.repoOwner;
  const repo = fields.repoName;
  if (!owner || !repo) return;

  const repoKey = `${owner}/${repo}`;
  if (fetchedRepos.get(filePath) === repoKey) return;

  console.log(`[Scaffold] Fetching GitHub data for ${repoKey}...`);
  try {
    // Repo metadata
    const repoData = ghApi(`/repos/${owner}/${repo}`);
    if (!repoData) {
      console.log(`[Scaffold] GitHub repo ${repoKey} not found, skipping.`);
      return;
    }

    const branch = repoData.default_branch || 'main';

    // Author + email: try repo endpoint first, fall back to user profile (cached)
    let authorName = fields.author;
    let repoEmail = fields.repoEmail;
    if (!authorName || !repoEmail) {
      const profile = ghUser(repoData.owner?.login);
      if (!authorName) authorName = repoData.owner?.name || profile?.name || '';
      if (!repoEmail && profile?.email) repoEmail = profile.email;
    }

    // Determine the README.md URL from the repo root (Code.astro renders it via FlatWrite)
    const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;

    // Ensure tags is always an array
    const tags = Array.isArray(fields.tags) ? fields.tags : [];
    if (tags.length === 0 && repoData.topics?.length) {
      tags.push(...repoData.topics);
    }

    // Build frontmatter in schema order, preserving user values and filling from GitHub
    const newFields: Record<string, any> = {
      status: fields.status || 'draft',
      title: fields.title || repoData.name || repo,
      description: fields.description || repoData.description || '',
      repoOwner: owner,
      repoName: repo,
      repoEmail: repoEmail || '',
      author: authorName || '',
      createdDate: fields.createdDate || repoData.created_at?.split('T')[0] || '',
      lastUpdated: repoData.pushed_at?.split('T')[0] || fields.lastUpdated || '',
      repoUrl: `https://github.com/${owner}/${repo}`,
      readmeUrl: readmeUrl || '',
      branch: fields.branch || branch,
      appUrl: fields.appUrl || repoData.homepage || '',
      heroImage: fields.heroImage || '',
      tags,
      license: fields.license || repoData.license?.spdx_id || '',
    };

    // Write back
    const fm = buildFrontmatter(newFields);
    fs.writeFileSync(filePath, `---\n${fm}\n---\n${body}`);

    fetchedRepos.set(filePath, repoKey);
    console.log(`[Scaffold] Enriched ${relativePath} from ${repoKey}`);
  } catch (err: any) {
    console.error(`[Scaffold] GitHub fetch failed for ${repoKey}: ${err.message}`);
  }
}

/* ── Scrolly: discovery ─────────────────────────────────────────────── */

const DATASTORY_DIR = path.resolve(__dirname, '../content/datastory');

interface ScrollyEntry {
  slug: string;
  /** Path to the scrolly's Vite project, resolved against the .md entry's location (content/datastory/). */
  sourceDir: string;
  /** Public URL prefix under which the scrolly is served, e.g. "/datastory/bangalore-metro-conspiracy-theory/". */
  baseUrl: string;
}

function findScrollyEntries(): ScrollyEntry[] {
  const entries: ScrollyEntry[] = [];
  if (!fs.existsSync(DATASTORY_DIR)) return entries;
  for (const file of fs.readdirSync(DATASTORY_DIR)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    const { fields } = parseFrontmatter(
      fs.readFileSync(path.join(DATASTORY_DIR, file), 'utf8'),
    );
    if (fields.format !== 'scrolly') continue;
    if (typeof fields.source !== 'string' || typeof fields.baseUrl !== 'string') continue;
    const sourceDir = path.resolve(DATASTORY_DIR, fields.source);
    entries.push({ slug, sourceDir, baseUrl: fields.baseUrl });
  }
  return entries;
}

function findScrollySourceDirs(): string[] {
  return findScrollyEntries().map((e) => e.sourceDir);
}

function rebuildScrolly(reason: string) {
  console.log(`[Scrolly] ${reason} → rebuilding…`);
  try {
    execSync('node scripts/build_scrolly.mjs', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log('[Scrolly] rebuild done. Refresh the page.');
  } catch (err: any) {
    console.error(`[Scrolly] rebuild failed: ${err.message}`);
  }
}

function setupScrollyWatcher() {
  const sourceDirs = findScrollySourceDirs();
  if (sourceDirs.length === 0) return;

  console.log(`[Scrolly] Watching ${sourceDirs.length} scrolly source dir${sourceDirs.length === 1 ? '' : 's'}:`);
  for (const d of sourceDirs) {
    console.log(`  - ${path.relative(path.resolve(__dirname, '..'), d)}`);
  }

  // Debounce: collapse rapid bursts of file changes (e.g. Vite rebuilding
  // its own deps) into a single rebuild.
  let pending: NodeJS.Timeout | null = null;
  const triggerRebuild = (reason: string) => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      pending = null;
      rebuildScrolly(reason);
    }, 200);
  };

  for (const srcDir of sourceDirs) {
    if (!fs.existsSync(srcDir)) continue;
    const w = chokidar.watch(srcDir, {
      ignored: [
        /(^|[\\/\\])\../,        // dotfiles
        /[\\/]node_modules[\\/]/, // dep installs
        /[\\/]dist[\\/]/,         // build output
        /[\\/]public[\\/]data[\\/].*\.json$/, // fetched JSONs (regenerated by `data` step)
      ],
      persistent: true,
      ignoreInitial: true,
    });
    w.on('change', (p) => triggerRebuild(`changed: ${path.relative(srcDir, p)}`));
    w.on('add', (p) => triggerRebuild(`added: ${path.relative(srcDir, p)}`));
    w.on('unlink', (p) => triggerRebuild(`removed: ${path.relative(srcDir, p)}`));
  }
}

/* ── Scrolly: post-build asset copy ────────────────────────────────────
 *
 * After Astro's static build writes the route Response to
 * dist/datastory/<slug>/index.html, copy the scrolly's bundled
 * assets/ and data/ from <source>/dist/ into dist/datastory/<slug>/
 * so the deployed HTML's relative asset URLs resolve correctly.
 *
 * The route itself (src/pages/datastory/[...slug].astro) reads
 * <source>/dist/index.html and returns it as the Response. Astro
 * writes the Response body to dist/datastory/<slug>/index.html.
 * We only handle the auxiliary files here.
 * --------------------------------------------------------------------- */

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function copyScrollyAssets(distDir: string, logger: { info: (msg: string) => void }) {
  const entries = findScrollyEntries();
  if (entries.length === 0) return;
  for (const e of entries) {
    const scrollyDist = path.join(e.sourceDir, 'dist');
    if (!fs.existsSync(scrollyDist)) {
      logger.info(`[Scrolly] ${e.slug}: no dist/ found, skipping asset copy (build_scrolly.mjs may not have run)`);
      continue;
    }
    // Copy assets/ and data/ (the bundled JS/CSS chunks and fetched JSONs).
    // The index.html itself is provided by the route's Response — do not
    // overwrite it.
    for (const subdir of ['assets', 'data']) {
      const srcSub = path.join(scrollyDist, subdir);
      if (!fs.existsSync(srcSub)) continue;
      const destSub = path.join(distDir, e.baseUrl.replace(/^\/+/, ''), subdir);
      copyDirSync(srcSub, destSub);
      logger.info(`[Scrolly] ${e.slug}: copied ${subdir}/ → ${path.relative(distDir, destSub)}/`);
    }
  }
}

/* ── Scrolly: dev middleware ───────────────────────────────────────────
 *
 * In dev, the route serves the scrolly's index.html as a Response.
 * But the bundled assets (assets/, data/) live on disk inside
 * <source>/dist/, not in the Astro public/. The dev server normally
 * only serves static files from public/ — so we register a Vite
 * middleware that intercepts requests to /<baseUrl>/<subdir>/<file>
 * and streams the file from <source>/dist/<subdir>/<file>.
 *
 * The middleware is only registered for slugs that have a built
 * dist/ on disk. Files that don't exist fall through to the next
 * handler (Astro's 404).
 * --------------------------------------------------------------------- */

const MIME: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function setupScrollyMiddleware(server: any) {
  const entries = findScrollyEntries().filter((e) =>
    fs.existsSync(path.join(e.sourceDir, 'dist', 'index.html')),
  );
  if (entries.length === 0) return;

  console.log(`[Scrolly] Dev middleware: ${entries.length} scrolly entr${entries.length === 1 ? 'y' : 'ies'}`);

  server.middlewares.use((req: any, res: any, next: any) => {
    const url = req.url || '';
    for (const e of entries) {
      // baseUrl like "/datastory/bangalore-metro-conspiracy-theory/". Strip
      // trailing slash for the prefix match.
      const prefix = e.baseUrl.replace(/\/+$/, '');
      if (!url.startsWith(prefix + '/')) continue;
      // Skip the index.html path itself — that's handled by the route.
      const remainder = url.slice(prefix.length + 1).split('?')[0];
      if (!remainder || remainder === 'index.html') continue;
      // The scrolly's dist/ has the same internal structure (assets/, data/).
      const filePath = path.join(e.sourceDir, 'dist', remainder);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue;
      const ext = path.extname(filePath).toLowerCase();
      res.statusCode = 200;
      res.setHeader('content-type', MIME[ext] || 'application/octet-stream');
      res.setHeader('cache-control', 'no-cache');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    next();
  });
}

/* ── Integration entry point ─────────────────────────────────────────── */

export default function scaffoldIntegration() {
  return {
    name: 'astro-auto-scaffold',
    hooks: {
      'astro:config:setup': ({ command }: { command: string }) => {
        if (command === 'dev') {
          console.log('[Scaffold] Content watcher active.');
          const watcher = chokidar.watch(CONTENT_DIR, {
            ignored: /(^|[\\/\\])\../,
            persistent: true,
            ignoreInitial: true,
          });

          // New empty file → populate template
          watcher.on('add', (filePath) => {
            setTimeout(() => scaffoldFile(filePath), 150);
          });

          // File changed → if code collection with repoOwner/repoName, fetch GitHub data
          watcher.on('change', (filePath) => {
            setTimeout(() => enrichCodeFile(filePath), 300);
          });

          // Scrolly: watch each scrolly source dir and rebuild on change
          setupScrollyWatcher();
        }
      },
      'astro:server:setup': ({ server }: { server: any }) => {
        // Scrolly: serve bundled assets from <source>/dist/ in dev mode
        // (the route serves the index.html; the middleware serves the
        // /assets/ and /data/ subpaths that the HTML references).
        setupScrollyMiddleware(server);
      },
      'astro:build:done': async ({ dir, logger }: { dir: URL; logger: any }) => {
        const distDir = fileURLToPath(dir);
        logger.info(`[Scrolly] Copying bundled assets to ${path.relative(process.cwd(), distDir)}/...`);
        copyScrollyAssets(distDir, logger);
      },
    }
  };
}
