#!/usr/bin/env bun
// scripts/fetch_citations.mjs — walk index.html for URL footnotes,
// fetch missing OG metadata, write it into the #article-citations
// JSON block.
//
// Idempotent: re-running won't re-fetch URLs that already have an
// entry. To re-fetch (e.g. if a page's OG data changed), delete the
// entry from the JSON block and run again.
//
// Network-dependent: requires internet access to fetch each URL.
// Use --dry-run to list URLs that would be fetched without actually
// fetching them.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
const INDEX = join(ROOT, "index.html");

const FN_FOOTNOTE_RE = /<sup class="fn-footnote">([^<]+)<\/sup>/g;
const URL_RE = /^(https?:\/\/|\/\/)/i;

const log = (...args) => console.log("[citations]", ...args);

/**
 * Read index.html and extract:
 *   - all URL footnotes (in document order)
 *   - the existing #article-citations JSON block (if any)
 */
function parse(html) {
  const urls = [];
  let match;
  while ((match = FN_FOOTNOTE_RE.exec(html)) !== null) {
    const text = match[1].trim();
    if (URL_RE.test(text)) urls.push(text);
  }
  // Find all existing citation blocks (defensive — there should be
  // one, but we merge entries from all of them in case of duplicates).
  const globalBlockRe = /<script type="application\/json" id="article-citations">([\s\S]*?)<\/script>/g;
  const allBlocks = [...html.matchAll(globalBlockRe)];
  let registry = {};
  for (const m of allBlocks) {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed && typeof parsed === "object") {
        registry = { ...registry, ...parsed };
      }
    } catch (e) {
      log(`warning: invalid JSON in #article-citations block, ignoring`);
    }
  }
  if (allBlocks.length > 1) {
    log(`warning: found ${allBlocks.length} #article-citations blocks, will collapse to one`);
  }
  return { urls, registry, jsonMatch: allBlocks[0] || null };
}

/**
 * Fetch a URL and extract its OpenGraph metadata. Falls back to
 * <title> and <meta name="description"> if OG tags aren't present.
 * Returns null on network/parse failure.
 */
async function fetchOG(url) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; thecontrarian.in-citation-fetcher/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      log(`  ! ${res.status} ${url}`);
      return null;
    }
    const html = await res.text();

    const get = (re) => {
      const m = html.match(re);
      return m ? m[1].trim() : undefined;
    };

    // OG tags win; meta name="description" and <title> are fallbacks.
    const og = {
      title: get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
        || get(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i),
      description: get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
        || get(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
        || get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || get(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i),
      image: get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || get(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i),
      siteName: get(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
        || get(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i),
    };
    // Clean undefined fields
    for (const k of Object.keys(og)) if (!og[k]) delete og[k];
    return Object.keys(og).length ? { og } : null;
  } catch (e) {
    log(`  ! fetch failed: ${url} (${e.message})`);
    return null;
  }
}

function rewriteBlock(html, jsonMatch, registry) {
  const json = JSON.stringify(registry, null, 2);
  // Block format: 4-space-indented opening <script>, JSON body,
  // 4-space-indented closing </script>. The whole block sits inside
  // the <body> with 4 spaces of indent, like the rest of the body
  // content.
  const newBlock = `    <script type="application/json" id="article-citations">\n${json}\n    </script>`;
  // Strip ALL existing blocks (defensive — there should only be one,
  // but past runs have accidentally appended duplicates).
  const globalBlockRe = /[ \t]*<script type="application\/json" id="article-citations">[\s\S]*?<\/script>\n?/g;
  const stripped = html.replace(globalBlockRe, "");
  // Insert the fresh block just before </body>.
  return stripped.replace(
    /<\/body>/,
    `  ${newBlock}\n  </body>`,
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");

  const html = await readFile(INDEX, "utf8");
  const { urls, registry, jsonMatch } = parse(html);

  // Dedupe URLs in document order
  const seen = new Set();
  const orderedUrls = [];
  for (const u of urls) {
    if (!seen.has(u)) {
      seen.add(u);
      orderedUrls.push(u);
    }
  }
  log(`found ${urls.length} URL footnotes (${orderedUrls.length} unique)`);

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const url of orderedUrls) {
    if (registry[url] && !force) {
      skipped++;
      continue;
    }
    if (dryRun) {
      log(`  - would fetch: ${url}`);
      continue;
    }
    log(`fetching: ${url}`);
    const data = await fetchOG(url);
    if (data) {
      registry[url] = data;
      fetched++;
    } else {
      failed++;
    }
  }

  if (dryRun) {
    log(`dry run: ${skipped} cached, ${orderedUrls.length - skipped} to fetch`);
    return;
  }

  if (fetched > 0 || failed > 0) {
    await writeFile(INDEX, rewriteBlock(html, jsonMatch, registry), "utf8");
    log(`wrote ${fetched} new entries${failed ? `, ${failed} failed` : ""} to #article-citations`);
  } else {
    log("no changes — all URLs already in registry");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
