// viz/calendar-strip.js — Calendar grid viz for Chapter 1.
//
// Layout: a 7-row × N-week calendar grid.
//   - Rows = days of the week. Mon at the top, Sun at the bottom.
//   - Each month in the editorial window is its own Monday-to-Sunday
//     mini-calendar, so the 1st of each new month always starts in a
//     fresh column on its correct day-of-week row (one cell below and
//     one cell to the right of the previous month's last day). The
//     first block clamps to the editorial start; the last block clamps
//     to the editorial end.
//   - Within a month-block, the first column starts on the Monday on or
//     before the block's first date and the last column ends on the
//     Sunday on or after the block's last date. Leading/trailing days
//     outside the block are rendered as empty blanks.
//   - A short month label (e.g. "Nov", "Dec") sits above the first
//     column of each month-block.
//   - Each cell = a single day. Cells outside the editorial window
//     are rendered empty (no fill, no border, no X). Cells inside
//     the window that BMRCL didn't publish are rendered with a
//     transparent fill and a visible X. Reported cells are coloured
//     by total ridership on a sequential Namma Metro purple scale.
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

// Month-block label row. A short month label (e.g. "Nov", "Dec")
// sits above the first column of each month-block. Bumped from
// 16 → 24 to give the month label more breathing room above
// the first cell row — without the extra space, "Nov" sat
// just 5px above the cells, which read as too tight (the
// labels visually fused with the squares). 24px gives the
// label ~14px of clearance from the cell top, which reads
// as a proper section header above a data block.
const LABEL_ROW_HEIGHT = 24;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Namma Metro purple scale — 5 distinct buckets from "almost paper"
// at the bottom to deep BMRCL purple at the top. The dataset is
// divided into N bands (driven by the notebook's percentile
// boundaries in daily-stats.json — currently 10), and the bands
// are painted by `d3.interpolateRgbBasis(PURPLE_BUCKETS)` so
// the N stops are smooth blends between these 5 anchor colours.
// The bottom anchor (`#f2ecf4`) is barely a step away from the
// page's paper background (`#f7f3ee`); the top anchor is the
// story's BMRCL purple (`#5E2D8C`) used elsewhere in the
// article. The middle three are spaced out so each band is
// visually distinct from its neighbours — the eye can pick
// out "this cell is in the bottom band" from "this cell is in
// the next band up" at a glance, without having to consult
// the legend.
const PURPLE_BUCKETS = [
  '#f2ecf4',  // 0 — almost paper, just a whisper of purple
  '#d4bee0',  // 1 — light lavender (clearly lavender, not paper)
  '#a37ac0',  // 2 — medium wisteria, more saturated
  '#7a3fa8',  // 3 — deep violet
  '#5E2D8C',  // 4 — BMRCL purple (highest ridership band)
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

/**
 * Build the calendar grid. Returns the SVG and an `update` function.
 *
 * @param {Element} container - the viz container
 * @param {Array}  daily      - daily-by-mode records
 * @param {Object} window     - { startDate, endDate }
 * @param {Object} stats      - daily-stats.json payload
 *   - { min, max, count, bucketCount, buckets: { p20, p40, p60, p80 } }
 *   The HTML page does no analytics of its own: min, max, and the
 *   four bucket boundaries are pre-computed by the aggregation
 *   notebook and shipped in the JSON.
 */
export function renderCalendarStrip(container, daily, window, stats) {
  const { startDate, endDate } = window;

  // 1. Index daily by ISO date for O(1) lookup
  const byDate = new Map(daily.map((d) => [d.date, d]));

  // 1b. Percentile bucketing. The number of bands and the
  //     boundaries come pre-computed by the aggregation
  //     notebook — see daily-stats.json. The bucketing is read
  //     here, not derived: the HTML/JS does no analytics of
  //     its own, just maps values into the pre-computed bands.
  //     The notebook picks the boundaries (e.g. p2, p5, p10,
  //     p25, p50, p75, p90, p95, p98) and how many (9 boundaries
  //     → 10 bands in the current JSON). Change the JSON, the
  //     chart adapts: more or fewer boundaries, more or fewer
  //     legend stops, more or fewer chart zones, more or fewer
  //     colour buckets.
  //
  //     The bar's value-to-height mapping is still linear across
  //     the absolute min–max range (so the bar visually spans
  //     the full chart height), but the *colour* of the bar is
  //     the band the value lands in.
  const dataMin = stats.min;
  const dataMax = stats.max;
  const dataRange = dataMax - dataMin;
  // Bucket boundaries, sorted ascending. Read from the JSON
  // (sorted by the key suffix: p2, p5, p10, p25, p50, p75, p90,
  // p95, p98). The number of bands = boundaries.length + 1.
  const boundaryKeys = Object.keys(stats.buckets)
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
  const boundaries = boundaryKeys.map((k) => stats.buckets[k]);
  const BUCKET_COUNT = boundaries.length + 1;

  // Percentile labels for each bucket, e.g. "< 2nd percentile",
  // "2nd–5th percentile", ..., "> 98th percentile". Used by the
  // tiny tooltip that appears when hovering a legend stop.
  function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    if (n % 10 === 1) return `${n}st`;
    if (n % 10 === 2) return `${n}nd`;
    if (n % 10 === 3) return `${n}rd`;
    return `${n}th`;
  }
  const bucketPct = boundaryKeys.map((k) => parseInt(k.slice(1), 10));
  const bucketRangeLabels = [];
  bucketRangeLabels.push(`< ${ordinal(bucketPct[0])} percentile`);
  for (let i = 1; i < bucketPct.length; i++) {
    bucketRangeLabels.push(
      `${ordinal(bucketPct[i - 1])}–${ordinal(bucketPct[i])} percentile`
    );
  }
  bucketRangeLabels.push(`> ${ordinal(bucketPct[bucketPct.length - 1])} percentile`);

  // Bucket colours: sample the PURPLE_BUCKETS gradient at
  // BUCKET_COUNT evenly-spaced points. This way the same 5
  // anchor colours produce a smooth 10-stop legend when the
  // JSON has 9 boundaries, or a 4-stop legend if the notebook
  // ever ships 3 boundaries. d3.interpolateRgbBasis with 5
  // anchor colours and 10 sample points gives 10 stops
  // that progress smoothly from palest to deepest.
  function computeBandColors(n) {
    if (n === PURPLE_BUCKETS.length) return PURPLE_BUCKETS;
    const interp = d3.interpolateRgbBasis(PURPLE_BUCKETS);
    return d3.range(n).map((i) => interp(i / (n - 1)));
  }
  const BAND_COLORS = computeBandColors(BUCKET_COUNT);

  // valueToPct: maps the dataset's value range [MIN, MAX]
  // to a height percentage in [BAR_MIN_PCT, 100]. The
  // BAR_MIN_PCT floor keeps the bar at MIN visible as a
  // thin sliver (without it, the bar at MIN would have
  // 0% height and disappear entirely — the user found
  // this confusing: "a bar with minimum value is barely
  // visible, suggesting the bottom of the chart is MIN
  // and not 0"). The reference lines (min/med/max) and
  // the banded background positions all use the SAME
  // mapping, so the MIN line sits at exactly the bar's
  // tip position when the value is MIN, the MAX line at
  // the bar's tip when value is MAX, etc. The chart's
  // visual bottom (0%) is just a small "buffer" below
  // MIN — the bar never extends below BAR_MIN_PCT.
  function valueToPct(v) {
    if (v == null) return 0;
    const linear = (v - dataMin) / dataRange;   // 0..1
    return BAR_MIN_PCT + linear * (100 - BAR_MIN_PCT);
  }
  // BAR_MIN_PCT: the bar's minimum height as a percentage of
  // the chart. Even at the dataset's smallest value (4.0L), the
  // bar is rendered at 4% of the chart's height — a thin sliver
  // that's clearly visible but reads as "this is the floor of
  // the data". The bar's actual VALUE is still conveyed by its
  // tip position, which now aligns exactly with the MIN/MAX
  // reference lines (both use valueToPct above, so the line
  // for a value v sits at the bar's tip position when the
  // value is v).
  const BAR_MIN_PCT = 4;
  // bucketForValue: returns 0..BUCKET_COUNT-1. Walks the
  // boundaries list — value below the first boundary is
  // bucket 0, between first and second is bucket 1, etc.
  // Value at or above the last boundary is the top bucket
  // (BUCKET_COUNT-1). null → -1 (unreported).
  function bucketForValue(v) {
    if (v == null) return -1;
    for (let i = 0; i < boundaries.length; i++) {
      if (v < boundaries[i]) return i;
    }
    return boundaries.length;
  }
  // color: maps the bucket to its BAND_COLORS colour. -1 (no
  // value) clamps to bucket 0 (palest lavender) — unreported days
  // pick up the palest colour, matching the bottom of the scale.
  function color(v) {
    const b = bucketForValue(v);
    if (b < 0) return BAND_COLORS[0];
    if (b >= BUCKET_COUNT) return BAND_COLORS[BUCKET_COUNT - 1];
    return BAND_COLORS[b];
  }

  // 2. Build the month-blocks in the editorial window. Each month
  //    is its own Monday-to-Sunday mini-calendar, so the 1st of a
  //    new month always starts in a fresh column on its correct
  //    day-of-week row (one cell below and one cell to the right of
  //    the previous month's last day). The first block clamps to the
  //    editorial start; the last block clamps to the editorial end.
  const start = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  function getMonday(d) {
    const day = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const offset = (day + 6) % 7; // Mon=0, ..., Sun=6
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset));
  }
  function getSunday(d) {
    const day = d.getUTCDay();
    const offset = (day + 6) % 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + (6 - offset)));
  }
  function getLastOfMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0));
  }

  const monthBlocks = [];
  {
    let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const lastMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cur.getTime() <= lastMonth.getTime()) {
      const year = cur.getUTCFullYear();
      const month = cur.getUTCMonth();
      const firstOfMonth = new Date(Date.UTC(year, month, 1));
      const lastOfMonth = getLastOfMonth(year, month);
      const firstDate = firstOfMonth < start ? start : firstOfMonth;
      const lastDate = lastOfMonth > end ? end : lastOfMonth;
      monthBlocks.push({
        firstDate,
        lastDate,
        firstOfMonth,
        lastOfMonth,
        month,
        year,
      });
      cur = new Date(Date.UTC(year, month + 1, 1));
    }
  }

  // 3. Build the column list. Each month-block contributes weekly
  //    Monday-to-Sunday columns. The first column of a block starts
  //    on the Monday on or before the block's first date; the last
  //    column ends on the Sunday on or after the block's last date.
  //    Days that belong to the surrounding month but sit inside the
  //    padded week are rendered as blanks.
  const columns = [];
  let absoluteCol = 0;
  for (const block of monthBlocks) {
    const calStart = getMonday(block.firstDate);
    const calEnd = getSunday(block.lastDate);
    for (let colStart = new Date(calStart); colStart.getTime() <= calEnd.getTime(); colStart.setUTCDate(colStart.getUTCDate() + 7)) {
      const colEnd = new Date(Date.UTC(colStart.getUTCFullYear(), colStart.getUTCMonth(), colStart.getUTCDate() + 6));
      columns.push({
        absoluteCol,
        startDate: new Date(colStart),
        startRow: 0, // Monday
        endDate: new Date(colEnd),
        block,
      });
      absoluteCol++;
    }
  }
  const numCols = columns.length;

  // 4. Build the cell list. Each column is a full Monday-to-Sunday
  //    week; days outside the current month-block (but inside the
  //    padded week) keep their place in the grid but are rendered as
  //    empty placeholders.
  const cells = [];
  for (const col of columns) {
    for (let row = 0; row < 7; row++) {
      const date = new Date(Date.UTC(col.startDate.getUTCFullYear(), col.startDate.getUTCMonth(), col.startDate.getUTCDate() + row));
      const iso = date.toISOString().slice(0, 10);
      const inBlock =
        date.getTime() >= col.block.firstDate.getTime() &&
        date.getTime() <= col.block.lastDate.getTime();
      const inRange =
        date.getTime() >= start.getTime() &&
        date.getTime() <= end.getTime();
      const rendered = inRange && inBlock;
      const reported = rendered && byDate.has(iso);
      cells.push({
        date,
        iso,
        col: col.absoluteCol,
        row,
        inRange: rendered,
        reported,
        total: byDate.get(iso)?.total ?? null,
      });
    }
  }

  // 5. SVG dimensions — no MONTH_GUTTER; columns are uniformly
  //    spaced. LABEL_ROW_HEIGHT reserves vertical space at the
  //    top for the month labels (Nov, Dec, Jan, …).
  const WIDTH = LABEL_WIDTH + numCols * (CELL + GAP);
  const HEIGHT = LABEL_ROW_HEIGHT + ROWS * (CELL + GAP);

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
  //     is the 5 PURPLE_BUCKETS, one band per quintile of the
  //     dataset's reported totals. The strip itself doesn't show
  //     the band positions in value space (they're not equal-width
  //     — see the comment at 9a for the chart's banded background
  //     for the actual positions); the strip is just 5 equal-
  //     width swatches of the 5 colours, palest to deepest. Below
  //     the strip, a single row of labels: "Min <value>" anchored
  //     at the left edge, "Daily Ridership" centred, "Max <value>"
  //     anchored at the right edge. The Min/Max values are the
  //     dataset's actual extremes (stats.min and stats.max), not
  //     the 10th/90th percentiles — so the user sees the true
  //     range of the data, not a clipped middle. No tick marks
  //     at band boundaries.
  const legend = d3.select(container)
    .append('div')
    .attr('class', 'cal-legend')
    .attr('aria-hidden', 'true');  // decorative; cells already have aria-labels
  const legendBar = legend.append('div').attr('class', 'cal-legend__bar');

  // Tiny tooltip that follows the cursor band in the legend,
  // showing the percentile range each colour represents.
  const legendTip = legend.append('div').attr('class', 'cal-legend__tip');

  for (let i = 0; i < BUCKET_COUNT; i++) {
    legendBar
      .append('div')
      .attr('class', 'cal-legend__stop')
      .attr('data-bucket', String(i))
      .attr('data-label', bucketRangeLabels[i])
      .style('background', BAND_COLORS[i]);
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

  // 6c. Legend hover → filter calendar cells. Hovering a stop
  //     shows only cells whose bucket matches the hovered stop.
  //     Moving from the legend into the chart keeps the filter
  //     active so the user can inspect matching squares. Moving
  //     out of the chart restores the full view. Moving out of
  //     the legend (without entering the chart) keeps the filter
  //     active for 1 second as a grace period. The `dimActive`
  //     flag (declared alongside update()) prevents the scroll-
  //     reveal from clobbering the filter.
  //
  //     Important: when the legend filter is active, we set
  //     `display` (matches visible, otherwise none) AND
  //     `opacity` to 1 on matching cells. The scroll-reveal
  //     sets opacity 0-1 as the user scrolls; without resetting
  //     it, a matching cell could still be invisible because
  //     its row hasn't been scrolled into view yet. So we
  //     force opacity=1 on whatever's visible.
  let dimActive = false;
  let dimTarget = null;
  let overLegend = false;
  let overChart = false;
  let filterLeaveTimer = null;  // 1s grace after leaving legend
  let chartLeaveTimer = null;   // short grace for chart→legend transitions

  function applyFilter(target) {
    groups
      .style('display', (d) => {
        if (!d.reported) return 'none';
        const db = String(bucketForValue(d.total));
        return db === target ? '' : 'none';
      })
      .style('opacity', (d) => {
        if (!d.reported) return 0;
        const db = String(bucketForValue(d.total));
        return db === target ? 1 : 0;
      });
  }
  function clearFilter() {
    groups
      .style('display', null)
      .style('opacity', null);
    // Re-apply the last progress so cells re-appear at the
    // right opacity for the current scroll position.
    update(lastProgress);
  }
  function clearFilterNow() {
    dimActive = false;
    dimTarget = null;
    if (filterLeaveTimer) {
      clearTimeout(filterLeaveTimer);
      filterLeaveTimer = null;
    }
    if (chartLeaveTimer) {
      clearTimeout(chartLeaveTimer);
      chartLeaveTimer = null;
    }
    clearFilter();
  }
  function scheduleClearFilter(delayMs) {
    if (filterLeaveTimer) return; // already scheduled
    filterLeaveTimer = setTimeout(() => {
      dimActive = false;
      dimTarget = null;
      clearFilter();
      filterLeaveTimer = null;
    }, delayMs);
  }
  function cancelFilterTimers() {
    if (filterLeaveTimer) {
      clearTimeout(filterLeaveTimer);
      filterLeaveTimer = null;
    }
    if (chartLeaveTimer) {
      clearTimeout(chartLeaveTimer);
      chartLeaveTimer = null;
    }
  }

  legend.on('mouseenter', () => {
    overLegend = true;
    cancelFilterTimers();
  });
  legend.on('mouseleave', () => {
    overLegend = false;
    if (!overChart) scheduleClearFilter(1000);
  });

  svg.on('mouseenter', () => {
    overChart = true;
    cancelFilterTimers();
  });
  svg.on('mouseleave', () => {
    overChart = false;
    // Short grace window so a chart→legend transition does not
    // clear the filter before the legend mouseenter fires.
    chartLeaveTimer = setTimeout(() => {
      chartLeaveTimer = null;
      if (!overLegend && !overChart) clearFilterNow();
    }, 50);
  });

  legendBar.selectAll('.cal-legend__stop')
    .on('mouseenter', function () {
      const target = this.getAttribute('data-bucket');
      dimActive = true;
      dimTarget = target;
      applyFilter(target);

      // Show the percentile-range tooltip centered above the band.
      const label = this.getAttribute('data-label');
      const rect = this.getBoundingClientRect();
      const legendRect = legend.node().getBoundingClientRect();
      const center = rect.left - legendRect.left + rect.width / 2;
      legendTip
        .text(label)
        .style('left', `${center}px`)
        .classed('cal-legend__tip--visible', true);
    })
    .on('mouseleave', function () {
      legendTip.classed('cal-legend__tip--visible', false);
    });

  // 7. Y-axis labels (Mon, Tue, ...). Always visible.
  svg
    .selectAll('text.label')
    .data(DOW_LABELS)
    .join('text')
    .attr('class', 'label')
    .attr('x', 0)
    .attr('y', (_, i) => LABEL_ROW_HEIGHT + i * (CELL + GAP) + CELL * 0.72)
    .attr('font-size', 9)
    .attr('font-weight', 400)
    .attr('fill', COLORS.text)
    .attr('letter-spacing', '0.04em')
    .text((d) => d);

  // 6c. Month labels. For each month-block, a short label ("Nov",
  //     "Dec", "Jan", …) sits in the row above the cells, anchored
  //     to the first column of that block. Same font, weight, AND
  //     colour as the day-of-week labels to the left of the cells
  //     (size 9, weight 400, fill var(--muted)) so the two read as
  //     a single labelling language — the labels on the top and
  //     the left of the grid are part of the same axis system.
  //     The wider letter-spacing (0.22em vs 0.04em on the DOW
  //     labels) gives the month label just enough breathing room
  //     to read as a "section title" rather than a row marker,
  //     without making it visually compete with the data.
  const monthLabels = monthBlocks.map((block) => {
    const firstCol = columns.find((c) => c.block === block);
    return {
      x: LABEL_WIDTH + firstCol.absoluteCol * (CELL + GAP),
      text: MONTH_NAMES[block.month],
    };
  });
  svg
    .selectAll('text.month-label')
    .data(monthLabels)
    .join('text')
    .attr('class', 'month-label')
    .attr('x', (d) => d.x)
    .attr('y', LABEL_ROW_HEIGHT - 8)   // baseline 8px above the top row, centred in the new 24px label row
    .attr('font-size', 9)
    .attr('font-weight', 400)
    .attr('fill', 'var(--muted)')
    .attr('letter-spacing', '0.22em')
    .text((d) => d.text);

  // 8. Cells. Initial state: invisible (opacity 0). The
  //    update() below reveals them row-by-row, top to bottom,
  //    fading each row from 0 → 1.0 as the user scrolls
  //    through the chapter. The "fade in from zero" reveal
  //    is the data-story intent: the calendar isn't a static
  //    data table to glance at, it's the chapter's central
  //    visualisation, and the scroll-reveal is what makes
  //    the 191 days feel like a sequence the reader is being
  //    walked through, not a wall of cells to parse at once.
  //    (An earlier v0.15 baseline of 0.35 made the cells
  //    visible at all scroll positions, but the user
  //    explicitly wanted the rows to fade in from 0 — a true
  //    reveal, not a dim baseline that brightens. The TDZ
  //    fix from v0.15 is kept: the chapter mount's
  //    try/catch around renderTreemap ensures the calendar
  //    always gets a working ScrollTrigger, so the reveal
  //    fires reliably.)
  const groups = svg
    .selectAll('g.cell')
    .data(cells)
    .join('g')
    .attr('class', 'cell')
    .attr('transform', (d) => `translate(${LABEL_WIDTH + d.col * (CELL + GAP)}, ${LABEL_ROW_HEIGHT + d.row * (CELL + GAP)})`)
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
    .attr('ry', 1)
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

  // 9a. Tooltip chart's banded background. BUCKET_COUNT hard-
  //     stop colour zones mapped to the bands. Each zone's
  //     height is NOT equal — the zones are positioned at the
  //     value-positions of the bucket boundaries (from the
  //     notebook) inside the absolute min–max range. The
  //     dataset is right-skewed (most days are 7-9L), so the
  //     bottom band spans a large value range and the top bands
  //     are compressed. The bar's height uses the same
  //     valueToPct mapping as the band positions, so the bar's
  //     tip at any value lands exactly in the band that value
  //     belongs to — the bar's tip position and the band's
  //     vertical position are the same encoding. The MIN line
  //     is at the bar's tip at MIN; the MAX line at the bar's
  //     tip at MAX; everything reads as one value space.
  const positions = [
    valueToPct(dataMin),
    ...boundaries.map(valueToPct),
    valueToPct(dataMax),
  ];
  const zoneStops = [];
  for (let i = 0; i < BUCKET_COUNT; i++) {
    zoneStops.push(`${BAND_COLORS[i]} ${positions[i].toFixed(2)}%`);
    zoneStops.push(`${BAND_COLORS[i]} ${positions[i + 1].toFixed(2)}%`);
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
  //     spelled out. Min/med/max are all pre-computed by the
  //     aggregation notebook (daily-stats.json) — the page does
  //     no analytics of its own.
  //
  //     "med" is the dataset's median, not the mean. Metro
  //     ridership is right-skewed (weekend dips + occasional
  //     spike days), so the mean gets pulled up by the tails
  //     and reads as "above the average day". The median is
  //     the 50th-percentile day — it anchors the chart at
  //     "what a typical day looks like", and the bar's fill
  //     vs the reference line then reads as "normal day" vs
  //     "spike day" instead of "below average" vs "above
  //     average". This is the rare chart where the *spread*
  //     is the story; the median tells the more useful story.
  const refMin = dataMin;
  const refMax = dataMax;
  const refMed = stats.median;
  const refs = [
    { key: 'min', value: refMin, label: 'min' },
    { key: 'med', value: refMed, label: 'med' },
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

  // 9d. The scale axis label was previously a "MIN 4.0L" tag
  //     at the bottom-left of the chart — but the dashed MIN
  //     reference line on the right edge of the bar already
  //     labels the floor, and the chart's bottom = MIN is now
  //     self-evident from the bar's bottom anchor. A redundant
  //     label at the bottom-left just adds visual weight to
  //     the lowest part of the chart, which is where the eye
  //     least needs help. Gone. (The `.cal-tooltip__scale` div
  //     is kept as an empty placeholder so any future scale
  //     label can re-attach to it without re-architecting the
  //     tooltip — the `.cal-tooltip__scale-min` CSS rule is
  //     also still in place for that case.)

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
      // Fade out by removing the visible class. The CSS opacity
      // transition runs (0.18s); the display is set to none on
      // the transitionend event so we don't snap-hide while the
      // fade is in flight.
      tooltip.classed('cal-tooltip--visible', false);
      hideTimeout = null;
    }, HIDE_DELAY_MS);
  }
  // After the fade-out finishes, set display: none. Listens on
  // the tooltip itself for the opacity transition end.
  tooltip
    .on('transitionend.calTooltip', (event) => {
      if (event.propertyName === 'opacity' && !tooltip.classed('cal-tooltip--visible')) {
        tooltip.style('display', 'none');
      }
    });

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
        // Bar height uses the same valueToPct as the
        // reference lines, so the bar's tip at MIN sits
        // exactly on the dashed MIN line, and the bar's
        // tip at MAX sits exactly on the dashed MAX line.
        // The fill is the same purple as the band the
        // value lands in — second visual encoding (which
        // bucket) on top of the bar's height (how far up).
        const heightPct = valueToPct(d.total);
        const bucket = bucketForValue(d.total);
        const barFill = BAND_COLORS[
          Math.max(0, Math.min(BUCKET_COUNT - 1, bucket))
        ];
        tipBarFill
          .style('height', heightPct + '%')
          .style('background', barFill)
          .style('opacity', 1);
      } else {
        tipValue.text('Not reported by BMRCL');
        tipBarFill
          .style('height', BAR_MIN_PCT + '%')
          .style('background', X_STROKE)
          .style('opacity', 1);
      }

      // Position below the cell. The tooltip's transform is
      // translate(-50%, 0) so its top edge sits at the 'top'
      // value (cellBottomY + TIP_GAP). The CSS transition on
      // 'left' and 'top' (in scrolly.css) makes the tooltip
      // smoothly slide from one cell to the next as the mouse
      // moves. The 'cal-tooltip--visible' class is added only
      // on first show (when the tooltip is hidden) — once
      // visible, subsequent cell changes just update the
      // content and the position, and the CSS transition
      // handles the smooth slide.
      const cellRect = this.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const cellCenterX = cellRect.left - containerRect.left + cellRect.width / 2;
      const cellBottomY = cellRect.bottom - containerRect.top;

      const wasHidden = tooltip.style('display') === 'none' || !tooltip.classed('cal-tooltip--visible');
      tooltip
        .style('left', cellCenterX + 'px')
        .style('top', cellBottomY + TIP_GAP + 'px')
        .style('display', 'block');

      if (wasHidden) {
        // First show: force a reflow before adding the visible
        // class so the opacity transition fires from 0 → 1.
        void tooltip.node().offsetWidth;
        tooltip.classed('cal-tooltip--visible', true);
      }
      // If the tooltip is already visible, just update content
      // and position — the CSS transition on left/top slides
      // the tooltip smoothly to the new cell.
    })
    .on('mouseleave blur', scheduleHide);

  // 10. Scroll-driven reveal: rows top to bottom. If the user has
  //     hovered a legend stop, the dim takes precedence and the
  //     reveal update is suppressed until they move off the legend.
  // Track the last progress so we can re-apply the reveal when
  // the user moves off the legend (after a hover), restoring
  // the cells to their scroll-driven opacity.
  let lastProgress = 0;
  function update(progress) {
    lastProgress = progress;
    if (dimActive) {
      // Legend hover is in control. Force the matching cells
      // to full opacity so they're visible even if their row
      // hasn't been scrolled into view. Non-matching cells stay
      // hidden (display: none from applyFilter).
      groups
        .filter((d) => d.reported)
        .style('opacity', (d) =>
          String(bucketForValue(d.total)) === dimTarget ? 1 : 0
        );
      return;
    }
    // When the legend filter is not active, make sure no leftover
    // inline opacity styles override the scroll-reveal attribute.
    groups.style('opacity', null);
    // The reveal ramps each row from 0 → 1 as the user scrolls
    // through the trigger. Row 0 (Mon) starts revealing at
    // progress 0; row 6 (Sun) finishes at progress 1. A row
    // that hasn't been scrolled into view yet is at opacity 0
    // (invisible); a row that has been fully scrolled past is
    // at opacity 1.0 (fully visible). No baseline opacity —
    // the reveal is a true fade-in from 0.
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
    tooltip.on('transitionend.calTooltip', null);
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
