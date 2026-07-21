// viz/extreme-days.js — top-10 + bottom-10 days, vertical "overlapping
// pairs" barchart.
//
// The story: ridership spans an enormous range. The 10 busiest days in
// the editorial window are clustered around 8.5–9.1L; the 10 least busy
// days are clustered around 4.0–5.0L. A 2× difference, with the
// "typical day" (median ≈ 8.0L) sitting closer to the busy end than
// the quiet end.
//
// The chart: 10 PAIRS of vertical bars, one pair per rank (1..10).
// Within each pair, the busy bar (descending: tallest at rank 1,
// shortest at rank 10) and the quiet bar (ascending: shortest at
// rank 1, tallest at rank 10) share the same x-position and
// baseline, and OVERLAP in the y-direction. The busy bar is drawn
// first (back, BMRCL purple); the quiet bar is drawn on top
// (front, muted blue) at full opacity. The two are differentiated
// by colour rather than transparency: the busy is purple, the
// quiet is blue, and the user reads the overlap as the
// coexistence of the two distributions. The combined top profile
// forms a U-shape (or W, depending on the data): tall on both
// ends, dipping in the middle — a visual pun on the "busy
// cluster" and "quiet cluster" being two separate worlds.
//
// Why overlapping (and not stacked or grouped)?
//   - A side-by-side / grouped layout would double the visual
//     width and bury the relationship between busy and quiet
//     ranks.
//   - A stacked layout (one on top of the other) would make the
//     quiet bars "free" (the busy bar provides the baseline) and
//     would obscure the absolute comparison.
//   - Overlapping puts the two distributions on the same x-axis
//     and same baseline, so the eye reads "rank 1 = tallest busy
//     AND shortest quiet" as a single composite fact. The
//     X-shape of the two top edges is the visual: the busy
//     descending staircase on one side, the quiet ascending
//     staircase on the other, crossing in the middle.
//
// Chart anatomy:
//   - 10 x-positions (one per rank, 1..10).
//   - At each x: a busy bar (dark purple, drawn first) and a
//     quiet bar (light pinkish lavender, drawn on top, full opacity).
//     Quiet bars have a white 1px top/left border and a black
//     1px bottom/right border; busy bars have no border.
//   - 20 date labels (one per bar, 2 lines each: short day-of-
//     week on top, "Mon DD" below), anchored to the top of each
//     bar and fade in once the bar reaches its final height.
//   - A minimal skeleton: only Min, Max and Median reference
//     lines are visible before the reveal.
//   - Y-axis: 0 to dataset max; the only drawn rules are the
//     Min, Max and Median reference lines, rendered on top of
//     the bars so they stay readable.
//   - A legend at the bottom with three entries: busy swatch,
//     quiet swatch, reference-line dashed segment.
//
// Scroll integration: the chart's "ruler" (axis, gridlines,
// median line, slot outlines) is visible as soon as the chart
// is in the document. When the chart's base (the x-axis at the
// bottom of the drawing area) crosses the viewport bottom, all
// 20 bars spring into place via GSAP. The spring is a slight
// overshoot — each bar overshoots its target by ~7% and settles
// back, giving the chart a "snap into focus" feel rather than a
// gradual grow. If the user scrolls back up past the chart base,
// the bars spring back down to their hidden state. The 20 bars
// cascade in two groups: the 10 busy bars first (rank 1 → 10),
// then the 10 quiet bars (rank 1 → 10). The per-bar stagger is
// ~30ms, so the full sequence takes ~600ms to settle. There is no
// scroll-driven height mapping — the bars are at their final values
// as soon as the spring fires. This avoids the "user is reading
// a chart whose bars haven't grown to full size" failure mode of
// the previous scroll-driven grow.

import * as d3 from 'd3';
import { gsap, ScrollTrigger } from '@thecontrarian/scrollytelling-core';

const WIDTH = 960;
const HEIGHT = 800;
const PADDING_TOP = 48;
const PADDING_BOTTOM = 60;
const PADDING_LEFT = 80;
const PADDING_RIGHT = 32;
const N_PAIRS = 10;
// 5px right-offset on the quiet bar so the two distributions
// don't read as "stacked" (one above the other on the same
// x) — the horizontal nudge makes the busy/quiet pair look
// like a true side-by-side, with the front (quiet) bar
// visually shifted half a step right of the back (busy) bar.
const QUIET_OFFSET_X = 5;
const PAIR_GAP = 8;          // horizontal gap between pairs

const ACCENT = '#5E2D8C';    // dark purple — high/busy values
const ACCENT2 = '#d4bee0';   // light pinkish lavender — low/quiet values
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const GRID = 'rgba(0, 0, 0, 0.08)';
const MEDIAN = '#7a3fa8';    // medium purple for Min/Max/Med reference lines

const QUIET_BORDER_TOPLEFT = '#fff';
const QUIET_BORDER_BOTTOMRIGHT = '#000';

