// viz/dow-lines.js — 7-day ridership chart, scroll-driven from a
// 7-cell sparkline grid to a single 4x-scaled merged plot.
//
// Two states, scroll-driven:
//
//   Phase 1 (default / as the chart scrolls into view):
//     Seven sparkline cells in a single row, one per day of the
//     week. Each cell shows EVERY reported ridership value for
//     that day across the full dataset (~13-20 lines per cell,
//     one per reported day, full cell width). Lines at the same
//     y-position stack and read as a single line — the density
//     of the cell is the visual signal of how often that day
//     lands at each ridership level.
//
//   Phase 2 (as the chart scrolls further up):
//     The seven cells collapse and fade out. In their place, a
//     single 4x-scaled plot fades in, showing all 7 days overlaid
//     as horizontal lines (7 days × 8 weeks = 56 lines, each at
//     the day's color, full cell width, at the y-position of the
//     week's ridership). To the right of the plot, a vertical
//     column of 7 small squares appears — one per day, in the
//     day's color, with the day label. Hovering a square
//     highlights that day's 8 lines and dims the other 48;
//     moving the cursor off restores all 56 to full opacity. The
//     y-axis (broken scale, 0–400K squiggle, 400K–max) stays
//     visible throughout the merged state.
//
//   The morph starts SOON after the chart enters the viewport
//   (`start: 'top 80%'`) and HOLDS the merged state for a long
//   scroll range (`end: 'top -50%'`) so the user has time to
//   explore the day-selector before the chart scrolls away.

import * as d3 from 'd3';
import { gsap, ScrollTrigger } from '@thecontrarian/scrollytelling-core';

const CELL_SIZE = 120; // each sparkline cell is a perfect square
const GRID = { cols: 7, rows: 1, gap: 12 };
const MARGIN = { top: 90, right: 20, bottom: 55, left: 55 };

// The full width of the phase-1 chart (used for title/caption centreing).
const WIDTH =
  MARGIN.left + MARGIN.right + GRID.cols * CELL_SIZE + (GRID.cols - 1) * GRID.gap;

