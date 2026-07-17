// viz/treemap.js — payment-mode treemap with a 7-day selector.
//
// Renders a treemap where each rectangle is a payment mode, sized by its
// share of the selected day's ridership. Along the right edge, a vertical
// strip shows the last 7 days in the dataset as small coloured squares,
// using the same percentile bucket colours as the calendar-strip cells.
// Clicking a square updates the treemap to that day.

import * as d3 from 'd3';

const PURPLE_BUCKETS = ['#ead7f3', '#d4b0e6', '#c08bd6', '#a96cc5', '#8e4bb0', '#7a3fa8', '#5E2D8C'];

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
// Each channel has two colour fields:
//   - color:  the icon's stroke / fill (the channel's
//             "brand" colour). Used by the legend label
//             and the icon pattern inside the rectangle.
//   - bgColor: a light tint of `color` (mixed ~88% toward
//             paper / white) used as the rectangle's base
//             fill. Tinting the base with the channel's
//             own colour — instead of using flat paper —
//             lets the reader identify each rectangle at
//             a glance even before reading the legend:
//             the smartcard area reads as a pale violet
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
// rectangle is the smartcard area", subtle enough that the
// icon pattern on top still dominates.
const TREEMAP_PAPER = '#f7f3ee';
const BG_TINT = 0.12;

// Precompute bgColor on each channel. d3.interpolateRgb
// mixes in linear-RGB space (closer to how the eye
// perceives colour) so the tints don't look muddy. We do
// this once at module init rather than inside the render
// loop, since the channel colours are static.
for (const c of CHANNELS) {
  c.bgColor = d3.interpolateRgb(TREEMAP_PAPER, c.color)(BG_TINT);
}

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
export function renderTreemap(container, days, stats) {
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

  // Day rows: hover drives the chart; click does the same
  // (so keyboard / touch users get the same interaction).
  // The active-row border on click is a small "locked in"
  // indicator — the chart already follows the cursor on
  // hover, so click doesn't change the visual chart state,
  // it just adds the border. No tooltip on hover — the
  // day-row labels already read as "Mon / Dec 08" and the
  // rectangles' tinted backgrounds read as "this is the
  // Smart Card area", so a popup would only duplicate
  // what's already visible. (The tooltip was tried in
  // v0.17 but its only good place to hang was inside the
  // chart, where it covered the rectangles — gone in
  // v0.18.)
  const dayRows = selector
    .selectAll('div.treemap-day-row')
    .data(selectorDays)
    .join('div')
    .attr('class', 'treemap-day-row')
    .attr('role', 'button')
    .attr('tabindex', 0)
    .attr('aria-label', (d) => `${formatDateLabel(d.date)}, ${formatRiders(d.total)}`)
    .on('mouseenter', function (_event, d) {
      // Live-preview: the chart morphs to this day's mix on
      // hover. The active-row border (set by click) does NOT
      // change on hover — the border is the "locked in"
      // marker, separate from "what the chart is currently
      // showing".
      renderDay(d);
    })
    .on('mouseleave', function () {
      // No tooltip to fade; the chart stays on the
      // last-hovered day. The user can keep reading the
      // chart as they move toward the legend or the
      // article body.
    })
    .on('click', function (_event, d) {
      selectedDay = d;
      updateSelector();
      renderDay(d);
    })
    .on('keydown', function (event, d) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectedDay = d;
        updateSelector();
        renderDay(d);
      }
    });

  // The date label sits BELOW the square. Two lines: day-of-week
  // on top, "Month DD" below. The active row's chip (square +
  // label) is bordered to show the selection.
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

  function updateSelector() {
    dayRows.classed('treemap-day-row--active', (d) => d.date === selectedDay.date);
  }

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

  function segmentTransform() {
    return (d) => {
      const cx = d.x0 + (d.x1 - d.x0) / 2;
      const cy = d.y0 + (d.y1 - d.y0) / 2;
      const scale = 0.5 + lastProgress * 0.5;
      return `translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})`;
    };
  }

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
            .attr('fill', (d) => d.data.bgColor)
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
      })
      .on('mouseleave', function () {
        clearHover();
      });

    updateLegend(day);
    update(lastProgress);
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
    lastProgress = progress;
    treemapGroup
      .selectAll('g.segment')
      .attr('opacity', progress)
      .attr('transform', segmentTransform());
  }

  updateSelector();
  renderDay(selectedDay);

  function destroy() {
    wrapper.remove();
  }

  return { update, destroy };
}
