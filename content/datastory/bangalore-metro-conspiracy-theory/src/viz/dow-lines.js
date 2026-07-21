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
const CELL_H = 360;
const GRID = { cols: 7, rows: 1, gap: 12 };
const MARGIN = { top: 90, right: 20, bottom: 55, left: 55 };
// Padding inside the clip so y-tick labels at the extremes (0 and 1M)
// are not cropped. Only applied to the axis group, not the data lines.
const CLIP_PAD_TOP = 14;
const CLIP_PAD_BOTTOM = 14;

const WIDTH =
  MARGIN.left + MARGIN.right + GRID.cols * CELL_W + (GRID.cols - 1) * GRID.gap;

const VIEWBOX_TOP = -MARGIN.top;
const VIEWBOX_HEIGHT = MARGIN.top + CELL_H + 10;
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

// Per-mode y-axis scales. Each mode zooms to a range appropriate
// for its ridership volume.
const MODE_SCALES = {
  total:        { yMax: 1000000, ticks: [0, 200000, 400000, 600000, 800000, 1000000] },
  smartcard:    { yMax: 600000,  ticks: [0, 100000, 200000, 300000, 400000, 500000, 600000] },
  token:        { yMax: 400000,  ticks: [0, 100000, 200000, 300000, 400000] },
  qrWhatsApp:   { yMax: 200000,  ticks: [0, 50000, 100000, 150000, 200000] },
  qrNammaMetro: { yMax: 100000,  ticks: [0, 25000, 50000, 75000, 100000] },
  qrPaytm:      { yMax: 100000,  ticks: [0, 25000, 50000, 75000, 100000] },
  ncmc:         { yMax: 50000,   ticks: [0, 10000, 20000, 30000, 40000, 50000] },
  groupTicket:  { yMax: 50000,   ticks: [0, 10000, 20000, 30000, 40000, 50000] },
};

// The window height in content pixels. The visible y-range depends
// on the current scale: 600K for 1M mode, 400K for token, 200K for
// the smaller methods.
const WINDOW_H = CELL_H;
const PLOT_TOP = 0;

/**
 * @param {HTMLElement} container
 * @param {Array<{date: string, total: number}>} daily
 * @param {{ title?: string, yLabel?: string }} options
 * @returns {{ update, destroy }}
 */
