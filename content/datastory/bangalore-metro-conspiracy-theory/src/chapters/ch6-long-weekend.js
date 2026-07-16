// chapters/ch6-long-weekend.js — "The Long Weekend and Other Phenomena"
//
// Sankranti focus (Jan 14-18, 2025). The notebook introduces the Jan 14-16
// anomaly here as a *holiday effect* — the conspiracy chapter (9) reveals
// the implication.

import { loadDailyByMode } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderMultiRidershipLine } from '../viz/multi-ridership-line.js';
import { wireFootnotes } from '@thecontrarian/scrollytelling-core';

export async function mountCh6LongWeekend(chapterEl) {
  const daily = await loadDailyByMode();
  const slot = chapterEl.querySelector('[data-viz="sankranti-week"]');
  if (!slot) return;

  // Filter to the Sankranti week
  const sankranti = daily.filter((d) => {
    const date = new Date(d.date);
    return date >= new Date('2025-01-13') && date <= new Date('2025-01-19');
  });

  const viz = renderMultiRidershipLine(slot, sankranti, {
    title: 'Sankranti week (Jan 13–19, 2025) — Smart Card vs Token vs QR',
  });

  const trigger = ScrollTrigger.create({
    trigger: slot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => viz.update(self.progress),
  });

  wireFootnotes({});

  return () => {
    viz.destroy();
    trigger.kill();
  };
}
