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

  // Shared scales: x is week index; y starts at the truncated baseline.
  const x = d3.scalePoint().domain(d3.range(WEEKS)).range([0, cellInnerW]).padding(0);
  const yMax = d3.max(series, (s) => d3.max(s.values, (v) => v.value ?? 0));
  const y = d3.scaleLinear()
    .domain([Y_BASELINE, yMax * 1.05])
    .range([cellInnerH, 0])
    .nice();

  const dateFmt = d3.timeFormat('%b %d, %Y');
  const selectedFirst = d3.min(series, (s) => parseDate(s.values[0].date));
  const selectedLast = d3.max(series, (s) => parseDate(s.values[s.values.length - 1].date));
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

  // Shared y-axis on the left of the single row.
  const axisGroup = svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0, 0, 0, 0.2)'));

  // Squiggle break on the y-axis to show the base is truncated at 350K.
  const breakY = y(Y_BASELINE);
  axisGroup
    .append('path')
    .attr('d', `M -6,${breakY - 6} L -3,${breakY} L 0,${breakY - 6} L 3,${breakY} L 6,${breakY - 6}`)
    .attr('stroke', 'var(--ink)')
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
  const allDotGroups = [];

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

    // Faint horizontal gridlines inside the cell.
    gCell
      .append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(y.ticks(4))
      .join('line')
      .attr('x1', 0)
      .attr('x2', cellInnerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', 'rgba(0, 0, 0, 0.06)');

    // X-axis baseline.
    const baselineY = y(Y_BASELINE);
    gCell
      .append('line')
      .attr('x1', 0)
      .attr('x2', cellInnerW)
      .attr('y1', baselineY)
      .attr('y2', baselineY)
      .attr('stroke', 'rgba(0, 0, 0, 0.2)');

    // Week labels (first and last only).
    gCell
      .append('text')
      .attr('x', x(0))
      .attr('y', baselineY + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', 'var(--muted)')
      .text('W1');
    gCell
      .append('text')
      .attr('x', x(WEEKS - 1))
      .attr('y', baselineY + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', 'var(--muted)')
      .text('W8');

    // Solid line through the 8 real points for this day.
    const lineGen = d3
      .line()
      .x((d) => x(d.week))
      .y((d) => y(d.value))
      .curve(d3.curveLinear);

    const cellPath = gCell
      .append('path')
      .attr('class', 'dow-line')
      .attr('fill', 'none')
      .attr('stroke', s.color)
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGen(s.values))
      .each(function () {
        const length = this.getTotalLength();
        d3.select(this)
          .attr('stroke-dasharray', `${length} ${length}`)
          .attr('stroke-dashoffset', length);
      });

    allLinePaths.push(cellPath.node());

    // Dots at each of the 8 points.
    const dotGroup = gCell
      .append('g')
      .attr('class', 'dow-points')
      .style('opacity', 0);

    dotGroup
      .selectAll('circle')
      .data(s.values)
      .join('circle')
      .attr('cx', (d) => x(d.week))
      .attr('cy', (d) => y(d.value))
      .attr('r', 2.5)
      .attr('fill', 'var(--paper)')
      .attr('stroke', s.color)
      .attr('stroke-width', 2);

    allDotGroups.push(dotGroup.node());
  });

  // Note about what the sparklines show.
  svg
    .append('text')
    .attr('x', WIDTH / 2)
    .attr('y', HEIGHT - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', 'var(--muted)')
    .text('Each sparkline shows the last 8 reported ridership values for that day of the week.');

  // Scroll-driven draw animation: reveal all line segments, then dots.
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
  tl.to(allDotGroups, { opacity: 1, duration: 0.15 }, '-=0.05');

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
