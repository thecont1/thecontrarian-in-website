// main.js — entry point. Mounts all 9 chapters and the site chrome.
//
// Chapters are mounted lazily via IntersectionObserver so the initial bundle
// execution is small. Each chapter's D3 viz only renders when the chapter
// is about to scroll into view.
//
// Story-specific code only. Generic motion / footnotes / base styles
// come from @thecontrarian/scrollytelling-core (a sibling workspace
// package at packages/scrollytelling-core/).

import '@thecontrarian/scrollytelling-core/styles';

import { mountCh1OneDay } from './chapters/ch1-one-day.js';
import { mountCh2Crowded } from './chapters/ch2-crowded.js';
import { mountCh3OneWeek } from './chapters/ch3-one-week.js';
import { mountCh4TrafficBands } from './chapters/ch4-traffic-bands.js';
import { mountCh5OneMonth } from './chapters/ch5-one-month.js';
import { mountCh6LongWeekend } from './chapters/ch6-long-weekend.js';
import { mountCh7VisitorEconomy } from './chapters/ch7-visitor-economy.js';
import { mountCh8FareHike } from './chapters/ch8-fare-hike.js';
import { mountCh9Conspiracy } from './chapters/ch9-conspiracy.js';
import { setupImageReveals } from '@thecontrarian/scrollytelling-core';

// Footer copyright year
const yearEl = document.getElementById('copyright-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Site header stays dark the whole time (matches the existing datastory layout).
// We force the dark background on the header element directly, since the Astro
// site does the same via inline style.
const header = document.getElementById('site-header');
if (header) {
  header.style.backgroundColor = '#2a2a2a';
  header.style.transition = 'background-color 0.3s ease';
  const headerInner = header.querySelector('.site-header-inner');
  if (headerInner) headerInner.style.backgroundColor = 'transparent';
  header.querySelectorAll('a, button').forEach((el) => {
    el.style.color = '#fff';
    el.style.textShadow = 'none';
  });
}

const CHAPTERS = [
  { sel: '[data-chapter="1-one-day"]',     fn: mountCh1OneDay },
  { sel: '[data-chapter="2-crowded"]',     fn: mountCh2Crowded },
  { sel: '[data-chapter="3-one-week"]',    fn: mountCh3OneWeek },
  { sel: '[data-chapter="4-traffic-bands"]', fn: mountCh4TrafficBands },
  { sel: '[data-chapter="5-one-month"]',   fn: mountCh5OneMonth },
  { sel: '[data-chapter="6-long-weekend"]', fn: mountCh6LongWeekend },
  { sel: '[data-chapter="7-visitor-economy"]', fn: mountCh7VisitorEconomy },
  { sel: '[data-chapter="8-fare-hike"]',   fn: mountCh8FareHike },
  { sel: '[data-chapter="9-conspiracy"]',  fn: mountCh9Conspiracy },
];

/**
 * Lazy-mount each chapter when its top edge is within 1.5 viewports of the
 * current viewport. The chapter's D3 viz doesn't render until then, so the
 * initial bundle cost is minimal.
 */
function lazyMountChapters() {
  for (const { sel, fn } of CHAPTERS) {
    const el = document.querySelector(sel);
    if (!el) continue;
    let mounted = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !mounted) {
            mounted = true;
            observer.disconnect();
            fn(el).catch((err) => console.error(`Failed to mount ${sel}:`, err));
          }
        }
      },
      { rootMargin: '1500px 0px 1500px 0px' }
    );
    observer.observe(el);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    lazyMountChapters();
    setupImageReveals();
  });
} else {
  lazyMountChapters();
  setupImageReveals();
}
