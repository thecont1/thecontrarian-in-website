// viz/treemap.js — payment-mode treemap with a 7-day selector.
//
// Renders a treemap where each rectangle is a payment mode, sized by its
// share of the selected day's ridership. Along the right edge, a vertical
// strip shows the last 7 days in the dataset as small coloured squares,
// using the same percentile bucket colours as the calendar-strip cells.
// Clicking a square updates the treemap to that day.

import * as d3 from 'd3';

// Namma Metro purple scale — 5 anchor colours from "almost
// paper" at the bottom to BMRCL purple at the top. Matches
// the calendar's PURPLE_BUCKETS exactly so the day-selector
// squares (which use this palette) and the calendar cells
// (which use the same palette via calendar-strip.js) read
// as one continuous value space. The treemap itself uses
// per-channel colours for the rectangles, so this palette
// only paints the day-selector and any other ridership
// encoding. The number of bands is determined by
// daily-stats.json's bucket count; `computeBandColors`
// interpolates these 5 anchors to N stops.
const PURPLE_BUCKETS = [
  '#f2ecf4',  // 0 — almost paper, just a whisper of purple
  '#d4bee0',  // 1 — light lavender
  '#a37ac0',  // 2 — medium wisteria, more saturated
  '#7a3fa8',  // 3 — deep violet
  '#5E2D8C',  // 4 — BMRCL purple
];

// CHANNELS is the canonical, EDITORIAL order of payment modes
// (Smart Card → Tokens → Whatsapp → Metro QR → Paytm → NCMC →
// Group Ticket). Both the legend AND the treemap rectangles
// read this order verbatim — the legend lists the modes top-
// to-bottom in this sequence, and the treemap sorts its
// leaves by this order so the largest rectangle (Smart Card)
// always sits in the top-left, the next largest below or to
// the right, and so on. The order does NOT change as the
// selected day changes; it is a fixed data-story ordering,
// not a dynamic "descending share of today" ranking. The
// reader can scan the legend top-to-bottom and follow the
// same sequence in the treemap without having to re-find
// each mode after every hover.
//
// Each channel has one colour field:
//   - color:  the icon's stroke / fill (the channel's
//             "brand" colour). Used by the legend label
//             and the icon pattern inside the rectangle.
//             The rectangle's base fill is paper (not a
//             tinted version of the channel colour) — the
//             icons alone carry the channel identity, and
//             the white base keeps the chart reading as a
//             single neutral surface rather than seven
//             competing colour blocks.
//             block, the token area reads as a pale tan
//             block, and so on. The icon pattern still
//             renders on top in the channel's full
//             saturation, so the rectangle's identity is
//             double-coded (tinted base + saturated icons).
const CHANNELS = [
  { key: 'smartcard',     label: 'Smart Card',   color: '#7e3eb5' },
  { key: 'token',          label: 'Tokens',       color: '#a8852b' },
  { key: 'qrWhatsApp',     label: 'Whatsapp',     color: '#e0633f' },
  { key: 'qrNammaMetro',   label: 'Metro QR',     color: '#d04b36' },
  { key: 'qrPaytm',        label: 'Paytm',        color: '#ed7b48' },
  { key: 'ncmc',           label: 'NCMC',         color: '#a13a3a' },
  { key: 'groupTicket',    label: 'Group Ticket', color: '#c8a44d' },
];

