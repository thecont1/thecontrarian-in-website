// viz/dow-lines.js — 7-day ridership chart with interactive payment-mode overlay.
//
// A single row of seven sparkline cells (Mon–Sun). By default the chart
// shows total daily ridership (black 1px lines) on a 400K–1M y-axis.
// Hovering a payment-method label in the legend animates the y-axis
// window down to 0–600K, revealing that method's coloured lines.
// Only the hovered method's lines are shown; all others stay invisible.
//
// Rendered as crisp vector SVG (non-scaling-stroke, geometricPrecision)
// for 300 DPI-equivalent clarity at any zoom level.

import * as d3 from 'd3';

const CELL_W = 120;
const CELL_H = 240;
const GRID = { cols: 7, rows: 1, gap: 12 };
const MARGIN = { top: 90, right: 20, bottom: 55, left: 55 };

const WIDTH =
  MARGIN.left + MARGIN.right + GRID.cols * CELL_W + (GRID.cols - 1) * GRID.gap;

const VIEWBOX_TOP = -MARGIN.top;
const VIEWBOX_HEIGHT = MARGIN.top + CELL_H + 60;
const VIEWBOX = `0 ${VIEWBOX_TOP} ${WIDTH} ${VIEWBOX_HEIGHT}`;

const DAYS = [
  { name: 'Mon', dow: 1 },
  { name: 'Tue', dow: 2 },
  { name: 'Wed', dow: 3 },
  { name: 'Thu', dow: 4 },
  { name: 'Fri', dow: 5 },
  { name: 'Sat', dow: 6 },
  { name: 'Sun', dow: 0 },
];

// Payment channels — same as treemap.js CHANNELS for visual consistency.
const CHANNELS = [
  { key: 'smartcard',     label: 'Smart Card',   color: '#7e3eb5' },
  { key: 'token',          label: 'Tokens',       color: '#a8852b' },
  { key: 'qrWhatsApp',     label: 'Whatsapp',     color: '#e0633f' },
  { key: 'qrNammaMetro',   label: 'Metro QR',     color: '#d04b36' },
  { key: 'qrPaytm',        label: 'Paytm',        color: '#ed7b48' },
  { key: 'ncmc',           label: 'NCMC',         color: '#a13a3a' },
  { key: 'groupTicket',    label: 'Group Ticket', color: '#c8a44d' },
];

// The full y-range is 0–1M. The window shows 600K at a time.
// fullH is the pixel height of the full 0–1M range in content space.
// WINDOW_H (240px = cellInnerH) is the visible window = 600K of range.
// fullH = 240 × (1M / 600K) = 400px.
const Y_FULL_MAX = 1000000;
const WINDOW_H = CELL_H;
const FULL_H = Math.round(WINDOW_H * (Y_FULL_MAX / 600000));
// Scroll offset: yFull(600K) = 160, so scrolling up 160px brings
// the 0–600K range into the window.
const SCROLL_OFFSET = FULL_H - WINDOW_H;

const PLOT_TOP = 0;

/**
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} daily
 * @param {{ title?: string, yLabel?: string }} options
 * @returns {{ update, destroy }}
 */
