// chapters/ch2-crowded.js — "The Metro is Getting Crowded!"
//
// One chart, not two. The 10 busiest and 10 quietest days sit
// in the same ranked bar chart so the empty space between
// them is the visual punchline — the dataset has a "busy
// cluster" around 8.5–9.1L and a "quiet cluster" around
// 4.0–5.0L, with very few days in between. Two side-by-side
// bar lists would obscure the gap; one ranked list makes it
// obvious at a glance.
//
// Reads: the median line at 8.0L is closer to the busy
// cluster than the quiet cluster — the dataset is right-
// skewed, with most days sitting in the upper half of the
// range. The 10 quietest days are a long tail below.

import { loadDailyByMode, loadDailyStats } from '../data/loaders.js';
import { renderExtremeDays } from '../viz/extreme-days.js';

export async function mountCh2Crowded(chapterEl) {
  const [daily, stats] = await Promise.all([
    loadDailyByMode(),
    loadDailyStats(),
  ]);

  const slot = chapterEl.querySelector('[data-viz="extreme-days"]');
  if (!slot) return;

  // The viz owns its own GSAP spring-in: when the chart's
  // base crosses the viewport bottom, the 20 bars spring
  // into place (back.out(1.7), 30ms stagger, busy first
  // then quiet). We don't need a chapter-level ScrollTrigger
  // — the spring's internal trigger handles the reveal.
  const viz = renderExtremeDays(slot, daily, {
    median: stats.median,
    max: stats.max,
    min: stats.min,
    buckets: stats.buckets,
  });

  return () => {
    viz.destroy();
  };
}
