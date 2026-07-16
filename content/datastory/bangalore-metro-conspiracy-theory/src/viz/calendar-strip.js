// viz/calendar-strip.js — Calendar grid viz for Chapter 1.
//
// Layout: a 7-row × N-week calendar grid.
//   - Rows = days of the week. Mon at the top, Sun at the bottom.
//   - Columns = weeks. The first column starts on the Monday on or
//     before the editorial window's start date; the last column ends
//     on the Sunday on or after the end date.
//   - Each cell = a single day. Cells outside the editorial window
//     are rendered empty (no fill, no border, no X). Cells inside
//     the window that BMRCL didn't publish are rendered with a
//     faint placeholder background and a visible X. Reported cells
//     are coloured by total ridership on a sequential Namma Metro
//     purple scale.
//
// Hover: a confident popover appears above (or below, for top rows)
// the cell, showing the human-readable date, the day's value, and
// a single vertical bar on a 0…max+10% bar chart.
//
// Scroll integration: progress ∈ [0, 1] reveals rows top-to-bottom.
// Row 0 (Mon) starts revealing at progress = 0; row 6 (Sun) finishes
// at progress = 1.

import * as d3 from 'd3';

const CELL = 22;            // px per cell side
const GAP = 3;              // px between cells
const LABEL_WIDTH = 36;     // px reserved on the left for day-of-week labels
const ROWS = 7;             // Mon, Tue, Wed, Thu, Fri, Sat, Sun
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Namma Metro purple scale — light lavender to deep BMRCL purple.
const PURPLE_LIGHT = '#f0e6f7';
const PURPLE_DARK = '#5E2D8C';

// Padding for the X mark inside missing cells.
const X_PAD = 6;
const X_STROKE = 'rgba(0, 0, 0, 0.42)';
const X_WIDTH = 1.4;

const COLORS = {
  missingFill: 'rgba(0, 0, 0, 0.08)',     // visible-but-quiet background for missing days
  reportedStroke: 'rgba(0, 0, 0, 0.18)',
  missingStroke: 'rgba(0, 0, 0, 0.12)',
  text: 'var(--muted)',
};

const TIP_GAP = 8;        // px gap between cell and tooltip
const TIP_CELL_OFFSET = CELL + TIP_GAP;  // 30px — used when tooltip sits below

/**
 * Build the calendar grid. Returns the SVG and an `update` function.
 */