export function renderDowLines(container, daily, options = {}) {
  const { title = 'Ridership Patterns by Day of Week' } = options;

  const parseDate = (d) => new Date(d.date);
  const sorted = [...daily].sort((a, b) => parseDate(a) - parseDate(b));

  // Build one series per day-of-week using EVERY reported value
  // in the dataset. Each line in a cell is one reported day.
  const series = DAYS.map(({ name, dow }, i) => {
    const dayRows = sorted.filter((d) => parseDate(d).getDay() === dow);
    return {
      name,
      dow,
      values: dayRows.map((row, idx) => ({
        week: idx,
        date: row.date,
        value: row.total,
        modes: CHANNELS.map((m) => ({ mode: m.key, value: row[m.key] ?? 0 })),
      })),
    };
  });

  const cellInnerW = CELL_W;
  const cellInnerH = CELL_H;
  const cellX = (col) => MARGIN.left + col * (cellInnerW + GRID.gap);
  const cellY = () => PLOT_TOP;

  // Single y-scale: maps 0–1M to FULL_H–0 in content space.
  // The window (240px) shows a 600K slice of this range.
  function yFull(v) {
    return FULL_H - (v / Y_FULL_MAX) * FULL_H;
  }

  const dateFmt = d3.timeFormat('%b %d, %Y');
  const selectedFirst = d3.min(series, (s) => new Date(s.values[0].date));
  const selectedLast = d3.max(series, (s) => new Date(s.values[s.values.length - 1].date));
  const subtitle = `${dateFmt(selectedFirst)} – ${dateFmt(selectedLast)}`;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'dow-lines-svg')
    .attr('viewBox', VIEWBOX)
    .attr('role', 'img')
    .attr('aria-label', `${title}: ${subtitle}`)
    .attr('shape-rendering', 'geometricPrecision')
    .style('width', '100%')
    .style('overflow', 'visible')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px');

  // Title and subtitle.
  const titleGroup = svg.append('g')
    .attr('class', 'dow-lines__title')
    .attr('transform', `translate(0, ${PLOT_TOP - 90})`);
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

  const gridW = GRID.cols * cellInnerW + (GRID.cols - 1) * GRID.gap;

  // --- Window frame ---
  // The chart is a fixed "window" with four edges and a background.
  // Content (lines + ticks) lives in a taller virtual space (0–1M =
  // 400px) and scrolls within this 240px window.

  // Window background (behind content).
  svg.append('rect')
    .attr('class', 'dow-lines__window-bg')
    .attr('x', MARGIN.left)
    .attr('y', PLOT_TOP)
    .attr('width', gridW)
    .attr('height', cellInnerH)
    .attr('fill', 'rgba(248, 248, 248, 0.6)');

  // Clip path — fixed to the window area. Content outside this rect
  // is hidden. Extends left to include y-tick labels.
  const defs = svg.append('defs');
  defs.append('clipPath').attr('id', 'dow-lines-window-clip')
    .append('rect')
    .attr('x', MARGIN.left - 60)
    .attr('y', PLOT_TOP)
    .attr('width', gridW + 60)
    .attr('height', cellInnerH);

  // Viewport group — has the clip-path, never transforms.
  // Content group inside it transforms on hover.
  const viewportGroup = svg.append('g')
    .attr('class', 'dow-lines__viewport')
    .attr('clip-path', 'url(#dow-lines-window-clip)');

  const contentGroup = viewportGroup.append('g')
    .attr('class', 'dow-lines__content');

  // --- Y-axis ticks (inside content, scroll with it) ---
  const tickFmt = d3.format('~s');
  const allTicks = [0, 200000, 400000, 600000, 800000, 1000000];
  const axisGroup = contentGroup
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${MARGIN.left}, ${PLOT_TOP})`);
  const tickGroup = axisGroup.append('g').attr('class', 'y-axis__ticks');
  allTicks.forEach((tVal) => {
    const ty = yFull(tVal);
    tickGroup.append('line')
      .attr('x1', -6).attr('x2', 0)
      .attr('y1', ty).attr('y2', ty)
      .attr('stroke', 'rgba(0, 0, 0, 0.2)')
      .attr('vector-effect', 'non-scaling-stroke');
    tickGroup.append('text')
      .attr('x', -10)
      .attr('y', ty + 3)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', 'var(--muted)')
      .text(tickFmt(tVal));
  });

  // --- Cells with lines (inside content, scroll with it) ---
  const cellGroup = contentGroup.append('g').attr('class', 'dow-lines__cells');
  const totalLines = [];
  const modeLines = {};
  CHANNELS.forEach((m) => (modeLines[m.key] = []));

  series.forEach((s, i) => {
    const col = i % GRID.cols;
    const cx = cellX(col);
    const cy = cellY();
    const gCell = cellGroup
      .append('g')
      .attr('transform', `translate(${cx}, ${cy})`);

    // Total ridership lines — black, 1px.
    const totalGroup = gCell.append('g').attr('class', 'dow-lines__total');
    totalGroup
      .selectAll('line')
      .data(s.values)
      .join('line')
      .attr('x1', 0)
      .attr('x2', cellInnerW)
      .attr('y1', (d) => yFull(d.value))
      .attr('y2', (d) => yFull(d.value))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .each(function () { totalLines.push(this); });

    // Payment-method lines — coloured, invisible by default.
    CHANNELS.forEach((m) => {
      const modeKey = m.key;
      gCell
        .selectAll(`.mode-line-${modeKey}`)
        .data(s.values)
        .join('line')
        .attr('class', `dow-lines__mode-line mode-${modeKey}`)
        .attr('x1', 0)
        .attr('x2', cellInnerW)
        .attr('y1', (d) => yFull(d.modes.find((md) => md.mode === modeKey).value))
        .attr('y2', (d) => yFull(d.modes.find((md) => md.mode === modeKey).value))
        .attr('stroke', m.color)
        .attr('stroke-width', 1.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('opacity', 0)
        .each(function () { modeLines[modeKey].push(this); });
    });
  });

  // --- Fixed elements (outside viewport, don't scroll) ---

  // Cell titles (day names) — fixed above the window.
  const cellTitlesGroup = svg.append('g').attr('class', 'dow-lines__cell-titles');
  series.forEach((s, i) => {
    const col = i % GRID.cols;
    const cx = cellX(col);
    cellTitlesGroup
      .append('text')
      .attr('x', cx + cellInnerW / 2)
      .attr('y', PLOT_TOP - 8)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-display)')
      .attr('font-size', '12px')
      .attr('font-weight', 600)
      .attr('fill', 'var(--ink)')
      .text(s.name);
  });

  // Window border — four edges, drawn on top of content.
  svg.append('rect')
    .attr('class', 'dow-lines__window-border')
    .attr('x', MARGIN.left)
    .attr('y', PLOT_TOP)
    .attr('width', gridW)
    .attr('height', cellInnerH)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(0, 0, 0, 0.25)')
    .attr('stroke-width', 1)
    .attr('vector-effect', 'non-scaling-stroke');

  // HTML legend — uses the exact same treemap-legend CSS classes
  // as Chapter 1's Payment Mix chart for identical styling.
  const legendEl = document.createElement('div');
  legendEl.className = 'treemap-legend';
  container.appendChild(legendEl);

  let currentMode = null;
  const TRANSITION_MS = 600;

  function enterMode(modeKey) {
    if (currentMode === modeKey) return;
    currentMode = modeKey;
    const t = d3.transition().duration(TRANSITION_MS);

    // Scroll content up: window now shows 0–600K instead of 400K–1M.
    contentGroup.transition(t)
      .attr('transform', `translate(0, ${-SCROLL_OFFSET})`);

    // Show ONLY the hovered method's lines; all others stay invisible.
    Object.keys(modeLines).forEach((key) => {
      const isHover = key === modeKey;
      d3.selectAll(modeLines[key])
        .transition(t)
        .style('opacity', isHover ? 1 : 0);
    });
  }

  function exitMode() {
    if (currentMode === null) return;
    currentMode = null;
    const t = d3.transition().duration(TRANSITION_MS);

    // Scroll content back: window shows 400K–1M (default).
    contentGroup.transition(t)
      .attr('transform', 'translate(0, 0)');

    // Hide all mode lines.
    Object.keys(modeLines).forEach((key) => {
      d3.selectAll(modeLines[key]).transition(t).style('opacity', 0);
    });
  }

  // Build legend items — same structure as treemap legend.
  const legend = d3.select(legendEl);
  CHANNELS.forEach((c) => {
    const item = legend.append('div')
      .attr('class', 'treemap-legend__item')
      .attr('data-key', c.key)
      .style('cursor', 'pointer');
    item.append('span')
      .attr('class', 'treemap-legend__label')
      .style('color', c.color)
      .text(c.label);
    item.append('span').attr('class', 'treemap-legend__pct');
    item
      .on('mouseenter', () => enterMode(c.key))
      .on('mouseleave', () => exitMode());
  });

  function update() {}

  function destroy() {
    svg.remove();
    legendEl.remove();
  }

  return { update, destroy };
}
