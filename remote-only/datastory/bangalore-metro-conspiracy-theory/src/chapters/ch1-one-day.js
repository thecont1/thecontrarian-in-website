// chapters/ch1-one-day.js — mount the Chapter 1 scrollytelling experience.
//
// What it does:
//   1. Loads the daily ridership data
//   2. Renders the 191-day calendar strip
//   3. Renders a single-day stacked bar (a representative weekday)
//   4. Wires ScrollTrigger so the calendar cells reveal column-by-column
//      as the user scrolls the chapter
//   5. Wires in-line footnotes for the BMRCL data citation

import {
  loadDailyByMode,
  loadSignificantEvents,
} from '../data/loaders.js';
import { gsap, ScrollTrigger } from '../motion/scroll-trigger.js';
import {
  renderCalendarStrip,
  extractWindow,
} from '../viz/calendar-strip.js';
import { renderStackedBar } from '../viz/stacked-bar.js';
import { wireFootnotes } from '../components/footnote.js';

// Pick a representative weekday for the stacked-bar viz. Prefers a
// recent Wednesday (mid-week, full data), then falls back to any
// recent Mon–Thu, then to the last day in the data.
function pickRepresentativeWeekday(daily) {
  // Walk from the most recent day backwards; first Mon–Thu wins.
  for (let i = daily.length - 1; i >= 0; i--) {
    const d = new Date(daily[i].date);
    const dow = d.getDay();             // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (dow >= 1 && dow <= 4) return daily[i];
  }
  return daily[daily.length - 1];
}

export async function mountCh1OneDay(chapterEl) {
  // 1. Load data
  const [daily, events] = await Promise.all([
    loadDailyByMode(),
    loadSignificantEvents(),
  ]);

  // 2. Find the viz container
  const calendarSlot = chapterEl.querySelector('[data-viz="calendar-strip"]');
  const barSlot = chapterEl.querySelector('[data-viz="stacked-bar"]');
  if (!calendarSlot || !barSlot) {
    console.warn('ch1-one-day: viz slots not found in chapter element');
    return;
  }

  // 3. Render the calendar strip
  const window = extractWindow(daily);
  const calViz = renderCalendarStrip(calendarSlot, daily, window);

  // 4. Render the single-day stacked bar
  const repDay = pickRepresentativeWeekday(daily);
  const barViz = renderStackedBar(barSlot, repDay);

  // 5. ScrollTrigger: each viz animates independently as it scrolls into view.
  // Animation completes when the viz reaches the center of the viewport.
  const calTrigger = ScrollTrigger.create({
    trigger: calendarSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => calViz.update(self.progress),
  });
  const barTrigger = ScrollTrigger.create({
    trigger: barSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => barViz.update(self.progress),
  });

  // 6. Footnotes for this chapter
  wireFootnotes({
    'bmrcl-data': {
      title: 'BMRCL Daily Ridership page',
      url: 'https://english.bmrc.co.in/ridership/',
      quote: 'Official daily ridership data, updated every 24 hours.',
      og: {
        title: 'Daily Ridership — Bangalore Metro Rail Corporation Limited',
        description: 'Official daily ridership data published by BMRCL, updated every 24 hours. The Bangalore Metro Rail Corporation Limited (BMRCL) operates NammaMetro, the rapid transit system serving Bengaluru.',
        siteName: 'BMRCL',
      },
    },
  });

  // 7. Cleanup if the chapter is removed (e.g. SPA navigation)
  return () => {
    calTrigger.kill();
    barTrigger.kill();
    calViz.destroy();
    barViz.destroy();
  };
}