export function renderCalendarStrip(container, daily, window) {
  const { startDate, endDate } = window;

  // 1. Index daily by ISO date for O(1) lookup
  const byDate = new Map(daily.map((d) => [d.date, d]));

  // 2. Find the Monday on or before the start, and the Sunday on or
  //    after the end. The calendar grid spans this range so the
  //    visualisation always starts on a Monday and ends on a Sunday.
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDow = start.getDay();
  const endDow = end.getDay();
  const daysSinceMonday = (startDow + 6) % 7;
  const daysUntilSunday = (7 - endDow) % 7;
  const firstMonday = new Date(start.getTime() - daysSinceMonday * 86400000);
  const lastSunday = new Date(end.getTime() + daysUntilSunday * 86400000);

  // 3. Build the cell list.
  const totalDays = Math.round((lastSunday - firstMonday) / 86400000) + 1;
  const numWeeks = totalDays / 7;
  const cells = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(firstMonday.getTime() + i * 86400000);
    const col = Math.floor(i / 7);
    const row = i % 7;
    const iso = d.toISOString().slice(0, 10);
    const inRange = d >= start && d <= end;
    const reported = inRange && byDate.has(iso);
    cells.push({
      date: d,
      iso,
      col,
      row,
      inRange,
      reported,
      total: byDate.get(iso)?.total ?? null,
    });
  }

  // 4. Colour scale and the chart's max for the tooltip (max + 10%).
  const maxReported = d3.max(daily, (d) => d.total) ?? 0;
  const chartMax = maxReported * 1.1;
  const color = d3
    .scaleLinear()
    .range([PURPLE_LIGHT, PURPLE_DARK])
    .domain([0, maxReported || 1]);

  // 5. SVG dimensions
  const WIDTH = LABEL_WIDTH + numWeeks * (CELL + GAP);
  const HEIGHT = ROWS * (CELL + GAP);

  // 6. Build the SVG
  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'calendar-svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label',
      'Calendar of reported ridership days. Rows are days of the week from Monday (top) to Sunday (bottom). ' +
      'Cells coloured by total ridership on a Namma Metro purple scale.'
    )
    .style('width', '100%')
    .style('height', 'auto')
    .style('font-family', 'var(--font-mono)');

  // 7. Y-axis labels (Mon, Tue, ...). Always visible.
  svg
    .selectAll('text.label')
    .data(DOW_LABELS)
    .join('text')
    .attr('class', 'label')
    .attr('x', 0)
    .attr('y', (_, i) => i * (CELL + GAP) + CELL * 0.72)
    .attr('font-size', 9)
    .attr('font-weight', 400)
    .attr('fill', COLORS.text)
    .attr('letter-spacing', '0.04em')
    .text((d) => d);

  // 8. Cells. Initial state: invisible. The update() below reveals them
  //    row by row, top to bottom.
  const groups = svg
    .selectAll('g.cell')
    .data(cells)
    .join('g')
    .attr('class', 'cell')
    .attr('transform', (d) => `translate(${LABEL_WIDTH + d.col * (CELL + GAP)}, ${d.row * (CELL + GAP)})`)
    .attr('tabindex', (d) => (d.inRange ? 0 : -1))    // focusable for keyboard nav
    .attr('opacity', 0);

  // 8a. The cell rectangle.
  //     - Reported: filled with the ridership colour, dark border
  //     - Missing (in range, not reported): faint fill, faint border, X mark drawn next
  //     - Outside: NO fill, NO border, NO X (truly empty)
  groups
    .append('rect')
    .attr('width', CELL)
    .attr('height', CELL)
    .attr('fill', (d) => {
      if (d.reported) return color(d.total);
      if (d.inRange) return COLORS.missingFill;
      return 'none';
    })
    .attr('stroke', (d) => {
      if (!d.inRange) return 'none';
      return d.reported ? COLORS.reportedStroke : COLORS.missingStroke;
    })
    .attr('stroke-width', (d) => (d.inRange ? 0.5 : 0))
    .attr('rx', 1);

  // 8b. The X mark on missing cells.
  groups
    .filter((d) => d.inRange && !d.reported)
    .append('g')
    .attr('class', 'missing-x')
    .each(function () {
      const g = d3.select(this);
      g.append('line')
        .attr('x1', X_PAD).attr('y1', X_PAD)
        .attr('x2', CELL - X_PAD).attr('y2', CELL - X_PAD)
        .attr('stroke', X_STROKE)
        .attr('stroke-width', X_WIDTH)
        .attr('stroke-linecap', 'round');
      g.append('line')
        .attr('x1', CELL - X_PAD).attr('y1', X_PAD)
        .attr('x2', X_PAD).attr('y2', CELL - X_PAD)
        .attr('stroke', X_STROKE)
        .attr('stroke-width', X_WIDTH)
        .attr('stroke-linecap', 'round');
    });

  // 8c. Native a11y title (announced on focus / hover)
  groups.append('title').text((d) => {
    if (d.reported) return `${d.iso} — ${d.total.toLocaleString('en-IN')} riders`;
    if (d.inRange) return `${d.iso} — not reported`;
    return '';
  });

  // 9. Tooltip — a sibling div inside the .viz container, positioned
  //    absolutely. The container has position: relative (set in CSS).
  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'cal-tooltip')
    .style('display', 'none');

  const tipDate = tooltip.append('div').attr('class', 'cal-tooltip__date');
  const tipValue = tooltip.append('div').attr('class', 'cal-tooltip__value');
  const tipChart = tooltip.append('div').attr('class', 'cal-tooltip__chart');
  const tipBarContainer = tipChart
    .append('div')
    .attr('class', 'cal-tooltip__bar-container');
  const tipBar = tipBarContainer
    .append('div')
    .attr('class', 'cal-tooltip__bar');
  const tipScale = tipChart.append('div').attr('class', 'cal-tooltip__scale');
  tipScale.append('span').attr('class', 'cal-tooltip__scale-min').text('0');
  tipScale
    .append('span')
    .attr('class', 'cal-tooltip__scale-max')
    .text(formatRiders(chartMax));

  function formatRiders(v) {
    return v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' riders';
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // 9a. Hover handlers.
  //    The tooltip is shown immediately on mouseenter / focus, but
  //    hidden with an 80ms delay on mouseleave / blur. The delay lets
  //    the user drag the mouse across a row of cells (including the
  //    gaps between them) without the tooltip vanishing. If the mouse
  //    enters another cell within the delay, the hide is cancelled
  //    and the tooltip just updates its content for the new cell.
  let hideTimeout = null;
  const HIDE_DELAY_MS = 80;

  function showTooltip() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }
  function scheduleHide() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      tooltip.style('display', 'none');
      hideTimeout = null;
    }, HIDE_DELAY_MS);
  }

  groups
    .on('mouseenter focus', function (event, d) {
      if (!d.inRange) return;  // outside cells: nothing to show

      showTooltip();  // cancel any pending hide

      tipDate.text(formatDate(d.iso));

      if (d.reported) {
        tipValue.text(formatRiders(d.total));
        const heightPct = (d.total / chartMax) * 100;
        tipBar
          .style('height', heightPct + '%')
          .style('background', PURPLE_DARK)
          .style('opacity', 1);
      } else {
        tipValue.text('Not reported by BMRCL');
        tipBar
          .style('height', '4%')
          .style('background', 'rgba(0,0,0,0.18)')
          .style('opacity', 1);
      }

      // Position above the cell, falling back to below for top rows
      const cellRect = this.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const cellCenterX = cellRect.left - containerRect.left + cellRect.width / 2;
      const cellTop = cellRect.top - containerRect.top;

      tooltip
        .style('left', cellCenterX + 'px')
        .style('top', cellTop + 'px')
        .style('display', 'block');

      // After display, measure the tooltip and decide above/below
      const tipRect = tooltip.node().getBoundingClientRect();
      const tipHeight = tipRect.height;
      const needBelow = cellTop < tipHeight + TIP_CELL_OFFSET;
      tooltip.classed('cal-tooltip--below', needBelow);
    })
    .on('mouseleave blur', scheduleHide);

  // 10. Scroll-driven reveal: rows top to bottom.
  function update(progress) {
    for (let row = 0; row < ROWS; row++) {
      const rowStart = row / ROWS;
      const rowEnd = (row + 1) / ROWS;
      const rowProgress = Math.max(0, Math.min(1, (progress - rowStart) / (rowEnd - rowStart)));
      groups
        .filter((d) => d.row === row)
        .attr('opacity', rowProgress);
    }
  }

  function destroy() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    svg.remove();
    tooltip.remove();
  }

  return { update, destroy };
}

/** Utility: get the editorial window from a daily array. */
export function extractWindow(daily) {
  const dates = daily.map((d) => new Date(d.date)).sort((a, b) => a - b);
  return { startDate: dates[0], endDate: dates[dates.length - 1] };
}
