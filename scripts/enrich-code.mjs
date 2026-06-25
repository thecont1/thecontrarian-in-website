#!/usr/bin/env node
/**
 * Enrich code content entries from GitHub before Astro build.
 * Run via: node scripts/enrich-code.mjs
 *
 * Uses `gh api` for all GitHub calls — handles auth automatically.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CONTENT_DIR = join(__dirname, '../content');
const CODE_DIR = join(CONTENT_DIR, 'code');
const GITHUB_OWNER = 'thecont1';

/* ── GitHub API via gh CLI ───────────────────────────────────────────── */

function ghApi(endpoint) {
  try {
    const out = execSync(`gh api "${endpoint}"`, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function ghGetRaw(endpoint) {
  try {
    return execSync(`gh api "${endpoint}" --jq '.content'`, { encoding: 'utf8', maxBuffer: 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

// Cache user profiles to avoid repeated calls for the same owner
const userCache = new Map();
function ghUser(login) {
  if (userCache.has(login)) return userCache.get(login);
  const profile = ghApi(`/users/${login}`);
  userCache.set(login, profile);
  return profile;
}

/* ── Frontmatter parser ──────────────────────────────────────────────── */

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { raw: content, frontmatter: '', body: content, fields: {} };

  const fmText = match[1];
  const body = match[2];
  const fields = {};

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

function buildFrontmatter(fields) {
  const lines = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;
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

/* ── GitHub enrichment ───────────────────────────────────────────────── */

async function enrichCodeFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const { fields, body } = parseFrontmatter(content);

  const owner = fields.repoOwner || GITHUB_OWNER;
  const repo = fields.repoName || basename(filePath, extname(filePath));
  if (!repo) return;

  const repoKey = `${owner}/${repo}`;
  console.log(`[Enrich] Fetching ${repoKey}...`);

  try {
    const repoData = ghApi(`/repos/${owner}/${repo}`);
    if (!repoData) {
      console.log(`[Enrich] ${repoKey} not found, skipping.`);
      return;
    }

    // Authoritative branch from GitHub (single source of truth)
    fields.branch = repoData.default_branch || 'main';

    // Author + email: try repo endpoint first, fall back to user profile (cached)
    let authorName = fields.author;
    let repoEmail = fields.repoEmail;
    if (!authorName || !repoEmail) {
      const profile = ghUser(repoData.owner?.login);
      if (!authorName) authorName = repoData.owner?.name || profile?.name || '';
      if (!repoEmail && profile?.email) repoEmail = profile.email;
    }

    // Determine the README.md URL from the repo root
    const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${fields.branch}/README.md`;

    // Ensure tags is always an array
    const tags = Array.isArray(fields.tags) ? fields.tags : [];
    if (tags.length === 0 && repoData.topics?.length) {
      tags.push(...repoData.topics);
    }

    // Build frontmatter in schema order, preserving user values and filling from GitHub
    const newFields = {
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
      branch: fields.branch || repoData.default_branch || 'main',
      appUrl: fields.appUrl || repoData.homepage || '',
      heroImage: fields.heroImage || '',
      tags,
      license: fields.license || repoData.license?.spdx_id || '',
    };

    // Write frontmatter + preserved body
    const fm = buildFrontmatter(newFields);
    writeFileSync(filePath, `---\n${fm}\n---\n${body}`);
    console.log(`[Enrich] ✓ ${relative(CONTENT_DIR, filePath)} from ${repoKey}`);
  } catch (err) {
    console.error(`[Enrich] ✗ ${repoKey}: ${err.message}`);
  }
}

/* ── Main ────────────────────────────────────────────────────────────── */

async function main() {
  if (!existsSync(CODE_DIR)) {
    console.log('[Enrich] No code/ directory, skipping.');
    return;
  }

  const files = readdirSync(CODE_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .map(f => join(CODE_DIR, f));

  if (files.length === 0) {
    console.log('[Enrich] No code entries found.');
    return;
  }

  console.log(`[Enrich] Processing ${files.length} code entries...`);
  for (const file of files) {
    await enrichCodeFile(file);
  }
  console.log('[Enrich] Done.');
}

main();
