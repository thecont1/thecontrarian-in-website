// components/footnote.js — in-line footnote popover for the scrolly.
//
// Usage:
//   <sup class="fn-slot" data-fn-id="bmrcl-data"></sup>
//   wireFootnotes({ bmrcl-data: { title, url, quote?, og? } })
//
// The footnote trigger is a small button. Click opens a popover above the
// trigger with the citation. Click outside or Escape closes it. Keyboard
// accessible: button gets focus, Enter/Space toggles, Escape closes.
//
// Numbering is **continuous across chapters**: a module-level counter
// keeps ticking as each chapter's `wireFootnotes` is called, so the
// first footnote in the document is "1", the second is "2", and so on.
// Chapters are mounted lazily top-to-bottom via IntersectionObserver, so
// in practice the counter increments in DOM order. If a user scrolls
// fast enough to mount a later chapter before an earlier one, the
// counter still ends up correct (each fn-slot in the DOM is processed
// exactly once, in document order, against the footnotes dict of the
// chapter currently being mounted).

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

// Inline SVG used as the default thumbnail when a footnote has no
// og.image. A simple document-with-lines icon. Drawn in the brand
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

function renderFootnote(footnote) {
  const og = footnote.og || {};
  // Prefer og.title if present and different from the headline.
  const headline = escapeHtml(og.title || footnote.title);
  const desc = og.description
    ? `<p class="fn-popover__desc">${escapeHtml(og.description)}</p>`
    : (footnote.quote
        ? `<p class="fn-popover__desc">"${escapeHtml(footnote.quote)}"</p>`
        : '');
  const site = og.siteName
    ? `<span class="fn-popover__site">${escapeHtml(og.siteName)}</span>`
    : '';
  // Thumbnail: real OG image if supplied, otherwise the inline SVG
  // document icon (drawn in NammaMetro purple via currentColor).
  const thumb = og.image
    ? `<img class="fn-popover__thumb" src="${escapeAttr(og.image)}" alt="" loading="lazy" />`
    : `<div class="fn-popover__thumb fn-popover__thumb--default" role="img" aria-label="Citation thumbnail">${DEFAULT_THUMB_SVG}</div>`;
  return `
    <div class="fn-popover__head">
      <h4 class="fn-popover__title">${headline}</h4>
    </div>
    <div class="fn-popover__body">
      ${thumb}
      <div class="fn-popover__text">
        ${desc}
        <div class="fn-popover__foot">
          ${site}
          <a class="fn-popover__link" href="${escapeAttr(footnote.url)}" target="_blank" rel="noopener noreferrer">View source →</a>
        </div>
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
 * Wire up all <sup class="fn-slot" data-fn-id="X"> elements in the document
 * to the corresponding footnote in `footnotes`.
 *
 * @param {Record<string, { title: string, url: string, quote?: string, og?: { title?: string, description?: string, image?: string, siteName?: string } }>} footnotes
 */
export function wireFootnotes(footnotes) {
  // Walk all fn-slots in document order, in case the DOM order doesn't
  // match the call order (lazy-mounted chapters).
  const allSlots = Array.from(document.querySelectorAll('.fn-slot'));

  for (const slot of allSlots) {
    const id = slot.getAttribute('data-fn-id');
    const footnote = footnotes[id];
    if (!footnote) continue;

    footnoteCounter++;
    const number = footnoteCounter;

    // Promote the slot to a button for a11y
    const trigger = document.createElement('button');
    trigger.className = 'fn-trigger';
    trigger.setAttribute('type', 'button');
    trigger.setAttribute('aria-label', `Footnote ${number}: ${footnote.title}`);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.textContent = String(number);
    trigger.setAttribute('data-fn-id', id);
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
  if (!wireFootnotes._globalHandlersAttached) {
    wireFootnotes._globalHandlersAttached = true;
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
