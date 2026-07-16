// chapters/ch9-conspiracy.js — "The Conspiracy Theory 😈"
//
// The analytical climax. Three sub-sections:
//   A. The Curious Case of Jan 15-16 — multi-line chart of payment channels
//      across the 4-day window. Smart Card surges; Token/QR crash.
//   B. Payment Disruptions: Examining the Patterns — before/after paired bars
//      with hypothesis-test CIs.
//   C. Putting the Hypothesis to the Test — CI bars for each channel.

import { loadDailyByMode, loadHypothesisWindow } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderMultiRidershipLine } from '../viz/multi-ridership-line.js';
import { renderBeforeAfter } from '../viz/before-after.js';
import { renderCIBar } from '../viz/ci-bar.js';
import { wireFootnotes } from '@thecontrarian/scrollytelling-core';

export async function mountCh9Conspiracy(chapterEl) {
  const [daily, hypWindow] = await Promise.all([
    loadDailyByMode(),
    loadHypothesisWindow(),
  ]);

  const caseSlot = chapterEl.querySelector('[data-viz="jan-15-16-case"]');
  const beforeAfterSlot = chapterEl.querySelector('[data-viz="pre-vs-post-bars"]');
  const ciSlot = chapterEl.querySelector('[data-viz="hypothesis-ci-bars"]');

  if (!caseSlot || !beforeAfterSlot || !ciSlot) return;

  // A. The 4-day case (Jan 14-17, 2025)
  const caseViz = renderMultiRidershipLine(caseSlot, daily, {
    title: 'Jan 14–17, 2025 — Smart Card vs Token vs QR',
    window: { pre: { start: '2025-01-14', end: '2025-01-14' }, post: { start: '2025-01-17', end: '2025-01-17' } },
    seriesKeys: ['smartcard', 'token', 'qrNammaMetro'],
  });

  // B. Before/after paired bars
  const beforeAfterViz = renderBeforeAfter(beforeAfterSlot, daily, hypWindow, {
    title: 'Pre vs Post: mean daily ridership by channel (14 days each side)',
  });

  // C. CI bars — the notebook's hypothesis test results
  const ciRows = [
    { channel: 'qrWhatsApp',   pctChange:  15.1, ciLow:  8.5, ciHigh: 21.7 },
    { channel: 'ncmc',         pctChange:  12.4, ciLow:  6.0, ciHigh: 18.8 },
    { channel: 'smartcard',    pctChange:   9.7, ciLow:  5.3, ciHigh: 14.1 },
    { channel: 'qrNammaMetro', pctChange:   4.1, ciLow: -2.0, ciHigh: 10.2 },
    { channel: 'groupTicket',  pctChange:  -3.4, ciLow: -8.1, ciHigh:  1.3 },
    { channel: 'qrPaytm',      pctChange:  -5.6, ciLow: -9.4, ciHigh: -1.8 },
    { channel: 'token',        pctChange: -10.7, ciLow: -13.2, ciHigh: -8.2 },
  ];
  const ciViz = renderCIBar(ciSlot, ciRows, {
    title: 'Hypothesis test: change in mean ridership after Jan 14, 2025 (95% CI)',
  });

  const triggers = [];
  triggers.push(ScrollTrigger.create({
    trigger: caseSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => caseViz.update(self.progress),
  }));
  triggers.push(ScrollTrigger.create({
    trigger: beforeAfterSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => beforeAfterViz.update(self.progress),
  }));
  triggers.push(ScrollTrigger.create({
    trigger: ciSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => ciViz.update(self.progress),
  }));

  wireFootnotes({});

  return () => {
    caseViz.destroy();
    beforeAfterViz.destroy();
    ciViz.destroy();
    triggers.forEach((t) => t.kill());
  };
}