// Namma Metro purple scale — same 5 anchors used by the calendar
// chart. The 5 anchors are sampled to produce N bands (driven by
// the notebook's bucket count in daily-stats.json). The bar
// chart's tooltip reuses the same anchors and the same band
// interpolation so the tooltip's banded background matches the
// calendar's tooltip exactly — same colours, same band positions.
// (Same anchors also live in calendar-strip.js and treemap.js;
// kept in sync by hand. A future refactor could move this to a
// shared `palette.js` module.)
const PURPLE_BUCKETS = [
  '#f2ecf4',  // 0 — almost paper, just a whisper of purple
  '#d4bee0',  // 1 — light lavender
  '#a37ac0',  // 2 — medium wisteria
  '#7a3fa8',  // 3 — deep violet
  '#5E2D8C',  // 4 — BMRCL purple
];

const BAR_MIN_PCT = 4;   // tooltip bar's floor (matches calendar)

/**
 * Render the overlapping-pairs barchart.
 *
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} daily - all daily records
 * @param {Object} options
 *   - {number} median - the dataset's median ridership, pre-computed
 *     by the notebook (stats.median in daily-stats.json)
 *   - {number} max - the dataset's max ridership, pre-computed
 *     (stats.max in daily-stats.json). Used to set the y-axis
 *     domain so all 20 bars fit on a shared scale.
 *   - {number} [min] - the dataset's min ridership, pre-computed
 *     (stats.min in daily-stats.json). Used for the tooltip's
 *     value-to-position mapping. Falls back to the smallest
 *     value in `daily` if not provided.
 *   - {Object} [buckets] - bucket boundaries, e.g.
 *     { p2, p5, p10, p25, p50, p75, p90, p95, p98 }. Used for
 *     the tooltip's banded background. Falls back to a single
 *     band (no boundaries) if not provided.
 * @returns {{ update, destroy }}
 */
