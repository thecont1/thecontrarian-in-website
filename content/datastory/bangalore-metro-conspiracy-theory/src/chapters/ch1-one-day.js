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
  loadDailyStats,
  loadSignificantEvents,
} from '../data/loaders.js';
import { gsap, ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import {
  renderCalendarStrip,
  extractWindow,
} from '../viz/calendar-strip.js';
import { renderStackedBar } from '../viz/stacked-bar.js';

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
  const [daily, events, stats] = await Promise.all([
    loadDailyByMode(),
    loadSignificantEvents(),
    loadDailyStats(),
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
  const calViz = renderCalendarStrip(calendarSlot, daily, window, stats);

  // 4. Render the single-day stacked bar
  const repDay = pickRepresentativeWeekday(daily);
  const barViz = renderStackedBar(barSlot, repDay);

  // 5. ScrollTrigger: each viz animates independently as it scrolls into view.
  // The calendar reveal starts when the chart's top enters the bottom
  // of the viewport and completes when the chart is roughly centred
  // in the viewport. The user is *reading* the chart at that scroll
  // position — its top is at viewport mid-height, the data fills the
  // lower half of the screen. Earlier configs (e.g. 'top 25%') made
  // the reveal finish too high; the user had to scroll the chart past
  // the top of the viewport to actually see it. The original 'center
  // center' was close but the chart was still drawing while the user
  // was reading the body text above it. 'top center' lands the sweet
  // spot: fully drawn + centred + visible.
  const calTrigger = ScrollTrigger.create({
    trigger: calendarSlot,
    start: 'top bottom',
    end: 'top center',
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

  // 6. Footnotes: the citation data for this chapter lives in
  //    `<script id="article-footnotes">` in index.html, alongside the
  //    article body. setupFootnotes() (called once from main.js) wires
  //    up all <sup class="fn-slot"> elements in the document.

  // 7. Cleanup if the chapter is removed (e.g. SPA navigation)
  return () => {
    calTrigger.kill();
    barTrigger.kill();
    calViz.destroy();
    barViz.destroy();
  };
}
