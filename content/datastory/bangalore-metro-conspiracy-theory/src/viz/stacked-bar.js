// viz/stacked-bar.js — single-day stacked bar showing the 7 payment-mode shares.
//
// Renders one vertical bar where each segment is a payment mode, sized by
// its share of the day's total ridership. Colors match the chapter 2 "doors"
// palette: smart card purple, NCMC+QR red family, token gold.
//
// Scroll integration: the export returns an `update(progress)` that grows
// the bar from 0 to its full height. progress ∈ [0, 1].

import * as d3 from 'd3';

const CHANNELS = [
  { key: 'smartcard',     label: 'Smart Card',     color: '#7e3eb5' },  // closed-loop, BMRCL-controlled
  { key: 'ncmc',           label: 'NCMC',           color: '#a13a3a' },  // open-loop
  { key: 'qrNammaMetro',   label: 'QR (NammaMetro)', color: '#d04b36' },
  { key: 'qrWhatsApp',     label: 'QR (WhatsApp)',  color: '#e0633f' },
  { key: 'qrPaytm',        label: 'QR (Paytm)',     color: '#ed7b48' },
  { key: 'groupTicket',    label: 'Group Ticket',   color: '#c8a44d' },
  { key: 'token',          label: 'Token',          color: '#a8852b' },
];

const WIDTH = 360;
const HEIGHT = 360;
const BAR_WIDTH = 80;
const BAR_X = (WIDTH - BAR_WIDTH) / 2;
const MARGIN_TOP = 30;

/**
 * Render a single-day stacked bar.
 * @param {HTMLElement} container
 * @param {{ date: string, smartcard: number, token: number, ncmc: number, groupTicket: number, qrNammaMetro: number, qrWhatsApp: number, qrPaytm: number, total: number }} day
 * @returns {{ update: (progress: number) => void, destroy: () => void }}
 */
export function renderStackedBar(container, day) {
  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', `Stacked bar of payment-mode shares for ${day.date}. Total ${day.total.toLocaleString('en-IN')} riders.`)
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '11px');

  const segments = CHANNELS
    .map((c) => ({ ...c, value: day[c.key] }))
    .filter((s) => s.value > 0);

  const y = d3
    .scaleLinear()
    .domain([0, day.total])
    .range([HEIGHT - MARGIN_TOP, MARGIN_TOP]);

  // Y-axis ticks (5 ticks: 0, 25%, 50%, 75%, 100%)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: HEIGHT - MARGIN_TOP - p * (HEIGHT - 2 * MARGIN_TOP),
    label: `${Math.round(p * 100)}%`,
  }));
  svg
    .selectAll('line.tick')
    .data(ticks)
    .join('line')
    .attr('class', 'tick')
    .attr('x1', 0)
    .attr('x2', WIDTH)
    .attr('y1', (d) => d.y)
    .attr('y2', (d) => d.y)
    .attr('stroke', 'rgba(0, 0, 0, 0.08)')
    .attr('stroke-dasharray', '2,3');
  svg
    .selectAll('text.tick-label')
    .data(ticks)
    .join('text')
    .attr('class', 'tick-label')
    .attr('x', 4)
    .attr('y', (d) => d.y - 2)
    .attr('fill', 'rgba(0, 0, 0, 0.5)')
    .text((d) => d.label);

  // Baseline (the bar's x position)
  const baselineY = HEIGHT - MARGIN_TOP;

  // Bar segments
  const bars = svg
    .selectAll('rect.segment')
    .data(segments)
    .join('rect')
    .attr('class', 'segment')
    .attr('x', BAR_X)
    .attr('width', BAR_WIDTH)
    .attr('y', baselineY) // start collapsed at baseline
    .attr('height', 0)
    .attr('fill', (d) => d.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);

  // Segment labels (in the middle of each segment, when there's room)
  const labels = svg
    .selectAll('text.segment-label')
    .data(segments)
    .join('text')
    .attr('class', 'segment-label')
    .attr('x', BAR_X + BAR_WIDTH / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-weight', 600)
    .attr('y', baselineY)
    .attr('opacity', 0)
    .text((d) => {
      const pct = ((d.value / day.total) * 100).toFixed(0);
      return pct >= 4 ? `${pct}%` : '';
    });

  // Title above the bar
  svg
    .append('text')
    .attr('x', WIDTH / 2)
    .attr('y', 18)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-display)')
    .attr('font-size', '14px')
    .attr('font-style', 'italic')
    .attr('fill', 'var(--ink)')
    .text(`${day.date} — ${day.total.toLocaleString('en-IN')} riders`);

  // Scroll-driven grow: progress 0..1 reveals the bar from bottom to top
  function update(progress) {
    // Compute the running totals
    let cum = 0;
    for (const seg of segments) {
      const target = seg.value;
      const segProgress = Math.max(0, Math.min(1, (progress * day.total - cum) / target));
      const segY = baselineY - (segProgress * (baselineY - y(target))); // top of segment
      const segHeight = segProgress * (baselineY - y(target));
      bars.filter((d) => d === seg).attr('y', segY).attr('height', segHeight);
      cum += target;
    }
    labels.attr('opacity', progress > 0.4 ? 1 : 0);
  }

  function destroy() {
    svg.remove();
  }

  return { update, destroy };
}
