// chapters/ch7-visitor-economy.js — "Metro Enables the Visitor Economy"
//
// Daily ridership with event markers (Ranji Trophy, Ed Sheeran, Aero India).

import { loadDailyByMode, loadSignificantEvents } from '../data/loaders.js';
import { ScrollTrigger } from '../motion/scroll-trigger.js';
import { renderEventLine } from '../viz/event-line.js';
import { wireFootnotes } from '../components/footnote.js';

export async function mountCh7VisitorEconomy(chapterEl) {
  const [daily, events] = await Promise.all([
    loadDailyByMode(),
    loadSignificantEvents(),
  ]);
  const slot = chapterEl.querySelector('[data-viz="event-ridership"]');
  if (!slot) return;

  const viz = renderEventLine(slot, daily, events, {
    title: 'Daily ridership with event markers',
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
