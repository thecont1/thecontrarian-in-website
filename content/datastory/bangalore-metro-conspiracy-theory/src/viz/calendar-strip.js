// viz/calendar-strip.js — Calendar grid viz for Chapter 1.
//
// Layout: a 7-row × N-week calendar grid.
//   - Rows = days of the week. Mon at the top, Sun at the bottom.
//   - Columns = weeks. The first column starts on the Monday on or
//     before the editorial window's start date; the last column ends
//     on the Sunday on or after the end date.
//   - Each cell = a single day. Cells outside the editorial window
//     are rendered empty (no fill, no border, no X). Cells inside
//     the window that BMRCL didn't publish are rendered with a
//     faint placeholder background and a visible X. Reported cells
//     are coloured by total ridership on a sequential Namma Metro
//     purple scale.
//
// Hover: a confident popover appears above (or below, for top rows)
// the cell, showing the human-readable date, the day's value, and
// a single vertical bar on a 0…max+10% bar chart.
//
// Scroll integration: progress ∈ [0, 1] reveals rows top-to-bottom.
// Row 0 (Mon) starts revealing at progress = 0; row 6 (Sun) finishes
// at progress = 1.

import * as d3 from 'd3';

const CELL = 22;            // px per cell side
const GAP = 3;              // px between cells
const LABEL_WIDTH = 36;     // px reserved on the left for day-of-week labels
const ROWS = 7;             // Mon, Tue, Wed, Thu, Fri, Sat, Sun
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Namma Metro purple scale — 5 distinct buckets from light lavender to
// deep BMRCL purple. The dataset is divided into 5 equal-width bands
// across its absolute min–max range, each band mapped to one of these
// 5 colours. This is the same palette that paints the calendar cells,
// the tooltip chart's banded background, the tooltip bar's fill, and
// the legend strip — so all four encodings stay in lockstep.
const PURPLE_BUCKETS = [
  '#ead7f3',  // 0 — palest lavender (lowest ridership band)
  '#caa6dd',  // 1 — light wisteria
  '#a06ec0',  // 2 — mid violet
  '#7a3fa8',  // 3 — deep violet
  '#5E2D8C',  // 4 — BMRCL purple (highest ridership band)
];
const BUCKET_COUNT = PURPLE_BUCKETS.length;   // 5

// Padding for the X mark inside missing cells. The mark is a corner-
// to-corner cross in a thin accent red; no fill, no border on the
// cell — the X is the entire signal.
const X_PAD = 4;
const X_STROKE = '#d04b36';   // matches --accent
const X_WIDTH = 0.5;

const COLORS = {
  reportedStroke: 'rgba(0, 0, 0, 0.18)',
  text: 'var(--muted)',
};

const TIP_GAP = 8;        // px gap between cell and tooltip
const TIP_CELL_OFFSET = CELL + TIP_GAP;  // 30px — used when tooltip sits below

/**
 * Build the calendar grid. Returns the SVG and an `update` function.
 */
