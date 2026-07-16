// viz/event-line.js — line chart with prominent event markers (used by Ch 7).
//
// Like ridership-line but with a vertical event-marker band + label per
// event, designed to make spikes obvious.

import * as d3 from 'd3';
import { renderRidershipLine } from './ridership-line.js';

export function renderEventLine(container, data, events, options = {}) {
  // Delegate to ridership-line for the chart frame, then add event bands.
  const line = renderRidershipLine(container, data, { ...options, showAxis: true });

  // Events are rendered as full-height vertical bands with labels
  const parseDate = (s) => new Date(s);
  const svg = d3.select(container).select('svg');
  const MARGIN = { top: 24, right: 24, bottom: 32, left: 56 };
  const WIDTH = 720;
  const HEIGHT = 320;
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = d3.scaleTime()
    .domain(d3.extent(data, (d) => parseDate(d.date)))
    .range([0, innerW]);
  const g = svg.select('g');

  g.selectAll('rect.event-band')
    .data(events)
    .join('rect')
    .attr('class', 'event-band')
    .attr('x', (d) => x(parseDate(d.date)) - 4)
    .attr('width', 8)
    .attr('y', 0)
    .attr('height', innerH)
    .attr('fill', (d) => (d.weight === 'primary' ? 'rgba(208, 75, 54, 0.18)' : 'rgba(0, 0, 0, 0.05)'))
    .attr('stroke', (d) => (d.weight === 'primary' ? 'rgba(208, 75, 54, 0.6)' : 'rgba(0,0,0,0.2)'))
    .attr('stroke-dasharray', '2,2');

  g.selectAll('text.event-label')
    .data(events.filter((d) => d.weight === 'primary'))
    .join('text')
    .attr('class', 'event-label')
    .attr('x', (d) => x(parseDate(d.date)))
    .attr('y', 14)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('fill', '#d04b36')
    .attr('font-weight', 600)
    .text((d) => d.label);

  return line;
}
