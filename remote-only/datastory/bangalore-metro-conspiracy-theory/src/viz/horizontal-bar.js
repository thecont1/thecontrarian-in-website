// viz/horizontal-bar.js — top-N horizontal bar chart.
//
// Used by Chapter 2 ("The Metro is Getting Crowded!") for top-10 busiest
// and top-10 least busy days. Each bar is a date; length = total ridership.
//
// Scroll integration: bars grow from 0 to full width. update(progress)
// drives each bar's width. progress ∈ [0, 1].

import * as d3 from 'd3';

const WIDTH = 720;
const ROW_HEIGHT = 28;
const ROW_GAP = 6;
const LABEL_W = 110;
const BAR_AREA_W = WIDTH - LABEL_W - 80;
const PADDING = 12;

const SHADE = {
  busy:   '#1a7f37',
  quiet:  '#c8956b',
  border: 'rgba(0,0,0,0.15)',
};

/**
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} rows
 * @param {{ label: string, color?: 'busy'|'quiet' }} options
 * @returns {{ update, destroy }}
 */
export function renderHorizontalBar(container, rows, options = {}) {
  const { label = '', color = 'busy' } = options;
  const HEIGHT = PADDING * 2 + rows.length * (ROW_HEIGHT + ROW_GAP);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', `${label}: horizontal bar chart`)
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '11px');

  const max = d3.max(rows, (d) => d.total);
  const x = d3.scaleLinear().domain([0, max]).range([0, BAR_AREA_W]);
  const fill = SHADE[color] ?? SHADE.busy;

  const groups = svg
    .selectAll('g.row')
    .data(rows)
    .join('g')
    .attr('class', 'row')
    .attr('transform', (_, i) => `translate(0, ${PADDING + i * (ROW_HEIGHT + ROW_GAP)})`);

  // Date label (left)
  groups.append('text')
    .attr('x', 0)
    .attr('y', ROW_HEIGHT / 2)
    .attr('dy', '0.35em')
    .attr('font-size', '12px')
    .attr('fill', 'var(--ink)')
    .text((d) => d.date);

  // Bar background
  groups.append('rect')
    .attr('x', LABEL_W)
    .attr('y', 0)
    .attr('width', BAR_AREA_W)
    .attr('height', ROW_HEIGHT)
    .attr('fill', 'rgba(0,0,0,0.04)')
    .attr('rx', 2);

  // Bar foreground
  const bars = groups.append('rect')
    .attr('x', LABEL_W)
    .attr('y', 0)
    .attr('width', 0)            // start collapsed
    .attr('height', ROW_HEIGHT)
    .attr('fill', fill)
    .attr('rx', 2);

  // Value label (right of bar)
  groups.append('text')
    .attr('x', LABEL_W)
    .attr('y', ROW_HEIGHT / 2)
    .attr('dy', '0.35em')
    .attr('font-weight', 600)
    .attr('fill', 'var(--ink)')
    .attr('opacity', 0)
    .text((d) => d.total.toLocaleString('en-IN'));

  // Subtitle (small caption above the chart, set by the chapter)
  if (label) {
    svg.append('text')
      .attr('x', 0)
      .attr('y', -2)
      .attr('font-family', 'var(--font-display)')
      .attr('font-style', 'italic')
      .attr('font-size', '13px')
      .attr('fill', 'var(--muted)')
      .text(label);
  }

  function update(progress) {
    bars.attr('width', (d) => x(d.total) * progress);
    groups.selectAll('text:last-child').attr('opacity', progress).attr('x', (d) => LABEL_W + x(d.total) * progress + 8);
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}
