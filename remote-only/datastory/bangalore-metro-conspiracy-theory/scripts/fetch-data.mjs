#!/usr/bin/env node
/**
 * fetch-data.mjs — fetch the scrolly JSONs from the public namma-metro-ridership-tracker repo.
 *
 * Source of truth: https://github.com/thecont1/namma-metro-ridership-tracker/tree/main/scrolly-article
 *
 * Usage: `npm run data`
 *
 * What it does:
 *   1. Downloads each JSON from the GitHub raw URL into public/data/
 *   2. Logs a summary of file sizes
 *   3. Exits non-zero if any file fails
 *
 * Why we don't ship JSONs in the repo: keeps the scrolly project lean and forces a
 * single source of truth (the user's notebook). When the notebook is re-run and pushed
 * to GitHub, this script picks up the changes.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(PROJECT_ROOT, 'public', 'data');

const BASE = 'https://raw.githubusercontent.com/thecont1/namma-metro-ridership-tracker/main/scrolly-article';

const FILES = [
  'daily-by-mode.json',
  'mode-shares.json',
  'significant-events.json',
  'anomalies.json',
  'stations.geojson',
  'hypothesis-window.json',
  'fare-hike-window.json',
];

async function fetchOne(filename) {
  const url = `${BASE}/${filename}`;
  const localPath = resolve(DATA_DIR, filename);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${filename}: HTTP ${res.status} ${res.statusText}`);
  const text = await res.text();
  await writeFile(localPath, text, 'utf8');
  return { filename, bytes: text.length };
}

async function main() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  console.log(`Fetching ${FILES.length} JSONs from ${BASE} ...\n`);
  const results = await Promise.allSettled(FILES.map(fetchOne));
  let failed = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { filename, bytes } = r.value;
      console.log(`  ✓ ${filename.padEnd(28)} ${(bytes / 1024).toFixed(1).padStart(8)} KB`);
    } else {
      failed += 1;
      console.log(`  ✗ ${r.reason.message}`);
    }
  }
  console.log();
  if (failed) {
    console.error(`FAILED: ${failed} file(s) did not download.`);
    process.exit(1);
  }
  console.log('Done. Vite can now serve /data/*.json.');
}

main();