// Paper colour used as the light-tint target. The CHANNELS
// base fill is `interpolateRgb(paper, channelColor)(0.12)` —
// 12% channel, 88% paper. Strong enough to read as "this
// Tiny monochrome icons drawn into pattern tiles (viewBox 0 0 12 12).
// Each icon is a simple glyph so dense tiling stays readable at small size.
const ICONS = {
  smartcard: (g, color) => {
    g.append('rect').attr('x', 1.5).attr('y', 3).attr('width', 9).attr('height', 6)
      .attr('rx', 0.8).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.9);
    g.append('rect').attr('x', 1.5).attr('y', 4.2).attr('width', 9).attr('height', 1.4)
      .attr('fill', color);
    g.append('circle').attr('cx', 8.5).attr('cy', 7.2).attr('r', 0.7).attr('fill', color);
  },
  ncmc: (g, color) => {
    // Chip-style card with a small Indian-flag-ish mark (simplified as a diamond).
    g.append('rect').attr('x', 1.5).attr('y', 3).attr('width', 9).attr('height', 6)
      .attr('rx', 0.8).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.9);
    g.append('rect').attr('x', 2.5).attr('y', 4).attr('width', 2.2).attr('height', 1.6)
      .attr('rx', 0.2).attr('fill', color);
    g.append('path').attr('d', 'M7.5 5.5 L9 6.5 L7.5 7.5 L6 6.5 Z').attr('fill', color);
  },
  qrNammaMetro: (g, color) => {
    // Mini QR: three finder squares + a few modules.
    const finder = (x, y) => {
      g.append('rect').attr('x', x).attr('y', y).attr('width', 3.2).attr('height', 3.2)
        .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.7);
      g.append('rect').attr('x', x + 0.9).attr('y', y + 0.9).attr('width', 1.4).attr('height', 1.4)
        .attr('fill', color);
    };
    finder(1.5, 1.5);
    finder(7.3, 1.5);
    finder(1.5, 7.3);
    g.append('rect').attr('x', 7.5).attr('y', 7.5).attr('width', 1.2).attr('height', 1.2).attr('fill', color);
    g.append('rect').attr('x', 9.2).attr('y', 9.2).attr('width', 1.2).attr('height', 1.2).attr('fill', color);
    g.append('rect').attr('x', 7.5).attr('y', 9.2).attr('width', 1.2).attr('height', 1.2).attr('fill', color);
  },
  qrWhatsApp: (g, color) => {
    // Speech bubble with a tiny QR-ish mark inside.
    g.append('path')
      .attr('d', 'M2 2.5 h8 a1 1 0 0 1 1 1 v5 a1 1 0 0 1 -1 1 H5 L3 11.2 V9.5 H2 a1 1 0 0 1 -1 -1 v-5 a1 1 0 0 1 1 -1 z')
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.8).attr('stroke-linejoin', 'round');
    g.append('rect').attr('x', 3.5).attr('y', 4).attr('width', 2).attr('height', 2).attr('fill', color);
    g.append('rect').attr('x', 6.5).attr('y', 4).attr('width', 2).attr('height', 2).attr('fill', color);
    g.append('rect').attr('x', 3.5).attr('y', 6.5).attr('width', 2).attr('height', 1.5).attr('fill', color);
  },
  qrPaytm: (g, color) => {
    // Wallet / purse glyph.
    g.append('rect').attr('x', 1.5).attr('y', 3.5).attr('width', 9).attr('height', 6)
      .attr('rx', 1).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.9);
    g.append('path').attr('d', 'M1.5 5.5 h9').attr('stroke', color).attr('stroke-width', 0.8);
    g.append('circle').attr('cx', 8.2).attr('cy', 7.5).attr('r', 0.9)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.7);
  },
  groupTicket: (g, color) => {
    // Three little people heads/shoulders.
    const person = (cx) => {
      g.append('circle').attr('cx', cx).attr('cy', 4).attr('r', 1.3).attr('fill', color);
      g.append('path')
        .attr('d', `M${cx - 2} 9.2 Q${cx - 2} 6.5 ${cx} 6.5 Q${cx + 2} 6.5 ${cx + 2} 9.2`)
        .attr('fill', color);
    };
    person(3.2);
    person(6);
    person(8.8);
  },
  token: (g, color) => {
    // Coin / token with a hole.
    g.append('circle').attr('cx', 6).attr('cy', 6).attr('r', 4)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.9);
    g.append('circle').attr('cx', 6).attr('cy', 6).attr('r', 1.3)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.8);
  },
};

const WIDTH = 420;
const HEIGHT = 360;

