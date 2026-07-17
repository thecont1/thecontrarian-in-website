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
import { renderTreemap } from '../viz/treemap.js';

export async function mountCh1OneDay(chapterEl) {
  // 1. Load data
  const [daily, events, stats] = await Promise.all([
    loadDailyByMode(),
    loadSignificantEvents(),
    loadDailyStats(),
  ]);

  // 2. Find the viz container
  const calendarSlot = chapterEl.querySelector('[data-viz="calendar-strip"]');
  const barSlot = chapterEl.querySelector('[data-viz="treemap"]');
  if (!calendarSlot || !barSlot) {
    console.warn('ch1-one-day: viz slots not found in chapter element');
    return;
  }

  // 3. Render the calendar strip
  const window = extractWindow(daily);
  const calViz = renderCalendarStrip(calendarSlot, daily, window, stats);

  // 4. Render the treemap with a 7-day window (Dec 8–14) as the
  //    day selector. The selector reads whatever days are passed
  //    in, so the chapter mount picks the window. Each day in
  //    the window becomes a "chip" in the right-side selector
  //    (square + day-of-week + month-date); the first day in
  //    the window is the default selection.
  //
  //    Wrapped in try/catch so a future error inside the treemap
  //    (e.g. a forward-reference TDZ) doesn't take down the
  //    calendar's ScrollTrigger along with it. Each viz is
  //    independent: if one fails, the other should still render
  //    and the user sees what they came for.
  const SELECTOR_DATES = [
    '2024-12-08', '2024-12-09', '2024-12-10', '2024-12-11',
    '2024-12-12', '2024-12-13', '2024-12-14',
  ];
  const daysByDate = new Map(daily.map((d) => [d.date, d]));
  const selectorDays = SELECTOR_DATES
    .map((iso) => daysByDate.get(iso))
    .filter(Boolean);
  let barViz = null;
  try {
    barViz = renderTreemap(barSlot, selectorDays, stats);
  } catch (e) {
    console.error('ch1-one-day: treemap failed to render — calendar stays up', e);
    barSlot.innerHTML = '<p style="font-family: var(--font-mono); color: var(--muted); font-size: 11px;">Treemap failed to load — check console for details.</p>';
  }

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
  // Bar trigger only exists if the treemap mounted. If it
  // threw during render (see try/catch above), barViz stays
  // null and we skip creating a trigger for it.
  const barTrigger = barViz
    ? ScrollTrigger.create({
        trigger: barSlot,
        start: 'top 90%',
        end: 'top 50%',
        scrub: 0.5,
        onUpdate: (self) => barViz.update(self.progress),
      })
    : null;

  // 6. Footnotes: the citation data for this chapter lives in
  //    `<script id="article-footnotes">` in index.html, alongside the
  //    article body. setupFootnotes() (called once from main.js) wires
  //    up all <sup class="fn-slot"> elements in the document.

  // 7. Cleanup if the chapter is removed (e.g. SPA navigation)
  return () => {
    calTrigger.kill();
    if (barTrigger) barTrigger.kill();
    calViz.destroy();
    if (barViz) barViz.destroy();
  };
}
