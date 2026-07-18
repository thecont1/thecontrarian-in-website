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
// first (back, BMRCL purple); the quiet bar is drawn on top (front,
// gold/coral). The two are rendered at full width with the quiet
// using a slight transparency so the busy's top edge is visible
// where the busy is taller than the quiet, and the quiet's top
// edge is visible where the quiet is taller. The combined top
// profile forms a U-shape (or W, depending on the data): tall on
// both ends, dipping in the middle — a visual pun on the "busy
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
//   - At each x: a busy bar (BMRCL purple, drawn first) and a
//     quiet bar (gold/coral, drawn on top, 0.7 opacity).
//   - Y-axis: 0 to dataset max, gridlines at 0/2L/4L/6L/8L.
//   - A horizontal median line at the dataset's median (~8.0L).
//   - A small "busy" and "quiet" legend at the bottom.
//
// Scroll integration: each pair's heights grow from 0 to their
// target values as the user scrolls. update(progress) drives all
// 20 bars' heights × progress.

import * as d3 from 'd3';

const WIDTH = 720;
const HEIGHT = 400;
const PADDING_TOP = 64;
const PADDING_BOTTOM = 60;
const PADDING_LEFT = 64;
const PADDING_RIGHT = 24;
const N_PAIRS = 10;
const PAIR_GAP = 8;          // horizontal gap between pairs

const ACCENT = '#5E2D8C';    // BMRCL purple — the "busy" colour
const ACCENT2 = '#d04b36';   // coral/red — the "quiet" colour
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const GRID = 'rgba(0, 0, 0, 0.08)';
const MEDIAN = 'rgba(208, 75, 54, 0.85)';

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
 * @returns {{ update, destroy }}
 */