// AUTO_PLAY_START: the trigger's progress (0..1) at which the
// scroll-driven day-morph BEGINS cycling. Below this progress,
// the chart sits still on the first day (Sun Dec 08) — the
// user can read the chapter lead-in and see the treemap's
// top edge emerge in the viewport without the chart already
// morphing underneath them. Once the user scrolls past this
// threshold, the auto-play starts, taking the chart through
// the 7 days in order.
//
// 0.3 means the chart is parked on day 0 (Sun Dec 08) for
// the first 30% of the trigger. With the bar trigger at
// 'top 90%' → 'top 10%' (80% of viewport), progress 0.3
// corresponds to the treemap's top at 90% - 0.3*80% = 66%
// of viewport — the lower portion of the screen, where
// the day-selector is just becoming visible. The morph
// starts when the user is reading the chart in the middle
// of the viewport, not before they've even seen the day-
// selector.
//
// Tuning rationale: the user said the auto-play was
// "settling long before the dates even appear in the
// viewport." Earlier configs (AUTO_PLAY_START = 0 or 0.1)
// had the morph running from the trigger's start, which
// meant the chart was already on day 3-4 by the time the
// day-selector was visible — the user never saw the
// animation unfold. 0.3 delays the morph so the day-
// selector appears FIRST (parked on day 0), and the morph
// runs WHILE the user is reading the chart.
const AUTO_PLAY_START = 0.3;

// AUTO_PLAY_END: the trigger's progress (0..1) at which the
// scroll-driven day-morph lands on the LAST day. Below this
// progress, the chart cycles through the 7 days in order;
// above it, the chart sits on the last day. 1.0 means the
// auto-play uses the FULL trigger range — no settle zone —
// so the morph runs from progress 0.5 all the way to 1.0
// (the trigger's end), which is the longest possible play
// zone given the lead-in. The chart lands on day 6 right
// as the user reaches the end of the trigger range, giving
// them a beat at the end to read the final mix before
// scrolling past.
const AUTO_PLAY_END = 1.0;

function formatCompact(n) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('en-IN');
}

function formatRiders(n) {
  return `${formatCompact(n)} riders`;
}

function formatDateLabel(dateStr) {
  const date = d3.timeParse('%Y-%m-%d')(dateStr);
  if (!date) return dateStr;
  return d3.timeFormat('%a, %b %d')(date);
}

// Two-line label: day-of-week on top, "Month DD" below. Returned
// as { dow, date } so the template can render them on separate
// lines. The calendar's day-of-week labels (Mon, Tue, …) live
// in a column to the LEFT of the cells; here we use the full
// weekday name (Mon, Tue, …) so each row reads as a small
// chip with the date underneath.
function formatDateParts(dateStr) {
  const date = d3.timeParse('%Y-%m-%d')(dateStr);
  if (!date) return { dow: dateStr, date: '' };
  return {
    dow: d3.timeFormat('%a')(date),  // Mon, Tue, Wed, ...
    date: d3.timeFormat('%b %d')(date),  // Dec 08, Dec 09, ...
  };
}