// The SVG viewBox has to be tall enough to fit the merged state
// (which is the phase-1 Monday cell scaled 4x, with the day-selector
// column to its right). With the 4x scale and pivot at the centre
// of the Monday cell, the merged plot extends from y = -240 to
// y = 240 in viewBox units. The 7 cells (phase 1) sit centred in
// that space at y = -60..60.
const VIEWBOX_WIDTH = 1100;
const VIEWBOX_HEIGHT = 600;
const VIEWBOX = `0 -300 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;

// Mon..Sun ordering.
const DAYS = [
  { name: 'Mon', dow: 1 },
  { name: 'Tue', dow: 2 },
  { name: 'Wed', dow: 3 },
  { name: 'Thu', dow: 4 },
  { name: 'Fri', dow: 5 },
  { name: 'Sat', dow: 6 },
  { name: 'Sun', dow: 0 },
];

const COLORS = d3.schemeTableau10.slice(0, 7);

// Merged-state geometry. The merged plot is the size of a single
// sparkline cell but scaled 4x, centred in the viewBox. The
// day-selector column of 7 squares sits to its right. Both live in a
// "merged" group that fades in during phase 2.
const MERGED_PADDING = 24;   // gap between merged plot and day-selector column
const SELECTOR_SIZE = 56;   // px per day-selector square (the column's width is 56px)
const SELECTOR_GAP = 8;     // px between consecutive squares in the column

// Vertical placement: the final merged square is 480px tall (4x
// CELL_SIZE). The 120px phase-1 row is centred in that space,
// and the square is centred both horizontally and vertically
// inside the viewBox.
const PLOT_TOP = -60;
const HEIGHT = PLOT_TOP + MARGIN.bottom + CELL_SIZE;
const FINAL_CENTER_X = VIEWBOX_WIDTH / 2;
const FINAL_CENTER_Y = 0;

/**
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} daily
 * @param {{ title?: string, yLabel?: string }} options
 * @returns {{ update, destroy }}
 */
export function renderDowLines(container, daily, options = {}) {
  const { title = 'Ridership Patterns by Day of Week', yLabel = 'Total Daily Ridership' } = options;

  const parseDate = (d) => new Date(d.date);
  const sorted = [...daily].sort((a, b) => parseDate(a) - parseDate(b));

  // Build one series per day-of-week using EVERY reported value
  // in the dataset (not a tail window). The chart shows the full
  // story of that day-of-week across all 5 months of data: 13
  // Sundays, 18 Mondays, etc. Each line in a cell is one reported
  // day; lines stack on the shared broken y-axis (squiggle at
  // 400K, data above), so the density of lines is the visual
  // signal of how often that day-of-week is reported.
  const series = DAYS.map(({ name, dow }, i) => {
    const dayRows = sorted.filter((d) => parseDate(d).getDay() === dow);
    return {
      name,
      dow,
      color: COLORS[i],
      values: dayRows.map((row, idx) => ({
        week: idx,
        date: row.date,
        value: row.total,
      })),
    };
  });

  // Single row of seven perfect-square sparkline cells.
  const cellInnerW = CELL_SIZE;
  const cellInnerH = CELL_SIZE;

  const cellX = (col) => MARGIN.left + col * (cellInnerW + GRID.gap);
  const cellY = () => PLOT_TOP;

  // Shared x scale; y is a broken scale so the cell bottom is 0, a small
  // band represents the skipped 0–400K range, and the data region sits above.
  const yMax = d3.max(series, (s) => d3.max(s.values, (v) => v.value ?? 0));
  const Y_MAX = yMax * 1.05;
  const Y_BREAK = 400000;
  const BREAK_HEIGHT = 12;
  const DATA_TOP_Y = cellInnerH - BREAK_HEIGHT;
  function y(v) {
    if (v <= Y_BREAK) {
      return cellInnerH - (v / Y_BREAK) * BREAK_HEIGHT;
    }
    return DATA_TOP_Y - ((v - Y_BREAK) / (Y_MAX - Y_BREAK)) * DATA_TOP_Y;
  }

  const dateFmt = d3.timeFormat('%b %d, %Y');
  const selectedFirst = d3.min(series, (s) => new Date(s.values[0].date));
  const selectedLast = d3.max(series, (s) => new Date(s.values[s.values.length - 1].date));
  const subtitle = `${dateFmt(selectedFirst)} – ${dateFmt(selectedLast)}`;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'dow-lines-svg')
    .attr('viewBox', VIEWBOX)
    .attr('role', 'img')
    .attr('aria-label', `${title}: ${subtitle}`)
    .style('width', '100%')
    .style('height', 'auto')
    .style('overflow', 'visible')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

  // Title and subtitle.
  const titleGroup = svg.append('g')
    .attr('class', 'dow-lines__title')
    .attr('transform', `translate(0, ${PLOT_TOP - 90})`);
  titleGroup
    .append('text')
    .attr('x', WIDTH / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-display)')
    .attr('font-size', '18px')
    .attr('font-weight', 700)
    .attr('fill', 'var(--ink)')
    .text(title);
  titleGroup
    .append('text')
    .attr('x', WIDTH / 2)
    .attr('y', 48)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-display)')
    .attr('font-size', '12px')
    .attr('font-weight', 500)
    .attr('fill', 'var(--muted)')
    .text(subtitle);

  // Plot group: contains the axis, the cells (phase 1), and the
  // merged overlay (phase 2). It's a single group so the y-axis
  // and the merged plot stay in lockstep during the scale.
  const plotGroup = svg
    .append('g')
    .attr('class', 'dow-lines__plot');

  // Shared broken y-axis on the left of the single row and the merged plot.
  // The axis is at the left edge of the Monday cell; because the 4x scale
  // pivots around the Monday cell's centre, the y-axis stays right beside
  // the merged square during the morph.
  const axisGroup = plotGroup
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${MARGIN.left}, ${PLOT_TOP})`);

  const tickScale = d3.scaleLinear().domain([Y_BREAK, Y_MAX]).range([DATA_TOP_Y, 0]).nice();
  const yTicks = [0, ...tickScale.ticks(5).filter((t) => t > Y_BREAK)];
  const tickFmt = d3.format('~s');

  // Axis line from top down to the squiggle, and from the squiggle down to 0.
  const breakCenter = DATA_TOP_Y + BREAK_HEIGHT / 2;
  const breakGap = 3;
  axisGroup
    .append('line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', breakCenter - breakGap)
    .attr('stroke', 'rgba(0, 0, 0, 0.2)')
    .attr('vector-effect', 'non-scaling-stroke');
  axisGroup
    .append('line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', cellInnerH)
    .attr('y2', breakCenter + breakGap)
    .attr('stroke', 'rgba(0, 0, 0, 0.2)')
    .attr('vector-effect', 'non-scaling-stroke');

  // Tick marks and labels.
  yTicks.forEach((t) => {
    const ty = y(t);
    axisGroup.append('line').attr('x1', -6).attr('x2', 0).attr('y1', ty).attr('y2', ty).attr('stroke', 'rgba(0, 0, 0, 0.2)').attr('vector-effect', 'non-scaling-stroke');
    axisGroup
      .append('text')
      .attr('x', -10)
      .attr('y', ty + 3)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', 'var(--muted)')
      .text(tickFmt(t));
  });

  // Small double-tilde squiggle in the break band, matching axis marker style.
  const breakY = DATA_TOP_Y + BREAK_HEIGHT / 2;
  const squiggle = [
    `M -4,${breakY - 1} Q -2,${breakY - 3} 0,${breakY - 1} T 4,${breakY - 1}`,
    `M -4,${breakY + 1} Q -2,${breakY - 1} 0,${breakY + 1} T 4,${breakY + 1}`,
  ].join(' ');
  axisGroup
    .append('path')
    .attr('d', squiggle)
    .attr('stroke', 'rgba(0, 0, 0, 0.2)')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('vector-effect', 'non-scaling-stroke');

  // Single 0 baseline that joins the y-axis to the full row of cells.
  const gridW = GRID.cols * cellInnerW + (GRID.cols - 1) * GRID.gap;
  axisGroup
    .append('line')
    .attr('class', 'zero-baseline')
    .attr('x1', 0)
    .attr('x2', gridW)
    .attr('y1', cellInnerH)
    .attr('y2', cellInnerH)
    .attr('stroke', 'rgba(0, 0, 0, 0.2)')
    .attr('vector-effect', 'non-scaling-stroke');

  // Y-axis label removed (merged state provides its own counter-scaled version).

  // Draw each sparkline cell.
  const cellGroup = plotGroup.append('g').attr('class', 'dow-lines__cells');
  const cells = [];

  series.forEach((s, i) => {
    const col = i % GRID.cols;
    const cx = cellX(col);
    const cy = cellY();
    const initialTransform = `translate(${cx}, ${cy})`;
    const gCell = cellGroup
      .append('g')
      .attr('transform', initialTransform);

    // Cell title.
    gCell
      .append('text')
      .attr('x', cellInnerW / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-display)')
      .attr('font-size', '12px')
      .attr('font-weight', 600)
      .attr('fill', s.color)
      .text(s.name);

    // Eight full-width horizontal lines, one per reported value.
    // No reveal animation — the lines just appear in their final
    // state. The 7-cell row is the default view; the user reads
    // it as-is before the morph kicks in.
    const lineGroup = gCell
      .append('g')
      .attr('class', 'dow-lines__bars');

    lineGroup
      .selectAll('line')
      .data(s.values)
      .join('line')
      .attr('x1', 0)
      .attr('x2', cellInnerW)
      .attr('y1', (d) => y(d.value))
      .attr('y2', (d) => y(d.value))
      .attr('stroke', s.color)
      .attr('stroke-width', 1)
      .attr('vector-effect', 'non-scaling-stroke');

    cells.push({ node: gCell.node(), cx, cy, initialTransform, title: gCell.select('text').node() });
  });

  // -------------------------------------------------------------------
  // MERGED STATE (phase 2)
  // -------------------------------------------------------------------
  // The merged group lives at the SAME origin as the phase-1 cells
  // (top-left of the Monday cell at MARGIN.left, PLOT_TOP) but
  // contains the 4x-scaled version of the plot + 7 day-selector
  // squares to its right. The merged group starts at opacity 0 and
  // fades in during phase 2.
  //
  // Inside the merged group:
  //   - 7 polylines (one per day), each connecting the 8 weekly
  //     points. Different colors per day. The polylines live in
  //     the same coordinate space as the phase-1 cells (so the y
  //     scale and the broken axis are shared).
  //   - 7 day-selector squares to the right, each filled with the
  //     day's color, with the day label. Hovering a square
  //     highlights that polyline and dims the others; cursor
  //     leaves restores all 7 to full opacity.
  //
  // Geometry: the merged plot is the same width as a single cell
  // (CELL_SIZE) but its content is denser — the 8 weeks of the
  // x-axis are now spread across the full cell width, and the y
  // values are the actual data points (no longer horizontal
  // lines at fixed x positions). The 4x scale (applied via the
  // plotGroup transform during phase 2) enlarges this single-cell
  // plot to 4 × CELL_SIZE = 480px, giving the user a "zoomed in"
  // view of all 7 days' spreads at once.
  const mergedGroup = plotGroup
    .append('g')
    .attr('class', 'dow-lines__merged')
    .attr('transform', `translate(${MARGIN.left}, ${PLOT_TOP})`)
    .style('opacity', 0);  // hidden until phase 2

  // Merged-state labels: title, subtitle, y-axis label, tick labels,
  // and caption. They live in a 0.25x-scaled group inside mergedGroup.
  // plotGroup scales the whole merged group 4x, so text ends up at
  // the intended size and position.
  const mergedText = mergedGroup
    .append('g')
    .attr('class', 'dow-lines__merged-text')
    .attr('transform', 'scale(0.25)');

  // Title and subtitle, centred above the final square.
  mergedText
    .append('text')
    .attr('class', 'dow-lines__merged-title')
    .attr('x', 240)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-display)')
    .attr('font-size', '24px')
    .attr('font-weight', 700)
    .attr('fill', 'var(--ink)')
    .text(title);
  mergedText
    .append('text')
    .attr('class', 'dow-lines__merged-subtitle')
    .attr('x', 240)
    .attr('y', -18)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-display)')
    .attr('font-size', '14px')
    .attr('font-weight', 500)
    .attr('fill', 'var(--muted)')
    .text(subtitle);

  // Y-axis label, rotated and centred on the left edge of the square.
  mergedText
    .append('text')
    .attr('class', 'dow-lines__merged-y-label')
    .attr('x', -90)
    .attr('y', 240)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90, -90, 240)')
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '15px')
    .attr('font-weight', 700)
    .attr('fill', 'var(--muted)')
    .text(yLabel);

  // Y-axis tick labels, aligned with the scaled axis.
  yTicks.forEach((t) => {
    const ty = y(t);
    mergedText
      .append('text')
      .attr('class', 'dow-lines__merged-tick')
      .attr('x', -50)
      .attr('y', 4 * ty + 3)
      .attr('text-anchor', 'end')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '12px')
      .attr('fill', 'var(--muted)')
      .text(tickFmt(t));
  });

  // Caption below the merged square.
  const mergedCaption = mergedText
    .append('text')
    .attr('class', 'dow-lines__merged-caption')
    .attr('x', 240)
    .attr('y', 520)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '11px')
    .attr('fill', 'var(--muted)')
    .text('Hover a day on the right to see its 8-week pattern.');

  // 7 days × 8 weeks = 56 horizontal lines, all overlaid in the
  // merged plot. Each line is full cell width, sits at the y
  // position of its week's ridership, and carries the day's
  // color. Lines are grouped by day so the hover handler can
  // dim/highlight a whole day at once.
  const mergedLines = mergedGroup
    .append('g')
    .attr('class', 'dow-lines__merged-lines');

  // Track each day's 8 line nodes for the hover handler.
  const linesByDay = new Map();

  // Hover state constants and helpers (must be defined before the
  // merged lines are created because HOVER_FADE_S is used in their
  // CSS transition).
  let hoveredDay = null;
  const HOVER_FADE_S = 0.5;

  function updateSquareBorders() {
    selectorColumn
      .selectAll('rect.selector-square')
      .attr('stroke', function () {
        return this.getAttribute('data-day') === hoveredDay ? '#000' : 'transparent';
      })
      .attr('stroke-width', 0.5);
  }

  function restoreAllLines() {
    const allNodes = Array.from(linesByDay.values()).flatMap((entry) => entry.nodes);
    allNodes.forEach((node) => {
      node.style.opacity = '1';
    });
  }

  function applyHover(dayName) {
    hoveredDay = dayName;

    // Highlight the hovered day immediately and dim all others.
    linesByDay.forEach((entry, name) => {
      entry.nodes.forEach((node) => {
        node.style.opacity = name === dayName ? '1' : '0';
      });
    });

    updateSquareBorders();
  }

  function clearHover() {
    hoveredDay = null;
    restoreAllLines();
    updateSquareBorders();
  }

  series.forEach((s) => {
    const dayNodes = [];
    s.values.forEach((v, i) => {
      const py = y(v.value);
      const line = mergedLines
        .append('line')
        .attr('x1', 0)
        .attr('x2', cellInnerW)
        .attr('y1', py)
        .attr('y2', py)
        .attr('stroke', s.color)
        .attr('stroke-width', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('data-day', s.name)
        .style('opacity', 1)
        .style('transition', `opacity ${HOVER_FADE_S}s`);
      dayNodes.push(line.node());
    });
    linesByDay.set(s.name, { nodes: dayNodes, color: s.color });
  });

  // 7 day-selector squares to the right of the merged plot. Each
  // is a 56×56px square filled with the day's color, with the
  // day label centered on it. The column starts at
  // CELL_SIZE + MERGED_PADDING inside the merged group.
  //
  // The selector column lives inside the mergedGroup, which is
  // inside plotGroup (scaled 4x during phase 2). To keep the
  // squares at their natural 56px size (not 224px), we apply a
  // counter-scale of 0.25 (= 1/4) to the selector column. The
  // column is also translated so its top-left lands at the right
  // position relative to the scaled merged plot.
  const selectorColumnX = cellInnerW + MERGED_PADDING;
  const selectorColumn = mergedGroup
    .append('g')
    .attr('class', 'dow-lines__selector')
    .attr('transform', `translate(${selectorColumnX}, 0) scale(0.25)`);

  // The 7 squares. Layout: vertical column starting from the top
  // of the merged plot, each square spaced by (SELECTOR_SIZE +
  // SELECTOR_GAP). The column is 7 * SIZE + 6 * GAP tall
  // (440px with the default 56+8), which fits within the scaled
  // cell's 480px height (120px × 4x). Starting from the top means
  // the first square (Mon) is at the top of the column and the
  // last (Sun) is at the bottom — the column reads top-to-bottom
  // in the same order as the days of the week.
  const columnH = 7 * SELECTOR_SIZE + 6 * SELECTOR_GAP;
  // If the column is taller than the cell (which it is at default
  // settings: 440 > 120 unscaled, but 440 < 480 scaled), start
  // from the top so the first square is visible. If the column
  // is shorter than the cell, center it.
  const columnYOffset = columnH > cellInnerH
    ? 0
    : (cellInnerH - columnH) / 2;

  series.forEach((s, i) => {
    const sqY = columnYOffset + i * (SELECTOR_SIZE + SELECTOR_GAP);
    const gSquare = selectorColumn
      .append('g')
      .attr('class', 'dow-lines__selector-item')
      .attr('transform', `translate(0, ${sqY})`)
      .style('cursor', 'pointer');

    gSquare
      .append('rect')
      .attr('class', 'selector-square')
      .attr('data-day', s.name)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', SELECTOR_SIZE)
      .attr('height', SELECTOR_SIZE)
      .attr('fill', s.color)
      .attr('stroke', 'transparent')
      .attr('stroke-width', 0.5)
      .attr('rx', 1);

    gSquare
      .append('text')
      .attr('x', SELECTOR_SIZE / 2)
      .attr('y', SELECTOR_SIZE / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-display)')
      .attr('font-size', '12px')
      .attr('font-weight', 600)
      .attr('fill', '#fff')   // white text on the day's saturated color
      .attr('pointer-events', 'none')   // text doesn't capture hover
      .text(s.name);

    // No per-square mouseenter/mouseleave. The hover is wired
    // once on the parent selector column (see below) so that
    // moving the cursor between squares does NOT briefly reset
    // all 56 lines to full opacity between squares.
  });

  // Parent-group hover. `mouseover` bubbles, so it fires every
  // time the cursor enters ANY square inside the column. We
  // look at the event target to find the data-day of the square
  // the cursor is now over. When the mouse leaves the column,
  // we restore all lines to full opacity.
  selectorColumn.on('mouseover', (event) => {
    const target = event.target;
    const day = target.getAttribute && target.getAttribute('data-day');
    if (day) applyHover(day);
  });

  selectorColumn.on('mouseleave', () => {
    clearHover();
  });

  // The original phase-1 caption (below the 7 cells). Fades out
  // during phase 2 (along with the cells).
  const phase1Caption = svg
    .append('text')
    .attr('class', 'dow-lines__caption')
    .attr('x', WIDTH / 2)
    .attr('y', HEIGHT - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', 'var(--muted)')
    .text('Each sparkline shows every reported ridership value for that day of the week across the full dataset.');

  // Simple SVG text wrap: split into <tspan> lines so the caption
  // fits inside `maxWidth` rather than overflowing the chart.
  function wrapSvgText(textSel, maxWidth) {
    textSel.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      const lineHeight = 1.2; // ems
      const y = text.attr('y');
      const x = text.attr('x');
      let line = [];
      let tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', '0em');
      while (words.length) {
        const word = words.pop();
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan').attr('x', x).attr('dy', `${lineHeight}em`).text(word);
        }
      }
    });
  }

  wrapSvgText(phase1Caption, WIDTH - 80);
  wrapSvgText(mergedCaption, 360);

  // Phase 2: collapse the 7 cells (move them all to Mon's slot and
  // fade out), fade in the merged group (4x-scaled, 7×8=56
  // horizontal lines + day-selector column). The y-axis stays
  // visible throughout (it's the same scale for both phases).
  //
  // The 7-cell row is the default state. It holds for the first
  // 35% of the scroll range, then the morph plays over the rest.
  //
  // Timeline (0.0 → 1.0):
  //   0.00–0.20 : hold on phase 1
  //   0.20–0.55 : cells collapse to Mon, titles fade, non-Mon cells dim
  //   0.50–0.70 : phase-1 caption and zero-baseline fade out;
  //               title/y-axis label fade out
  //   0.70–0.95 : merged group fades in; plotGroup scales 1x → 4x
  //   0.95–1.00 : hold on merged state
  const targetX = MARGIN.left;
  const targetY = PLOT_TOP;
  const collapseTl = gsap.timeline({ paused: true });

  // Leading hold: keep the 7 subplots fully visible at the start
  // of the scroll range.
  collapseTl.to({}, { duration: 0.20 }, 0);

  cells.forEach(({ node, initialTransform, title }, i) => {
    collapseTl.fromTo(
      node,
      { attr: { transform: initialTransform } },
      { attr: { transform: `translate(${targetX}, ${targetY})` }, duration: 0.40, ease: 'sine.inOut' },
      0.20
    );
    collapseTl.fromTo(title, { opacity: 1 }, { opacity: 0, duration: 0.30 }, 0.20);
    if (i !== 0) {
      collapseTl.fromTo(node, { opacity: 1 }, { opacity: 0, duration: 0.30 }, 0.45);
    } else {
      collapseTl.fromTo(node, { opacity: 1 }, { opacity: 0, duration: 0.30 }, 0.52);
    }
  });

  // Fade out the phase-1 caption and the zero-baseline.
  collapseTl.fromTo(phase1Caption.node(), { opacity: 1 }, { opacity: 0, duration: 0.30 }, 0.50);
  collapseTl.fromTo(axisGroup.select('.zero-baseline').node(), { opacity: 1 }, { opacity: 0, duration: 0.30 }, 0.50);

  // Fade out the phase-1 title and tick labels; the merged
  // overlay provides counter-scaled versions in the final state.
  collapseTl.fromTo(titleGroup.node(), { opacity: 1 }, { opacity: 0, duration: 0.30 }, 0.50);
  collapseTl.fromTo(axisGroup.selectAll('text').nodes(), { opacity: 1 }, { opacity: 0, duration: 0.30 }, 0.50);

  // Fade in the merged group.
  collapseTl.fromTo(mergedGroup.node(), { opacity: 0 }, { opacity: 1, duration: 0.30 }, 0.70);

  // Scale plotGroup 4x around the Monday cell's centre, translating
  // the square so it lands in the centre of the SVG viewBox.
  const pivotX = targetX + CELL_SIZE / 2;
  const pivotY = targetY + CELL_SIZE / 2;
  const expandTransform = `translate(${FINAL_CENTER_X}, ${FINAL_CENTER_Y}) scale(4) translate(${-pivotX}, ${-pivotY})`;

  collapseTl.fromTo(
    plotGroup.node(),
    { attr: { transform: 'translate(0, 0) scale(1)' } },
    { attr: { transform: expandTransform }, duration: 0.30, ease: 'sine.inOut' },
    0.70
  );

  // Trailing hold: keep the merged state on screen for the final
  // part of the scroll range.
  collapseTl.to({}, { duration: 0.05 }, '+=0');

  const collapseTrigger = ScrollTrigger.create({
    trigger: container,
    // The 7 subplots are the default state while the chart scrolls into
    // view. The collapse starts once the chart is roughly centred, and
    // finishes before the sticky chapter title reaches the fixed header.
    // The scroll range is kept wide (50% of viewport) so the morph
    // from 7 subplots to the merged plot plays out gradually.
    start: 'top 70%',
    end: 'top 30%',
    scrub: true,
    animation: collapseTl,
  });

  function update() {
    // No per-frame work needed; ScrollTriggers drive the timelines.
  }

  function destroy() {
    collapseTrigger.kill();
    svg.remove();
  }

  return { update, destroy };
}
