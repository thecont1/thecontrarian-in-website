// components/footnote.js — in-line footnote popover for the scrolly.
//
// Usage:
//   1. In the article HTML, mark each footnote site:
//        <!-- Linked citation: URL inside; build-time fetches OG info -->
//        <sup class="fn-footnote">https://english.bmrc.co.in/ridership/</sup>
//
//        <!-- Pure footnote: text inside; popover shows the text -->
//        <sup class="fn-footnote">NammaMetro is a public transit system</sup>
//
//   2. In the same document, list citation metadata once (for URL
//      footnotes that need OG info):
//        <script type="application/json" id="article-citations">
//          { "https://english.bmrc.co.in/ridership/": { "og": {...} } }
//        </script>
//
//   3. Call setupFootnotes() once after the DOM is ready.
//
// The footnote trigger is a small button. Click opens a popover above
// the trigger — citation-style for URL footnotes (title, description,
// thumbnail, "View source" link), or simple text-style for plain
// footnotes (the text you wrote). Click outside or Escape closes.
// Keyboard accessible: button gets focus, Enter/Space toggles.
//
// Numbering is **continuous**: a module-level counter increments as
// each slot in document order is promoted. The first footnote in the
// document is "1", the second is "2", and so on — citations and
// pure notes are interleaved by their position in the article.
//
// Pure-text footnotes need no JSON entry — the text inside the <sup>
// is the entire data. URL footnotes need an entry in
// #article-citations (keyed by the URL itself) for the OG info; if
// the entry is missing, the popover still works but shows a minimal
// "View source →" link only. To re-fetch, delete the entry and the
// build-time script will repopulate it.

const activePopover = { current: null };
let footnoteCounter = 0;

function closeActive() {
  if (activePopover.current) {
    activePopover.current.remove();
    activePopover.current = null;
  }
}

function openPopover(trigger, footnote) {
  closeActive();
  const pop = document.createElement('div');
  pop.className = 'fn-popover';
  pop.setAttribute('role', 'tooltip');
  pop.innerHTML = renderFootnote(footnote);
  // Wrap the trigger so we can position the popover relative to it
  if (getComputedStyle(trigger).position === 'static') {
    trigger.style.position = 'relative';
  }
  trigger.appendChild(pop);
  activePopover.current = pop;
}

// Inline SVG used as the default thumbnail when a citation has no
// og.image. A simple document-with-lines icon, drawn in the brand
// purple so it reads as part of the scrolly's visual system.
const DEFAULT_THUMB_SVG = `
<svg class="fn-popover__thumb-svg" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
  <rect x="9" y="6" width="30" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
  <line x1="14" y1="15" x2="34" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  <line x1="14" y1="22" x2="34" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  <line x1="14" y1="29" x2="34" y2="29" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  <line x1="14" y1="36" x2="26" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  <path d="M30 6 L30 12 L39 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
</svg>
`;

/**
 * A footnote is one of two kinds:
 *
 *   { kind: 'cite', url, og? }   — a URL citation. Popover shows the
 *      cited page's OG title/desc/site and a "View source" link. The
 *      `og` object is optional; if absent, the popover shows a minimal
 *      view (just the URL, or the `title` field if provided).
 *
 *   { kind: 'note', text }       — a pure text footnote. Popover shows
 *      the text as a paragraph, no link, no thumbnail.
 */
