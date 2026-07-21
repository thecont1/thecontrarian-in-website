// viz/boxplot.js — boxplot of ridership by month.
//
// Used by Chapter 5 ("One Month on NammaMetro"). Each month is a vertical
// box with median, IQR, and outliers.

import * as d3 from 'd3';

const MARGIN = { top: 28, right: 24, bottom: 32, left: 56 };
const WIDTH = 720;
const HEIGHT = 320;

export function renderBoxplot(container, daily, options = {}) {
  const { title = 'Ridership distribution by month' } = options;
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  // Group by month
  const byMonth = d3.group(daily, (d) => d.date.slice(0, 7));
  const months = Array.from(byMonth.keys()).sort();
  const stats = months.map((m) => {
    const vals = byMonth.get(m).map((d) => d.total).sort((a, b) => a - b);
    const q1 = d3.quantile(vals, 0.25);
    const q2 = d3.quantile(vals, 0.5);
    const q3 = d3.quantile(vals, 0.75);
    const iqr = q3 - q1;
    const low = Math.max(d3.min(vals), q1 - 1.5 * iqr);
    const high = Math.min(d3.max(vals), q3 + 1.5 * iqr);
    const outliers = vals.filter((v) => v < low || v > high);
    return { month: m, low, q1, q2, q3, high, outliers };
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

  const x = d3.scaleBand().domain(months).range([0, innerW]).padding(0.3);
  const y = d3.scaleLinear()
    .domain([0, d3.max(stats, (s) => s.high) * 1.1])
    .range([innerH, 0])
    .nice();

  g.append('g')
    .attr('transform', `translate(0, ${innerH})`)
    .call(d3.axisBottom(x).tickFormat((d) => d3.timeFormat('%b %Y')(new Date(d + '-01'))))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)').attr('transform', 'rotate(-20)').attr('text-anchor', 'end'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0,0,0,0.2)'));

  // Each boxplot
  g.selectAll('g.box')
    .data(stats)
    .join('g')
    .attr('class', 'box')
    .attr('transform', (d) => `translate(${x(d.month)}, 0)`)
    .each(function (d) {
      const sel = d3.select(this);
      const cx = x.bandwidth() / 2;
      const boxW = x.bandwidth() * 0.6;
      // Whisker line
      sel.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', y(d.high)).attr('y2', y(d.low))
        .attr('stroke', 'var(--ink)')
        .attr('stroke-width', 1);
      // Whisker caps
      sel.append('line').attr('x1', cx - boxW / 4).attr('x2', cx + boxW / 4).attr('y1', y(d.high)).attr('y2', y(d.high)).attr('stroke', 'var(--ink)');
      sel.append('line').attr('x1', cx - boxW / 4).attr('x2', cx + boxW / 4).attr('y1', y(d.low)).attr('y2', y(d.low)).attr('stroke', 'var(--ink)');
      // IQR box
      sel.append('rect')
        .attr('x', cx - boxW / 2)
        .attr('y', y(d.q3))
        .attr('width', boxW)
        .attr('height', y(d.q1) - y(d.q3))
        .attr('fill', 'rgba(126, 62, 181, 0.2)')
        .attr('stroke', 'var(--ink)')
        .attr('stroke-width', 1);
      // Median line
      sel.append('line')
        .attr('x1', cx - boxW / 2)
        .attr('x2', cx + boxW / 2)
        .attr('y1', y(d.q2))
        .attr('y2', y(d.q2))
        .attr('stroke', '#7e3eb5')
        .attr('stroke-width', 2);
      // Outliers
      sel.selectAll('circle.outlier')
        .data(d.outliers)
        .join('circle')
        .attr('class', 'outlier')
        .attr('cx', cx)
        .attr('cy', (v) => y(v))
        .attr('r', 2.5)
        .attr('fill', 'rgba(0,0,0,0.5)');
    });

  function update(progress) {
    // Reveal left to right
    g.selectAll('g.box').attr('opacity', (d, i) => {
      const t = i / stats.length;
      return progress >= t ? 1 : 0;
    });
  }
  function destroy() { svg.remove(); }
  return { update, destroy };
}
