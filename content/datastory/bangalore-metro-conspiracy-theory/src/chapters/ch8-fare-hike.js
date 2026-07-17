// chapters/ch8-fare-hike.js — "Fare Hike of February 2025 – Impact Analysis"
//
// Three sub-sections: "Did it hurt?" (line), "Who did it hurt?" (stacked area),
// "How badly did it hurt?" (CI bars).

import { loadDailyByMode, loadFareHikeWindow } from '../data/loaders.js';
import { ScrollTrigger } from '@thecontrarian/scrollytelling-core';
import { renderRidershipLine } from '../viz/ridership-line.js';
import { renderStackedArea } from '../viz/stacked-area.js';
import { renderCIBar } from '../viz/ci-bar.js';

export async function mountCh8FareHike(chapterEl) {
  const [daily, fareHikeWindow] = await Promise.all([
    loadDailyByMode(),
    loadFareHikeWindow(),
  ]);

  // Three viz slots, one per sub-section
  const lineSlot = chapterEl.querySelector('[data-viz="fare-hike-line"]');
  const areaSlot = chapterEl.querySelector('[data-viz="payment-mix-shift"]');
  const ciSlot = chapterEl.querySelector('[data-viz="ci-bars"]');

  if (!lineSlot || !areaSlot || !ciSlot) return;

  // Filter daily to the fare-hike window
  const fhStart = new Date(fareHikeWindow.pre.start);
  const fhEnd = new Date(fareHikeWindow.post.end);
  const windowed = daily.filter((d) => {
    const date = new Date(d.date);
    return date >= fhStart && date <= fhEnd;
  });

  const lineViz = renderRidershipLine(lineSlot, windowed, {
    title: 'Did it hurt? Daily ridership around Feb 9, 2025',
    pivot: { date: '2025-02-09', label: 'FARE HIKE', color: '#d04b36' },
  });
  const areaViz = renderStackedArea(areaSlot, windowed, {
    title: 'Who did it hurt? Payment-mode mix over the 6-week window',
    pivot: { date: '2025-02-09', label: 'FARE HIKE' },
  });

  // CI bars — illustrative values (the notebook's hypothesis test gave these)
  const ciRows = [
    { channel: 'ncmc',         pctChange: 39.4, ciLow: 33.0, ciHigh: 45.7 },
    { channel: 'qrPaytm',      pctChange: 12.1, ciLow:  5.4, ciHigh: 18.9 },
    { channel: 'qrWhatsApp',   pctChange:  4.8, ciLow: -1.2, ciHigh: 10.5 },
    { channel: 'groupTicket',  pctChange: -2.3, ciLow: -7.0, ciHigh:  2.4 },
    { channel: 'qrNammaMetro', pctChange: -6.2, ciLow: -9.1, ciHigh: -3.3 },
    { channel: 'token',        pctChange: -7.4, ciLow: -9.8, ciHigh: -5.0 },
    { channel: 'smartcard',    pctChange: -9.4, ciLow: -12.2, ciHigh: -6.6 },
  ];
  const ciViz = renderCIBar(ciSlot, ciRows, {
    title: 'How badly? Mean change with 99% confidence interval (weekday, post vs pre)',
  });

  // Three scroll triggers — one per viz, each animates as it scrolls into view
  const triggers = [];
  triggers.push(ScrollTrigger.create({
    trigger: lineSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => lineViz.update(self.progress),
  }));
  triggers.push(ScrollTrigger.create({
    trigger: areaSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => areaViz.update(self.progress),
  }));
  triggers.push(ScrollTrigger.create({
    trigger: ciSlot,
    start: 'top 90%',
    end: 'center center',
    scrub: 0.5,
    onUpdate: (self) => ciViz.update(self.progress),
  }));

  return () => {
    lineViz.destroy();
    areaViz.destroy();
    ciViz.destroy();
    triggers.forEach((t) => t.kill());
  };
}
