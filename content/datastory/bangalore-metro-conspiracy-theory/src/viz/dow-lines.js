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
const MARGIN = { top: 70, right: 30, bottom: 80, left: 70 };
const WEEKS = 8;
const DAYS_PER_WEEK = 7;

// Mon..Sun ordering for the legend and the seven lines.
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
  const { title = 'Ridership by day of week', yLabel = 'Total ridership' } = options;

  const parseDate = (d) => new Date(d.date);
  const sorted = [...daily].sort((a, b) => parseDate(a) - parseDate(b));
  const recent = sorted.slice(-(WEEKS * DAYS_PER_WEEK));

  const dateFmt = d3.timeFormat('%b %d, %Y');
  const subtitle = `${dateFmt(recent[0].date)} – ${dateFmt(recent[recent.length - 1].date)}`;

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  // Split the recent window into eight weeks (oldest to newest).
  const withWeek = recent.map((d, i) => ({ ...d, week: Math.floor(i / DAYS_PER_WEEK) }));
  const weekGroups = d3.groups(withWeek, (d) => d.week).sort((a, b) => a[0] - b[0]);

  // Build one series per day-of-week.
  const series = DAYS.map(({ name, dow }, i) => ({
    name,
    dow,
    color: COLORS[i],
    values: weekGroups.map(([week, rows]) => {
      const row = rows.find((d) => parseDate(d).getDay() === dow);
      return { week, value: row ? row.total : null };
    }),
  }));

  // X axis: week index, labelled with the last date in each week.
  const x = d3.scalePoint().domain(d3.range(WEEKS)).range([0, innerW]).padding(0);
  const weekLabels = weekGroups.map(([, rows]) =>
    d3.timeFormat('%b %d')(d3.max(rows, (d) => parseDate(d)))
  );

  // Y axis: total ridership.
  const yMax = d3.max(series, (s) => d3.max(s.values, (v) => v.value ?? 0));
  const y = d3.scaleLinear().domain([0, yMax * 1.05]).range([innerH, 0]).nice();

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

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

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

  // Gridlines (horizontal).
  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(y.ticks(5))
    .join('line')
    .attr('x1', 0)
    .attr('x2', innerW)
    .attr('y1', (d) => y(d))
    .attr('y2', (d) => y(d))
    .attr('stroke', 'rgba(0, 0, 0, 0.08)');

  // Axes.
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${innerH})`)
    .call(
      d3
        .axisBottom(x)
        .tickFormat((i) => weekLabels[i] ?? '')
        .tickSizeOuter(0)
    )
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0, 0, 0, 0.2)'));

  g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
    .call((sel) => sel.selectAll('text').attr('fill', 'var(--muted)'))
    .call((sel) => sel.selectAll('line, path').attr('stroke', 'rgba(0, 0, 0, 0.2)'));

  // Y-axis label.
  g.append('text')
    .attr('transform', `translate(${-MARGIN.left + 8}, ${innerH / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('fill', 'var(--muted)')
    .text(yLabel);

  // The seven day-of-week lines.
  const line = d3
    .line()
    .x((d) => x(d.week))
    .y((d) => y(d.value))
    .defined((d) => d.value !== null)
    .curve(d3.curveMonotoneX);

  const seriesGroup = g.append('g').attr('class', 'series-group');

  const paths = seriesGroup
    .selectAll('path.dow-line')
    .data(series)
    .join('path')
    .attr('class', 'dow-line')
    .attr('fill', 'none')
    .attr('stroke', (d) => d.color)
    .attr('stroke-width', 2.5)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('d', (d) => line(d.values))
    .each(function () {
      const length = this.getTotalLength();
      d3.select(this)
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length);
    });

  // Small dots at each data point, hidden until the line draws in.
  const dots = seriesGroup
    .selectAll('g.dow-points')
    .data(series)
    .join('g')
    .attr('class', 'dow-points')
    .style('opacity', 0);

  dots
    .selectAll('circle')
    .data((d) => d.values.filter((v) => v.value !== null))
    .join('circle')
    .attr('cx', (d) => x(d.week))
    .attr('cy', (d) => y(d.value))
    .attr('r', 3)
    .attr('fill', 'var(--paper)')
    .attr('stroke', function () {
      return d3.select(this.parentNode).datum().color;
    })
    .attr('stroke-width', 2);

  // Legend at the bottom.
  const legendGroup = svg.append('g').attr('class', 'dow-lines__legend');
  const legendItemW = 82;
  const legendStartX = (WIDTH - DAYS.length * legendItemW) / 2;
  const legendY = HEIGHT - 30;

  DAYS.forEach(({ name }, i) => {
    const lx = legendStartX + i * legendItemW;
    legendGroup
      .append('line')
      .attr('x1', lx)
      .attr('x2', lx + 16)
      .attr('y1', legendY)
      .attr('y2', legendY)
      .attr('stroke', COLORS[i])
      .attr('stroke-width', 3);
    legendGroup
      .append('text')
      .attr('x', lx + 22)
      .attr('y', legendY + 3)
      .attr('font-size', '11px')
      .attr('font-weight', 600)
      .attr('fill', 'var(--ink)')
      .text(name);
  });

  // Scroll-driven draw animation.
  const tl = gsap.timeline({ paused: true });
  paths.nodes().forEach((node, i) => {
    tl.to(
      node,
      {
        attr: { 'stroke-dashoffset': 0 },
        duration: 0.75,
        ease: 'none',
      },
      i * 0.05
    );
  });
  tl.to(dots.nodes(), { opacity: 1, duration: 0.2 }, '-=0.1');

  const trigger = ScrollTrigger.create({
    trigger: container,
    start: 'top 80%',
    end: 'center center',
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
