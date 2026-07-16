// viz/multi-ridership-line.js — multi-line chart for the Jan 14-17 smoking gun.
//
// Used by Chapter 9 ("The Conspiracy Theory") to show Smart Card / Token / QR
// values across the 4-day window centered on the Jan 15-16 anomaly.
//
// All three series share an axis. The Smart Card line spikes; Token and QR
// lines crash. The annotations (👆🏼, 👇🏼) come from the chapter prose.

import * as d3 from 'd3';

const SERIES = [
  { key: 'smartcard',  label: 'Smart Card', color: '#7e3eb5' },
  { key: 'token',      label: 'Token',      color: '#a8852b' },
  { key: 'qrNammaMetro', label: 'QR (NammaMetro)', color: '#d04b36' },
  { key: 'qrWhatsApp',   label: 'QR (WhatsApp)',   color: '#e0633f' },
  { key: 'qrPaytm',      label: 'QR (Paytm)',      color: '#ed7b48' },
];

const MARGIN = { top: 28, right: 24, bottom: 32, left: 56 };
const WIDTH = 720;
const HEIGHT = 320;

export function renderMultiRidershipLine(container, data, options = {}) {
  const { title = '', window = null, seriesKeys = SERIES.map((s) => s.key) } = options;
  const parseDate = (s) => new Date(s);

  // Filter to window if provided
  const filtered = window
    ? data.filter((d) => {
        const date = parseDate(d.date);
        return date >= parseDate(window.pre.start) && date <= parseDate(window.post.end);
      })
    : data;

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', title || 'Multi-line chart of payment channels')
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
    .domain(d3.extent(filtered, (d) => parseDate(d.date)))
    .range([0, innerW]);
  const maxVal = d3.max(filtered, (d) => Math.max(...seriesKeys.map((k) => d[k]))) * 1.1;
  const y = d3.scaleLinear().domain([0, maxVal]).range([innerH, 0]).nice();

  g.append('g')
    .attr('transform', `translate(0, ${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));

  const line = d3.line()
    .x((d) => x(parseDate(d.date)))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const paths = g.selectAll('path.series')
    .data(seriesKeys.map((k) => ({
      key: k,
      meta: SERIES.find((s) => s.key === k),
      values: filtered.map((d) => ({ date: d.date, value: d[k] })),
    })))
    .join('path')
    .attr('class', 'series')
    .attr('fill', 'none')
    .attr('stroke', (d) => d.meta.color)
    .attr('stroke-width', 2.5)
    .attr('stroke-linecap', 'round')
    .attr('d', (d) => line(d.values));

  // Animate each line drawing in, staggered
  const lengths = paths.nodes().map((n) => n.getTotalLength());
  paths
    .attr('stroke-dasharray', (d, i) => `${lengths[i]} ${lengths[i]}`)
    .attr('stroke-dashoffset', (d, i) => lengths[i]);

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${HEIGHT - 6})`);
  seriesKeys.forEach((k, i) => {
    const meta = SERIES.find((s) => s.key === k);
    const item = legend.append('g').attr('transform', `translate(${i * 110}, 0)`);
    item.append('rect').attr('width', 10).attr('height', 10).attr('y', -8).attr('fill', meta.color).attr('rx', 1);
    item.append('text').attr('x', 14).attr('font-size', '10px').attr('fill', 'var(--muted)').text(meta.label);
  });

  function update(progress) {
    paths.attr('stroke-dashoffset', (d, i) => lengths[i] * (1 - progress));
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}
