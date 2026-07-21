// chapters/ch3-one-week.js — "One Week on NammaMetro"
//
// Renders the day-of-week line chart that shows how each weekday's
// ridership evolves across the last eight weeks of the dataset.

import { loadDailyByMode, loadDowModeStats } from '../data/loaders.js';
import { renderDowLines } from '../viz/dow-lines.js';
import { renderDowModeTable } from '../viz/dow-mode-table.js';

export async function mountCh3OneWeek(chapterEl) {
  const [daily, dowModeStats] = await Promise.all([
    loadDailyByMode(),
    loadDowModeStats(),
  ]);

  const slot = chapterEl.querySelector('[data-viz="dow-lines"]');
  if (!slot) return;

  const viz = renderDowLines(slot, daily, {
    yLabel: 'Total Ridership',
    dowModeStats,
  });

  const tableSlot = chapterEl.querySelector('[data-viz="dow-mode-table"]');
  let tableViz = null;
  if (tableSlot) {
    tableViz = renderDowModeTable(tableSlot, dowModeStats, {
      caption: `Daily ridership by day of week and payment method · ${dowModeStats.window.start} → ${dowModeStats.window.end} (n = ${dowModeStats.rows.reduce((s, r) => s + r.n, 0)} days)`,
    });
  }

  return () => {
    viz.destroy();
    if (tableViz) tableViz.destroy();
  };
}
