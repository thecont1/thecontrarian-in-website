// motion/image-reveal.js — scroll-driven block-based image reveal.
//
// Each static image in the content is wrapped in a `.img-reveal`
// container that holds a 20×15 (300-block) grid. Every block is the
// same image as background, scaled to 2000% × 1500% and positioned
// to show its 1/20 × 1/15 portion. As the user scrolls, each block's
// opacity animates from 0 to 1 in a **random order** — the visual
// effect is the image "assembling itself" out of 300 pieces.
//
// The 20:15 aspect ratio matches the 4:3 ratio of the scrolly's
// chapter photos, so each block is roughly square.
//
// The original <img> stays in the DOM (opacity:0) for screen readers
// and to provide the container's aspect ratio. The visible image is
// the block grid.
//
// The reveal range is tight: image top at 90% of viewport → image
// top at 50%. By the time the top edge of the image reaches 50% of
// the viewport height, the reveal is complete. The 300 blocks are
// spread evenly across that scroll range so each block gets an
// equal slice of the animation.
//
// The hero image (`.datastory-header .hero img`) is intentionally
// **excluded** — it loads normally on page load with no reveal
// animation. The scrolly's chapter photos are the only images that
// use the block reveal.

import { ScrollTrigger } from './scroll-trigger.js';

const ROWS = 15;
const COLS = 20;
const TOTAL = ROWS * COLS;       // 300
const REVEAL_START = 'top 90%';
const REVEAL_END = 'top 50%';

/**
 * Fisher-Yates shuffle. Returns a new array; the original is unchanged.
 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wrapInBlocks(img) {
  const src = img.currentSrc || img.src;
  if (!src) return;

  // Wrap the img in .img-reveal (or reuse an existing one if we've
  // already wrapped it — idempotent guard).
  let wrap = img.parentElement;
  if (!wrap || !wrap.classList.contains('img-reveal')) {
    wrap = document.createElement('div');
    wrap.className = 'img-reveal';
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
  }
  img.classList.add('img-reveal__base');

  // Avoid double-creating blocks on a re-run.
  let blocksContainer = wrap.querySelector('.img-reveal__blocks');
  if (blocksContainer) {
    blocksContainer.remove();
  }
  blocksContainer = document.createElement('div');
  blocksContainer.className = 'img-reveal__blocks';
  blocksContainer.setAttribute('aria-hidden', 'true');
  blocksContainer.style.setProperty('--img', `url("${src}")`);
  wrap.appendChild(blocksContainer);

  // Random reveal order: each block gets a unique reveal position
  // 0..TOTAL-1. The shuffled order array is the "queue".
  const order = shuffle(Array.from({ length: TOTAL }, (_, i) => i));

  for (let i = 0; i < TOTAL; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const block = document.createElement('div');
    block.className = 'img-reveal__block';
    block.style.setProperty('--x', `${(col / (COLS - 1)) * 100}%`);
    block.style.setProperty('--y', `${(row / (ROWS - 1)) * 100}%`);
    block.dataset.revealOrder = String(order[i]);
    blocksContainer.appendChild(block);
  }

  ScrollTrigger.create({
    trigger: wrap,
    start: REVEAL_START,
    end: REVEAL_END,
    scrub: 0.4,
    onUpdate: (self) => {
      const progress = self.progress;
      const blocks = blocksContainer.children;
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const orderIdx = parseInt(block.dataset.revealOrder, 10);
        const blockStart = orderIdx / TOTAL;
        const blockEnd = (orderIdx + 1) / TOTAL;
        const blockProgress = Math.max(
          0,
          Math.min(1, (progress - blockStart) / (blockEnd - blockStart)),
        );
        block.style.opacity = blockProgress;
      }
    },
  });
}

export function setupImageReveals() {
  // Only chapter photos. The hero is excluded — it loads normally
  // on page load, with no animation, no mask, no block grid.
  const images = document.querySelectorAll('.datastory-photo img');
  if (images.length === 0) return;

  for (const img of images) {
    // If the image hasn't loaded yet, wait for it so the natural
    // dimensions (and thus the wrap's aspect ratio) are correct.
    if (img.complete && img.naturalWidth > 0) {
      wrapInBlocks(img);
    } else {
      img.addEventListener(
        'load',
        () => wrapInBlocks(img),
        { once: true },
      );
    }
  }
}
