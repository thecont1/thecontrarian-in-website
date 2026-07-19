// motion/scroll-trigger.js — thin wrapper around GSAP + ScrollTrigger.
//
// We re-export the gsap singleton and the ScrollTrigger plugin so chapter
// modules don't each have to call `gsap.registerPlugin(ScrollTrigger)`.
// This is the only file in the project that touches `gsap` directly;
// viz modules stay pure (they accept scrub values as numbers, not GSAP refs).

import gsap from 'gsap';
import { CSSPlugin } from 'gsap/CSSPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(CSSPlugin, ScrollTrigger, ScrollSmoother);

export { gsap, ScrollTrigger, ScrollSmoother };
