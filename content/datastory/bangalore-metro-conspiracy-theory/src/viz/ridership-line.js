// viz/ridership-line.js — generic line chart for daily ridership over time.
//
// Used by Chapters 3, 5, 7, 8. Configurable: title, y-axis label,
// event markers, and a "pivot" date that gets a vertical highlight line.
//
// Scroll integration: the path draws in left-to-right as the user scrolls.
// update(progress) sets stroke-dashoffset on a pre-measured path length.

import * as d3 from 'd3';

const MARGIN = { top: 24, right: 24, bottom: 32, left: 56 };
const WIDTH = 720;
const HEIGHT = 320;

/**
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} data
 * @param {{
 *   title?: string,
 *   yLabel?: string,
 *   events?: Array<{date: string, label: string}>,
 *   pivot?: { date: string, label: string, color?: string },
 *   showAxis?: boolean
 * }} options
 * @returns {{ update, destroy }}
 */
export function renderRidershipLine(container, data, options = {}) {
  const {
    title = '',
    yLabel = 'Total ridership',
    events = [],
    pivot = null,
    showAxis = true,
  } = options;

  const parseDate = (s) => new Date(s);
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', title || 'Daily ridership line chart')
    .attr('shape-rendering', 'geometricPrecision')
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, (d) => parseDate(d.date)))
    .range([0, innerW]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.total) * 1.05])
    .range([innerH, 0])
    .nice();

  // Title
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

  // Axes
  if (showAxis) {
    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d'));
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s'));
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerH})`)
      .call(xAxis)
      .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
      .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
      .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));
    // Y-axis label
    g.append('text')
      .attr('transform', `translate(${-MARGIN.left + 8}, ${innerH / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'var(--muted)')
      .text(yLabel);
  }

  // Event markers
  if (events.length) {
    g.selectAll('line.event')
      .data(events)
      .join('line')
      .attr('class', 'event')
      .attr('x1', (d) => x(parseDate(d.date)))
      .attr('x2', (d) => x(parseDate(d.date)))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', 'rgba(0, 0, 0, 0.18)')
      .attr('stroke-dasharray', '2,3');
  }

  // Pivot line
  if (pivot) {
    g.append('line')
      .attr('class', 'pivot')
      .attr('x1', x(parseDate(pivot.date)))
      .attr('x2', x(parseDate(pivot.date)))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', pivot.color || '#d04b36')
      .attr('stroke-width', 2);
    g.append('text')
      .attr('x', x(parseDate(pivot.date)) + 6)
      .attr('y', 12)
      .attr('font-size', '10px')
      .attr('fill', pivot.color || '#d04b36')
      .attr('font-weight', 600)
      .text(pivot.label);
  }

  // The line itself, with stroke-dashoffset for draw-in animation
  const line = d3.line()
    .x((d) => x(parseDate(d.date)))
    .y((d) => y(d.total))
    .curve(d3.curveMonotoneX);

  const path = g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'var(--ink)')
    .attr('stroke-width', 1.5)
    .attr('d', line);

  // Measure path length for draw-in animation
  const totalLength = path.node().getTotalLength();
  path
    .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
    .attr('stroke-dashoffset', totalLength);

  function update(progress) {
    path.attr('stroke-dashoffset', totalLength * (1 - progress));
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}
