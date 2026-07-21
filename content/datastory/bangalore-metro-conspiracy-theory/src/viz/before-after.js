// viz/before-after.js — paired bars comparing pre- and post-window means.
//
// Used by Chapter 9 ("Payment Disruptions: Examining the Patterns") to
// show the mean transaction volume for each channel before and after Jan 14.

import * as d3 from 'd3';

const CHANNELS = [
  { key: 'smartcard',     label: 'Smart Card', color: '#7e3eb5' },
  { key: 'ncmc',           label: 'NCMC',       color: '#a13a3a' },
  { key: 'qrNammaMetro',   label: 'QR (NM)',    color: '#d04b36' },
  { key: 'qrWhatsApp',     label: 'QR (WA)',    color: '#e0633f' },
  { key: 'qrPaytm',        label: 'QR (Paytm)', color: '#ed7b48' },
  { key: 'token',          label: 'Token',      color: '#a8852b' },
  { key: 'groupTicket',    label: 'Group',      color: '#c8a44d' },
];

const MARGIN = { top: 28, right: 24, bottom: 60, left: 56 };
const WIDTH = 720;
const HEIGHT = 320;

export function renderBeforeAfter(container, data, window, options = {}) {
  const { title = 'Pre vs Post: mean daily ridership by channel' } = options;
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const parseDate = (s) => new Date(s);

  // Compute pre/post means
  const preDays = new Set(data.filter((d) => {
    const date = parseDate(d.date);
    return date >= parseDate(window.pre.start) && date <= parseDate(window.pre.end);
  }).map((d) => d.date));
  const postDays = new Set(data.filter((d) => {
    const date = parseDate(d.date);
    return date >= parseDate(window.post.start) && date <= parseDate(window.post.end);
  }).map((d) => d.date));

  const means = CHANNELS.map((c) => {
    const pre = data.filter((d) => preDays.has(d.date));
    const post = data.filter((d) => postDays.has(d.date));
    const preMean = pre.length ? d3.mean(pre, (d) => d[c.key]) : 0;
    const postMean = post.length ? d3.mean(post, (d) => d[c.key]) : 0;
    const changePct = preMean ? ((postMean - preMean) / preMean) * 100 : 0;
    return { channel: c.key, label: c.label, color: c.color, pre: preMean, post: postMean, changePct };
  });

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
      .attr('x', MARGIN.left)
      .attr('y', 16)
      .attr('font-family', 'var(--font-display)')
      .attr('font-style', 'italic')
      .attr('font-size', '13px')
      .attr('fill', 'var(--muted)')
      .text(title);
  }

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  const x0 = d3.scaleBand().domain(means.map((m) => m.label)).range([0, innerW]).padding(0.2);
  const x1 = d3.scaleBand().domain(['Pre', 'Post']).range([0, x0.bandwidth()]).padding(0.1);
  const y = d3.scaleLinear()
    .domain([0, d3.max(means, (d) => Math.max(d.pre, d.post)) * 1.1])
    .range([innerH, 0])
    .nice();

  g.append('g')
    .attr('transform', `translate(0, ${innerH})`)
    .call(d3.axisBottom(x0))
    .selectAll('text')
    .attr('transform', 'rotate(-20)')
    .attr('text-anchor', 'end')
    .attr('fill', 'var(--muted)');
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));

  const groups = g.selectAll('g.channel')
    .data(means)
    .join('g')
    .attr('class', 'channel')
    .attr('transform', (d) => `translate(${x0(d.label)}, 0)`);

  const preBars = groups.append('rect')
    .attr('x', x1('Pre'))
    .attr('width', x1.bandwidth())
    .attr('y', innerH)
    .attr('height', 0)
    .attr('fill', (d) => d.color)
    .attr('opacity', 0.55)
    .attr('rx', 2);

  const postBars = groups.append('rect')
    .attr('x', x1('Post'))
    .attr('width', x1.bandwidth())
    .attr('y', innerH)
    .attr('height', 0)
    .attr('fill', (d) => d.color)
    .attr('rx', 2);

  // Change labels above each pair
  groups.append('text')
    .attr('x', x0.bandwidth() / 2)
    .attr('y', (d) => y(Math.max(d.pre, d.post)) - 8)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('font-weight', 600)
    .attr('fill', (d) => (d.changePct >= 0 ? '#1a7f37' : '#d04b36'))
    .attr('opacity', 0)
    .text((d) => `${d.changePct >= 0 ? '+' : ''}${d.changePct.toFixed(1)}%`);

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${WIDTH - 130}, ${HEIGHT - 8})`);
  legend.append('rect').attr('width', 10).attr('height', 10).attr('fill', '#888').attr('opacity', 0.55).attr('rx', 1);
  legend.append('text').attr('x', 14).attr('font-size', '10px').attr('fill', 'var(--muted)').text('Pre (14d before)');
  legend.append('rect').attr('x', 90).attr('width', 10).attr('height', 10).attr('fill', '#888').attr('rx', 1);
  legend.append('text').attr('x', 104).attr('font-size', '10px').attr('fill', 'var(--muted)').text('Post (14d after)');

  function update(progress) {
    preBars.attr('y', (d) => innerH - y(d.pre) * progress).attr('height', (d) => y(d.pre) * progress);
    postBars.attr('y', (d) => innerH - y(d.post) * progress).attr('height', (d) => y(d.post) * progress);
    groups.selectAll('text:last-child').attr('opacity', progress);
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}