export function renderExtremeDays(container, daily, options = {}) {
  const {
    median = 800000,
    max = 920000,
    min: dataMinOpt,
    buckets: bucketBoundaries,
  } = options;
  // Compute dataMin from the daily array if not provided. This
  // is the floor of the tooltip's value space — the bar at the
  // dataset's smallest value sits at BAR_MIN_PCT (4%) of the
  // tooltip chart's height, the same floor the calendar tooltip
  // uses.
  const dataMin = dataMinOpt != null
    ? dataMinOpt
    : Math.min(...daily.map((d) => d.total));
  const dataMax = max;
  const dataRange = dataMax - dataMin;

  // Sort the full daily array descending by ridership, then take
  // the top 10 as "busy" and bottom 10 (re-sorted ascending) as
  // "quiet". We pair by rank: pair k is the k-th busiest day and
  // the k-th quietest day. So at pair 1, busy is the tallest and
  // quiet is the shortest; at pair 10, busy is the 10th-tallest
  // and quiet is the 10th-shortest.
  const sortedDesc = [...daily].sort((a, b) => b.total - a.total);
  const busy = sortedDesc.slice(0, N_PAIRS);
  const quiet = sortedDesc.slice(-N_PAIRS).reverse();   // ascending: quietest first

  // Y-axis: 0 → max. Round the max UP to the next lakh for a
  // clean gridline.
  const maxAxis = Math.ceil(max / 100000) * 100000;
  const innerW = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const innerH = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const x = (i) => {
    // Slot width = innerW / N_PAIRS. Center the bar within the
    // slot. With PAIR_GAP between slots, the visible bar is
    // (slotW - PAIR_GAP) wide.
    const slotW = innerW / N_PAIRS;
    return PADDING_LEFT + i * slotW + slotW / 2;
  };
  const slotW = innerW / N_PAIRS;
  const barW = slotW - PAIR_GAP;
  const y = d3.scaleLinear()
    .domain([0, maxAxis])
    .range([PADDING_TOP + innerH, PADDING_TOP]);

  const svg = d3.select(container)
    .append('svg')
    .attr('class', 'extreme-days-svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', `Top 10 and bottom 10 days, vertical overlapping pairs. ${N_PAIRS} pairs.`)
    .attr('shape-rendering', 'geometricPrecision')
    .style('width', '100%')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

  // Chart title and subtitle (date range of the supplied dataset).
  const dateExtent = d3.extent(daily, (d) => new Date(d.date));
  const dateFmt = d3.timeFormat('%b %d, %Y');
  const titleCenterX = PADDING_LEFT + (WIDTH - PADDING_LEFT - PADDING_RIGHT) / 2;
  const titleGroup = svg.append('g').attr('class', 'extreme-days__title');
  titleGroup.append('text')
    .attr('x', titleCenterX)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', 18)
    .attr('font-weight', 700)
    .attr('fill', ACCENT)
    .text('10 Busiest and 10 Quietest Days');
  titleGroup.append('text')
    .attr('x', titleCenterX)
    .attr('y', 46)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 500)
    .attr('fill', ACCENT)
    .text(`${dateFmt(dateExtent[0])} – ${dateFmt(dateExtent[1])}`);

  // The empty chart shows only three reference lines: Min, Max
  // and Median. Everything else (bars, date labels, title)
  // is hidden until the sprint-in fires. The reference lines are
  // drawn after the bars so they remain visible once the bars land.

  // Pairs. Each pair has:
  //   - a busy bar (back, dark purple, full barW)
  //   - a quiet bar (front, light pinkish lavender, full opacity, full barW,
  //     drawn AFTER busy so it sits on top).
  // The two bars share the same x (slot centre) and the same
  // baseline (y(0)). The busy descending and quiet ascending
  // top edges form the visual "X" / hourglass.
  const pairsData = busy.map((b, i) => ({ busy: b, quiet: quiet[i], rank: i + 1 }));

  const pairGroup = svg.append('g').attr('class', 'extreme-days__pairs');

  const pairNodes = pairGroup
    .selectAll('g.pair')
    .data(pairsData)
    .join('g')
    .attr('class', 'pair')
    .attr('data-rank', (d) => d.rank)
    .attr('transform', (d) => `translate(${x(d.rank - 1) - barW / 2}, 0)`);

  // Busy bar (back). Drawn first.
  const busyBars = pairNodes.append('rect')
    .attr('class', 'pair__busy')
    .attr('x', 0)
    .attr('y', y(0))
    .attr('width', barW)
    .attr('height', 0)
    .attr('fill', ACCENT)
    .attr('rx', 1);

  // Quiet bar (front). Drawn second at full opacity; the
  // quiet is in a different colour from the busy, so the
  // overlap is read by colour rather than transparency. Where
  // the quiet is taller than the busy, the quiet's top edge
  // is the visible edge of the pair; where the busy is taller,
  // the busy's top edge shows above the quiet. The quiet is
  // offset 5px right of the busy (QUIET_OFFSET_X) so the two
  // bars don't read as "stacked" — the horizontal nudge
  // makes the pair look like a true side-by-side, with the
  // front (quiet) bar visually shifted half a step right of
  // the back (busy) bar.
  const quietBars = pairNodes.append('rect')
    .attr('class', 'pair__quiet')
    .attr('x', QUIET_OFFSET_X)
    .attr('y', y(0))
    .attr('width', barW)
    .attr('height', 0)
    .attr('fill', ACCENT2);

  // Quiet bar borders: white 1px lines on top/left, black 1px
  // lines on bottom/right, giving the bar a raised tile look.
  // The lines are drawn inside the pair group and animated with
  // the bar. pointer-events: none so they don't steal hovers.
  const quietBorderGroups = pairNodes.append('g')
    .attr('class', 'pair__quiet-borders')
    .style('pointer-events', 'none');
  const quietBorderTop = quietBorderGroups.append('line')
    .attr('class', 'pair__quiet-border-top')
    .attr('stroke', QUIET_BORDER_TOPLEFT)
    .attr('stroke-width', 1)
    .attr('x1', QUIET_OFFSET_X)
    .attr('x2', QUIET_OFFSET_X + barW)
    .attr('y1', y(0))
    .attr('y2', y(0));
  const quietBorderLeft = quietBorderGroups.append('line')
    .attr('class', 'pair__quiet-border-left')
    .attr('stroke', QUIET_BORDER_TOPLEFT)
    .attr('stroke-width', 1)
    .attr('x1', QUIET_OFFSET_X)
    .attr('x2', QUIET_OFFSET_X)
    .attr('y1', y(0))
    .attr('y2', y(0));
  const quietBorderBottom = quietBorderGroups.append('line')
    .attr('class', 'pair__quiet-border-bottom')
    .attr('stroke', QUIET_BORDER_BOTTOMRIGHT)
    .attr('stroke-width', 1)
    .attr('x1', QUIET_OFFSET_X)
    .attr('x2', QUIET_OFFSET_X + barW)
    .attr('y1', y(0))
    .attr('y2', y(0));
  const quietBorderRight = quietBorderGroups.append('line')
    .attr('class', 'pair__quiet-border-right')
    .attr('stroke', QUIET_BORDER_BOTTOMRIGHT)
    .attr('stroke-width', 1)
    .attr('x1', QUIET_OFFSET_X + barW)
    .attr('x2', QUIET_OFFSET_X + barW)
    .attr('y1', y(0))
    .attr('y2', y(0));

  // Date labels — one per bar (20 total: 10 busy + 10 quiet).
  // Each label sits just below its bar's top, in two lines:
  //   Line 1: short day-of-week (e.g. "Mon")
  //   Line 2: month-day (e.g. "Jan 27")
  // The labels are anchored to the bar tops so they fade in
  // once the bars spring into place. The busy label is white
  // (sits on the dark purple busy bar); the quiet label is
  // dark purple (sits on the light pinkish quiet bar). Both
  // labels are tucked just below the top of their respective
  // bars, leaving the bar's body as the primary "fill" and
  // the date as a small caption.
  const dowFmt = d3.timeFormat('%a');
  const monthDayFmt = d3.timeFormat('%b %d');
  const labelInset = 6;    // px below the bar's top
  const labelLineGap = 13; // px between line 1 and line 2

  // Busy date labels (drawn last so they sit on top of the
  // busy bar). The label sits INSIDE the bar, just below the
  // top, in white text. It is already positioned at the final
  // bar top and simply fades in once the bar springs in.
  const busyLabels = pairNodes.append('g')
    .attr('class', 'pair__label-busy-group')
    .attr('transform', (d) => `translate(${barW / 2}, ${y(d.busy.total) + labelInset})`);
  busyLabels.append('text')
    .attr('class', 'pair__label-busy-dow')
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .attr('font-weight', 600)
    .attr('fill', '#fff')
    .attr('letter-spacing', '0.04em')
    .attr('dy', '0.85em')
    .text((d) => dowFmt(new Date(d.busy.date)));
  busyLabels.append('text')
    .attr('class', 'pair__label-busy-date')
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 500)
    .attr('fill', '#fff')
    .attr('fill-opacity', 0.95)
    .attr('y', labelLineGap)
    .attr('dy', '0.85em')
    .text((d) => monthDayFmt(new Date(d.busy.date)));

  // Quiet date labels — same pattern, drawn after the busy
  // labels so they sit on top of the quiet bar. Dark text so
  // it reads on the light pinkish background.
  const quietLabels = pairNodes.append('g')
    .attr('class', 'pair__label-quiet-group')
    .attr('transform', (d) => `translate(${barW / 2 + QUIET_OFFSET_X}, ${y(d.quiet.total) + labelInset})`);
  quietLabels.append('text')
    .attr('class', 'pair__label-quiet-dow')
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .attr('font-weight', 600)
    .attr('fill', ACCENT)
    .attr('letter-spacing', '0.04em')
    .attr('dy', '0.85em')
    .text((d) => dowFmt(new Date(d.quiet.date)));
  quietLabels.append('text')
    .attr('class', 'pair__label-quiet-date')
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 500)
    .attr('fill', ACCENT)
    .attr('fill-opacity', 0.95)
    .attr('y', labelLineGap)
    .attr('dy', '0.85em')
    .text((d) => monthDayFmt(new Date(d.quiet.date)));

  // Reference lines: Min, Max and Median. Drawn on top of the
  // bars so they stay visible after the sprint-in. Labels sit
  // just to the left of the chart body.
  const refGroup = svg.append('g')
    .attr('class', 'extreme-days__reference-lines')
    .style('pointer-events', 'none');

  const refLines = [
    { key: 'min', value: dataMin, line: MEDIAN, label: ACCENT },
    { key: 'max', value: dataMax, line: MEDIAN, label: ACCENT },
    { key: 'med', value: median, line: MEDIAN, label: ACCENT },
  ];
  for (const r of refLines) {
    const yy = y(r.value);
    const label = `${r.key.toUpperCase()} ${(r.value / 100000).toFixed(1)}L`;
    refGroup.append('line')
      .attr('x1', PADDING_LEFT)
      .attr('x2', PADDING_LEFT + innerW)
      .attr('y1', yy)
      .attr('y2', yy)
      .attr('stroke', r.line)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 2');
    refGroup.append('text')
      .attr('x', PADDING_LEFT - 10)
      .attr('y', yy + 12)
      .attr('text-anchor', 'end')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('letter-spacing', '0.05em')
      .attr('fill', r.label)
      .text(label);
  }

  // (Rank labels removed; the title now provides the ranking context.)

  // Legend at the bottom. Three entries: a dark purple square for
  // "Busy (10 tallest)", a light pinkish square for "Quiet
  // (10 shortest)", and a purple dashed segment for the
  // Min/Max/Med reference lines. Reads as a footer for the
  // chart, not as a callout. Sits below the bars' baseline
  // (y(0) = PADDING_TOP + innerH = 660) and above the SVG's
  // bottom edge (800).
  const legendY = HEIGHT - 14;
  const legend = svg.append('g').attr('class', 'extreme-days__legend');
  // Busy swatch
  legend.append('rect')
    .attr('x', PADDING_LEFT)
    .attr('y', legendY - 9)
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', ACCENT)
    .attr('rx', 1);
  legend.append('text')
    .attr('x', PADDING_LEFT + 17)
    .attr('y', legendY)
    .attr('dy', '0.35em')
    .attr('font-size', 12)
    .attr('fill', ACCENT)
    .text('Busy (10 tallest)');
  // Quiet swatch
  const quietSwatchX = PADDING_LEFT + 180;
  legend.append('rect')
    .attr('x', quietSwatchX)
    .attr('y', legendY - 9)
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', ACCENT2)
    .attr('rx', 1);
  legend.append('text')
    .attr('x', quietSwatchX + 17)
    .attr('y', legendY)
    .attr('dy', '0.35em')
    .attr('font-size', 12)
    .attr('fill', ACCENT)
    .text('Quiet (10 shortest)');
  // Reference-line swatch
  const medianSwatchX = PADDING_LEFT + 420;
  legend.append('line')
    .attr('x1', medianSwatchX)
    .attr('x2', medianSwatchX + 20)
    .attr('y1', legendY - 3)
    .attr('y2', legendY - 3)
    .attr('stroke', MEDIAN)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3 2');
  legend.append('text')
    .attr('x', medianSwatchX + 26)
    .attr('y', legendY)
    .attr('dy', '0.35em')
    .attr('font-size', 12)
    .attr('fill', ACCENT)
    .text('Min / Max / Med');

  // (Min / Max / Median reference lines are drawn earlier, just
  // after the bar pairs, so they sit on top of the bars.)

  // =====================================================
  // HOVER TOOLTIP — same design and content as the
  // calendar's cell tooltip. Reuses the .cal-tooltip CSS
  // class for the white card, drop shadow, date header
  // (Fraunces dow + mono rest), value, and banded bar
  // chart with min/med/max reference lines. The tooltip
  // is appended as a sibling of the SVG inside the .viz
  // container (which has position: relative), so the
  // absolute positioning anchors to the chart, not the
  // page.
  //
  // Positioning: the tooltip always falls BELOW the
  // bar's top, centered on the bar. The tooltip's TOP
  // is anchored at the bar's TOP + 4px, and the tooltip
  // extends downward from there. This matches the
  // calendar's "below the cell" pattern — the tooltip
  // is consistently below its anchor, never above. The
  // tooltip may extend below the chart's drawing area
  // (over the chart's x-axis and into the chapter's
  // bottom margin) for bars near the top of the chart;
  // the .viz container has overflow: visible, so the
  // tooltip remains visible.
  //
  // The bar gets a 1.5px black stroke on hover so the
  // user has a second visual cue for "this is the bar
  // the tooltip is for" — the tooltip + the stroke
  // together form a single feedback unit.
  // =====================================================

  // valueToPct: maps the dataset's [dataMin, dataMax] range
  // to the tooltip chart's [BAR_MIN_PCT, 100] vertical range.
  // The bar's tip at any value lands at this percentage of
  // the chart's height. The reference lines (min/med/max)
  // use the same mapping, so the bar's tip at MIN sits
  // exactly on the dashed MIN line, etc. (Same logic as
  // calendar-strip.js.)
  function valueToPct(v) {
    if (v == null) return 0;
    const linear = (v - dataMin) / dataRange;
    return BAR_MIN_PCT + linear * (100 - BAR_MIN_PCT);
  }

  // Bucket boundaries and band colours for the tooltip's
  // banded background. The notebook ships the boundaries
  // keyed by percentile (p2, p5, ..., p98) in
  // daily-stats.json. We sort them by the numeric suffix
  // and sample PURPLE_BUCKETS to BUCKET_COUNT colours.
  // (Same logic as calendar-strip.js.)
  function computeBandColors(n) {
    if (n === PURPLE_BUCKETS.length) return PURPLE_BUCKETS;
    const interp = d3.interpolateRgbBasis(PURPLE_BUCKETS);
    return d3.range(n).map((i) => interp(i / (n - 1)));
  }
  const tipBoundaryKeys = Object.keys(bucketBoundaries || {})
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
  const tipBoundaries = tipBoundaryKeys.map((k) => bucketBoundaries[k]);
  const TIP_BUCKET_COUNT = tipBoundaries.length + 1;
  const TIP_BAND_COLORS = computeBandColors(TIP_BUCKET_COUNT);
  function bucketForValue(v) {
    if (v == null) return -1;
    for (let i = 0; i < tipBoundaries.length; i++) {
      if (v < tipBoundaries[i]) return i;
    }
    return tipBoundaries.length;
  }

  // Banded background gradient. Each band's vertical position
  // is at the boundary's value mapped to [BAR_MIN_PCT, 100],
  // so the bands are positioned in value space (not equal-
  // width). The bar's tip at any value lands in the band
  // that value belongs to — the band's vertical position and
  // the bar's tip position are the same encoding.
  const tipPositions = [
    valueToPct(dataMin),
    ...tipBoundaries.map(valueToPct),
    valueToPct(dataMax),
  ];
  const tipZoneStops = [];
  for (let i = 0; i < TIP_BUCKET_COUNT; i++) {
    tipZoneStops.push(`${TIP_BAND_COLORS[i]} ${tipPositions[i].toFixed(2)}%`);
    tipZoneStops.push(`${TIP_BAND_COLORS[i]} ${tipPositions[i + 1].toFixed(2)}%`);
  }
  const tipBandGradient = `linear-gradient(to top, ${tipZoneStops.join(', ')})`;

  // Tooltip DOM — sibling of the SVG, inside the .viz
  // container. Same structure as the calendar tooltip:
  // date (dow + rest) → value → bar chart with banded
  // background + bar + min/med/max reference lines.
  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'cal-tooltip')
    .style('display', 'none');

  const tipDate = tooltip.append('div').attr('class', 'cal-tooltip__date');
  const tipDateDow = tipDate.append('div').attr('class', 'cal-tooltip__date-dow');
  const tipDateRest = tipDate.append('div').attr('class', 'cal-tooltip__date-rest');
  const tipValue = tooltip.append('div').attr('class', 'cal-tooltip__value');
  const tipChart = tooltip.append('div').attr('class', 'cal-tooltip__chart');

  const tipBarContainer = tipChart
    .append('div')
    .attr('class', 'cal-tooltip__bar-container')
    .style('background', tipBandGradient);

  const tipBar = tipBarContainer
    .append('div')
    .attr('class', 'cal-tooltip__bar');
  const tipBarFill = tipBar
    .append('div')
    .attr('class', 'cal-tooltip__bar-fill');

  // Reference lines (min / med / max). Same as the calendar
  // tooltip — each line is a thin dashed rule with a tiny
  // label sitting just to the right of the bar. Min/med/max
  // are all pre-computed by the aggregation notebook; the
  // page does no analytics of its own.
  const tipRefs = [
    { key: 'min', value: dataMin, label: 'min' },
    { key: 'med', value: median, label: 'med' },
    { key: 'max', value: dataMax, label: 'max' },
  ];
  for (const r of tipRefs) {
    const line = tipBarContainer
      .append('div')
      .attr('class', `cal-tooltip__ref cal-tooltip__ref--${r.key}`)
      .style('bottom', `${valueToPct(r.value)}%`);
    line.append('span').attr('class', 'cal-tooltip__ref-rule');
    line
      .append('span')
      .attr('class', 'cal-tooltip__ref-label')
      .text(r.label);
  }

  // Date and value formatters (same as the calendar tooltip).
  function formatDateParts(iso) {
    const full = new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const commaIdx = full.indexOf(',');
    if (commaIdx === -1) return { dow: full, rest: '' };
    return {
      dow: full.slice(0, commaIdx).trim(),
      rest: full.slice(commaIdx + 1).trim(),
    };
  }
  function formatRiders(v) {
    return v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' riders';
  }

  // Hover lifecycle. The tooltip is shown immediately on
  // mouseenter, but hidden with a 250ms grace period on
  // mouseleave. The grace period lets the user sweep the
  // mouse across a row of bars (or across the 3px gap
  // between bars) without the tooltip vanishing. The
  // tooltip's pointer-events: none (inherited from the
  // cal-tooltip CSS) means the mouse "passes through" the
  // tooltip to whatever is behind it, so the container's
  // mouseenter/mouseleave track the mouse's position
  // relative to the chart, not the tooltip.
  let hideTimeout = null;
  const HIDE_DELAY_MS = 250;
  function cancelHide() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }
  function scheduleHide() {
    cancelHide();
    hideTimeout = setTimeout(() => {
      tooltip.classed('cal-tooltip--visible', false);
      hideTimeout = null;
    }, HIDE_DELAY_MS);
  }
  // Note: the transitionend handler from calendar-strip.js sets
  // display: none when the opacity transition ends AND the
  // visible class is not present. In the bar chart context,
  // this handler was incorrectly hiding the tooltip (because
  // a child's opacity transition was bubbling up and the
  // handler was firing for it). For the bar chart, we don't
  // need the display: none optimization — the tooltip is
  // always inside the chart container, and setting
  // display: block / visible class is sufficient.
  //
  // The tooltip is hidden by simply removing the visible
  // class (opacity transitions to 0). When the user hovers
  // again, showTooltip sets display: block and the visible
  // class, which restarts the opacity transition.
  const tooltipNode = tooltip.node();
  tooltipNode.addEventListener('transitionend', (event) => {
    // Only act on the tooltip's own opacity transition
    if (event.target !== tooltipNode) return;
    if (event.propertyName === 'opacity' && !tooltip.classed('cal-tooltip--visible')) {
      tooltip.style('display', 'none');
    }
  });
  d3.select(container).on('mouseenter', cancelHide);
  d3.select(container).on('mouseleave', scheduleHide);

  // Position helper. Anchors the tooltip to a bar's top,
  // centered on the bar horizontally. The tooltip always
  // falls BELOW the bar's top (matches the calendar's
  // "below the cell" pattern). The tooltip's TOP edge is
  // 4px below the bar's top, and the tooltip extends
  // downward from there.
  function positionTooltip(barEl) {
    const barRect = barEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const barCenterX = barRect.left - containerRect.left + barRect.width / 2;
    const barTopY = barRect.top - containerRect.top;
    return {
      left: barCenterX,
      top: barTopY + 4,
      transformY: 0,   // tooltip extends downward (no Y flip)
    };
  }

  // Track the currently hovered bar so we can re-position
  // the tooltip on every update() call (the bar's top
  // moves as the animation plays, so the tooltip needs
  // to follow). When the chart is at progress=1 (final
  // state), the tooltip is at the bar's final position
  // and stays there until the user hovers a different
  // bar or moves the mouse away.
  let hoveredBar = null;

  function showTooltip(barEl, day) {
    cancelHide();
    const parts = formatDateParts(day.date);
    tipDateDow.text(parts.dow);
    tipDateRest.text(parts.rest);
    tipValue.text(formatRiders(day.total));
    const heightPct = valueToPct(day.total);
    const bucket = bucketForValue(day.total);
    const barFill = TIP_BAND_COLORS[
      Math.max(0, Math.min(TIP_BUCKET_COUNT - 1, bucket))
    ];
    tipBarFill
      .style('height', heightPct + '%')
      .style('background', barFill)
      .style('opacity', 1);
    const pos = positionTooltip(barEl);
    const wasHidden = tooltip.style('display') === 'none' || !tooltip.classed('cal-tooltip--visible');
    tooltip
      .style('left', pos.left + 'px')
      .style('top', pos.top + 'px')
      .style('transform', `translate(-50%, ${pos.transformY}%)`)
      .style('display', 'block');
    if (wasHidden) {
      // Force a reflow before adding the visible class so the
      // opacity transition fires from 0 → 1. Without this, the
      // browser may batch the display change and the class
      // add, and the transition won't fire.
      void tooltip.node().offsetWidth;
      tooltip.classed('cal-tooltip--visible', true);
    }
    // Highlight the hovered bar with a thin black stroke.
    // The stroke is the second visual cue (after the
    // tooltip) for "this is the bar the tooltip is for".
    d3.select(barEl).attr('stroke', '#000').attr('stroke-width', 1.5);
    hoveredBar = barEl;
  }

  function hideTooltip(barEl) {
    scheduleHide();
    d3.select(barEl).attr('stroke', null).attr('stroke-width', null);
    hoveredBar = null;
  }

  // Bind hover to both busy and quiet bars. Both bar
  // types share the same tooltip — the tooltip shows
  // whichever day's data the user is hovering (busy
  // day on the back bar, quiet day on the front bar).
  // We use native addEventListener instead of d3's .on()
  // because the native mouseenter event is more reliable
  // in headless test environments (d3's wrapper relies
  // on the event bubbling correctly through SVG groups,
  // which can be flaky in some browsers).
  busyBars.each(function (d) {
    const barEl = this;
    barEl.addEventListener('mouseenter', () => showTooltip(barEl, d.busy));
    barEl.addEventListener('mouseleave', () => hideTooltip(barEl));
  });
  quietBars.each(function (d) {
    const barEl = this;
    barEl.addEventListener('mouseenter', () => showTooltip(barEl, d.quiet));
    barEl.addEventListener('mouseleave', () => hideTooltip(barEl));
  });

  // 20-stage spring-in: when the chart's base crosses the
  // viewport bottom, all 20 bars spring into place. The
  // animation is a GSAP timeline, not a scroll-driven
  // progress mapping. The bars start at height 0 (drawn at
  // the x-axis, invisible) and animate to their final
  // height with a slight overshoot via `back.out(1.7)`.
  //
  // The 20 bars cascade in two groups:
  //   1. The 10 busy bars (rank 1 → 10), each delayed by
  //      30ms from the previous. The 10th busy bar starts
  //      at 270ms.
  //   2. The 10 quiet bars (rank 1 → 10), starting at
  //      300ms (a small gap after the busy set starts).
  //      Each quiet bar is delayed by 30ms from the
  //      previous. The 10th quiet bar starts at 570ms.
  //
  // Each bar's spring lasts 600ms. The 10th quiet bar
  // finishes at 570 + 600 = 1170ms after the trigger
  // fires. The bars land in their final positions; the
  // spring is the "snap into focus" feel.
  //
  // The date labels on top of each bar ride the bar's top
  // into place. The labels are drawn just below the bar's
  // final top, so they appear with the bar.
  //
  // Why `back.out(1.7)` and not `elastic.out`? `back.out`
  // gives a clean overshoot-and-settle (the bar goes ~7%
  // past its target and settles back). `elastic.out` is
  // more "rubber band" — it overshoots and oscillates
  // back, which reads as playful rather than deliberate.
  // For a data story, the cleaner back.out is the right
  // feel.
  const SPRING_STAGGER = 0.04;   // 40ms between consecutive bars
  const SPRING_DURATION = 0.8;   // each bar's spring lasts 800ms
  const QUIET_START = 0.4;       // quiet set starts 400ms after trigger
  const springTimeline = gsap.timeline({
    paused: true,   // play/reverse controlled by ScrollTriggers below
  });

  // Bars spring in as the chart enters the viewport and finish
  // by the time the chart title reaches the top of the viewport.
  // Previously the scrubbed animation ran from 'bottom 90%' to
  // 'bottom 40%', which meant it only finished once the chart had
  // already scrolled halfway out of view. Using the chart's top
  // edge gives a much earlier, visible finish while keeping the
  // spring motion scroll-driven.
  const playTrigger = ScrollTrigger.create({
    trigger: container,
    start: 'top bottom',
    end: 'top top',
    scrub: true,
    animation: springTimeline,
  });

  // Initial state: all bars at height 0, drawn at the
  // x-axis (y(0)). The bars are invisible. The date labels
  // are hidden too. When the timeline plays, the bars
  // spring up to their final y / height values, and the
  // labels fade in.
  busyBars
    .attr('y', y(0))
    .attr('height', 0);
  quietBars
    .attr('y', y(0))
    .attr('height', 0);
  // Hide the date labels until the bars land. Each label
  // is a <text> element inside its pair group. The dow
  // and date texts both start at opacity 0; the spring
  // timeline fades them in along with their bar.
  const allLabels = svg.selectAll('.pair__label-busy-dow, .pair__label-busy-date, .pair__label-quiet-dow, .pair__label-quiet-date');
  allLabels.attr('opacity', 0);

  // Build the spring timeline. Each bar gets a tween
  // targeting its `y` and `height` attributes (so we use
  // the GSAP `attr` plugin, which is part of the free
  // GSAP core as of 3.x).
  pairsData.forEach((d, i) => {
    const busyTargetY = y(d.busy.total);
    const busyTargetH = y(0) - y(d.busy.total);
    const quietTargetY = y(d.quiet.total);
    const quietTargetH = y(0) - y(d.quiet.total);

    // Busy bar: delay = i * SPRING_STAGGER
    springTimeline.to(
      busyBars.nodes()[i],
      {
        attr: { y: busyTargetY, height: busyTargetH },
        duration: SPRING_DURATION,
        ease: 'back.out(1.7)',
      },
      i * SPRING_STAGGER
    );
    // Quiet bar: delay = QUIET_START + i * SPRING_STAGGER
    springTimeline.to(
      quietBars.nodes()[i],
      {
        attr: { y: quietTargetY, height: quietTargetH },
        duration: SPRING_DURATION,
        ease: 'back.out(1.7)',
      },
      QUIET_START + i * SPRING_STAGGER
    );
    // Quiet bar borders spring with the bar.
    springTimeline.to(
      quietBorderTop.nodes()[i],
      {
        attr: { y1: quietTargetY, y2: quietTargetY },
        duration: SPRING_DURATION,
        ease: 'back.out(1.7)',
      },
      QUIET_START + i * SPRING_STAGGER
    );
    springTimeline.to(
      quietBorderBottom.nodes()[i],
      {
        attr: { y1: quietTargetY + quietTargetH, y2: quietTargetY + quietTargetH },
        duration: SPRING_DURATION,
        ease: 'back.out(1.7)',
      },
      QUIET_START + i * SPRING_STAGGER
    );
    springTimeline.to(
      [quietBorderLeft.nodes()[i], quietBorderRight.nodes()[i]],
      {
        attr: { y1: quietTargetY, y2: quietTargetY + quietTargetH },
        duration: SPRING_DURATION,
        ease: 'back.out(1.7)',
      },
      QUIET_START + i * SPRING_STAGGER
    );
    // Date labels: fade in just after the bar's spring starts.
    // The labels are already anchored at the final bar top.
    springTimeline.to(
      [
        busyLabels.select('text.pair__label-busy-dow').nodes()[i],
        busyLabels.select('text.pair__label-busy-date').nodes()[i],
      ],
      {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      },
      i * SPRING_STAGGER + 0.15
    );
    springTimeline.to(
      [
        quietLabels.select('text.pair__label-quiet-dow').nodes()[i],
        quietLabels.select('text.pair__label-quiet-date').nodes()[i],
      ],
      {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      },
      QUIET_START + i * SPRING_STAGGER + 0.15
    );
  });

  // The tooltip is shown when the user hovers a bar. It is
  // NOT driven by the spring-in animation — the user can
  // hover a bar at any time (before, during, or after the
  // spring). The tooltip's getBoundingClientRect() reads
  // the bar's current position, so it tracks the bar as it
  // springs into place.
  //
  // `update(progress)` is retained as a no-op for API
  // compatibility with the previous scroll-driven design.
  // The chapter's mount code may call it; we just ignore
  // the progress value because the spring handles all
  // bar animations now.
  function update(_progress) {
    // No-op: the spring timeline handles all bar
    // animations. If a bar is hovered, reposition the
    // tooltip to track the bar's current top.
    if (hoveredBar) {
      const pos = positionTooltip(hoveredBar);
      tooltip
        .style('left', pos.left + 'px')
        .style('top', pos.top + 'px')
        .style('transform', `translate(-50%, ${pos.transformY}%)`);
    }
  }

  function destroy() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    springTimeline.kill();
    playTrigger.kill();
    // Remove the tooltip's transitionend listener. The
    // listener was added with an anonymous function, so
    // we can't remove it by reference. Instead, we just
    // remove the tooltip element (which is a sibling
    // of the SVG inside the .viz container) — removing
    // the element also removes all its event listeners.
    svg.remove();
    tooltip.remove();
  }

  return { update, destroy };
}
