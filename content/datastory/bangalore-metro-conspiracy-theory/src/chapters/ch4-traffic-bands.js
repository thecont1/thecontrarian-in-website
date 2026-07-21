// chapters/ch4-traffic-bands.js — "Three Traffic Bands, Two Kinds of Patrons"
//
// Stacked area of Commute (Smart Card + NCMC) vs Casual (Token + QR + Group)
// over the 191 days. The "Weekend Lite" crossover is visible as the bands
// shift on Fri-Sat.

import { loadDailyByMode } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderStackedArea } from '../viz/stacked-area.js';

export async function mountCh4TrafficBands(chapterEl) {
  const daily = await loadDailyByMode();

  const slot = chapterEl.querySelector('[data-viz="commute-vs-casual"]');
  if (!slot) return;

  const viz = renderStackedArea(slot, daily, {
    title: 'Commute (Smart card + NCMC) vs Casual (Token + QR + Group)',
    aggregate: true,
  });

  const trigger = ScrollTrigger.create({
    trigger: slot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => viz.update(self.progress),
  });

  return () => {
    viz.destroy();
    trigger.kill();
  };
}
