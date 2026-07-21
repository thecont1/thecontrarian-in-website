// viz/dow-mode-table.js — DOW × payment-method ridership statistics table.
//
// Renders a semantic HTML <table> built with D3 from the `dow-mode-stats.json`
// payload. Rows = Monday..Sunday (index 0..6), columns = each payment channel
// plus the total. Each cell shows mean ± sample std (rounded). The "Total"
// column is emphasised as a summary rail; weekend rows (Sat/Sun) are tinted to
// echo the "three traffic bands" framing in chapter 4's narrative.
//
// This is a static reference table — no scroll-driven update. The chapter
// mounts it once on first reveal.

import * as d3 from 'd3';

/** Format an integer-ish value with thousands separators. */
function fmtNum(v) {
  return d3.format(',d')(Math.round(v));
}

/**
 * @param {HTMLElement} container  The .viz slot element.
 * @param {object} stats          The parsed dow-mode-stats.json payload.
 * @param {object} [options]
 * @param {string} [options.caption] Optional <caption> for the table.
 */
export function renderDowModeTable(container, stats, options = {}) {
  const { caption } = options;
  const { modes, modeLabels, rows } = stats;

  // Clear any prior content (idempotent re-mount).
  d3.select(container).selectAll('*').remove();

  const wrap = d3.select(container).append('div').attr('class', 'dow-mode-table-wrap');

  const table = wrap.append('table').attr('class', 'dow-mode-table');

  if (caption) {
    table.append('caption').text(caption);
  }

  // --- Header: two rows. Row 1 groups channels into "Payment method" +
  // "Total"; row 2 lists each column. A <colgroup> lets us style the Total
  // column distinctly without per-cell classes.
  const colgroup = table.append('colgroup');
  colgroup.append('col').attr('class', 'dow-mode-table__col-dow');
  for (const m of modes) {
    colgroup.append('col').attr('class', `dow-mode-table__col dow-mode-table__col--${m}`);
  }

  const thead = table.append('thead');
  const headRow = thead.append('tr');
  headRow.append('th')
    .attr('rowspan', 1)
    .attr('scope', 'col')
    .attr('class', 'dow-mode-table__th-dow')
    .text('Day of week');

  for (const m of modes) {
    headRow.append('th')
      .attr('scope', 'col')
      .attr('class', `dow-mode-table__th dow-mode-table__th--${m}${m === 'total' ? ' is-total' : ''}`)
      .text(modeLabels[m] ?? m);
  }

  // Sub-header row: mean / std hint, kept compact.
  const subRow = thead.append('tr').attr('class', 'dow-mode-table__subhead');
  subRow.append('th').attr('scope', 'col').attr('class', 'dow-mode-table__th-dow').text('n = days');
  for (const m of modes) {
    subRow.append('th')
      .attr('scope', 'col')
      .attr('class', `dow-mode-table__th dow-mode-table__th--${m}${m === 'total' ? ' is-total' : ''}`)
      .html('<span class="dow-mode-table__unit">mean ± std</span>');
  }

  // --- Body ---
  const tbody = table.append('tbody');
  const tr = tbody.selectAll('tr')
    .data(rows)
    .join('tr')
    .attr('class', (d) => `dow-mode-table__row dow-mode-table__row--${d.dowName.toLowerCase()}`)
    .classed('is-weekend', (d) => d.dow === 5 || d.dow === 6)
    .classed('is-sunday', (d) => d.dow === 6);

  // First cell: DOW name + observed-day count.
  tr.append('th')
    .attr('scope', 'row')
    .attr('class', 'dow-mode-table__th-dow')
    .html((d) => `<span class="dow-mode-table__dow">${d.dowName}</span><span class="dow-mode-table__n">n=${d.n}</span>`);

  // One cell per mode.
  for (const m of modes) {
    tr.append('td')
      .attr('class', `dow-mode-table__cell dow-mode-table__cell--${m}${m === 'total' ? ' is-total' : ''}`)
      .html((d) => {
        const v = d[m];
        if (!v) return '';
        return `<span class="dow-mode-table__mean">${fmtNum(v.mean)}</span>` +
               `<span class="dow-mode-table__sep"> ± </span>` +
               `<span class="dow-mode-table__std">${fmtNum(v.std)}</span>`;
      });
  }

  function destroy() {
    d3.select(container).selectAll('*').remove();
  }

  return { destroy };
}
