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
// deep BMRCL purple. Using a quantile step scale (rather than a smooth
// interpolator) so each bucket gets equal screen real estate: most
// days land in the mid-to-upper range, and a smooth gradient would
// visually collapse them all into the dark end. Five bands give the
// eye a real landmark for "is this day low, mid-low, mid, mid-high,
// or high?" without inventing artificial cutoffs.
const PURPLE_BUCKETS = [
  '#ead7f3',  // 0 — palest lavender (very low ridership)
  '#caa6dd',  // 1 — light wisteria
  '#a06ec0',  // 2 — mid violet
  '#7a3fa8',  // 3 — deep violet
  '#5E2D8C',  // 4 — BMRCL purple (max)
];

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

  // 1b. Percentile boundaries (declared up-front so the cell data
  //     built in step 3 can pre-compute its bucket). The bucket is
  //     -1 for below-p10, 0-7 for 10-90 (eight bands, mapped to
  //     PURPLE_BUCKETS via index 0-4 with two-per-bucket pairing),
  //     8 for above-p90.
  const reportedTotals = daily.map((d) => d.total);
  const sortedTotals = [...reportedTotals].sort((a, b) => a - b);
  const quantile = (p) => {
    const idx = (sortedTotals.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sortedTotals[lo];
    return sortedTotals[lo] + (sortedTotals[hi] - sortedTotals[lo]) * (idx - lo);
  };
  const p10 = quantile(0.10);
  const p20 = quantile(0.20);
  const p30 = quantile(0.30);
  const p40 = quantile(0.40);
  const p50 = quantile(0.50);
  const p60 = quantile(0.60);
  const p70 = quantile(0.70);
  const p80 = quantile(0.80);
  const p90 = quantile(0.90);
  const chartRange = p90 - p10;
  // valueToPct: 0% = bottom of chart (= 10th percentile line),
  // 100% = top (= 90th percentile line). Values < p10 clamp to 0
  // (white zone); values > p90 clamp to 100 (deep purple zone).
  // (bucketForValue, color, and WHITE are declared alongside the
  //  legend below — they need to be visible to the legend-stop
  //  data-bucket assignment, which happens after the legend is
  //  appended. cell rendering reads the same `color` closure later.)
  const valueToPct = (v) => Math.max(0, Math.min(100, ((v - p10) / chartRange) * 100));

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

  // 4. Colour scale and the chart's max for the tooltip (max + 10%).
  //    The cells are bucketed into 5 percentile ranges (10-20, 20-30,
  //    ..., 80-90), each mapped to one of the PURPLE_BUCKETS. The
  //    same bucketing is used by the chart's banded background, the
  //    tooltip's bar fill, and the legend-hover "isolate" filter, so
  //    all four visual encodings stay in lockstep.

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

  // 6b. Gradient legend — 10-step purple gradient strip below the
  //     calendar showing the colour scale (white = 10th percentile,
  //     deep BMRCL purple = 90th percentile). Helps the reader decode
  //     the cell colours at a glance and is also the same scale used
  //     in the tooltip chart's banded background.
  //
  //     The legend has 5 stops — one per PURPLE_BUCKETS entry — so
  //     every stop corresponds to a real bucket, and the user's
  //     mouse can hit a meaningful "is this day in the X bucket?"
  //     filter. (Earlier 10-stop version had stops with no
  //     corresponding cells in some datasets, especially 5-month
  //     windows where only the densest bucket would fire.)
  const LEGEND_STEPS = PURPLE_BUCKETS.length;   // 5
  const legendInterp = d3.interpolateRgb('#ffffff', PURPLE_BUCKETS[4]);
  const legend = d3.select(container)
    .append('div')
    .attr('class', 'cal-legend')
    .attr('aria-hidden', 'true');  // decorative; the cells already have aria-labels
  const legendBar = legend.append('div').attr('class', 'cal-legend__bar');

  // The 5 buckets used for cells and the tooltip bar are evenly spaced
  // across the 10-90th percentile range. Their boundaries are the
  // 18, 34, 50, 66, 82 percentiles (so each bucket spans 16 percentile
  // points). Using evenly-spaced boundaries (not d3.scaleQuantile)
  // keeps the chart's banded background, the cell colours, and the
  // tooltip bar all aligned to the SAME 5 buckets.
  const BUCKET_PCTS = [0.10, 0.26, 0.42, 0.58, 0.74, 0.90];
  const bucketBoundaries = BUCKET_PCTS.map(quantile);
  function bucketForValue(v) {
    if (v == null) return -1;
    if (v < bucketBoundaries[0]) return -1;          // below p10
    for (let b = 0; b < 5; b++) {
      if (v < bucketBoundaries[b + 1]) return b;
    }
    return 5;                                          // above p90
  }
  // Color: bucket 0-4 maps to PURPLE_BUCKETS[0-4]. -1 (below p10)
  // clamps to PURPLE_BUCKETS[0] (palest). 5 (above p90) clamps to
  // PURPLE_BUCKETS[4] (deepest).
  function color(v) {
    const b = bucketForValue(v);
    if (b < 0) return PURPLE_BUCKETS[0];
    if (b >= PURPLE_BUCKETS.length) return PURPLE_BUCKETS[PURPLE_BUCKETS.length - 1];
    return PURPLE_BUCKETS[b];
  }
  // White fill used when the tooltip bar's value is below p10.
  const WHITE = '#ffffff';

  for (let i = 0; i < LEGEND_STEPS; i++) {
    // 5 evenly-spaced stops, one per PURPLE_BUCKETS entry. Each
    // stop's data-bucket matches the cells it should highlight when
    // hovered — stop i highlights cells with bucketForValue ===
    // i. (There are no separate "below p10" / "above p90" stops;
    // those are clamped into buckets 0 and 4 by `color`, so cells
    // in those ranges still light up under stops 0 and 4.)
    const t = LEGEND_STEPS === 1 ? 0.5 : i / (LEGEND_STEPS - 1);
    legendBar
      .append('div')
      .attr('class', 'cal-legend__stop')
      .attr('data-bucket', String(i))
      .style('background', PURPLE_BUCKETS[i]);
  }
  const legendLabels = legend.append('div').attr('class', 'cal-legend__labels');
  legendLabels.append('span').attr('class', 'cal-legend__label-min').text('low');
  legendLabels.append('span').attr('class', 'cal-legend__label-max').text('high');

  // 6d. Legend hover → filter calendar cells. When the user hovers
  //     any of the 5 legend stops, cells whose bucket doesn't match
  //     the hovered stop's bucket VANISH entirely (display: none).
  //     This is clearer than dimming at 0.18 opacity, which was hard
  //     to distinguish from low-percentile cells at full opacity.
  //     Cells without a bucket (unreported / out-of-range) stay
  //     visible — they aren't a data bucket, they're a separate
  //     category, and dimming them would also make the X marks
  //     disappear. Mouse-leave the legend restores all cells.
  //     The `dimActive` flag (defined alongside update()) prevents
  //     the scroll-reveal from clobbering the dim.
  legend.on('mouseleave', () => {
    dimActive = false;
    groups.attr('opacity', null).style('display', null);
  });
  legendBar.selectAll('.cal-legend__stop')
    .on('mouseenter', function () {
      const target = this.getAttribute('data-bucket');
      dimActive = true;
      dimTarget = target;
      groups.style('display', (d) => {
        // Reported cells with matching bucket: visible. Anything
        // else (non-matching reported, or unreported / out-of-
        // range): hidden — but only if the unreported cells
        // haven't been explicitly asked to stay visible. The user
        // wants strict "is this day in the X bucket" filtering,
        // so unreported days also disappear on hover.
        if (!d.reported) return 'none';
        const db = String(bucketForValue(d.total));
        return db === target ? '' : 'none';
      });
    });

  // 6c. Percentile boundaries for the tooltip chart's banded
  //     background. We compute the 10th and 90th percentile of the
  //     reported daily ridership so the chart's vertical scale
  //     always shows the 10th–90th percentile range — the white
  //     band sits at the 10th percentile, the deepest band at the
  //     90th. This means the variance is visible regardless of
  //     the dataset's actual range, and the bands correspond
  //     1:1 with the legend below the chart.
  // (percentile boundaries, bucketForValue, valueToPct, and color are
  //  computed up-front in step 1b so cells can be tagged with their
  //  bucket at construction time)

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
  // The bar container's background is a percentile scale, with bands
  // mapped 1:1 to the 10-step legend below the calendar. Eleven zones
  // stacked from bottom to top:
  //   - white      (below 10th percentile)
  //   - 9 bands    (10-20, 20-30, ..., 80-90th percentile, each
  //                  1/9 of the chart height, matching legend stops
  //                  1 through 9)
  //   - deep purple (above 90th percentile)
  // Values that fall outside the 10–90 range are immediately visible
  // as either fully white or fully deep purple. The bar's height
  // maps linearly to percentile position, so a value at p50 lands
  // at the middle of the chart.
  //
  // 7 hard-stop colour zones, each 100/7 of the bar-container height.
  // Zone 0 (white) is the bottom — values below p10. Zones 1-5 are
  // the 5 PURPLE_BUCKETS (10-90 range, evenly spaced). Zone 6 (deep
  // purple) is the top — values above p90.
  const ZONE_COUNT = PURPLE_BUCKETS.length + 2;   // 7
  const zoneColors = ['#ffffff', ...PURPLE_BUCKETS, PURPLE_BUCKETS[4]];
  const zoneStops = [];
  for (let i = 0; i < ZONE_COUNT; i++) {
    const startPct = (i / ZONE_COUNT) * 100;
    const endPct = ((i + 1) / ZONE_COUNT) * 100;
    zoneStops.push(`${zoneColors[i]} ${startPct.toFixed(2)}%`);
    zoneStops.push(`${zoneColors[i]} ${endPct.toFixed(2)}%`);
  }
  const bandGradient = `linear-gradient(to top, ${zoneStops.join(', ')})`;

  const tipBarContainer = tipChart
    .append('div')
    .attr('class', 'cal-tooltip__bar-container')
    .style('background', bandGradient);
  const tipBar = tipBarContainer
    .append('div')
    .attr('class', 'cal-tooltip__bar');

  // Reference lines (min / avg / max) drawn inside the bar container as
  // absolutely-positioned horizontal divs. They sit *over* the bar, so
  // the eye can compare the day's value against the dataset's spread at
  // a glance. Drawn once at render time; positions are percentile-based
  // (same scale as the bar and the chart's banded background), so a
  // value below p10 lands at 0% (white zone) and a value above p90
  // lands at 100% (deep purple zone).
  const refMin = d3.min(reportedTotals);
  const refMax = d3.max(reportedTotals);
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

  // The scale axis only shows `0` on the left now. The right-hand end
  // was just echoing the dataset max (same number on every hover) —
  // the dashed MAX reference line already tells the reader where the
  // ceiling sits, and the cell's own value tells them where they are.
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

  // 9a. Hover handlers.
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
        // Bar height is mapped to the 10th–90th percentile range so
        // the variance is visible regardless of the dataset's actual
        // range. The bar's top edge sits at the band's colour, which
        // tells the reader the day's bucket. Values < p10 clamp to
        // 0 (white zone visible), values > p90 clamp to 100% (deep
        // purple zone visible).
        const heightPct = Math.max(0, Math.min(100, valueToPct(d.total)));
        // The bar's fill is the same purple as the *highest* band the
        // bar reaches — this gives a second visual encoding (the
        // band's colour zone) on top of the bar's height, so the
        // reader can read both "how tall" and "which band" at a
        // glance. For values below p10, the bar sits in the white
        // zone and the fill is white.
        const bucket = bucketForValue(d.total);
        const barFill = bucket < 0
          ? WHITE
          : (bucket >= PURPLE_BUCKETS.length
              ? PURPLE_BUCKETS[PURPLE_BUCKETS.length - 1]
              : PURPLE_BUCKETS[bucket]);
        tipBar
          .style('height', heightPct + '%')
          .style('background', barFill)
          .style('opacity', 1);
      } else {
        tipValue.text('Not reported by BMRCL');
        tipBar
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
  let dimActive = false;
  let dimTarget = null;
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
