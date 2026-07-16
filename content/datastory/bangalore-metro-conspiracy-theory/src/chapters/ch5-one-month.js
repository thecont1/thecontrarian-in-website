// chapters/ch5-one-month.js — "One Month on NammaMetro"
//
// Boxplot of daily ridership by month + (optionally) the wave chart of
// Commute vs Casual.

import { loadDailyByMode } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderBoxplot } from '../viz/boxplot.js';
import { renderStackedArea } from '../viz/stacked-area.js';
import { wireFootnotes } from '@thecontrarian/scrollytelling-core';

export async function mountCh5OneMonth(chapterEl) {
  const daily = await loadDailyByMode();

  const boxSlot = chapterEl.querySelector('[data-viz="monthly-boxplot"]');
  const waveSlot = chapterEl.querySelector('[data-viz="commute-casual-wave"]');
  if (!boxSlot) return;

  const boxViz = renderBoxplot(boxSlot, daily, { title: 'Ridership distribution by month' });
  const waveViz = waveSlot ? renderStackedArea(waveSlot, daily, {
    title: 'A wave rides NammaMetro — Commute vs Casual',
    aggregate: true,
  }) : null;

  const boxTrigger = ScrollTrigger.create({
    trigger: boxSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => boxViz.update(self.progress),
  });
  const waveTrigger = waveSlot ? ScrollTrigger.create({
    trigger: waveSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => waveViz.update(self.progress),
  }) : null;

  wireFootnotes({});

  return () => {
    boxViz.destroy();
    if (waveViz) waveViz.destroy();
    boxTrigger.kill();
    if (waveTrigger) waveTrigger.kill();
  };
}
