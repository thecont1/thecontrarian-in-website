// viz/extreme-days.js — top-10 + bottom-10 days, one ranked bar chart.
//
// The story: ridership spans an enormous range. The 10 busiest days in
// the editorial window are clustered around 8.5–9.1L; the 10 least busy
// days are clustered around 4.0–5.0L. A 2× difference, with the
// "typical day" (median ≈ 8.0L) sitting closer to the busy end than
// the quiet end. One chart, sorted descending, makes the gap visible
// at a glance: the long top-10 bars and the short bottom-10 bars
// bracket an empty stretch in the middle that is itself the visual
// point — the dataset has two modes, "weekday peaks" and "Sunday /
// holiday floors", with very few days in between.
//
// Chart anatomy:
//   - 20 horizontal bars, sorted by ridership descending (busiest on
//     top, quietest on bottom).
//   - Single colour (BMRCL purple, --accent-color) for all bars. The
//     row position alone tells you whether a day is in the busy or
//     quiet cluster; a second colour would be redundant.
//   - Date label inside the bar (left-aligned, white) for the long
//     top-10 bars; for the short bottom-10 bars, the label sits
//     outside the bar in the ink colour so it doesn't disappear.
//   - Total ridership to the right of each bar (Lakh, 1 decimal).
//   - X-axis from 0 to the dataset's max ridership, with subtle
//     gridlines at 2L / 4L / 6L / 8L.
//   - A thin vertical median line at 8.0L, annotated "median", to
//     anchor the eye against the dataset's "typical day".
//   - A thin horizontal divider between row 10 and row 11 (the
//     busiest cluster ends, the quietest cluster begins), with a
//     small "← 10 BUSIEST  |  10 QUIETEST →" label that reads as a
//     section header without dominating the chart.
//
// Scroll integration: each bar's width animates from 0 to its
// target value as the user scrolls. update(progress) drives all
// 20 bars' width × progress. progress ∈ [0, 1].

import * as d3 from 'd3';

const WIDTH = 720;
const ROW_HEIGHT = 26;
const ROW_GAP = 5;
const LABEL_W = 132;        // left gutter for date + dow
const RIGHT_W = 64;         // right gutter for the Lakh value
const BAR_AREA_W = WIDTH - LABEL_W - RIGHT_W;
const TOP_PAD = 32;         // space above the first bar (for the divider label)
const BOTTOM_PAD = 38;      // space below the last bar (for the x-axis)
const PADDING_X = 8;

const ACCENT = '#5E2D8C';   // BMRCL purple, matches the calendar's legend
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const GRID = 'rgba(0, 0, 0, 0.08)';
const MEDIAN = 'rgba(208, 75, 54, 0.85)';  // matches --accent (#d04b36)

/**
 * Render the unified top-10 / bottom-10 chart.
 *
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} daily - all daily records
 * @param {Object} options
 *   - {number} median - the dataset's median ridership, pre-computed
 *     by the notebook (stats.median in daily-stats.json)
 *   - {number} max - the dataset's max ridership, pre-computed
 *     (stats.max in daily-stats.json). Used to set the x-axis
 *     domain so all 20 bars fit on a shared scale.
 * @returns {{ update, destroy }}
 */
