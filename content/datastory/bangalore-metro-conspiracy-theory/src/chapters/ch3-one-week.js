// chapters/ch3-one-week.js — "One Week on NammaMetro"
//
// Last 7 days ridership line + average ridership by day-of-week bars.

import { loadDailyByMode } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderRidershipLine } from '../viz/ridership-line.js';
import { renderDayOfWeek, computeDayOfWeekAverages } from '../viz/day-of-week.js';
import { wireFootnotes } from '@thecontrarian/scrollytelling-core';

export async function mountCh3OneWeek(chapterEl) {
  const daily = await loadDailyByMode();
  const last7 = daily.slice(-7);
  const dowAvgs = computeDayOfWeekAverages(daily);

  const lineSlot = chapterEl.querySelector('[data-viz="last-7-days"]');
  const dowSlot = chapterEl.querySelector('[data-viz="dow-averages"]');
  if (!lineSlot || !dowSlot) return;

  const lineViz = renderRidershipLine(lineSlot, last7, { title: 'Last 7 days', yLabel: 'Total ridership' });
  const dowViz = renderDayOfWeek(dowSlot, dowAvgs, { title: 'Average ridership by day of week' });

  const lineTrigger = ScrollTrigger.create({
    trigger: lineSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => lineViz.update(self.progress),
  });
  const dowTrigger = ScrollTrigger.create({
    trigger: dowSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => dowViz.update(self.progress),
  });

  wireFootnotes({});

  return () => {
    lineViz.destroy();
    dowViz.destroy();
    lineTrigger.kill();
    dowTrigger.kill();
  };
}