export function renderExtremeDays(container, daily, options = {}) {
  const { median = 800000, max = 920000 } = options;

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
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

  // Gridlines (horizontal) at 0, 2L, 4L, 6L, 8L, max.
  const gridTicks = [0, 200000, 400000, 600000, 800000, maxAxis];
  const gridGroup = svg.append('g').attr('class', 'extreme-days__grid');
  for (const t of gridTicks) {
    gridGroup.append('line')
      .attr('x1', PADDING_LEFT)
      .attr('x2', PADDING_LEFT + innerW)
      .attr('y1', y(t))
      .attr('y2', y(t))
      .attr('stroke', GRID)
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', t === 0 ? null : '2 3');
  }

  // Y-axis tick labels on the left.
  const axisGroup = svg.append('g').attr('class', 'extreme-days__axis');
  for (const t of gridTicks) {
    const label = t === 0 ? '0' : `${(t / 100000).toFixed(0)}L`;
    axisGroup.append('text')
      .attr('x', PADDING_LEFT - 8)
      .attr('y', y(t))
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .attr('font-size', 9)
      .attr('fill', MUTED)
      .text(label);
  }
  // Y-axis caption.
  axisGroup.append('text')
    .attr('x', PADDING_LEFT - 8)
    .attr('y', PADDING_TOP - 12)
    .attr('text-anchor', 'end')
    .attr('font-size', 9)
    .attr('font-style', 'italic')
    .attr('fill', MUTED)
    .text('Daily ridership');

  // Median line (horizontal across the chart).
  const medianY = y(median);
  svg.append('line')
    .attr('class', 'extreme-days__median')
    .attr('x1', PADDING_LEFT - 4)
    .attr('x2', PADDING_LEFT + innerW + 4)
    .attr('y1', medianY)
    .attr('y2', medianY)
    .attr('stroke', MEDIAN)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3 2');
  svg.append('text')
    .attr('class', 'extreme-days__median-label')
    .attr('x', PADDING_LEFT + innerW)
    .attr('y', medianY - 4)
    .attr('text-anchor', 'end')
    .attr('font-size', 8)
    .attr('font-weight', 500)
    .attr('letter-spacing', '0.06em')
    .attr('text-transform', 'uppercase')
    .attr('fill', MEDIAN)
    .text('Median');

  // Pairs. Each pair has:
  //   - a busy bar (back, BMRCL purple, full barW)
  //   - a quiet bar (front, coral, 0.7 opacity, full barW, drawn
  //     AFTER busy so it sits on top).
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

  // Quiet bar (front). Drawn second; 0.7 opacity lets the busy
  // show through where they overlap. Where the quiet is taller
  // than the busy, the quiet's top edge is the visible edge of
  // the pair; where the busy is taller, the busy's top edge
  // shows above the quiet.
  const quietBars = pairNodes.append('rect')
    .attr('class', 'pair__quiet')
    .attr('x', 0)
    .attr('y', y(0))
    .attr('width', barW)
    .attr('height', 0)
    .attr('fill', ACCENT2)
    .attr('fill-opacity', 0.7)
    .attr('rx', 1);

  // Pair labels under each slot. Two lines: the busy date
  // (top, ink) and the quiet date (bottom, muted). Tiny font
  // so 20 dates fit in the bottom strip without crowding.
  const dateFmt = d3.timeFormat('%b %d');
  const labelGroup = pairNodes.append('g')
    .attr('class', 'pair__labels')
    .attr('transform', `translate(${barW / 2}, ${HEIGHT - PADDING_BOTTOM + 8})`);
  labelGroup.append('text')
    .attr('class', 'pair__label-busy')
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('font-size', 8.5)
    .attr('font-weight', 500)
    .attr('fill', INK)
    .text((d) => dateFmt(new Date(d.busy.date)));
  labelGroup.append('text')
    .attr('class', 'pair__label-quiet')
    .attr('y', 11)
    .attr('text-anchor', 'middle')
    .attr('font-size', 8.5)
    .attr('fill', MUTED)
    .text((d) => dateFmt(new Date(d.quiet.date)));

  // Rank labels above each slot (1, 2, 3, ..., 10). Small
  // mono numerals in the muted colour; they sit at the very
  // top of the chart above the tallest bars.
  const rankGroup = svg.append('g').attr('class', 'extreme-days__ranks');
  rankGroup.selectAll('text.rank')
    .data(pairsData)
    .join('text')
    .attr('class', 'rank')
    .attr('x', (d) => x(d.rank - 1))
    .attr('y', PADDING_TOP - 12)
    .attr('text-anchor', 'middle')
    .attr('font-size', 8)
    .attr('font-weight', 600)
    .attr('letter-spacing', '0.04em')
    .attr('fill', MUTED)
    .text((d) => d.rank);

  // Legend at the bottom. Two small swatches with labels: a
  // purple square for "Busy (10 tallest)" and a coral square
  // for "Quiet (10 shortest)". Reads as a footer for the
  // chart, not as a callout. Sits below the date labels
  // (which are at HEIGHT - PADDING_BOTTOM + 8 = 348) and
  // above the SVG's bottom edge (400).
  const legendY = HEIGHT - 18;
  const legend = svg.append('g').attr('class', 'extreme-days__legend');
  // Busy swatch
  legend.append('rect')
    .attr('x', PADDING_LEFT)
    .attr('y', legendY - 7)
    .attr('width', 9)
    .attr('height', 9)
    .attr('fill', ACCENT)
    .attr('rx', 1);
  legend.append('text')
    .attr('x', PADDING_LEFT + 14)
    .attr('y', legendY)
    .attr('font-size', 9)
    .attr('fill', MUTED)
    .text('Busy (10 tallest)');
  // Quiet swatch
  const quietSwatchX = PADDING_LEFT + 130;
  legend.append('rect')
    .attr('x', quietSwatchX)
    .attr('y', legendY - 7)
    .attr('width', 9)
    .attr('height', 9)
    .attr('fill', ACCENT2)
    .attr('fill-opacity', 0.7)
    .attr('rx', 1);
  legend.append('text')
    .attr('x', quietSwatchX + 14)
    .attr('y', legendY)
    .attr('font-size', 9)
    .attr('fill', MUTED)
    .text('Quiet (10 shortest)');

  function update(progress) {
    // Heights grow from 0 to the target as the user scrolls.
    // Both bars in each pair grow in lockstep, so the "X"
    // pattern is preserved throughout the reveal.
    busyBars
      .attr('y', (d) => y(d.busy.total * progress))
      .attr('height', (d) => y(0) - y(d.busy.total * progress));
    quietBars
      .attr('y', (d) => y(d.quiet.total * progress))
      .attr('height', (d) => y(0) - y(d.quiet.total * progress));
  }

  function destroy() {
    svg.remove();
  }

  return { update, destroy };
}
