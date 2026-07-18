// viz/dow-lines.js — 7-line chart of ridership by day-of-week over
// the last 8 weeks of the dataset.
//
// Each line is one day of the week (Mon..Sun). The X-axis is eight
// consecutive weeks, so every line has eight points and the chart
// shows whether, say, Mondays are rising or falling across the
// window.

import * as d3 from 'd3';
import { gsap, ScrollTrigger } from '@thecontrarian/scrollytelling-core';

const WIDTH = 960;
const HEIGHT = 480;
const MARGIN = { top: 70, right: 30, bottom: 70, left: 60 };
const WEEKS = 8;
const DAYS_PER_WEEK = 7;
const Y_BASELINE = 350000; // truncate the y-axis below this value
const GRID = { cols: 4, rows: 2, gap: 20 };

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

  const lastDate = parseDate(sorted[sorted.length - 1]);
  const firstDate = new Date(lastDate);
  firstDate.setDate(firstDate.getDate() - (WEEKS * DAYS_PER_WEEK - 1));

  // Build a full calendar window (56 days) because the dataset has
  // gaps where NammaMetro did not report. Missing days are imputed
  // per day-of-week line after the values are collected.
  const dateKey = d3.timeFormat('%Y-%m-%d');
  const rowByDate = new Map(sorted.map((d) => [d.date, d]));
  const calendarRows = [];
  for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    const row = rowByDate.get(key);
    calendarRows.push({ date: key, total: row ? row.total : null });
  }

  // Split the calendar window into eight weeks (oldest to newest).
  const withWeek = calendarRows.map((d, i) => ({ ...d, week: Math.floor(i / DAYS_PER_WEEK) }));
  const weekGroups = d3.groups(withWeek, (d) => d.week).sort((a, b) => a[0] - b[0]);

  // Build one series per day-of-week. Values keep their original
  // nulls so missing days can be shown with dashed connectors.
  const series = DAYS.map(({ name, dow }, i) => ({
    name,
    dow,
    color: COLORS[i],
    values: weekGroups.map(([week, rows]) => {
      const row = rows.find((d) => new Date(d.date).getDay() === dow);
      return { week, date: row?.date ?? null, value: row ? row.total : null };
    }),
  }));

  // Small-multiples layout.
  const cellInnerW =
    (WIDTH - MARGIN.left - MARGIN.right - (GRID.cols - 1) * GRID.gap) / GRID.cols;
  const cellInnerH =
    (HEIGHT - MARGIN.top - MARGIN.bottom - (GRID.rows - 1) * GRID.gap) / GRID.rows;

  const cellX = (col) => MARGIN.left + col * (cellInnerW + GRID.gap);
  const cellY = (row) => MARGIN.top + row * (cellInnerH + GRID.gap);

  // Shared scales: x is week index; y starts at the truncated baseline.
  const x = d3.scalePoint().domain(d3.range(WEEKS)).range([0, cellInnerW]).padding(0);
  const yMax = d3.max(series, (s) => d3.max(s.values, (v) => v.value ?? 0));
  const y = d3.scaleLinear()
    .domain([Y_BASELINE, yMax * 1.05])
    .range([cellInnerH, 0])
    .nice();

  const dateFmt = d3.timeFormat('%b %d, %Y');
  const subtitle = `${dateFmt(firstDate)} – ${dateFmt(lastDate)}`;

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

  // Shared y-axis, drawn once for each row so both rows have a scale.
  for (let row = 0; row < GRID.rows; row++) {
    const rowAxis = svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${MARGIN.left}, ${cellY(row)})`)
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('~s')))
      .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
      .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0, 0, 0, 0.2)'));

    // Squiggle break on the y-axis to show the base is truncated at 350K.
    const breakY = y(Y_BASELINE);
    rowAxis
      .append('path')
      .attr('d', `M -6,${breakY - 6} L -3,${breakY} L 0,${breakY - 6} L 3,${breakY} L 6,${breakY - 6}`)
      .attr('stroke', 'var(--ink)')
      .attr('stroke-width', 1)
      .attr('fill', 'none');
  }

  // Y-axis label, centered on the full grid height.
  const gridMidY = MARGIN.top + (GRID.rows * cellInnerH + (GRID.rows - 1) * GRID.gap) / 2;
  svg
    .append('text')
    .attr('transform', `translate(${-MARGIN.left + 10}, ${gridMidY}) rotate(-90)`)
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
    const row = Math.floor(i / GRID.cols);
    const cx = cellX(col);
    const cy = cellY(row);
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

    // Build solid and dashed segments from consecutive real points.
    const known = s.values
      .map((p, idx) => (p.value !== null ? { ...p, idx } : null))
      .filter(Boolean);

    const segments = [];
    for (let k = 1; k < known.length; k++) {
      const a = known[k - 1];
      const b = known[k];
      segments.push({
        from: a,
        to: b,
        dashed: b.idx - a.idx > 1,
      });
    }

    const lineGen = d3
      .line()
      .x((d) => x(d.idx))
      .y((d) => y(d.value))
      .curve(d3.curveLinear);

    const cellPaths = gCell
      .append('g')
      .attr('class', 'dow-line-group')
      .selectAll('path')
      .data(segments)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', s.color)
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-dasharray', (d) => (d.dashed ? '4 3' : null))
      .attr('d', (d) => lineGen([d.from, d.to]))
      .each(function () {
        const length = this.getTotalLength();
        const d3Sel = d3.select(this);
        if (d3Sel.datum().dashed) {
          // Keep the 4-3 dash pattern and reveal it via dashoffset.
          d3Sel.attr('stroke-dasharray', `4 3`).attr('stroke-dashoffset', length);
        } else {
          d3Sel.attr('stroke-dasharray', `${length} ${length}`).attr('stroke-dashoffset', length);
        }
      });

    allLinePaths.push(...cellPaths.nodes());

    // Dots at real points.
    const dotGroup = gCell
      .append('g')
      .attr('class', 'dow-points')
      .style('opacity', 0);

    dotGroup
      .selectAll('circle')
      .data(known)
      .join('circle')
      .attr('cx', (d) => x(d.idx))
      .attr('cy', (d) => y(d.value))
      .attr('r', 2.5)
      .attr('fill', 'var(--paper)')
      .attr('stroke', s.color)
      .attr('stroke-width', 2);

    allDotGroups.push(dotGroup.node());
  });

  // Note about missing data.
  svg
    .append('text')
    .attr('x', WIDTH / 2)
    .attr('y', HEIGHT - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', 'var(--muted)')
    .text('Dashed segments connect days when Metro did not report ridership.');

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
