// viz/dow-lines.js — 7-line chart of ridership by day-of-week over
// the last 8 weeks of the dataset.
//
// Each line is one day of the week (Mon..Sun). The X-axis is eight
// consecutive weeks, so every line has eight points and the chart
// shows whether, say, Mondays are rising or falling across the
// window.

import * as d3 from 'd3';
import { gsap, ScrollTrigger } from '@thecontrarian/scrollytelling-core';

const CELL_SIZE = 120; // each sparkline cell is a perfect square
const GRID = { cols: 7, rows: 1, gap: 12 };
const MARGIN = { top: 70, right: 20, bottom: 55, left: 55 };
const WIDTH =
  MARGIN.left + MARGIN.right + GRID.cols * CELL_SIZE + (GRID.cols - 1) * GRID.gap;
const HEIGHT = MARGIN.top + MARGIN.bottom + CELL_SIZE;
const WEEKS = 8;
const DAYS_PER_WEEK = 7;
const Y_BASELINE = 350000; // truncate the y-axis below this value

// Mon..Sun ordering for the subplots.
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

/**
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} daily
 * @param {{ title?: string, yLabel?: string }} options
 * @returns {{ update, destroy }}
 */
export function renderDowLines(container, daily, options = {}) {
  const { title = 'Ridership Patterns by Day of Week', yLabel = 'Total ridership' } = options;

  const parseDate = (d) => new Date(d.date);
  const sorted = [...daily].sort((a, b) => parseDate(a) - parseDate(b));

  // Build one series per day-of-week using the last 8 reported values.
  // No calendar windowing: every point is real, so there are no gaps to
  // bridge and no dashed connectors.
  const series = DAYS.map(({ name, dow }, i) => {
    const dayRows = sorted.filter((d) => parseDate(d).getDay() === dow);
    const tail = dayRows.slice(-WEEKS);
    return {
      name,
      dow,
      color: COLORS[i],
      values: tail.map((row, idx) => ({
        week: idx,
        date: row.date,
        value: row.total,
      })),
    };
  });

  const firstDate = parseDate(sorted[0].date);
  const lastDate = parseDate(sorted[sorted.length - 1].date);

  // Single row of seven perfect-square sparkline cells.
  const cellInnerW = CELL_SIZE;
  const cellInnerH = CELL_SIZE;

  const cellX = (col) => MARGIN.left + col * (cellInnerW + GRID.gap);
  const cellY = () => MARGIN.top;

  // Shared x scale; y is a broken scale so the cell bottom is 0, a small
  // band represents the skipped 0–400K range, and the data region sits above.
  const x = d3.scalePoint().domain(d3.range(WEEKS)).range([0, cellInnerW]).padding(0);
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
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', `${title}: ${subtitle}`)
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

  // Title and subtitle.
  const titleGroup = svg.append('g').attr('class', 'dow-lines__title');
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

  // Shared broken y-axis on the left of the single row.
  const axisGroup = svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

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
    .attr('stroke', 'rgba(0, 0, 0, 0.2)');
  axisGroup
    .append('line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', cellInnerH)
    .attr('y2', breakCenter + breakGap)
    .attr('stroke', 'rgba(0, 0, 0, 0.2)');

  // Tick marks and labels.
  yTicks.forEach((t) => {
    const ty = y(t);
    axisGroup.append('line').attr('x1', -6).attr('x2', 0).attr('y1', ty).attr('y2', ty).attr('stroke', 'rgba(0, 0, 0, 0.2)');
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
    .attr('fill', 'none');

  // Y-axis label.
  svg
    .append('text')
    .attr('transform', `translate(${-MARGIN.left + 10}, ${MARGIN.top + cellInnerH / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('fill', 'var(--muted)')
    .text(yLabel);

  // Draw each sparkline cell.
  const cellGroup = svg.append('g').attr('class', 'dow-lines__cells');
  const allLinePaths = [];

  series.forEach((s, i) => {
    const col = i % GRID.cols;
    const cx = cellX(col);
    const cy = cellY();
    const gCell = cellGroup
      .append('g')
      .attr('transform', `translate(${cx}, ${cy})`);

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

    // Horizontal 0 line across the bottom of the cell.
    gCell
      .append('line')
      .attr('x1', 0)
      .attr('x2', cellInnerW)
      .attr('y1', cellInnerH)
      .attr('y2', cellInnerH)
      .attr('stroke', 'rgba(0, 0, 0, 0.2)');

    // Eight full-width horizontal lines, one per reported value.
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
      .each(function () {
        const length = this.getTotalLength();
        d3.select(this)
          .attr('stroke-dasharray', `${length} ${length}`)
          .attr('stroke-dashoffset', length);
      });

    allLinePaths.push(...lineGroup.selectAll('line').nodes());
  });

  // Note about what the sparklines show.
  svg
    .append('text')
    .attr('x', WIDTH / 2)
    .attr('y', HEIGHT - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', 'var(--muted)')
    .text('Each plot shows the last 8 reported ridership values for that day of the week.');

  // Scroll-driven draw animation: reveal each horizontal tick.
  const tl = gsap.timeline({ paused: true });
  allLinePaths.forEach((node) => {
    tl.to(
      node,
      {
        attr: { 'stroke-dashoffset': 0 },
        duration: 0.55,
        ease: 'none',
      },
      '<0.02'
    );
  });

  const trigger = ScrollTrigger.create({
    trigger: container,
    start: 'top 80%',
    end: 'top 50%',
    scrub: 0.5,
    animation: tl,
  });

  function update() {
    // No per-frame work needed; ScrollTrigger drives the timeline.
  }

  function destroy() {
    trigger.kill();
    svg.remove();
  }

  return { update, destroy };
}
