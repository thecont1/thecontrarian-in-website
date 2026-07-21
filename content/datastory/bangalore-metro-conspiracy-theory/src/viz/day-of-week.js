// viz/day-of-week.js — bar chart of average ridership by day of week.

import * as d3 from 'd3';

const MARGIN = { top: 24, right: 24, bottom: 32, left: 48 };
const WIDTH = 720;
const HEIGHT = 280;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function renderDayOfWeek(container, byDay, options = {}) {
  const { title = 'Average ridership by day of week' } = options;
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', title)
    .attr('shape-rendering', 'geometricPrecision')
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  if (title) {
    svg.append('text')
      .attr('x', MARGIN.left)
      .attr('y', 16)
      .attr('font-family', 'var(--font-display)')
      .attr('font-style', 'italic')
      .attr('font-size', '13px')
      .attr('fill', 'var(--muted)')
      .text(title);
  }

  const x = d3.scaleBand().domain(DAYS).range([0, innerW]).padding(0.25);
  const y = d3.scaleLinear()
    .domain([0, d3.max(byDay, (d) => d.total) * 1.1])
    .range([innerH, 0])
    .nice();

  g.append('g')
    .attr('transform', `translate(0, ${innerH})`)
    .call(d3.axisBottom(x))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));

  const bars = g.selectAll('rect.bar')
    .data(byDay)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', (d) => x(DAYS[d.dow]))
    .attr('width', x.bandwidth())
    .attr('y', innerH)
    .attr('height', 0)
    .attr('fill', (d) => (d.dow === 0 || d.dow === 6) ? '#c8956b' : '#1a7f37')
    .attr('rx', 2);

  function update(progress) {
    bars
      .attr('y', (d) => innerH - y(d.total) * progress)
      .attr('height', (d) => y(d.total) * progress);
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}

/** Compute average ridership per day of week (0=Sun..6=Sat) from a daily array. */
export function computeDayOfWeekAverages(daily) {
  const sums = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  for (const d of daily) {
    const dow = new Date(d.date).getDay();
    sums[dow] += d.total;
    counts[dow] += 1;
  }
  return sums.map((sum, dow) => ({ dow, total: counts[dow] ? Math.round(sum / counts[dow]) : 0 }));
}
