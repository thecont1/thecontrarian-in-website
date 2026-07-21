// chapters/ch4-traffic-bands.js — "Three Traffic Bands, Two Kinds of Patrons"
//
// Stacked area of Commute (Smart Card + NCMC) vs Casual (Token + QR + Group)
// over the 191 days. The "Weekend Lite" crossover is visible as the bands
// shift on Fri-Sat.

import { loadDailyByMode, loadDowModeStats } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderStackedArea } from '../viz/stacked-area.js';
import { renderDowModeTable } from '../viz/dow-mode-table.js';

export async function mountCh4TrafficBands(chapterEl) {
  const [daily, dowModeStats] = await Promise.all([
    loadDailyByMode(),
    loadDowModeStats(),
  ]);

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

  // Reference table: day-of-week × payment-method ridership (mean ± std).
  // Mounted once on first reveal; static, no scroll scrub.
  const tableSlot = chapterEl.querySelector('[data-viz="dow-mode-table"]');
  let tableViz = null;
  if (tableSlot) {
    tableViz = renderDowModeTable(tableSlot, dowModeStats, {
      caption: `Daily ridership by day of week and payment method · ${dowModeStats.window.start} → ${dowModeStats.window.end} (n = ${dowModeStats.rows.reduce((s, r) => s + r.n, 0)} days)`,
    });
  }

  return () => {
    viz.destroy();
    trigger.kill();
    if (tableViz) tableViz.destroy();
  };
}
