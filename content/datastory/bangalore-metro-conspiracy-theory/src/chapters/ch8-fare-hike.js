// chapters/ch8-fare-hike.js — "Fare Hike of February 2025 – Impact Analysis"
//
// Three sub-sections: "Did it hurt?" (line), "Who did it hurt?" (stacked area),
// "How badly did it hurt?" (CI bars).

import { loadDailyByMode, loadFareHikeWindow } from '../data/loaders.js';
import { ScrollTrigger } from '../motion/scroll-trigger.js';
import { renderRidershipLine } from '../viz/ridership-line.js';
import { renderStackedArea } from '../viz/stacked-area.js';
import { renderCIBar } from '../viz/ci-bar.js';
import { wireFootnotes } from '../components/footnote.js';

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

  wireFootnotes({
    'the-hindu-fare-hike': {
      title: 'The Hindu — Bengalu reans will now have to shell out more for Namma Metro',
      url: 'https://www.thehindu.com/news/cities/bangalore/after-bus-fare-hike-bengalureans-will-now-have-to-shell-out-more-for-namma-metro-rides-from-feb-9/article69196596.ece',
      og: {
        title: 'After bus fare hike, Bengalureans will now have to shell out more for Namma Metro rides from Feb 9',
        description: 'BMRCL hikes Namma Metro fares for the first time since 2017. New fares take effect February 9, 2025.',
        siteName: 'The Hindu',
      },
    },
    'indian-express-4pct': {
      title: 'Indian Express — 4% drop in Bengaluru Metro ridership',
      url: 'https://indianexpress.com/article/cities/bangalore/metro-ridership-drop-bmrcl-plug-fare-hike-public-backlash-9830375/',
      og: {
        title: 'Bengaluru Metro ridership drops 4% after fare hike, BMRCL plugs public backlash',
        description: 'Bengaluru Metro ridership saw a 4% drop in the week following the February 9 fare hike, as daily commuters and casual riders both pulled back.',
        siteName: 'The Indian Express',
      },
    },
    'times-now-ncmc': {
      title: 'Times Now — Bengaluru\u2019s Namma Metro Halted NCMC Cards Services',
      url: 'https://www.timesnownews.com/bengaluru/why-has-bengalurus-namma-metro-halted-ncmc-cards-services-article-151381010',
      og: {
        title: 'Why has Bengaluru\u2019s Namma Metro Halted NCMC Cards Services?',
        description: 'Namma Metro halted NCMC card services in March 2025, citing a technical issue. The disruption affected commuters who relied on the National Common Mobility Card.',
        siteName: 'Times Now',
      },
    },
    'bangalore-mirror-glitch': {
      title: 'Bangalore Mirror — Glitch in the metro matrix',
      url: 'https://bangaloremirror.indiatimes.com/bangalore/others/glitch-in-the-metro-matrix/articleshow/124312799.cms',
      og: {
        title: 'Glitch in the metro matrix',
        description: 'A payment-glitch at Namma Metro turnstiles left Smart Card users frustrated, even as the post-fare-hike 5-10% discount was meant to incentivise the closed-loop channel.',
        siteName: 'Bangalore Mirror',
      },
    },
  });

  return () => {
    lineViz.destroy();
    areaViz.destroy();
    ciViz.destroy();
    triggers.forEach((t) => t.kill());
  };
}
