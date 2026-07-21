// viz/stacked-area.js — stacked area chart for Commute vs Casual over time.
//
// Used by Chapter 4 (Three Traffic Bands) and Chapter 8 (Fare Hike shift).
// 7 channels stack by default; can be reduced to 2 (commute/casual) when
// the chapter aggregates them.

import * as d3 from 'd3';

const CHANNELS = [
  { key: 'smartcard',     label: 'Smart Card', color: '#7e3eb5' },
  { key: 'ncmc',           label: 'NCMC',       color: '#a13a3a' },
  { key: 'qrNammaMetro',   label: 'QR (NM)',    color: '#d04b36' },
  { key: 'qrWhatsApp',     label: 'QR (WA)',    color: '#e0633f' },
  { key: 'qrPaytm',        label: 'QR (Paytm)', color: '#ed7b48' },
  { key: 'groupTicket',    label: 'Group',      color: '#c8a44d' },
  { key: 'token',          label: 'Token',      color: '#a8852b' },
];

const MARGIN = { top: 28, right: 24, bottom: 32, left: 48 };
const WIDTH = 720;
const HEIGHT = 320;

export function renderStackedArea(container, data, options = {}) {
  const {
    title = '',
    pivot = null,
    aggregate = false, // if true, group into 'Commute' (smartcard + ncmc) and 'Casual' (rest)
  } = options;

  const parseDate = (s) => new Date(s);
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  // Optionally aggregate into 2 channels
  const channels = aggregate
    ? [
        { key: 'commute', label: 'Commute (Smart Card + NCMC)', color: '#7e3eb5' },
        { key: 'casual',  label: 'Casual (Token + QR + Group)', color: '#c8956b' },
      ]
    : CHANNELS;

  // Build stacked series
  const stacked = data.map((d) => {
    if (aggregate) {
      return {
        date: d.date,
        commute: d.smartcard + d.ncmc,
        casual: d.token + d.qrNammaMetro + d.qrWhatsApp + d.qrPaytm + d.groupTicket,
      };
    }
    return { date: d.date, ...Object.fromEntries(channels.map((c) => [c.key, d[c.key]])) };
  });

  const keys = channels.map((c) => c.key);
  const stack = d3.stack().keys(keys).order(d3.stackOrderNone);
  const series = stack(stacked);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', title || 'Stacked area chart')
    .attr('shape-rendering', 'geometricPrecision')
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

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

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(stacked, (d) => parseDate(d.date)))
    .range([0, innerW]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(stacked, (d) => keys.reduce((s, k) => s + d[k], 0)) * 1.05])
    .range([innerH, 0])
    .nice();

  g.append('g')
    .attr('transform', `translate(0, ${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));

  if (pivot) {
    g.append('line')
      .attr('x1', x(parseDate(pivot.date)))
      .attr('x2', x(parseDate(pivot.date)))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#d04b36')
      .attr('stroke-width', 2);
    g.append('text')
      .attr('x', x(parseDate(pivot.date)) + 6)
      .attr('y', 12)
      .attr('font-size', '10px')
      .attr('fill', '#d04b36')
      .attr('font-weight', 600)
      .text(pivot.label);
  }

  const area = d3.area()
    .x((d) => x(parseDate(d.data.date)))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(d3.curveMonotoneX);

  const layerPaths = g.selectAll('path.layer')
    .data(series)
    .join('path')
    .attr('class', 'layer')
    .attr('fill', (d) => channels.find((c) => c.key === d.key).color)
    .attr('opacity', 0.9)
    .attr('d', area);

  function update(progress) {
    // Reveal layers with a left-to-right mask
    layerPaths.attr('style', (d) => {
      const last = d[d.length - 1];
      const xMax = x(parseDate(last.data.date)) * progress;
      return `clip-path: inset(0 ${innerW - xMax}px 0 0);`;
    });
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}
