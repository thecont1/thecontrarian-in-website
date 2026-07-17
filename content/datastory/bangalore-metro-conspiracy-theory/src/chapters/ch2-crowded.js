// chapters/ch2-crowded.js — "The Metro is Getting Crowded!"
//
// Top 10 busiest days (commuter) and top 10 least busy days (weekend).
// Two horizontal bar charts, scroll-revealed.

import { loadDailyByMode } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderHorizontalBar } from '../viz/horizontal-bar.js';

export async function mountCh2Crowded(chapterEl) {
  const daily = await loadDailyByMode();

  // Top 10 busiest (weekdays) — exclude known public holidays for "commuter traffic"
  const weekdays = daily.filter((d) => {
    const dow = new Date(d.date).getDay();
    return dow >= 1 && dow <= 4; // Mon-Thu
  });
  const topBusy = [...weekdays].sort((a, b) => b.total - a.total).slice(0, 10);
  const topQuiet = [...daily].sort((a, b) => a.total - b.total).slice(0, 10);

  const busySlot = chapterEl.querySelector('[data-viz="top-10-busy"]');
  const quietSlot = chapterEl.querySelector('[data-viz="top-10-quiet"]');
  if (!busySlot || !quietSlot) return;

  const busyViz = renderHorizontalBar(busySlot, topBusy, { label: 'Top 10 busiest weekdays', color: 'busy' });
  const quietViz = renderHorizontalBar(quietSlot, topQuiet, { label: 'Top 10 least busy days', color: 'quiet' });

  const busyTrigger = ScrollTrigger.create({
    trigger: busySlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => busyViz.update(self.progress),
  });
  const quietTrigger = ScrollTrigger.create({
    trigger: quietSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => quietViz.update(self.progress),
  });

  return () => {
    busyViz.destroy();
    quietViz.destroy();
    busyTrigger.kill();
    quietTrigger.kill();
  };
}
