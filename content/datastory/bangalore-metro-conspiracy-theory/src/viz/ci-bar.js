// viz/ci-bar.js — horizontal bar with 99% / 95% confidence interval whiskers.
//
// Used by Chapter 8 ("How badly did it hurt?") and Chapter 9 ("Hypothesis test").
// Each row: a single channel, a horizontal bar showing the % change,
// with whiskers for the CI bounds.

import * as d3 from 'd3';

const ROW_HEIGHT = 36;
const ROW_GAP = 8;
const PADDING = 12;
const LABEL_W = 140;
const BAR_AREA_W = 320;
const WIDTH = 720;

const CHANNEL_LABELS = {
  smartcard: 'Smart Card',
  ncmc: 'NCMC',
  qrNammaMetro: 'QR (NammaMetro)',
  qrWhatsApp: 'QR (WhatsApp)',
  qrPaytm: 'QR (Paytm)',
  token: 'Token',
  groupTicket: 'Group Ticket',
};

export function renderCIBar(container, rows, options = {}) {
  const { title = 'Pre- vs post- change with confidence interval' } = options;
  const HEIGHT = PADDING * 2 + rows.length * (ROW_HEIGHT + ROW_GAP);

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

  if (title) {
    svg.append('text')
      .attr('x', 0)
      .attr('y', -2)
      .attr('font-family', 'var(--font-display)')
      .attr('font-style', 'italic')
      .attr('font-size', '13px')
      .attr('fill', 'var(--muted)')
      .text(title);
  }

  // Domain: symmetric, max abs value across all rows
  const maxAbs = d3.max(rows, (r) => Math.max(Math.abs(r.ciLow || 0), Math.abs(r.ciHigh || 0)));
  const half = Math.max(maxAbs, 5);
  const x = d3.scaleLinear().domain([-half, half]).range([0, BAR_AREA_W]);
  const center = x(0);

  // Zero line
  svg.append('line')
    .attr('x1', LABEL_W + center)
    .attr('x2', LABEL_W + center)
    .attr('y1', PADDING)
    .attr('y2', HEIGHT - PADDING)
    .attr('stroke', 'rgba(0,0,0,0.3)');

  const groups = svg.selectAll('g.row')
    .data(rows)
    .join('g')
    .attr('class', 'row')
    .attr('transform', (_, i) => `translate(0, ${PADDING + i * (ROW_HEIGHT + ROW_GAP)})`);

  // Channel label
  groups.append('text')
    .attr('x', 0)
    .attr('y', ROW_HEIGHT / 2)
    .attr('dy', '0.35em')
    .attr('font-size', '12px')
    .attr('fill', 'var(--ink)')
    .text((d) => CHANNEL_LABELS[d.channel] || d.channel);

  // CI whisker (horizontal line)
  const whiskers = groups.append('line')
    .attr('class', 'ci-whisker')
    .attr('x1', (d) => LABEL_W + x(d.ciLow))
    .attr('x2', (d) => LABEL_W + x(d.ciHigh))
    .attr('y1', ROW_HEIGHT / 2)
    .attr('y2', ROW_HEIGHT / 2)
    .attr('stroke', 'rgba(0,0,0,0.5)')
    .attr('stroke-width', 1)
    .attr('opacity', 0);

  // CI end caps
  groups.append('line')
    .attr('class', 'ci-cap-low')
    .attr('x1', (d) => LABEL_W + x(d.ciLow))
    .attr('x2', (d) => LABEL_W + x(d.ciLow))
    .attr('y1', ROW_HEIGHT / 2 - 5)
    .attr('y2', ROW_HEIGHT / 2 + 5)
    .attr('stroke', 'rgba(0,0,0,0.5)')
    .attr('stroke-width', 1)
    .attr('opacity', 0);
  groups.append('line')
    .attr('class', 'ci-cap-high')
    .attr('x1', (d) => LABEL_W + x(d.ciHigh))
    .attr('x2', (d) => LABEL_W + x(d.ciHigh))
    .attr('y1', ROW_HEIGHT / 2 - 5)
    .attr('y2', ROW_HEIGHT / 2 + 5)
    .attr('stroke', 'rgba(0,0,0,0.5)')
    .attr('stroke-width', 1)
    .attr('opacity', 0);

  // The bar (extends from zero to the point estimate)
  const bars = groups.append('rect')
    .attr('class', 'bar')
    .attr('x', LABEL_W + center)
    .attr('y', ROW_HEIGHT / 2 - 6)
    .attr('width', 0)
    .attr('height', 12)
    .attr('fill', (d) => (d.pctChange >= 0 ? '#1a7f37' : '#d04b36'))
    .attr('rx', 2);

  // Value label
  groups.append('text')
    .attr('class', 'value-label')
    .attr('x', (d) => LABEL_W + x(d.pctChange) + (d.pctChange >= 0 ? 8 : -8))
    .attr('y', ROW_HEIGHT / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', (d) => (d.pctChange >= 0 ? 'start' : 'end'))
    .attr('font-size', '11px')
    .attr('font-weight', 600)
    .attr('fill', (d) => (d.pctChange >= 0 ? '#1a7f37' : '#d04b36'))
    .attr('opacity', 0)
    .text((d) => `${d.pctChange >= 0 ? '+' : ''}${d.pctChange.toFixed(1)}%`);

  function update(progress) {
    bars.attr('x', (d) => {
      const target = LABEL_W + x(d.pctChange);
      return d.pctChange >= 0 ? LABEL_W + center : target;
    }).attr('width', (d) => Math.abs(x(d.pctChange) - center) * progress);
    whiskers.attr('opacity', progress);
    groups.select('.ci-cap-low').attr('opacity', progress);
    groups.select('.ci-cap-high').attr('opacity', progress);
    groups.select('.value-label').attr('opacity', progress);
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}