export function renderExtremeDays(container, daily, options = {}) {
  const { median = 800000, max = 920000 } = options;

  // Sort and pick the extremes. We pick 10 from each end of the
  // full daily array — the chapter 2 caption originally said
  // "10 busiest weekdays (Mon–Thu)" but the user has since
  // broadened the request to "10 busiest days" without a
  // weekday filter, so we use ALL days.
  const sorted = [...daily].sort((a, b) => b.total - a.total);
  const topBusy = sorted.slice(0, 10);
  const topQuiet = sorted.slice(-10).reverse();   // reverse so it's still descending
  const rows = [...topBusy, ...topQuiet];
  // Mark which side each row belongs to. Drives the divider
  // label and a subtle colour treatment if we ever want one.
  for (let i = 0; i < topBusy.length; i++) topBusy[i]._cluster = 'busy';
  for (let i = 0; i < topQuiet.length; i++) topQuiet[i]._cluster = 'quiet';

  const N = rows.length;
  const HEIGHT = TOP_PAD + N * (ROW_HEIGHT + ROW_GAP) + BOTTOM_PAD;

  const svg = d3.select(container)
    .append('svg')
    .attr('class', 'extreme-days-svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', `Top 10 and bottom 10 days by ridership, ranked descending. ${rows.length} days.`)
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10.5px');

  // X-axis: 0 → max. Round the max UP to the next lakh for a
  // clean gridline.
  const maxAxis = Math.ceil(max / 100000) * 100000;
  const x = d3.scaleLinear()
    .domain([0, maxAxis])
    .range([0, BAR_AREA_W]);

  // Gridlines at 0, 2L, 4L, 6L, 8L, max. Only 0 is visible at the
  // bar's start; the rest are thin vertical rules behind the
  // bars.
  const gridTicks = [0, 200000, 400000, 600000, 800000, maxAxis];
  const gridGroup = svg.append('g').attr('class', 'extreme-days__grid');
  for (const t of gridTicks) {
    gridGroup.append('line')
      .attr('x1', LABEL_W + x(t))
      .attr('x2', LABEL_W + x(t))
      .attr('y1', TOP_PAD - 6)
      .attr('y2', TOP_PAD + N * (ROW_HEIGHT + ROW_GAP) - ROW_GAP + 4)
      .attr('stroke', GRID)
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', t === 0 ? null : '2 3');
  }

  // X-axis tick labels along the bottom.
  const axisGroup = svg.append('g').attr('class', 'extreme-days__axis');
  for (const t of gridTicks) {
    const label = t === 0 ? '0' : `${(t / 100000).toFixed(0)}L`;
    axisGroup.append('text')
      .attr('x', LABEL_W + x(t))
      .attr('y', TOP_PAD + N * (ROW_HEIGHT + ROW_GAP) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', MUTED)
      .text(label);
  }
  // Axis caption.
  axisGroup.append('text')
    .attr('x', LABEL_W + BAR_AREA_W / 2)
    .attr('y', TOP_PAD + N * (ROW_HEIGHT + ROW_GAP) + 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', 9)
    .attr('font-style', 'italic')
    .attr('fill', MUTED)
    .text('Daily ridership');

  // Median line + label. The median sits between the two
  // clusters visually — it's the "what a typical day looks
  // like" reference, and it's closer to the busy end than
  // the quiet end, which is itself a data point.
  const medianX = LABEL_W + x(median);
  svg.append('line')
    .attr('class', 'extreme-days__median')
    .attr('x1', medianX)
    .attr('x2', medianX)
    .attr('y1', TOP_PAD - 10)
    .attr('y2', TOP_PAD + N * (ROW_HEIGHT + ROW_GAP) - ROW_GAP + 4)
    .attr('stroke', MEDIAN)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3 2');
  svg.append('text')
    .attr('class', 'extreme-days__median-label')
    .attr('x', medianX + 4)
    .attr('y', TOP_PAD - 14)
    .attr('font-size', 8)
    .attr('font-weight', 500)
    .attr('letter-spacing', '0.06em')
    .attr('text-transform', 'uppercase')
    .attr('fill', MEDIAN)
    .text('Median');

  // Cluster divider. A thin horizontal rule between row 10
  // (the last busy day) and row 11 (the first quiet day), with
  // a small section label that reads the gap as a story beat.
  const dividerY = TOP_PAD + 10 * (ROW_HEIGHT + ROW_GAP) - ROW_GAP / 2;
  svg.append('line')
    .attr('x1', LABEL_W)
    .attr('x2', WIDTH - RIGHT_W)
    .attr('y1', dividerY)
    .attr('y2', dividerY)
    .attr('stroke', 'rgba(0, 0, 0, 0.25)')
    .attr('stroke-width', 0.5)
    .attr('stroke-dasharray', '1 3');
  // Section label sits just above the divider, centred on the
  // chart. It's small (8.5px) and ink-coloured so it reads as a
  // section header without competing with the bars.
  const dividerLabelY = dividerY - 4;
  // Right side: "10 QUIETEST"
  svg.append('text')
    .attr('x', WIDTH - RIGHT_W - 4)
    .attr('y', dividerLabelY)
    .attr('text-anchor', 'end')
    .attr('font-size', 8.5)
    .attr('font-weight', 600)
    .attr('letter-spacing', '0.12em')
    .attr('fill', MUTED)
    .text('10 QUIETEST ▾');
  // Left side: "10 BUSIEST ▴"
  svg.append('text')
    .attr('x', LABEL_W + 4)
    .attr('y', dividerLabelY)
    .attr('text-anchor', 'start')
    .attr('font-size', 8.5)
    .attr('font-weight', 600)
    .attr('letter-spacing', '0.12em')
    .attr('fill', MUTED)
    .text('▴ 10 BUSIEST');

  // Rows. Each row is a group with:
  //   - a date label on the left (Mon, Dec 08)
  //   - a bar in BMRCL purple
  //   - a value label to the right of the bar
  const groups = svg
    .selectAll('g.row')
    .data(rows)
    .join('g')
    .attr('class', 'row')
    .attr('data-cluster', (d) => d._cluster)
    .attr('transform', (_, i) => `translate(0, ${TOP_PAD + i * (ROW_HEIGHT + ROW_GAP)})`);

  // Date label (left). Format "Mon, Dec 08" using the same
  // d3.timeFormat pattern as the calendar's day-of-week labels.
  const dateFmt = d3.timeFormat('%a, %b %d');
  groups.append('text')
    .attr('class', 'row__date')
    .attr('x', 0)
    .attr('y', ROW_HEIGHT / 2)
    .attr('dy', '0.35em')
    .attr('font-size', 10.5)
    .attr('fill', INK)
    .text((d) => dateFmt(new Date(d.date)));

  // Bar background (full chart-area width, faint). Acts as
  // the "track" the bar fills — gives the bar a visible end
  // even when the bar is short, and keeps the visual rhythm of
  // the chart consistent for all 20 rows.
  groups.append('rect')
    .attr('class', 'row__track')
    .attr('x', LABEL_W)
    .attr('y', 0)
    .attr('width', BAR_AREA_W)
    .attr('height', ROW_HEIGHT)
    .attr('fill', 'rgba(0,0,0,0.03)')
    .attr('rx', 2);

  // The bar itself. Starts collapsed (width 0) and grows on
  // scroll-reveal. Same purple throughout — the row position
  // is the only "busy vs quiet" signal.
  const bars = groups.append('rect')
    .attr('class', 'row__bar')
    .attr('x', LABEL_W)
    .attr('y', 0)
    .attr('width', 0)
    .attr('height', ROW_HEIGHT)
    .attr('fill', ACCENT)
    .attr('rx', 2);

  // Value label (Lakh, 1 decimal). Sits to the right of the
  // bar's tip — its `x` is set in update() as
  // `LABEL_W + x(d.total) * progress + 6`.
  const values = groups.append('text')
    .attr('class', 'row__value')
    .attr('x', LABEL_W)
    .attr('y', ROW_HEIGHT / 2)
    .attr('dy', '0.35em')
    .attr('font-size', 10.5)
    .attr('font-weight', 600)
    .attr('fill', INK)
    .attr('opacity', 0)
    .text((d) => `${(d.total / 100000).toFixed(1)}L`);

  function update(progress) {
    bars.attr('width', (d) => x(d.total) * progress);
    // Value label slides out with the bar's tip. When the bar
    // is fully grown, the value sits just to the right of the
    // bar. While the bar is growing, the value's opacity
    // ramps with progress so it doesn't appear before the bar
    // is wide enough to be associated with it.
    values
      .attr('x', (d) => LABEL_W + x(d.total) * progress + 6)
      .attr('opacity', progress);
  }

  function destroy() {
    svg.remove();
  }

  return { update, destroy };
}