export function renderCalendarStrip(container, daily, window) {
  const { startDate, endDate } = window;

  // 1. Index daily by ISO date for O(1) lookup
  const byDate = new Map(daily.map((d) => [d.date, d]));

  // 1b. Value-based bucketing. Five equal-width bands across the
  //     dataset's absolute min–max range. This replaces the earlier
  //     percentile-based scheme so:
  //       - the legend's Min/Max labels read the actual dataset
  //         extremes (4.0L / 9.1L) instead of the 10th/90th
  //         percentile (6.4L / 8.8L),
  //       - the bar's value-to-height mapping is linear across the
  //         full observed range, and
  //       - the chart's banded background, the cell colours, the
  //         tooltip bar fill, and the legend strip all use the same
  //         five bands (no white-below-p10 or extra-deep-above-p90
  //         zones that didn't have a matching legend stop).
  const reportedTotals = daily.map((d) => d.total);
  const dataMin = d3.min(reportedTotals);
  const dataMax = d3.max(reportedTotals);
  const dataRange = dataMax - dataMin;

  // valueToPct: 0% sits at the dataset's absolute minimum, 100% at
  // the absolute maximum. The bar's height maps linearly to this
  // percentage; the reference lines (min/avg/max) use the same scale.
  function valueToPct(v) {
    if (v == null) return 0;
    return Math.max(0, Math.min(100, ((v - dataMin) / dataRange) * 100));
  }
  // bucketForValue: returns 0..4. The five band boundaries are at
  //   dataMin, dataMin + 0.2·dataRange, ..., dataMax
  // Values are clamped to the nearest band (no -1 "below min" or
  // 5 "above max" cases — every observed value falls in 0..4).
  function bucketForValue(v) {
    if (v == null) return -1;
    if (v <= dataMin) return 0;
    if (v >= dataMax) return BUCKET_COUNT - 1;
    const idx = Math.floor(((v - dataMin) / dataRange) * BUCKET_COUNT);
    return Math.min(Math.max(idx, 0), BUCKET_COUNT - 1);
  }
  // color: maps the bucket to its PURPLE_BUCKETS colour. -1 (no
  // value) clamps to bucket 0 (palest lavender).
  function color(v) {
    const b = bucketForValue(v);
    if (b < 0) return PURPLE_BUCKETS[0];
    if (b >= BUCKET_COUNT) return PURPLE_BUCKETS[BUCKET_COUNT - 1];
    return PURPLE_BUCKETS[b];
  }

  // 2. Find the Monday on or before the start, and the Sunday on or
  //    after the end. The calendar grid spans this range so the
  //    visualisation always starts on a Monday and ends on a Sunday.
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDow = start.getDay();
  const endDow = end.getDay();
  const daysSinceMonday = (startDow + 6) % 7;
  const daysUntilSunday = (7 - endDow) % 7;
  const firstMonday = new Date(start.getTime() - daysSinceMonday * 86400000);
  const lastSunday = new Date(end.getTime() + daysUntilSunday * 86400000);

  // 3. Build the cell list.
  const totalDays = Math.round((lastSunday - firstMonday) / 86400000) + 1;
  const numWeeks = totalDays / 7;
  const cells = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(firstMonday.getTime() + i * 86400000);
    const col = Math.floor(i / 7);
    const row = i % 7;
    const iso = d.toISOString().slice(0, 10);
    const inRange = d >= start && d <= end;
    const reported = inRange && byDate.has(iso);
    cells.push({
      date: d,
      iso,
      col,
      row,
      inRange,
      reported,
      total: byDate.get(iso)?.total ?? null,
    });
  }

  // 4. (no separate scale step — bucketing lives in 1b)

  // 5. SVG dimensions
  const WIDTH = LABEL_WIDTH + numWeeks * (CELL + GAP);
  const HEIGHT = ROWS * (CELL + GAP);

  // 6. Build the SVG
  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'calendar-svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label',
      'Calendar of reported ridership days. Rows are days of the week from Monday (top) to Sunday (bottom). ' +
      'Cells coloured by total ridership on a Namma Metro purple scale.'
    )
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)');

  // Helper: format a value as a compact "Lakh riders" string.
  // 850000 → "8.5L", 10000 → "10K", 1234567 → "12.3L". Indian
  // numbering convention: 1 Lakh = 100,000. Lakh values always
  // show one decimal place so the legend reads consistently
  // ("Min 4.0L" alongside "Max 9.1L") — the trailing .0 is the
  // visual cue that this is a Lakh value, not an integer count.
  function formatCompact(v) {
    if (v >= 100000) {
      const lakhs = v / 100000;
      return (Math.round(lakhs * 10) / 10).toFixed(1) + 'L';
    }
    if (v >= 1000) {
      return Math.round(v / 1000) + 'K';
    }
    return String(Math.round(v));
  }

  // 6b. Gradient legend — 5-zone strip below the calendar. The strip
  //     is the 5 PURPLE_BUCKETS, one band per equal-width slice of
  //     the dataset's min–max range. No white below and no extra
  //     deep purple above: the value bucketing now covers the full
  //     range, so the 5 bands are the whole story. Below the strip,
  //     a single row of labels: "Min <value>" anchored at the left
  //     edge, "Daily Ridership" centred, "Max <value>" anchored at
  //     the right edge. No tick marks at band boundaries.
  const legend = d3.select(container)
    .append('div')
    .attr('class', 'cal-legend')
    .attr('aria-hidden', 'true');  // decorative; cells already have aria-labels
  const legendBar = legend.append('div').attr('class', 'cal-legend__bar');
  for (let i = 0; i < BUCKET_COUNT; i++) {
    legendBar
      .append('div')
      .attr('class', 'cal-legend__stop')
      .attr('data-bucket', String(i))
      .style('background', PURPLE_BUCKETS[i]);
  }

  const legendCaption = legend.append('div').attr('class', 'cal-legend__caption');
  legendCaption
    .append('span')
    .attr('class', 'cal-legend__caption-min')
    .text(`Min ${formatCompact(dataMin)}`);
  legendCaption
    .append('span')
    .attr('class', 'cal-legend__caption-title')
    .text('Daily Ridership');
  legendCaption
    .append('span')
    .attr('class', 'cal-legend__caption-max')
    .text(`Max ${formatCompact(dataMax)}`);

  // 6c. Legend hover → filter calendar cells. Hovering a stop shows
  //     only cells whose bucket matches the hovered stop. Everything
  //     else (non-matching reported cells, unreported / out-of-range
  //     cells) vanishes. Mouse-leave the legend restores all cells.
  //     The `dimActive` flag (declared alongside update()) prevents
  //     the scroll-reveal from clobbering the filter.
  let dimActive = false;
  let dimTarget = null;
  legend.on('mouseleave', () => {
    dimActive = false;
    dimTarget = null;
    groups.attr('opacity', null).style('display', null);
  });
  legendBar.selectAll('.cal-legend__stop')
    .on('mouseenter', function () {
      const target = this.getAttribute('data-bucket');
      dimActive = true;
      dimTarget = target;
      groups.style('display', (d) => {
        if (!d.reported) return 'none';
        const db = String(bucketForValue(d.total));
        return db === target ? '' : 'none';
      });
    });

  // 7. Y-axis labels (Mon, Tue, ...). Always visible.
  svg
    .selectAll('text.label')
    .data(DOW_LABELS)
    .join('text')
    .attr('class', 'label')
    .attr('x', 0)
    .attr('y', (_, i) => i * (CELL + GAP) + CELL * 0.72)
    .attr('font-size', 9)
    .attr('font-weight', 400)
    .attr('fill', COLORS.text)
    .attr('letter-spacing', '0.04em')
    .text((d) => d);

  // 8. Cells. Initial state: invisible. The update() below reveals them
  //    row by row, top to bottom.
  const groups = svg
    .selectAll('g.cell')
    .data(cells)
    .join('g')
    .attr('class', 'cell')
    .attr('transform', (d) => `translate(${LABEL_WIDTH + d.col * (CELL + GAP)}, ${d.row * (CELL + GAP)})`)
    .attr('tabindex', (d) => (d.inRange ? 0 : -1))    // focusable for keyboard nav
    .attr('data-bucket', (d) => d.reported ? bucketForValue(d.total) : 'unreported')
    .attr('opacity', 0);

  // 8a. The cell rectangle.
  //     - Reported: filled with the ridership colour, subtle border
  //     - Missing (in range, not reported): transparent fill (so the
  //       X mark remains the only visible signal) BUT the rect still
  //       exists as a hit-target — without it, hover only fires when
  //       the mouse is exactly on the X line. The transparent fill
  //       makes the whole 22×22 cell area hoverable.
  //     - Outside: NO fill, NO stroke, NO rect hit-area (truly empty)
  groups
    .append('rect')
    .attr('width', CELL)
    .attr('height', CELL)
    .attr('fill', (d) => {
      if (d.reported) return color(d.total);
      if (d.inRange) return 'transparent';  // hit area only
      return 'none';
    })
    .attr('stroke', (d) => (d.reported ? COLORS.reportedStroke : 'none'))
    .attr('stroke-width', (d) => (d.reported ? 0.5 : 0))
    .attr('rx', 1)
    .attr('pointer-events', (d) => (d.inRange ? 'all' : 'none'));

  // 8b. The X mark on missing cells.
  groups
    .filter((d) => d.inRange && !d.reported)
    .append('g')
    .attr('class', 'missing-x')
    .each(function () {
      const g = d3.select(this);
      g.append('line')
        .attr('x1', X_PAD).attr('y1', X_PAD)
        .attr('x2', CELL - X_PAD).attr('y2', CELL - X_PAD)
        .attr('stroke', X_STROKE)
        .attr('stroke-width', X_WIDTH)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('stroke-linecap', 'round');
      g.append('line')
        .attr('x1', CELL - X_PAD).attr('y1', X_PAD)
        .attr('x2', X_PAD).attr('y2', CELL - X_PAD)
        .attr('stroke', X_STROKE)
        .attr('stroke-width', X_WIDTH)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('stroke-linecap', 'round');
    });

  // 8c. A11y label (announced on focus). We do NOT use a native <title>
  //    because browsers render it as a yellow box that overlaps our
  //    custom popover. aria-label is the screen-reader-friendly
  //    equivalent and doesn't paint a native tooltip.
  groups.attr('aria-label', (d) => {
    if (d.reported) return `${d.iso} — ${d.total.toLocaleString('en-IN')} riders`;
    if (d.inRange) return `${d.iso} — not reported`;
    return '';
  });

  // 9. Tooltip — a sibling div inside the .viz container, positioned
  //    absolutely. The container has position: relative (set in CSS).
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

  // 9a. Tooltip chart's banded background. 5 hard-stop colour
  //     zones, each 20% of the bar-container height, mapped to the
  //     5 PURPLE_BUCKETS (palest at the bottom, deepest at the
  //     top). The bar's height maps linearly to the dataset's
  //     min–max range, so a value at the dataset minimum sits at
  //     the bottom of the palest band, and a value at the dataset
  //     maximum sits at the top of the deepest band.
  const zoneStops = [];
  for (let i = 0; i < BUCKET_COUNT; i++) {
    const startPct = (i / BUCKET_COUNT) * 100;
    const endPct = ((i + 1) / BUCKET_COUNT) * 100;
    zoneStops.push(`${PURPLE_BUCKETS[i]} ${startPct.toFixed(2)}%`);
    zoneStops.push(`${PURPLE_BUCKETS[i]} ${endPct.toFixed(2)}%`);
  }
  const bandGradient = `linear-gradient(to top, ${zoneStops.join(', ')})`;

  const tipBarContainer = tipChart
    .append('div')
    .attr('class', 'cal-tooltip__bar-container')
    .style('background', bandGradient);

  // 9b. The bar is a two-element structure:
  //     - .cal-tooltip__bar — the "track". Spans the full chart
  //       height, has a 0.5px black border and 1px paper-coloured
  //       padding. The padding is the key piece: it shows paper
  //       between the bucket-coloured fill and the bar's border,
  //       so the bar visibly stands off the chart's banded
  //       background even when the fill matches the band it
  //       lands in.
  //     - .cal-tooltip__bar-fill — the variable-height inner
  //       element, filled with the bucket colour. Its height
  //       is set inline (heightPct%) on every hover; the bucket
  //       colour is also set inline. The fill is anchored to the
  //       bottom of the track via flex-end.
  const tipBar = tipBarContainer
    .append('div')
    .attr('class', 'cal-tooltip__bar');
  const tipBarFill = tipBar
    .append('div')
    .attr('class', 'cal-tooltip__bar-fill');

  // 9c. Reference lines (min / avg / max) — absolutely-positioned
  //     thin rules overlaid on the chart. Min sits at the bottom
  //     (0%), max at the top (100%), avg somewhere in the middle.
  //     The labels (min / avg / max) are tucked to the right of
  //     the bar so the chart's vertical scale is implied, not
  //     spelled out.
  const refMin = dataMin;
  const refMax = dataMax;
  const refAvg = d3.mean(reportedTotals) ?? 0;
  const refs = [
    { key: 'min', value: refMin, label: 'min' },
    { key: 'avg', value: refAvg, label: 'avg' },
    { key: 'max', value: refMax, label: 'max' },
  ];
  for (const r of refs) {
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

  // 9d. The scale axis only shows `0` on the left now. The right-
  //     hand end was just echoing the dataset max (same number on
  //     every hover) — the dashed MAX reference line already tells
  //     the reader where the ceiling sits, and the cell's own
  //     value tells them where they are.
  const tipScale = tipChart.append('div').attr('class', 'cal-tooltip__scale');
  tipScale.append('span').attr('class', 'cal-tooltip__scale-min').text('0');

  function formatRiders(v) {
    return v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' riders';
  }
  function formatDateParts(iso) {
    // Returns { dow, rest } — the day-of-week and the rest of the
    // date string. The template uses day-of-week in a larger,
    // bolder font at the top of the popover and the rest below it.
    const full = new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    // The default en-US format is "Tuesday, December 10, 2024" —
    // split on the first comma to get the day-of-week and the rest.
    const commaIdx = full.indexOf(',');
    if (commaIdx === -1) return { dow: full, rest: '' };
    return {
      dow: full.slice(0, commaIdx).trim(),
      rest: full.slice(commaIdx + 1).trim(),
    };
  }

  // 9e. Hover handlers.
  //    The tooltip is shown immediately on mouseenter / focus, but
  //    hidden with a longer delay (HIDE_DELAY_MS) on mouseleave / blur.
  //    The delay lets the user sweep the mouse across a row of cells
  //    — including the 3px gaps between them — without the tooltip
  //    vanishing. If the mouse enters another cell within the delay,
  //    the hide is cancelled and the tooltip just updates for the
  //    new cell. We also extend the grace period by listening on the
  //    chart container itself: if the mouse moves into the gap (which
  //    is a child of the chart but not a cell), the hide is paused.
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
      tooltip.style('display', 'none');
      hideTimeout = null;
    }, HIDE_DELAY_MS);
  }

  // While the mouse is anywhere in the chart container (cell OR gap),
  // keep the tooltip alive. This means moving from one cell to a
  // neighbour across a gap never causes the tooltip to flash off.
  d3.select(container).on('mouseenter', cancelHide);
  d3.select(container).on('mouseleave', scheduleHide);

  groups
    .on('mouseenter focus', function (event, d) {
      if (!d.inRange) return;  // outside cells: nothing to show

      cancelHide();  // cancel any pending hide

      const parts = formatDateParts(d.iso);
      tipDateDow.text(parts.dow);
      tipDateRest.text(parts.rest);

      if (d.reported) {
        tipValue.text(formatRiders(d.total));
        // Bar height maps linearly to value position in the dataset's
        // absolute min–max range. The fill is the same purple as the
        // band the bar's value lands in — second visual encoding
        // (which bucket) on top of the bar's height (how far up).
        const heightPct = valueToPct(d.total);
        const bucket = bucketForValue(d.total);
        const barFill = PURPLE_BUCKETS[
          Math.max(0, Math.min(BUCKET_COUNT - 1, bucket))
        ];
        tipBarFill
          .style('height', heightPct + '%')
          .style('background', barFill)
          .style('opacity', 1);
      } else {
        tipValue.text('Not reported by BMRCL');
        tipBarFill
          .style('height', '4%')
          .style('background', X_STROKE)
          .style('opacity', 1);
      }

      // Position above the cell, falling back to below for top rows
      const cellRect = this.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const cellCenterX = cellRect.left - containerRect.left + cellRect.width / 2;
      const cellTop = cellRect.top - containerRect.top;

      tooltip
        .style('left', cellCenterX + 'px')
        .style('top', cellTop + 'px')
        .style('display', 'block');

      // After display, measure the tooltip and decide above/below
      const tipRect = tooltip.node().getBoundingClientRect();
      const tipHeight = tipRect.height;
      const needBelow = cellTop < tipHeight + TIP_CELL_OFFSET;
      tooltip.classed('cal-tooltip--below', needBelow);
    })
    .on('mouseleave blur', scheduleHide);

  // 10. Scroll-driven reveal: rows top to bottom. If the user has
  //     hovered a legend stop, the dim takes precedence and the
  //     reveal update is suppressed until they move off the legend.
  function update(progress) {
    if (dimActive) return;  // legend hover is in control
    for (let row = 0; row < ROWS; row++) {
      const rowStart = row / ROWS;
      const rowEnd = (row + 1) / ROWS;
      const rowProgress = Math.max(0, Math.min(1, (progress - rowStart) / (rowEnd - rowStart)));
      groups
        .filter((d) => d.row === row)
        .attr('opacity', rowProgress);
    }
  }

  function destroy() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    svg.remove();
    tooltip.remove();
  }

  return { update, destroy };
}

/** Utility: get the editorial window from a daily array. */
export function extractWindow(daily) {
  const dates = daily.map((d) => new Date(d.date)).sort((a, b) => a - b);
  return { startDate: dates[0], endDate: dates[dates.length - 1] };
}