export function renderDowLines(container, daily, options = {}) {
  const { title = 'Ridership by Day of Week & Payment Method' } = options;

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

  // Dynamic y-scale. The content height and yMax change depending on
  // which payment method is hovered, zooming in for smaller methods.
  let currentYMax = 1000000;
  function getContentH(yMax) {
    return Math.max(WINDOW_H, Math.round(WINDOW_H * (yMax / 600000)));
  }
  let currentContentH = getContentH(currentYMax);
  let currentScrollOffset = currentContentH - WINDOW_H;

  function yScale(v) {
    return currentContentH - (v / currentYMax) * currentContentH;
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

  // Two clip paths: one padded for axis ticks (so 0 and 1M labels
  // are not cropped), one strict for data lines (so they can't leak
  // above/below the window and overlap DoW labels).
  const defs = svg.append('defs');
  defs.append('clipPath').attr('id', 'dow-lines-axis-clip')
    .append('rect')
    .attr('x', MARGIN.left - 60)
    .attr('y', PLOT_TOP - CLIP_PAD_TOP)
    .attr('width', gridW + 60)
    .attr('height', cellInnerH + CLIP_PAD_TOP + CLIP_PAD_BOTTOM);
  defs.append('clipPath').attr('id', 'dow-lines-data-clip')
    .append('rect')
    .attr('x', MARGIN.left)
    .attr('y', PLOT_TOP)
    .attr('width', gridW)
    .attr('height', cellInnerH);

  // Axis viewport — padded clip (fixed, never transforms).
  // Axis content inside it transforms on scroll/hover.
  const axisViewport = svg.append('g')
    .attr('class', 'dow-lines__axis-viewport')
    .attr('clip-path', 'url(#dow-lines-axis-clip)');
  const axisContent = axisViewport.append('g')
    .attr('class', 'dow-lines__axis-content')
    .attr('transform', `translate(0, 0)`);

  // --- Y-axis ticks (inside axis content, scroll with it) ---
  const tickFmt = d3.format('~s');
  const axisGroup = axisContent
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${MARGIN.left}, ${PLOT_TOP})`);
  const tickGroup = axisGroup.append('g').attr('class', 'y-axis__ticks');

  function renderTicks(ticks, animated) {
    const sel = tickGroup.selectAll('g.y-axis__tick').data(ticks, (d) => d);
    const enter = sel.enter()
      .append('g')
      .attr('class', 'y-axis__tick')
      .style('opacity', animated ? 0 : 1)
      .attr('transform', (d) => `translate(0, ${yScale(d)})`);
    enter.append('line')
      .attr('x1', -6).attr('x2', 0)
      .attr('stroke', 'rgba(0, 0, 0, 0.2)')
      .attr('vector-effect', 'non-scaling-stroke');
    enter.append('text')
      .attr('x', -10)
      .attr('y', 3)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', 'var(--muted)');

    const merged = enter.merge(sel);
    merged.select('text').text(tickFmt);
    if (animated) {
      merged.transition().duration(600)
        .style('opacity', 1)
        .attr('transform', (d) => `translate(0, ${yScale(d)})`);
    } else {
      merged.attr('transform', (d) => `translate(0, ${yScale(d)})`);
    }
    sel.exit()
      .transition().duration(300)
      .style('opacity', 0)
      .remove();
  }

  renderTicks(MODE_SCALES.total.ticks, false);

  // Data viewport — strict clip (fixed, never transforms).
  // Data content inside it transforms on scroll/hover.
  const dataViewport = svg.append('g')
    .attr('class', 'dow-lines__data-viewport')
    .attr('clip-path', 'url(#dow-lines-data-clip)');
  const contentGroup = dataViewport.append('g')
    .attr('class', 'dow-lines__content')
    .attr('transform', `translate(0, 0)`);

  // --- Cells with lines (inside data content, scroll with it) ---
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
      .attr('y1', (d) => yScale(d.value))
      .attr('y2', (d) => yScale(d.value))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .each(function () { totalLines.push(this); });

    // Payment-method lines — coloured, visible by default at reduced opacity.
    CHANNELS.forEach((m) => {
      const modeKey = m.key;
      gCell
        .selectAll(`.mode-line-${modeKey}`)
        .data(s.values)
        .join('line')
        .attr('class', `dow-lines__mode-line mode-${modeKey}`)
        .attr('x1', 0)
        .attr('x2', cellInnerW)
        .attr('y1', (d) => yScale(d.modes.find((md) => md.mode === modeKey).value))
        .attr('y2', (d) => yScale(d.modes.find((md) => md.mode === modeKey).value))
        .attr('stroke', m.color)
        .attr('stroke-width', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('opacity', 1)
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

  // Brief description below the legend.
  const descEl = document.createElement('p');
  descEl.className = 'dow-lines__desc';
  descEl.textContent = 'Each line is one week. Click a payment method to isolate and zoom. Scroll to explore the full range. Click outside to reset.';
  container.appendChild(descEl);

  let currentMode = null;
  let currentScroll = 0;
  const TRANSITION_MS = 600;

  // --- Smooth scroll engine ---
  // rAF-based easing toward a target offset. Gives momentum-like
  // smooth scrolling similar to native page scroll.
  let scrollTarget = 0;
  let scrollRAF = null;

  function clampScroll(v) {
    return Math.max(-currentScrollOffset, Math.min(0, v));
  }

  function applyScroll(v) {
    currentScroll = v;
    const tf = `translate(0, ${v})`;
    contentGroup.attr('transform', tf);
    axisContent.attr('transform', tf);
  }

  function scrollTick() {
    scrollRAF = null;
    const diff = scrollTarget - currentScroll;
    if (Math.abs(diff) < 0.3) {
      applyScroll(scrollTarget);
      return;
    }
    applyScroll(currentScroll + diff * 0.18);
    scrollRAF = requestAnimationFrame(scrollTick);
  }

  function smoothScrollTo(target) {
    scrollTarget = clampScroll(target);
    if (!scrollRAF) scrollRAF = requestAnimationFrame(scrollTick);
  }

  // Animated scroll for hover transitions (uses d3 transition).
  function animatedScrollTo(target) {
    if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
    scrollTarget = clampScroll(target);
    const start = clampScroll(currentScroll);
    const end = scrollTarget;
    const ease = d3.easeCubicInOut;
    const t0 = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - t0) / TRANSITION_MS);
      applyScroll(start + (end - start) * ease(t));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Wheel handler — only intercepts when the cursor is inside the
  // chart window. Outside the window, normal page scroll continues.
  const windowBorder = svg.select('.dow-lines__window-border');
  container.addEventListener('wheel', (e) => {
    if (currentMode !== null) return;
    // Check if cursor is inside the window rect.
    const wbRect = windowBorder.node().getBoundingClientRect();
    if (e.clientX < wbRect.left || e.clientX > wbRect.right ||
        e.clientY < wbRect.top || e.clientY > wbRect.bottom) {
      return; // let the page scroll naturally
    }
    e.preventDefault();
    const delta = e.deltaY * 0.5;
    smoothScrollTo(scrollTarget - delta);
  }, { passive: false });

  // Drag handler.
  let dragStartY = null;
  let dragStartScroll = 0;
  svg.on('mousedown', (event) => {
    if (currentMode !== null) return;
    // Only start drag if mousedown is inside the window rect.
    const wbRect = windowBorder.node().getBoundingClientRect();
    if (event.clientX < wbRect.left || event.clientX > wbRect.right ||
        event.clientY < wbRect.top || event.clientY > wbRect.bottom) {
      return;
    }
    if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
    dragStartY = event.clientY;
    dragStartScroll = currentScroll;
    svg.style('cursor', 'grabbing');
  });
  d3.select(window).on('mousemove.dowline', (event) => {
    if (dragStartY === null) return;
    const dy = event.clientY - dragStartY;
    const svgRect = svg.node().getBoundingClientRect();
    const scale = VIEWBOX_HEIGHT / svgRect.height;
    const next = clampScroll(dragStartScroll + dy * scale);
    scrollTarget = next;
    applyScroll(next);
  });
  d3.select(window).on('mouseup.dowline', () => {
    if (dragStartY === null) return;
    dragStartY = null;
    svg.style('cursor', 'grab');
  });
  svg.style('cursor', 'grab');

  let prevMode = null;

  function applyScale(newYMax, newTicks) {
    if (currentYMax === newYMax) return;
    currentYMax = newYMax;
    currentContentH = getContentH(newYMax);
    currentScrollOffset = currentContentH - WINDOW_H;

    // Animate all line positions to the new scale.
    d3.selectAll(totalLines)
      .transition('pos').duration(600)
      .attr('y1', (d) => yScale(d.value))
      .attr('y2', (d) => yScale(d.value));
    Object.keys(modeLines).forEach((key) => {
      d3.selectAll(modeLines[key])
        .transition('pos').duration(600)
        .attr('y1', (d) => yScale(d.modes.find((md) => md.mode === key).value))
        .attr('y2', (d) => yScale(d.modes.find((md) => md.mode === key).value));
    });

    // Update ticks with animation.
    renderTicks(newTicks, true);
  }

  function selectLegendItem(key) {
    legendEl.querySelectorAll('.treemap-legend__item').forEach((el) => {
      const elKey = el.getAttribute('data-key');
      const label = el.querySelector('.treemap-legend__label');
      if (elKey === key) {
        const chan = CHANNELS.find((c) => c.key === key);
        const bg = chan ? chan.color : '#000';
        el.style.background = bg;
        label.style.color = '#fff';
      } else {
        el.style.background = '';
        const chan = CHANNELS.find((c) => c.key === elKey);
        label.style.color = chan ? chan.color : '#000';
      }
    });
  }

  function enterMode(modeKey) {
    if (currentMode === modeKey) return;
    prevMode = currentMode;
    currentMode = modeKey;
    selectLegendItem(modeKey);

    const scale = MODE_SCALES[modeKey] || MODE_SCALES.total;

    if (modeKey === 'total') {
      applyScale(scale.yMax, scale.ticks);
      animatedScrollTo(0);
      d3.selectAll(totalLines).transition('opacity').duration(600).style('opacity', 1);
      Object.keys(modeLines).forEach((key) => {
        const wasPrev = key === prevMode;
        d3.selectAll(modeLines[key])
          .transition('opacity').delay(wasPrev ? 400 : 0).duration(wasPrev ? 800 : 600)
          .style('opacity', 0);
      });
    } else {
      applyScale(scale.yMax, scale.ticks);
      if (scale.yMax >= 1000000) {
        animatedScrollTo(-currentScrollOffset);
      } else {
        animatedScrollTo(0);
      }
      d3.selectAll(totalLines).transition('opacity').duration(600).style('opacity', 0);
      Object.keys(modeLines).forEach((key) => {
        if (key === modeKey) {
          d3.selectAll(modeLines[key])
            .transition('opacity').duration(600)
            .style('opacity', 1);
        } else if (key === prevMode) {
          d3.selectAll(modeLines[key])
            .transition('opacity').delay(400).duration(800)
            .style('opacity', 0);
        } else {
          d3.selectAll(modeLines[key])
            .transition('opacity').duration(600)
            .style('opacity', 0);
        }
      });
    }
  }

  function exitMode() {
    if (currentMode === null) return;
    currentMode = null;
    selectLegendItem(null);
    // Restore scale to 1M.
    applyScale(MODE_SCALES.total.yMax, MODE_SCALES.total.ticks);
    // Restore all lines to full visibility.
    d3.selectAll(totalLines).transition('opacity').duration(TRANSITION_MS).style('opacity', 1);
    Object.keys(modeLines).forEach((key) => {
      d3.selectAll(modeLines[key]).transition('opacity').duration(TRANSITION_MS).style('opacity', 1);
    });
  }

  // Build legend items — "Total" first, then payment channels.
  const legend = d3.select(legendEl);

  // "Daily Totals" item — black label, shows total ridership.
  const totalItem = legend.append('div')
    .attr('class', 'treemap-legend__item')
    .attr('data-key', 'total')
    .style('cursor', 'pointer');
  totalItem.append('span')
    .attr('class', 'treemap-legend__label')
    .style('color', '#000')
    .text('Daily Totals');
  totalItem.append('span').attr('class', 'treemap-legend__pct');
  totalItem.on('click', () => {
    if (currentMode === 'total') exitMode();
    else enterMode('total');
  });

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
    item.on('click', () => {
      if (currentMode === c.key) exitMode();
      else enterMode(c.key);
    });
  });

  // Click outside chart SVG and legend to deselect.
  const svgEl = svg.node();
  function onDocClick(e) {
    if (currentMode === null) return;
    if (svgEl.contains(e.target) || legendEl.contains(e.target)) return;
    exitMode();
  }
  document.addEventListener('click', onDocClick);

  function update() {}

  function destroy() {
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    document.removeEventListener('click', onDocClick);
    svg.remove();
    legendEl.remove();
    descEl.remove();
    d3.select(window).on('mousemove.dowline', null);
    d3.select(window).on('mouseup.dowline', null);
  }

  return { update, destroy };
}
