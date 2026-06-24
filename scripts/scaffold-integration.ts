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
notebook:
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
title: ""
description: ""
author: ""
status: draft
repoOwner: "${GITHUB_OWNER}"
repoName: "${fileName}"
license: ""
createdDate: ${today()}
lastUpdated: ${today()}
tags: []
repoUrl: ""
repoEmail: ""
appUrl: ""
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

    // README (base64 decoded)
    let readmeBody = '';
    try {
      readmeBody = execSync(
        `gh api repos/${owner}/${repo}/readme --jq '.content' | base64 -d`,
        { encoding: 'utf8', maxBuffer: 1024 * 1024 }
      );
    } catch {}

    // File tree
    const branch = repoData.default_branch || 'main';
    let fileTree: string[] = [];
    const treeData = ghApi(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (treeData && treeData.tree) {
      fileTree = treeData.tree
        .filter((item: any) => item.type === 'blob')
        .map((item: any) => item.path);
    }

    // Merge: fill empty fields + always update authoritative ones
    if (!fields.title) fields.title = repoData.name || repo;
    if (!fields.description && repoData.description) fields.description = repoData.description;
    // Author + email: try repo endpoint first, fall back to user profile (cached)
    if (!fields.author || !fields.repoEmail) {
      const profile = ghUser(repoData.owner?.login);
      if (!fields.author) fields.author = repoData.owner?.name || profile?.name || '';
      if (!fields.repoEmail && profile?.email) fields.repoEmail = profile.email;
    }
    if (!fields.license && repoData.license?.spdx_id) fields.license = repoData.license.spdx_id;
    if (!fields.appUrl && repoData.homepage) fields.appUrl = repoData.homepage;
    if (!fields.createdDate && repoData.created_at) fields.createdDate = repoData.created_at.split('T')[0];
    if ((!fields.tags || fields.tags.length === 0) && repoData.topics?.length) {
      fields.tags = repoData.topics;
    }
    // Always update from GitHub (authoritative)
    if (repoData.pushed_at) fields.lastUpdated = repoData.pushed_at.split('T')[0];
    fields.repoUrl = `https://github.com/${owner}/${repo}`;
    // Ensure tags is always an array
    if (!Array.isArray(fields.tags)) fields.tags = [];
    // Always update fileTree
    if (fileTree.length > 0) fields.fileTree = fileTree;

    // Body: use README if body is empty
    const trimmedBody = body.trim();
    const newBody = (!trimmedBody && readmeBody) ? readmeBody : trimmedBody;

    // Write back
    const fm = buildFrontmatter(fields);
    fs.writeFileSync(filePath, `---\n${fm}\n---\n\n${newBody}\n`);

    fetchedRepos.set(filePath, repoKey);
    console.log(`[Scaffold] Enriched ${relativePath} from ${repoKey}`);
  } catch (err: any) {
    console.error(`[Scaffold] GitHub fetch failed for ${repoKey}: ${err.message}`);
  }
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
        }
      }
    }
  };
}
