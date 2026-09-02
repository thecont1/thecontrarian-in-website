#!/usr/bin/env node
/**
 * Sync product data from the apps portfolio repo into this site.
 *
 * Reads thecont1.github.io/apps.csv and repo-meta.json, then:
 *  - copies each product screenshot into public/assets/products/<slug>.png
 *  - writes a content/code/<slug>.md entry for every product
 *  - writes an order into the frontmatter so the homepage lists products
 *    in the same order as the portfolio.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORTFOLIO_DIR = process.env.PORTFOLIO_DIR || join(ROOT, '..', 'thecont1.github.io');
const OUTPUT_IMG_DIR = join(ROOT, 'public', 'assets', 'products');
const OUTPUT_CODE_DIR = join(ROOT, 'content', 'code');

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: text, fields: {} };
  const raw = match[1];
  const body = match[2];
  const fields = {};
  let currentKey = '';
  let inArray = false;

  for (const line of raw.split(/\r?\n/)) {
    const arrayItem = line.match(/^\s+-\s+"?(.+?)"?\s*$/);
    const kv = line.match(/^(\w+):\s*(.*)$/);

    if (inArray && arrayItem) {
      if (Array.isArray(fields[currentKey])) {
        fields[currentKey].push(arrayItem[1]);
      }
      continue;
    }

    inArray = false;
    if (!kv) continue;
    const [, key, rawVal] = kv;
    currentKey = key;
    const val = rawVal.trim();

    if (val === '[]' || val === '') {
      fields[key] = [];
      inArray = true;
    } else if (val.startsWith('[') && val.endsWith(']')) {
      fields[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    } else {
      fields[key] = val.replace(/^"|"$/g, '');
    }
  }
  return { frontmatter: raw, body, fields };
}

function buildFrontmatter(fields) {
  const lines = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${k}: []`);
      } else {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`);
      }
    } else if (v === '') {
      lines.push(`${k}: ""`);
    } else if (typeof v === 'string' && (v.includes(':') || v.includes('#') || /[\s'"\[\],]/.test(v))) {
      lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  return lines.join('\n');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    if (row.some(v => v.trim() !== '')) rows.push(row);
  }
  const [header = [], ...body] = rows;
  const normalized = header.map(h => h.trim().toLowerCase());
  return body.map(values =>
    Object.fromEntries(normalized.map((key, i) => [key, (values[i] || '').trim()]))
  ).filter(app => app.app_name && app.repo_url);
}

function repoKeyFromUrl(url) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return null;
  return { owner: m[1], name: m[2] };
}

function slugFromRepoName(name) {
  return name.toLowerCase();
}

function main() {
  const appsPath = join(PORTFOLIO_DIR, 'apps.csv');
  const metaPath = join(PORTFOLIO_DIR, 'repo-meta.json');
  if (!existsSync(appsPath) || !existsSync(metaPath)) {
    console.warn(`[sync-products] Missing portfolio source files in ${PORTFOLIO_DIR}; skipping.`);
    console.warn('[sync-products] Set PORTFOLIO_DIR or run this from a workspace with thecont1.github.io checked out.');
    return;
  }

  const apps = parseCsv(readFileSync(appsPath, 'utf8'));
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));

  mkdirSync(OUTPUT_IMG_DIR, { recursive: true });
  mkdirSync(OUTPUT_CODE_DIR, { recursive: true });

  // Build a set of slugs we expect, so stale product files can be removed.
  const seenSlugs = new Set();

  for (const [index, app] of apps.entries()) {
    const repo = repoKeyFromUrl(app.repo_url);
    if (!repo) {
      console.warn(`[sync-products] Skipping ${app.app_name}: cannot parse repo URL ${app.repo_url}`);
      continue;
    }

    const slug = slugFromRepoName(repo.name);
    seenSlugs.add(slug);

    const repoMeta = meta[app.repo_url] || {};
    const description = repoMeta.description || app.app_name;
    const appUrl = repoMeta.homepage || '';
    const tags = Array.isArray(repoMeta.tech_stack) ? repoMeta.tech_stack.slice(0, 8) : [];
    const sourceImage = join(PORTFOLIO_DIR, 'assets', 'screenshots', app.image_filename || `${app.app_name}.png`);
    const imageFilename = `${slug}.png`;
    const targetImage = join(OUTPUT_IMG_DIR, imageFilename);

    if (existsSync(sourceImage)) {
      const buf = readFileSync(sourceImage);
      writeFileSync(targetImage, buf);
      console.log(`[sync-products] copied ${app.image_filename} -> ${targetImage}`);
    } else {
      console.warn(`[sync-products] screenshot missing for ${app.app_name}: ${sourceImage}`);
    }

    const codePath = join(OUTPUT_CODE_DIR, `${slug}.md`);
    let existing = { fields: {}, body: '' };
    if (existsSync(codePath)) {
      existing = parseFrontmatter(readFileSync(codePath, 'utf8'));
    }

    const fields = {
      status: 'published',
      title: app.app_name,
      description,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoEmail: existing.fields.repoEmail || 'ms@thecontrarian.in',
      author: existing.fields.author || 'Mahesh Shantaram',
      createdDate: existing.fields.createdDate || null,
      lastUpdated: existing.fields.lastUpdated || null,
      repoUrl: app.repo_url,
      readmeUrl: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/main/README.md`,
      branch: existing.fields.branch || 'main',
      appUrl,
      heroImage: `/assets/products/${imageFilename}`,
      tags,
      license: existing.fields.license || '',
      order: index,
    };

    const fm = buildFrontmatter(fields);
    writeFileSync(codePath, `---\n${fm}\n---\n${existing.body}`);
    console.log(`[sync-products] ${codePath}`);
  }

  // Remove stale code entries that no longer appear in the portfolio.
  for (const file of readdirSync(OUTPUT_CODE_DIR)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    if (!seenSlugs.has(slug)) {
      const stale = join(OUTPUT_CODE_DIR, file);
      const { fields } = parseFrontmatter(readFileSync(stale, 'utf8'));
      // Only remove auto-generated product entries (status published and from thecont1)
      if (fields.status === 'published' && fields.repoOwner === 'thecont1') {
        console.log(`[sync-products] removing stale entry ${stale}`);
        // Do not actually delete; just mark as private to avoid data loss.
        const body = readFileSync(stale, 'utf8').replace(/^status:.*$/m, 'status: private');
        writeFileSync(stale, body);
      }
    }
  }

  console.log('[sync-products] Done.');
}

main();
