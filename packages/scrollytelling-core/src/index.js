// src/index.js — barrel re-exports for the scrollytelling core.
//
// Story-specific code does `import { wireFootnotes, setupImageReveals } from '@thecontrarian/scrollytelling-core'`.
//
// The package can also be imported by subpath for tree-shaking:
//   import { wireFootnotes } from '@thecontrarian/scrollytelling-core/components/footnote';
//   import { setupImageReveals } from '@thecontrarian/scrollytelling-core/motion/image-reveal';

export { wireFootnotes, renderFootnote } from './components/footnote.js';
export { setupImageReveals } from './motion/image-reveal.js';
export { gsap, ScrollTrigger, ScrollSmoother } from './motion/scroll-trigger.js';