function renderFootnote(footnote) {
  if (footnote.kind === 'note') {
    return `
      <div class="fn-popover__head">
        <h4 class="fn-popover__title">Footnote</h4>
      </div>
      <div class="fn-popover__body fn-popover__body--note">
        <p class="fn-popover__desc fn-popover__desc--note">${escapeHtml(footnote.text)}</p>
      </div>
    `;
  }

  // citation kind
  const og = footnote.og || {};
  const headline = escapeHtml(og.title || footnote.title || footnote.url);
  const desc = og.description
    ? `<p class="fn-popover__desc">${escapeHtml(og.description)}</p>`
    : (footnote.quote
        ? `<p class="fn-popover__desc">"${escapeHtml(footnote.quote)}"</p>`
        : '');
  const site = og.siteName
    ? `<span class="fn-popover__site">${escapeHtml(og.siteName)}</span>`
    : '';
  // The thumbnail is the visual hero of the citation card: a
  // centered image taking 90% of the box's content width.
  // `alt` is intentionally empty — the citation's title and
  // description already convey the source's content, and the
  // image is purely decorative (a visual cue for which
  // publication the citation comes from).
  const thumb = og.image
    ? `<div class="fn-popover__thumb-wrap"><img class="fn-popover__thumb" src="${escapeAttr(og.image)}" alt="" loading="lazy" /></div>`
    : `<div class="fn-popover__thumb-wrap"><div class="fn-popover__thumb fn-popover__thumb--default" role="img" aria-label="Citation thumbnail">${DEFAULT_THUMB_SVG}</div></div>`;
  return `
    <div class="fn-popover__head">
      <h4 class="fn-popover__title">${headline}</h4>
    </div>
    ${thumb}
    <div class="fn-popover__text">
      ${desc}
      <div class="fn-popover__foot">
        ${site}
        <a class="fn-popover__link" href="${escapeAttr(footnote.url)}" target="_blank" rel="noopener noreferrer">View source →</a>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

/**
 * Read the citation registry from the inline `<script
 * type="application/json" id="article-citations">` block in the
 * article HTML. Keys are the citation URLs themselves; values are
 * the OG metadata fetched at build time (plus optional `title` and
 * `quote` overrides). URLs not in the registry still produce a
 * working popover — just with no OG data.
 *
 * @returns {Record<string, { og?: { title?: string, description?: string, image?: string, siteName?: string }, title?: string, quote?: string }>}
 */
function readCitationRegistry() {
  const el = document.getElementById('article-citations');
  if (!el) return {};
  try {
    const parsed = JSON.parse(el.textContent || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('setupFootnotes: invalid JSON in #article-citations', e);
    return {};
  }
}

/**
 * Heuristic URL detection. Recognises http://, https://, and protocol-
 * relative //host URLs. Anything else is treated as plain-text
 * footnote content.
 */
function isUrl(s) {
  return /^(https?:\/\/|\/\/)/i.test(s.trim());
}

/**
 * Promote a <sup class="fn-footnote">text</sup> into a footnote
 * record, merging in any citation registry entry if the text is a URL.
 */
function resolveFootnote(slot, citationRegistry) {
  const raw = (slot.textContent || '').trim();
  if (isUrl(raw)) {
    const url = raw;
    const reg = citationRegistry[url] || {};
    return {
      kind: 'cite',
      url,
      title: reg.title,
      quote: reg.quote,
      og: reg.og,
    };
  }
  return { kind: 'note', text: raw };
}

/**
 * Wire up all <sup class="fn-footnote"> elements in the document.
 * Call once after the DOM is ready.
 *
 * Each <sup> is replaced by a focusable <button> showing its
 * number. The number is computed in document order, so the first
 * footnote in the document is "1", the second is "2", and so on —
 * citations and pure-text notes are interleaved by their position
 * in the article. Already-promoted slots (e.g. from a previous
 * `setupFootnotes` call) are skipped, so calling this function more
 * than once is safe.
 */
export function setupFootnotes() {
  const citationRegistry = readCitationRegistry();

  // Walk all fn-footnotes in document order. The `.fn-footnote`
  // selector matches the original <sup> tags only — once a slot is
  // promoted to a <button class="fn-trigger">, it's gone from this
  // list.
  const allSlots = Array.from(document.querySelectorAll('.fn-footnote'));

  for (const slot of allSlots) {
    const footnote = resolveFootnote(slot, citationRegistry);
    const isCite = footnote.kind === 'cite';
    const ariaLabel = isCite
      ? `Footnote ${footnoteCounter + 1}: ${footnote.og?.title || footnote.title || footnote.url}`
      : `Footnote ${footnoteCounter + 1}: ${footnote.text}`;

    footnoteCounter++;
    const number = footnoteCounter;

    // Promote the slot to a button for a11y
    const trigger = document.createElement('button');
    trigger.className = 'fn-trigger';
    trigger.setAttribute('type', 'button');
    trigger.setAttribute('aria-label', ariaLabel);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.textContent = String(number);
    if (isCite) trigger.setAttribute('data-fn-url', footnote.url);
    else trigger.setAttribute('data-fn-text', footnote.text);
    slot.replaceWith(trigger);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activePopover.current) {
        closeActive();
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        openPopover(trigger, footnote);
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  }

  // Click anywhere else closes the popover (only attach once).
  if (!setupFootnotes._globalHandlersAttached) {
    setupFootnotes._globalHandlersAttached = true;
    document.addEventListener('click', (e) => {
      if (activePopover.current && !activePopover.current.contains(e.target)) {
        closeActive();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activePopover.current) {
        closeActive();
      }
    });
  }
}