// Long-form date for the day-row tooltip's date line. The
// tooltip is a real card with room for full names, so the
// day-of-week reads as "Monday" (not "Mon") and the rest
// reads as "December 10, 2024" (not "Dec 08"). Matches the
// calendar tooltip's format so both popups read as one
// design language.
export function renderTreemap(container, days, stats, options = {}) {
  const { title = 'Payment Mix', yLabel = '' } = options;

  // Subtitle: the date range of the 7-day window the treemap
  // cycles through. "Nov 14 – Nov 20, 2024" reads as a small
  // chip under the title, like the other charts' date ranges.
  const firstDay = days[0]?.date;
  const lastDay = days[days.length - 1]?.date;
  const subtitle = (() => {
    if (!firstDay || !lastDay) return '';
    const a = d3.timeParse('%Y-%m-%d')(firstDay);
    const b = d3.timeParse('%Y-%m-%d')(lastDay);
    if (!a || !b) return '';
    const fmtShort = d3.timeFormat('%b %d');
    const fmtYear = d3.timeFormat('%Y');
    if (a.getFullYear() === b.getFullYear()) {
      return `${fmtShort(a)} – ${fmtShort(b)}, ${fmtYear(a)}`;
    }
    return `${fmtShort(a)}, ${fmtYear(a)} – ${fmtShort(b)}, ${fmtYear(b)}`;
  })();
  const dataMin = stats.min;
  const dataMax = stats.max;
  const dataRange = dataMax - dataMin;

  const boundaryKeys = Object.keys(stats.buckets)
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
  const boundaries = boundaryKeys.map((k) => stats.buckets[k]);
  const BUCKET_COUNT = boundaries.length + 1;

  function computeBandColors(n) {
    if (n === PURPLE_BUCKETS.length) return PURPLE_BUCKETS;
    const interp = d3.interpolateRgbBasis(PURPLE_BUCKETS);
    return d3.range(n).map((i) => interp(i / (n - 1)));
  }
  const BAND_COLORS = computeBandColors(BUCKET_COUNT);

  function bucketForValue(v) {
    if (v == null) return -1;
    for (let i = 0; i < boundaries.length; i++) {
      if (v < boundaries[i]) return i;
    }
    return boundaries.length;
  }

  function colorForValue(v) {
    const b = bucketForValue(v);
    if (b < 0) return BAND_COLORS[0];
    if (b >= BUCKET_COUNT) return BAND_COLORS[BUCKET_COUNT - 1];
    return BAND_COLORS[b];
  }

  // Set up the DOM and the reactive state up front, before any
  // d3 selection tries to read `wrapper` / `selectedDay` /
  // `selectorDays`. Without this order, those references are
  // in the temporal dead zone (TDZ) and the function throws
  // before anything renders — leaving the viz slot empty.
  const selectorDays = days;
  let selectedDay = selectorDays[0];
  const wrapper = d3
    .select(container)
    .append('div')
    .attr('class', 'treemap-wrap');

  // Title + date-range subtitle. Sits above the chart in the
  // same visual language as the dow-lines (Ch 3) and stacked-
  // area (Ch 8) charts: bold serif title with a muted mono
  // date range below. Without these, the user has no way to
  // know which 7 days the day-selector is cycling through —
  // they'd just see chips labelled "Mon / Dec 08" without a
  // framing "Nov 14 – Nov 20, 2024" telling them what window
  // they're looking at.
  const header = wrapper
    .append('div')
    .attr('class', 'treemap-header');
  header
    .append('div')
    .attr('class', 'treemap-header__title')
    .text(title);
  if (subtitle) {
    header
      .append('div')
      .attr('class', 'treemap-header__subtitle')
      .text(subtitle);
  }

  const svg = wrapper
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', `Payment-mode shares for ${selectedDay.date}. Total ${selectedDay.total.toLocaleString('en-IN')} riders.`)
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '11px');

  // Day selector: a 7-row vertical strip on the right of the
  // treemap. Each row is a "chip" with a percentile-coloured
  // 22×22 square on top and a 2-line date label below it. The
  // active row gets a 0.5px black border wrapping both the
  // square and the date label, so the selection reads as a
  // single bounded unit.
  const selector = wrapper
    .append('div')
    .attr('class', 'treemap-days');

  // Legend: payment-mode names with current-day percentages.
  const legend = wrapper
    .append('div')
    .attr('class', 'treemap-legend');

  // Segment tooltip — a small card that appears next to the
  // segment the user is hovering. Shows the channel name, the
  // raw rider count, and the percentage of that day's mix.
  // The card is positioned in screen coords (left/top) by
  // reading the hovered segment's getBoundingClientRect and
  // offsetting from the wrapper's rect. We use a single
  // shared element (not one per segment) and just update its
  // contents + position on each hover. Hidden by default.
  const tooltip = wrapper
    .append('div')
    .attr('class', 'treemap-tooltip')
    .style('opacity', 0)
    .style('pointer-events', 'none');

  // Day rows: hover is the only interaction. Hovering a
  // row drives the chart to that day's mix; the same row
  // gets a 0.5px black box drawn around the chip (square
  // + date label) so the "this is the day the chart is
  // showing" marker is unambiguous.
  //
  // The box persists after mouseleave: a JS-tracked
  // `selectedDay` records the most recently hovered day,
  // and a `.treemap-day-row--active` class is applied to
  // that row. The CSS :hover state and the --active class
  // are both drawn (a hovered row gets both, a non-hovered-
  // but-active row gets just the box).
  //
  // Hover is an OVERRIDE on the scroll-driven auto-play:
  // when the chart comes into view, the auto-play cycles
  // through the 7 days. When the user hovers a day, the
  // chart morphs to that day. On mouseleave, the chart
  // RESUMES the auto-play from the current scroll position
  // (rather than staying on the hovered day) — so the
  // user can sample a specific day but the page's overall
  // scroll-narrative keeps moving forward.
  const dayRows = selector
    .selectAll('div.treemap-day-row')
    .data(selectorDays)
    .join('div')
    .attr('class', 'treemap-day-row')
    .attr('aria-label', (d) => `${formatDateLabel(d.date)}, ${formatRiders(d.total)}`)
    .on('mouseenter', function (_event, d) {
      // Hover selection: the chart morphs to this day's mix
      // and the row gets the --active class so the box
      // follows. (The CSS :hover state ALSO fires on this
      // row while the cursor is on it — both visual states
      // overlap.) Setting `hoveredDay` makes the auto-play's
      // `update(progress)` a no-op — the auto-play yields
      // to the user's selection and never resumes.
      // Otherwise, the auto-play's next onUpdate call
      // (triggered by any tiny scroll change — including
      // the smooth-scroll lag from scrub) would snap the
      // chart back to the auto-play's day and override
      // the user's selection.
      hoveredDay = d;
      selectedDay = d;
      updateDaySelector();
      renderDay(d);
    });
    // (No `mouseleave` handler: the selection is sticky.
    // Once the user hovers a day, that day stays selected
    // for the rest of the session. The user said hovering
    // a date should "treat that as selected" — i.e. the
    // chart should not snap back to the previous selection
    // (the auto-play's day) when the mouse moves away.
    // To reset to the auto-play's day, reload the page or
    // hover day 0 again at the start of the chapter.)
  // (No `click` / `keydown` handlers: hover is the only
  // selection interaction.)

  function updateDaySelector() {
    dayRows.classed('treemap-day-row--active', (d) => d.date === selectedDay.date);
  }

  // The date label sits BELOW the square. Two lines: day-of-week
  // on top, "Month DD" below. The hovered row's chip (square +
  // label) is bordered to show the selection (CSS :hover).
  const dayLabel = dayRows
    .append('div')
    .attr('class', 'treemap-day-row__label');
  dayLabel
    .append('span')
    .attr('class', 'treemap-day-row__dow')
    .text((d) => formatDateParts(d.date).dow);
  dayLabel
    .append('span')
    .attr('class', 'treemap-day-row__date')
    .text((d) => formatDateParts(d.date).date);

  const dayButtons = dayRows
    .append('button')
    .attr('class', 'treemap-day')
    .attr('type', 'button')
    .style('background', (d) => colorForValue(d.total));

  // Tiny SVG-icon patterns used as rect fills. Transparent tile bg so
  // rotation doesn't leave seams; paper base lives on the segment rect.
  // Each channel is set at a different angle for a denser, less formal look.
  const ICON_ANGLES = [-28, 18, -12, 32, -22, 8, -35];
  const defs = svg.append('defs');
  CHANNELS.forEach((c, i) => {
    const angle = ICON_ANGLES[i % ICON_ANGLES.length];
    const tile = 7; // very dense packing of tiny icons
    const pat = defs
      .append('pattern')
      .attr('id', `treemap-pat-${c.key}`)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', tile)
      .attr('height', tile)
      .attr('patternTransform', `rotate(${angle})`);
    const g = pat
      .append('g')
      .attr('transform', 'translate(0.3,0.3) scale(0.5)');
    const draw = ICONS[c.key];
    if (draw) draw(g, c.color);
  });

  const treemapGroup = svg.append('g')
    .attr('class', 'treemap-chart');

  // Day selector: a vertical strip on the right of the
  // treemap, one row per day in `days`. The caller picks the
  // window — pass any 7 days (e.g. `daily.slice(-7)` for the
  // last week, or a filtered window for a specific range).
  // Each row is a "chip" with a percentile-coloured 22×22
  // square on top and a 2-line date label (day-of-week +
  // "Month DD") below. The active row gets a 0.5px black
  // border wrapping both the square and the date label, so
  // the selection reads as a single bounded unit.
  //
  // (selectorDays / selectedDay / wrapper are declared near
  // the top of the function so any d3 selection can read
  // them without hitting a TDZ ReferenceError.)

  let hoverKey = null;
  let lastProgress = 0;
  // hoveredDay: set to the day-row's data object the first
  // time the user hovers a day-selector row, and stays set
  // for the rest of the session. When non-null, the auto-
  // play's `update(progress)` is a no-op — the user's
  // selection is permanent and the auto-play never resumes.
  // The user said hovering a date should "treat that as
  // selected" — i.e. the chart should not snap back to the
  // auto-play's day when the mouse moves away. Without
  // this flag, the auto-play's per-frame `update(progress)`
  // call (fired by the scroll trigger's scrub) would snap
  // the chart back to the auto-play's day and the user's
  // hover would have no visible effect. The sticky flag
  // means: once you hover, the chart stays on that day
  // regardless of scroll. To reset, reload the page (or
  // implement an explicit "release" gesture later).
  let hoveredDay = null;

  function setHover(key) {
    hoverKey = key;
    legend
      .selectAll('.treemap-legend__item')
      .classed('treemap-legend__item--active', (d) => d && d.key === key);
    treemapGroup
      .selectAll('g.segment')
      .classed('segment--active', (d) => d && d.data.key === key)
      .classed('segment--dim', (d) => key != null && d && d.data.key !== key);
  }

  function clearHover() {
    setHover(null);
  }

  // Segment tooltip. Builds a compact card with the channel
  // name, raw rider count, percentage of that day's mix, and
  // the day's full date. Positioned to the right of the
  // hovered segment by default; flips to the left if the
  // segment is on the right half of the chart (so the
  // tooltip never falls off the right edge of the chart
  // container). The card sits in screen coords relative to
  // the wrapper — top/left in pixels, not SVG units.
  function showSegmentTooltip(segmentEl, d, day) {
    const value = d.data.value;
    const pct = day.total ? (value / day.total) * 100 : 0;
    const fullDate = d3.timeParse('%Y-%m-%d')(day.date);
    const longDate = fullDate
      ? d3.timeFormat('%A, %B %d, %Y')(fullDate)
      : day.date;

    tooltip
      .html(
        `<div class="treemap-tooltip__head">
           <span class="treemap-tooltip__swatch" style="background:${d.data.color}"></span>
           <span class="treemap-tooltip__name">${d.data.label}</span>
         </div>
         <div class="treemap-tooltip__date">${longDate}</div>
         <div class="treemap-tooltip__row">
           <span class="treemap-tooltip__num">${value.toLocaleString('en-IN')}</span>
           <span class="treemap-tooltip__unit">riders</span>
         </div>
         <div class="treemap-tooltip__pct">${pct.toFixed(1)}% of day</div>`
      )
      .style('opacity', 1);

    // Position relative to the wrapper. Get the segment's
    // bounding rect in viewport coords, subtract the wrapper's
    // rect to get coords inside the wrapper, then offset to
    // place the tooltip just outside the segment's right
    // (or left) edge.
    const segRect = segmentEl.getBoundingClientRect();
    const wrapRect = wrapper.node().getBoundingClientRect();
    const segCx = (segRect.left + segRect.right) / 2 - wrapRect.left;
    const segCy = (segRect.top + segRect.bottom) / 2 - wrapRect.top;
    // The tooltip's own size isn't known until it renders; use
    // a generous estimate (the card is ~180px wide, ~110px tall)
    // to decide which side to place it on.
    const tooltipW = 200;
    const tooltipH = 120;
    const preferRight = segCx < wrapRect.width / 2;
    const left = preferRight
      ? segRect.right - wrapRect.left + 12
      : segRect.left - wrapRect.left - tooltipW - 12;
    const top = Math.max(8, segCy - tooltipH / 2);
    tooltip.style('left', `${left}px`).style('top', `${top}px`);
  }

  function hideSegmentTooltip() {
    tooltip.style('opacity', 0);
  }

  function renderDay(day) {
    // CHANNELS is in the editorial order (Smart Card, Tokens,
    // Whatsapp, Metro QR, Paytm, NCMC, Group Ticket). The
    // treemap keeps that order via `.sort((a, b) =>
    // a.data.order - b.data.order)` instead of sorting by
    // value-descending — so the rectangles land in a fixed
    // sequence across days, not a reshuffled ranking. The
    // `order` field is set below when we build `data`.
    const data = CHANNELS
      .map((c, i) => ({ ...c, value: day[c.key] || 0, order: i }))
      .filter((d) => d.value > 0);

    const root = d3.hierarchy({ children: data })
      .sum((d) => d.value)
      .sort((a, b) => a.data.order - b.data.order);

    // Smaller gap keeps rectangles visually detached but tighter.
    d3.treemap()
      .size([WIDTH, HEIGHT])
      .paddingInner(3)
      .paddingOuter(2)
      .round(true)(root);

    const leaves = root.leaves();

    const t = treemapGroup.transition().duration(600).ease(d3.easeCubicOut);

    // One group per payment mode: paper base + icon pattern fill.
    const segments = treemapGroup
      .selectAll('g.segment')
      .data(leaves, (d) => d.data.key)
      .join(
        (enter) => {
          const g = enter
            .append('g')
            .attr('class', 'segment')
            .attr('data-key', (d) => d.data.key)
            .style('cursor', 'pointer');
          g.append('rect')
            .attr('class', 'segment-base')
            .attr('x', (d) => d.x0)
            .attr('y', (d) => d.y0)
            .attr('width', (d) => Math.max(0, d.x1 - d.x0))
            .attr('height', (d) => Math.max(0, d.y1 - d.y0))
            .attr('fill', 'var(--paper, #f7f3ee)')
            .attr('stroke', 'none')
            .attr('rx', 2)
            .attr('ry', 2);
          g.append('rect')
            .attr('class', 'segment-fill')
            .attr('x', (d) => d.x0)
            .attr('y', (d) => d.y0)
            .attr('width', (d) => Math.max(0, d.x1 - d.x0))
            .attr('height', (d) => Math.max(0, d.y1 - d.y0))
            .attr('fill', (d) => `url(#treemap-pat-${d.data.key})`)
            .attr('stroke', 'none')
            .attr('rx', 2)
            .attr('ry', 2);
          return g;
        },
        (update) => update,
        (exit) => exit.remove()
      );

    segments.select('rect.segment-base')
      .transition(t)
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0));

    segments.select('rect.segment-fill')
      .transition(t)
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0));

    segments
      .on('mouseenter', function (_event, d) {
        setHover(d.data.key);
        showSegmentTooltip(this, d, day);
      })
      .on('mouseleave', function () {
        clearHover();
        hideSegmentTooltip();
      });

    updateLegend(day);
    // (No `update(lastProgress)` here — that would re-apply
    // the auto-play's day and override the hover selection
    // the caller just set. The auto-play's next onUpdate
    // call (from a scroll tick) will fire normally and the
    // hoveredDay check in `update` will keep the chart on
    // the hovered day until the user mouseleave's.)
    if (hoverKey) setHover(hoverKey);
  }

  function updateLegend(day) {
    // Legend reads CHANNELS in their editorial order (Smart
    // Card, Tokens, Whatsapp, Metro QR, Paytm, NCMC, Group
    // Ticket). No descending-by-percentage sort — the
    // percentage is just the live numeric that updates next
    // to each label, but the rows themselves stay in the
    // fixed sequence. The reader can scan top-to-bottom and
    // find each mode in the same place regardless of which
    // day is selected.
    const items = legend
      .selectAll('div.treemap-legend__item')
      .data(CHANNELS, (c) => c.key)
      .join(
        (enter) => {
          const row = enter
            .append('div')
            .attr('class', 'treemap-legend__item')
            .attr('data-key', (c) => c.key)
            .style('cursor', 'pointer');
          row.append('span')
            .attr('class', 'treemap-legend__label')
            .style('color', (c) => c.color)
            .text((c) => c.label);
          row.append('span').attr('class', 'treemap-legend__pct');
          return row;
        },
        (update) => update,
        (exit) => exit.remove()
      );

    // Keep DOM in CHANNELS order (no-op when already there,
    // but defensive against any future data-driven reorders).
    items.order();

    items.each(function (c) {
      const value = day[c.key] || 0;
      const pct = day.total ? (value / day.total) * 100 : 0;
      const row = d3.select(this);
      row.select('.treemap-legend__label').text(c.label).style('color', c.color);
      row.select('.treemap-legend__pct').text(`${pct.toFixed(1)}%`);
    });

    items
      .on('mouseenter', function (_event, c) {
        setHover(c.key);
      })
      .on('mouseleave', function () {
        clearHover();
      });
  }

  function update(progress) {
    // Auto-play: the chart cycles through the 7 days as the
    // user scrolls the chapter into view, suggesting how the
    // combination of payment methods changes day on day.
    //
    // Three zones in the trigger's progress (0..1):
    //   1. LEAD-IN (progress < AUTO_PLAY_START = 0.3):
    //      chart sits still on day 0 (Sun Dec 08). The
    //      user reads the chapter lead-in and watches the
    //      treemap's top edge emerge in the viewport, with
    //      the day-0 chip lit and the chart at rest. By
    //      the end of the lead-in (treemap's top at ~66%
    //      of viewport), the day-selector is just becoming
    //      visible. The morph hasn't started yet, so the
    //      user has time to register that the chart is on
    //      day 0 before the day-cycling begins.
    //   2. PLAY (AUTO_PLAY_START → AUTO_PLAY_END = 0.3..1.0):
    //      chart cycles through all 7 days. The progress
    //      inside this zone is mapped linearly to the day
    //      index, so day 0 is at the start of the zone and
    //      day 6 is at the end. The morph runs WHILE the
    //      user is reading the chart (the day-selector is
    //      visible throughout), so each day-morph happens
    //      in the user's reading flow rather than before
    //      they've seen the day-selector.
    //   3. SETTLE (progress >= AUTO_PLAY_END = 1.0):
    //      effectively unreachable now that AUTO_PLAY_END =
    //      1.0 — the chart lands on day 6 exactly at the
    //      trigger's end. Kept as a safety branch in case
    //      AUTO_PLAY_END is dialed back below 1.0 later.
    //
    // Hover override: if the user is currently hovering a
    // day-selector row, the auto-play yields — the chart
    // stays on the hovered day regardless of scroll. The
    // user's selection is preserved across scroll events
    // (the trigger keeps firing onUpdate on every scroll
    // tick, but the no-op short-circuits it). lastProgress
    // IS still updated so that when the user mouseleave's,
    // the auto-play resumes from the current scroll
    // position, not from wherever it was last.
    lastProgress = progress;
    if (hoveredDay) return;
    const p = Math.max(0, Math.min(1, progress));
    let dayIdx;
    if (p < AUTO_PLAY_START) {
      dayIdx = 0;
    } else if (p >= AUTO_PLAY_END) {
      dayIdx = selectorDays.length - 1;
    } else {
      const playProgress = (p - AUTO_PLAY_START) / (AUTO_PLAY_END - AUTO_PLAY_START);
      dayIdx = Math.min(
        selectorDays.length - 1,
        Math.floor(playProgress * selectorDays.length),
      );
    }
    // Only update if the day actually changed — avoids a
    // redundant renderDay call when the chart is parked on
    // a day and the trigger keeps firing.
    if (selectorDays[dayIdx].date !== selectedDay.date) {
      selectedDay = selectorDays[dayIdx];
      updateDaySelector();
      renderDay(selectedDay);
    }
  }

  renderDay(selectedDay);
  // Initial state: the first day is the default selection,
  // so the box is drawn around it from the moment the
  // treemap mounts. Hovering any other row moves the box
  // to that row.
  updateDaySelector();

  function destroy() {
    wrapper.remove();
  }

  return { update, destroy };
}
