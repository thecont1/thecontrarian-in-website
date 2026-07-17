# Changelog

## v0.21 — Treemap: hover-only date selector with box around hovered day (2026-07-18)

The treemap's day selector strips out click-to-select and treats hover as the only selection interaction. The chart follows the cursor (already the v0.17 behavior) and a 0.5px black box now draws around the hovered row's chip (square + date label), so the "this is the day the chart is currently showing" marker is unambiguous and follows the mouse as the user sweeps across the 7 days.

### What changed

- **Click and keydown handlers removed.** The day rows are no longer interactive in the keyboard / touch sense — there's no `role="button"`, no `tabindex`. Hover is the only selection interaction. The chart already follows the cursor (v0.17), so click didn't add anything that hover wasn't already doing.
- **Box around the hovered row.** The 0.5px black border + pale ink background that previously required the `--active` class (set by click) is now driven by CSS `:hover`. The box wraps the entire chip — the 22×22 percentile-coloured square AND the two-line date label — so the selection reads as a single bounded unit, not a square with a label hanging off it.
- **`.treemap-day-row--active` class removed.** The class and its styles are gone from both the JS (no more `updateSelector`, no more `selectedDay` mutations from click) and the CSS (no more `--active` block). The CSS :hover state is the only selection state.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/treemap.js` — removed the `click` and `keydown` handlers from `dayRows`; removed `role="button"` and `tabindex=0`; removed the `updateSelector` function and its call; the `selectedDay` variable is still used for the initial `renderDay` call but is no longer mutated by user interaction.
- `packages/scrollytelling-core/styles/scrolly.css` — `.treemap-day-row--active` rules removed; the `.treemap-day-row:hover` block now draws the 0.5px black border + pale ink background; the hover rule's comment updated to reflect "hover is the only selection state".

## v0.20 — Treemap: revert rectangle tints back to paper (2026-07-18)

Reverts the v0.18 tinted-rectangle change. The treemap rectangles are back to a flat paper base, with the icon pattern (in the channel's full saturation) carrying the mode identity on its own. After sitting with the tinted base for a beat, the user decided the seven competing colour blocks were too busy — the icons alone are enough, and the paper base keeps the chart reading as a single neutral surface.

### What changed

- **Rectangle base: paper, not a light tint.** `segment-base` fill is back to `var(--paper, #f7f3ee)`. The `bgColor` precomputation (`d3.interpolateRgb(paper, channelColor)(0.12)`) is gone, the `BG_TINT` and `TREEMAP_PAPER` constants are gone, and the per-channel `bgColor` field is gone. Each rectangle is now a paper-coloured card with the channel's icon pattern in its full brand colour, no tinted base getting in the way.
- **Channel identity via icons alone.** The legend's `treemap-legend__label` is still rendered in the channel's full saturation (so the colour cue is preserved in the legend column), and the icon pattern inside each rectangle is still in the channel's full colour (so the rectangles read as "this is the smartcard area", "this is the token area", etc.). The reader gets the channel identity from the icons; the base stays neutral.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/treemap.js` — `segment-base` fill: `d.data.bgColor` → `var(--paper, #f7f3ee)`. Removed: `TREEMAP_PAPER` and `BG_TINT` constants; the `for (const c of CHANNELS) c.bgColor = ...` precomputation loop; the `bgColor` field on each channel. Doc comment on `CHANNELS` updated to reflect the single-colour model.

## v0.19 — Calendar reveal: restore fade-in-from-zero (2026-07-18)

Reverts the v0.15 baseline-opacity change on the calendar cells. The cells now start at `opacity: 0` and the scroll-reveal ramps each row from 0 → 1.0 (the v0.14 behavior). The v0.15 baseline of 0.35 was a guardrail against a different bug — the treemap TDZ, which was killing the chapter mount and leaving the calendar's ScrollTrigger uncreated. That bug is fixed in v0.15 (chapter mount is now try/catch around the treemap, so the calendar always gets a working trigger). With the TDZ fixed, the calendar's reveal works reliably, and the baseline 0.35 is no longer needed — and was getting in the way of the editorial intent: the calendar is the chapter's central visualisation, and a true fade-in-from-zero reveal is what makes the 191 days feel like a sequence the reader is being walked through, not a wall of cells to parse at once.

### What changed

- **Cells initial opacity 0.35 → 0.** The chart is genuinely invisible before the scroll-reveal starts; the reveal is a real fade-in, not a dim-to-bright transition. The TDZ fix from v0.15 is preserved: the chapter mount's `try/catch` around `renderTreemap` ensures the calendar's `ScrollTrigger` always gets created, so the reveal fires reliably.
- **Per-row opacity ramp 0.35 → 1.0 → 0 → 1.0.** The scroll-reveal's per-row opacity is now `rowProgress` (the v0.14 behavior), not `0.35 + rowProgress * 0.65` (the v0.15 behavior). A row that hasn't been scrolled into view is at opacity 0; a row that has been fully scrolled past is at opacity 1.0; rows in between are at intermediate values.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/calendar-strip.js` — `groups.attr('opacity', 0.35)` → `0`; `BASE_OPACITY` constant and the per-row `0.35 + rowProgress * 0.65` formula reverted to plain `rowProgress`; the `BASE_OPACITY` constant removed.

## v0.18 — Treemap: tinted rectangles, no hover tooltip (2026-07-18)

Two small visual changes to the Ch 1 treemap, both in service of "the rectangles are the message".

### What changed

- **Rectangles get a tinted base.** Each treemap rectangle's `segment-base` fill is now a light tint of the channel's own colour (12% channel + 88% paper, mixed in linear-RGB space via `d3.interpolateRgb`). Smart Card is a pale violet, Tokens a pale tan, Whatsapp / Metro QR / Paytm a pale orange, NCMC a pale maroon, Group Ticket a pale gold. The icon pattern still renders on top in the channel's full saturation, so each rectangle is double-coded: tinted base + saturated icons. The reader can identify each mode at a glance from the colour alone, even before consulting the legend. The legend labels are unchanged (still rendered in the channel's full saturation, for visual weight in the legend column).
- **No more hover tooltip on the day rows.** The v0.17 tooltip was a 340px-tall white card with date / value / bar / min-med-max reference lines, hanging off the LEFT of the cursor. It looked great on the calendar cells, but inside the treemap it covered the rectangles — its only "good" place to hang was inside the chart, where it sat on top of the data. Gone. The day-row hover now does ONE thing: morphs the treemap to the hovered day's mix. The day label (`Mon / Dec 08`) and the rectangle's tinted base already read as "what day / what mode"; a popup would only duplicate what's visible. The tooltip is deleted entirely — DOM construction, `showDayTip` / `hideDayTip` / `positionTip`, the `.cal-tooltip--left` CSS modifier, and the `formatDatePartsLong` / `valueToPct` helpers are all gone. The `tip.remove()` in `destroy()` is gone too.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/treemap.js` — `CHANNELS` now has a `bgColor` field precomputed at module init via `d3.interpolateRgb(paper, c.color)(0.12)`. `segment-base` fill: `var(--paper, #f7f3ee)` → `d.data.bgColor`. Removed: the entire tooltip DOM construction, `showDayTip` / `hideDayTip` / `positionTip`, `formatDatePartsLong`, `valueToPct`, the `tip.remove()` in `destroy()`, the `mousemove` handler on day rows. Day-row `mouseenter` now only calls `renderDay(d)`.
- `packages/scrollytelling-core/styles/scrolly.css` — removed the `.cal-tooltip--left` CSS modifier (no longer used).

## v0.17 — Treemap: live day preview, calendar tooltip, locked order (2026-07-18)

Three small interaction / visual changes to the Ch 1 treemap.

### What changed

- **Hover a date to preview that day.** Hovering a day in the right-side selector now shows the calendar's big tooltip (date / value / bar with min-med-max reference lines) AND morphs the treemap to that day's payment-mode mix in real time. The chart no longer only updates on click — mouse users get instant feedback as they sweep across the 7 days. Click is preserved as a no-op fallback (the active-row border still appears, marking the day as "locked in" for keyboard / touch users). On mouseleave, the tooltip fades but the chart stays on the last-hovered day — no flicker-back to the previous selection, so the user can keep reading the chart as they move toward the legend or the article body.
- **Calendar tooltip on the day rows.** The day-row hover used to show a tiny two-line dark tooltip ("Sun, Dec 08 / 7.2L riders"). It now shows the same big white card as the calendar's cell hover: full date ("Sunday" / "December 08, 2024"), value, and the bar with the banded percentile background and the min / med / max reference lines. Both popups read as one design language, so the reader recognises the date visualisation immediately regardless of which chart they're hovering. The tooltip hangs to the LEFT of the cursor (anchored via a new `.cal-tooltip--left` CSS modifier that overrides the calendar's `transform: translate(-50%, 0)` to `translate(calc(-100% - 12px), -50%)`) — reads as "label for what I'm pointing at" rather than "popup that pushes the chart aside". Vertical position is clamped to the container's bounds so the tooltip never overflows the top or bottom edge of the treemap's frame.
- **Locked legend + treemap order.** The legend used to sort by descending share of the selected day, and the treemap rectangles followed the same dynamic order. The reader had to re-find each mode in the legend after every hover because the rows reshuffled. The order is now fixed: **Smart Card, Tokens, Whatsapp, Metro QR, Paytm, NCMC, Group Ticket** (top-to-bottom in the legend; same order in the treemap rectangles). `CHANNELS` itself is the canonical sequence; the legend reads it verbatim and the treemap's `.sort((a, b) => a.data.order - b.data.order)` keeps rectangles in the same sequence across days. The reader can scan the legend top-to-bottom and follow the same sequence in the treemap without re-finding each mode.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/treemap.js` — `CHANNELS` array re-ordered to the editorial sequence; new `valueToPct` helper; `renderDay` now sorts by `data.order` instead of value-descending; `updateLegend` reads `CHANNELS` directly (no descending sort); new `formatDatePartsLong` for the long-form tooltip date; new big tooltip DOM (`.cal-tooltip.cal-tooltip--left` with date / value / chart / bar / ref lines / scale) built once and updated on hover; new `showDayTip` / `hideDayTip` / `positionTip` functions with bounds-clamping; day-row handlers reworked — hover drives `renderDay(d)` + `showDayTip`, click drives `selectedDay = d` + `updateSelector` + `renderDay(d)`, mouseleave calls `hideDayTip` only (chart stays on last-hovered day).
- `packages/scrollytelling-core/styles/scrolly.css` — new `.cal-tooltip--left` modifier class with `transform: translate(calc(-100% - 12px), -50%)`; removed the now-unused `.treemap-day-tip` and `.treemap-day-tip--visible` rules (the small dark tooltip is gone).

## v0.16 — Calendar polish: month labels match DOW, tooltip +50%, mean → median (2026-07-18)

Three small visual changes to the Ch 1 calendar, all in service of "the data is the protagonist":

### What changed

- **Month labels match the DOW labels.** The "Nov / Dec / Jan / …" labels above the cells now use the same `font-size: 9`, `font-weight: 400`, AND colour (`var(--muted)`) as the "Mon / Tue / Wed / …" labels in the left gutter — the two read as one labelling language, both axes of the grid. The wider `letter-spacing: 0.22em` (vs 0.04em on the DOW labels) gives the month label just enough breathing room to read as a *section title* rather than a row marker. `LABEL_ROW_HEIGHT` was also bumped from 16 to 24 so the month label has ~14px of clearance above the first cell row (was 5px) — without the extra space, the labels visually fused with the squares below them.
- **Tooltip +50%.** The cell-hover tooltip is now 50% larger across the board: width 200px → 300px, chart 168×130 → 252×195, bar 44px → 66px, base font-size 0.78rem → 1.17rem, all inner font-sizes 1.5x. The bar's 0.5px border and 1px paper padding are bumped to 0.75px / 1.5px so the bar reads as a chunky physical object rather than a thin line. The box-shadow lift grows from 3px to 4px to match the larger scale. The padding inside the tooltip scales with the font (1.25em vertical, 1.5em horizontal), so the proportions stay balanced.
- **Mean → median for the reference line.** The middle reference line in the tooltip chart was `avg` (the dataset's arithmetic mean). It now reads `med` (the dataset's median, the 50th-percentile day). The reasoning: metro ridership is right-skewed (weekend dips + occasional spike days), so the mean gets pulled up by the tails. The median anchors the chart at "what a typical day looks like" — the bar's fill vs the reference line then reads as "normal day" vs "spike day" instead of "below average" vs "above average". This is the rare chart where the *spread* is the story; the median tells the more useful story. The notebook already ships `stats.median` in `daily-stats.json` (802,511 for the Nov 14 → Apr 16 window), so no notebook changes were needed — just the JS / CSS swap.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/calendar-strip.js` — month labels: `font-size: 8` → `9`, `font-weight: 500` → `400`, `fill: var(--muted-2)` → `var(--muted)`, `letter-spacing: 0.05em` → `0.22em`, y baseline adjusted for the new label row height. `LABEL_ROW_HEIGHT` 16 → 24 (more breathing room above the cells). Reference line: `refAvg = stats.mean` → `refMed = stats.median`, label `'avg'` → `'med'`, key `'avg'` → `'med'`.
- `packages/scrollytelling-core/styles/scrolly.css` — tooltip `width: 200px` → `300px`, `padding: 0.85em 1em 0.7em` → `1.25em 1.5em 1em`, `font-size: 0.78rem` → `1.17rem`, `box-shadow: 3px 3px 0` → `4px 4px 0`. Date-dow `1.05rem` → `1.58rem`, date-rest `0.7rem` → `1.05rem`. Value `0.72rem` → `1.08rem`, `margin-bottom: 0.55em` → `0.8em`. Chart `168×130` → `252×195`. Bar-container `border-bottom: 1px` → `1.5px`. Bar `width: 44px` → `66px`, `border: 0.5px` → `0.75px`, `padding: 1px` → `1.5px`. Ref rule `1px` → `1.5px`, ref label `0.58rem` → `0.87rem`, label padding `4px` → `6px`. Scale label `0.62rem` → `0.93rem`, `bottom: 4px` → `6px`. CSS class `.cal-tooltip__ref--avg` renamed to `.cal-tooltip__ref--med`.

## v0.15 — Treemap render fixed (TDZ) + calendar baseline visibility (2026-07-18)

Two regressions from the v0.14 treemap commit, both with the same root cause and the same fix path.

### What changed

- **Treemap: forward-reference TDZ fixed.** The v0.14 `treemap.js` declared `wrapper`, `selectorDays`, and `selectedDay` *after* the d3 selections that referenced them. Because `let`/`const` declarations are not hoisted in the same way as `var`, those references hit the temporal dead zone and `renderTreemap` threw a `ReferenceError` on its first d3 call. The throw happened before the SVG was appended, before the day-selector rows were built, before anything rendered — so the `[data-viz="treemap"]` slot stayed empty. The same throw also aborted `mountCh1OneDay` mid-flow, so the calendar's `ScrollTrigger` was never created either. Net result: the user saw a blank calendar *and* a vanished treemap from a single root cause.
  - **Fix**: the three declarations now sit at the top of `renderTreemap`, right after the colour/bucket constants, before any d3 code runs. The duplicate late declarations are removed.
  - **Defensive**: `mountCh1OneDay` now wraps the `renderTreemap` call in a `try/catch` and creates the bar `ScrollTrigger` only if the treemap actually mounted. If the treemap ever throws again, the calendar still gets its scroll-reveal and the user still sees the calendar. The failed slot shows a one-line "Treemap failed to load" message instead of going silently blank.
- **Calendar: baseline visibility (no more blank before scroll).** The calendar's cells were initialised at `opacity: 0` and only brightened to `1.0` as the user scrolled through the `ScrollTrigger` range (`start: 'top bottom'` → `end: 'top center'`). For any scroll position where the chart's top was below the viewport's bottom (i.e. the user hadn't scrolled to the trigger's start yet), the cells sat at `opacity: 0` and the chart was *literally blank* — every cell invisible, no fill, no border, no label. Combined with the treemap throw killing the chapter mount, the calendar never had a chance to reveal at all.
  - **Fix**: cells now initialise at `opacity: 0.35` instead of `0`. The scroll-reveal's `update()` maps the per-row progress through `0.35 + rowProgress * (1 - 0.35)`, so a row at progress 0 sits at 35% opacity and a row at progress 1 sits at 100%. The chart is now structurally visible the moment it enters the viewport — you can see the grid, the colours, the palette — and the scroll just brightens it. The reveal still has a real arc (a row transitions from 35% → 100% as it scrolls in), it just doesn't start from invisible.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/treemap.js` — moved `wrapper` / `selectorDays` / `selectedDay` declarations to the top of `renderTreemap`; removed the duplicate late declarations.
- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/calendar-strip.js` — initial `attr('opacity', 0.35)` instead of `0`; `BASE_OPACITY = 0.35` constant in `update()`; per-row opacity now `BASE_OPACITY + rowProgress * (1 - BASE_OPACITY)`.
- `content/datastory/bangalore-metro-conspiracy-theory/src/chapters/ch1-one-day.js` — `renderTreemap` wrapped in try/catch; `barTrigger` only created if `barViz` is non-null; cleanup function checks for null `barViz` / `barTrigger` before calling their methods.

## v0.13 — Dynamic bands from the notebook + 1st-below-right + legend filter fix (2026-07-18)

The Ch 1 calendar's bucketing, chart, and legend are now fully data-driven by `daily-stats.json`. The notebook decides the number of bands and the percentile boundaries; the scrolly just maps each day into the pre-computed bands. Two regressions from the v0.12 rewrite are also fixed: the 1st of each new month now lands one cell below and one cell right of the previous month's last day, and the legend hover filter actually isolates the matching cells.

### What changed

- **Dynamic band count from the JSON.** The notebook's `daily-stats.json` now ships 9 percentile boundaries (p2, p5, p10, p25, p50, p75, p90, p95, p98), giving 10 bands. The chart reads them dynamically — sorted by the `p<N>` key, with `BUCKET_COUNT = boundaries.length + 1`. The legend shows 10 stops, the chart's banded background has 10 zones, and the bar fill uses one of 10 colours. The 5 `PURPLE_BUCKETS` anchor colours are interpolated with `d3.interpolateRgbBasis` to produce 10 smooth stops. If the notebook ships 3 boundaries next time, the chart shows 4 bands. If it ships 19, the chart shows 20.
- **1st below and right.** The 1st of each new month sits one cell below and one cell right of the previous month's last day. For Nov → Dec: Nov 30 (Sat) is at row 5 of the last Nov column, Dec 1 (Sun) is at row 6 of the next column. For Dec → Jan: Dec 31 (Tue) is at row 1 of the last Dec column, Jan 1 (Wed) is at row 2 of the next column. The block boundary moves with the month boundary.
- **Legend hover works again.** The legend hover filter was setting `display: none` on non-matching cells, but the scroll-reveal's `opacity: 0` was keeping the matching cells invisible too. The fix: when a legend stop is hovered, `applyFilter` sets BOTH `display: ''` (visible) AND `opacity: 1` (full opacity) on matching cells, regardless of their row's scroll progress. The `update()` function now also forces matching cells to full opacity while `dimActive` is true. When the user moves off the legend, `clearFilter` re-applies the last scroll progress so cells re-appear at the right opacity for the current scroll position.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/calendar-strip.js` — `boundaries` now read from `Object.keys(stats.buckets).sort()`; `BUCKET_COUNT = boundaries.length + 1`; `BAND_COLORS` interpolated from `PURPLE_BUCKETS` via `d3.interpolateRgbBasis`; `bucketForValue` walks the boundaries list (not hardcoded for 4); `color` uses `BAND_COLORS`; legend uses `BAND_COLORS`; tooltip chart gradient uses `BAND_COLORS` and dynamic boundary positions; bar fill uses `BAND_COLORS`; column logic reverted to "no Monday alignment" so the 1st of each new month lands at the right row; `applyFilter`/`clearFilter` for the legend hover (sets `opacity: 1` on matching cells); `lastProgress` tracked so the reveal is restored on filter clear.
- `packages/scrollytelling-core/styles/scrolly.css` — unchanged.

## v0.12 — Month-block columns + tooltip below + smoother transitions (2026-07-17)

Three changes to the Ch 1 calendar's interaction and structure.

### What changed

- **Month-block columns.** The calendar's columns are now aligned to calendar months instead of to Mon–Sun weeks. Each month in the editorial window is a "block": the 1st of the month is the first day in its column, and subsequent columns are 7-day intervals within that month. The last column of a block may be a partial week (if the month doesn't end exactly 6 days after the start of its last full week). The Nov block starts on the editorial start (Mon Nov 11) since the 1st of Nov is before the window; subsequent blocks start on the 1st.
- **No more MONTH_GUTTER.** The wider gap between months is gone. The block structure itself provides the visual separation — each month has its own set of columns with the 1st at the start. For the editorial window Nov 14 → Apr 16 there are 25 columns: 3 (Nov) + 5 (Dec) + 5 (Jan) + 4 (Feb) + 5 (Mar) + 3 (Apr).
- **Tooltip always below.** The tooltip is now always positioned below the hovered cell (was: above by default, falling back to below for the top row). The position is `(cellBottom + 8px)` with `transform: translate(-50%, 0)` so the tooltip's top edge sits at that point.
- **Smoother transitions.** The tooltip's `left` and `top` now have a `0.15s ease-out` transition — as the mouse sweeps from one cell to the next, the tooltip smoothly slides between positions instead of snapping. The bar's height transition is now `0.28s cubic-bezier(0.4, 0, 0.2, 1)` (was `0.18s ease-out`), so the bar grows with a more natural curve.
- **Fade in/out.** The tooltip now has a `0.18s ease-out` opacity transition. It fades in on first show (with a forced reflow to ensure the transition fires) and fades out on hide (with a `transitionend` handler that sets `display: none` only after the fade completes). When the mouse sweeps between cells, the visibility class is not toggled — only the content and position update, so the tooltip stays at full opacity throughout.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/calendar-strip.js` — replaced the Mon–Sun week structure with month-block columns; removed `MONTH_GUTTER`, `monthBreaks`, `numMonthBreaks`, `colGutterOffset`; new `monthBlocks` and `columns` arrays; cell list built from the column list; `WIDTH` no longer has the gutter term; cell transform no longer has `colGutterOffset[d.col]`; tooltip always positioned below with smooth `left`/`top` transitions; `transitionend` listener fades out and sets `display: none`; month labels anchored to the first column of each block.
- `packages/scrollytelling-core/styles/scrolly.css` — `.cal-tooltip` is now `transform: translate(-50%, 0)` (always below) with `opacity: 0` and a `transition: opacity 0.18s ease-out, left 0.15s ease-out, top 0.15s ease-out`; new `.cal-tooltip--visible` class sets `opacity: 1`; removed the `.cal-tooltip--below` rule. `.cal-tooltip__bar-fill` transition is now `height 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.28s ease-out`.

## v0.11 — Calendar month gutter + month labels (2026-07-17)

The Ch 1 calendar's week columns now have a wider horizontal gap (10px vs the regular 3px) when the month changes, and a short month label ("Nov", "Dec", "Jan", …) sits above the first column of each month-block. The user can read the monthly structure at a glance.

### What changed

- **Month gutter.** A column where the Monday is in a different calendar month than the previous column's Monday is a "month break". The first Monday of each new month is pushed right by 10px (`MONTH_GUTTER`) on top of the regular 3px cell-to-cell gap. The cumulative offset per column is precomputed once and added to every cell's `transform`. For the editorial window Nov 16 2024 → Apr 14 2025 there are 5 month breaks: Dec 2, Dec 30, Feb 3, Mar 3, Mar 31. So 6 month-blocks: Nov (3 weeks), Dec (4), Jan (5), Feb (4), Mar (4), Apr (2).
- **Month labels.** A row of short labels above the cells, anchored to the first column of each block: "Nov" above col 0, "Dec" above col 3, "Jan" above col 7, "Feb" above col 12, "Mar" above col 16, "Apr" above col 20. Mono font, 8px, weight 500, `var(--muted-2)` colour — quieter than the cells so they don't compete with the data.
- **`LABEL_ROW_HEIGHT = 16` reserves vertical space** at the top of the SVG. The cells and Y-axis day labels (Mon, Tue, …) are pushed down by that amount. The SVG is now 16px taller; the cell layout is otherwise unchanged.

### How to verify

1. Open the page in a browser. Look at the Ch 1 calendar.
2. The first row of the calendar is now a thin strip of month labels: `Nov` `Dec` `Jan` `Feb` `Mar` `Apr`.
3. Between each block of weeks, there's a slightly wider gap (you can see it by eye).
4. The day labels (Mon, Tue, …) are still on the left, aligned with the first row of cells.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory/src/viz/calendar-strip.js` — `MONTH_GUTTER = 10`, `LABEL_ROW_HEIGHT = 16`, `MONTH_NAMES` constants; `monthBreaks` and `colGutterOffset` computed once after the cell list; `WIDTH` and `HEIGHT` updated; Y-axis day labels and cell `transform` push down by `LABEL_ROW_HEIGHT`; new `monthLabels` array drives a row of `text.month-label` elements anchored to the first column of each block.

## v0.10 — Calendar tooltip: 5 quintile bands, Min/Max from the notebook, visible 1px padding (2026-07-17)

The Ch 1 calendar's tooltip chart and the legend strip now use 5 quintile bands — each band holds ~20% of the days, so the data distributes evenly across the colour scale instead of bunching up in the dark bands. The Min/Max labels in the legend read the dataset's actual extremes (4.0L / 9.1L), and every value on the tooltip (min, max, mean, the 4 quintile boundaries) is pre-computed by the aggregation notebook and shipped in `daily-stats.json`. The bar's 1px padding is now actually visible — the bar is a "track" (full chart height, paper-coloured padding) with a variable-height fill child inside it.

### Why quintile bucketing

The earlier v0.10 used value-based bucketing (5 equal-width bands across the absolute min–max range), but with the data right-skewed toward higher values that put most days in the dark bands. The quintile scheme — 5 equal-count bands at the 20th, 40th, 60th, 80th percentiles — distributes the data evenly: each band holds ~25 of the 123 reported days. The band boundaries are 7.1L, 7.9L, 8.3L, 8.7L.

### What changed

- **Bucketing: quintile, not value-based.** Five equal-count bands at p20, p40, p60, p80. The chart's vertical scale is still `0% = dataMin = 4.0L` and `100% = dataMax = 9.1L`, so the bar's height is still linear in the value range — the bar visually tells you "where in the value range am I?" while its fill tells you "which quintile band am I in?".
- **Notebook outputs `daily-stats.json`.** A new code cell at the end of `scrolly-article/aggregate-scrolly.ipynb` computes the dataset's `min`, `max`, `mean`, and the 4 quintile boundaries from `by_mode['total']` and writes them to `daily-stats.json`. The web app reads this JSON and does **no analytics of its own** — it just maps each day's value into the pre-computed band. Mean, too, is shipped in the JSON so the chart's `avg` reference line doesn't have to be computed client-side.
- **Tooltip chart's banded background: 5 zones at the value-positions of the boundaries.** The zones are not equal-height in the chart — they are positioned at `valueToPct(p20)`, `valueToPct(p40)`, `valueToPct(p60)`, `valueToPct(p80)`. The dataset is right-skewed, so the bottom band (4.0L–7.1L) takes ~60% of the chart height and the top band (8.7L–9.1L) takes ~8%. Each colour band still holds ~20% of the days — the visual height is just a side-effect of the data distribution.
- **Legend: `Min 4.0L` ... `Daily Ridership` ... `Max 9.1L`.** Single row below the 5-stop strip, no tick marks. The Min/Max values are the dataset's actual extremes (from `stats.min` and `stats.max`), not the 10th/90th percentiles that the v0.9 era showed.
- **Bar: track + fill so the 1px padding shows.** The bar element is now a "track" that spans the full chart height, with a 0.5px black border and **1px paper-coloured padding**. The variable-height fill is a child element whose background is the bucket colour. The 1px paper padding is now visibly sandwiched between the bar's border and the fill, so the bar stands off the chart's banded background even when the fill matches the band the value lands in.

### How to verify

1. Open the page in a browser.
2. Hover any reported calendar cell. The tooltip chart shows the bar in the band matching the day's quintile, with a 1px paper gap visible between the bar's black border and the fill.
3. Look below the calendar: the strip has 5 bands, and the row below reads `Min 4.0L` ... `Daily Ridership` ... `Max 9.1L`.
4. The Min reference line sits at the bottom of the chart, the Max line at the top, the Avg line at the dataset's mean (7.8L, ~75% of the chart height).

### Files touched

- **New** `scrolly-article/daily-stats.json` (and `content/datastory/.../public/data/daily-stats.json` after fetch) — `{ min, max, mean, count, bucketCount, buckets: { p20, p40, p60, p80 }, bucketLabels }`. Written by the aggregation notebook.
- **Modified** `scrolly-article/aggregate-scrolly.ipynb` — new code cell at the end computes and writes `daily-stats.json`.
- **Modified** `content/datastory/bangalore-metro-conspiracy-theory/scripts/fetch-data.mjs` — `daily-stats.json` added to the fetch list.
- **Modified** `content/datastory/bangalore-metro-conspiracy-theory/src/data/loaders.js` — `loadDailyStats` accessor.
- **Modified** `content/datastory/bangalore-metro-conspiracy-theory/src/chapters/ch1-one-day.js` — loads stats and passes them to `renderCalendarStrip`.
- **Modified** `content/datastory/bangalore-metro-conspiracy-theory/src/viz/calendar-strip.js` — `renderCalendarStrip(container, daily, window, stats)` now takes the stats object; `bucketForValue` and `valueToPct` use `stats.min` / `stats.max` / `stats.buckets.{p20..p80}` instead of computing; the chart's banded background is positioned at the value-positions of the boundaries; the bar's `avg` reference uses `stats.mean`.

## v0.8 — Bun workspace + @thecontrarian/scrollytelling-core (2026-07-17)

The scrolly project is now a bun workspace member. The reusable parts — motion (image-reveal, scroll-trigger), the footnote popover, and the base styles (reset, typography, scrolly) — live in a sibling package at `packages/scrollytelling-core/` and are imported as `@thecontrarian/scrollytelling-core`. The scrolly directory now holds only the story-specific code: 9 chapter files, 11 viz modules, the data loader, and `main.js` wiring it together.

### Why

Previously, producing another scrolly meant copying the whole project — 27 source files, 3 styles — and then gutting 80% of it. Only ~300 lines were generic (the motion + footnote + base styles); the rest (~2400 lines) was story-specific. Copying everything was the wrong default.

The core is the 300 generic lines. The scrolly is the 2400 story lines. They live in different places now.

### Workspace layout

```
thecontrarian.in-gpt5.2/
  package.json                       (workspaces: ["packages/*", "content/datastory/*"])
  bun.lock                           (workspace lockfile)
  packages/
    scrollytelling-core/
      package.json                   (@thecontrarian/scrollytelling-core)
      README.md
      src/
        index.js                     (barrel re-exports)
        motion/
          image-reveal.js
          scroll-trigger.js
        components/
          footnote.js
      styles/
        index.css                    (re-exports the three below)
        reset.css
        typography.css
        scrolly.css
  content/datastory/
    bangalore-metro-conspiracy-theory/   (story-specific)
      package.json                   ("@thecontrarian/scrollytelling-core": "workspace:*")
      src/
        main.js                      (imports from core)
        chapters/                    (9 story files)
        viz/                         (11 story modules)
        data/loaders.js
      index.html                     (sets --accent-color: #5E2D8C)
```

### Theming

The Namma Metro purple is no longer hardcoded in the core's `scrolly.css`. It now reads `var(--accent-color)` (with `#5E2D8C` as the default). Each scrolly sets this on `:root` in its own `index.html` to match its story's brand. The next scrolly can use a different colour without touching the core.

### Files touched

- **Created** `packages/scrollytelling-core/` — the new shared core
- **Moved** 6 files from the scrolly to the core (3 motion/footnote, 3 styles)
- **Modified** the scrolly's `package.json` to add `"@thecontrarian/scrollytelling-core": "workspace:*"`
- **Modified** the scrolly's `src/main.js` to import CSS and JS from the core
- **Modified** all 9 chapter files to import `{ wireFootnotes, ScrollTrigger, gsap }` from the core
- **Modified** the scrolly's `index.html` — removed the 3 `<link rel="stylesheet" href="/styles/*.css">` tags, added `<style>:root { --accent-color: #5E2D8C; }</style>` for the brand colour
- **Modified** root `package.json` to declare bun workspaces
- **Modified** root `.gitignore` to ignore `content/datastory/*/node_modules/` (bun's per-workspace install)
- **Modified** root `package.json` devDeps — added `unist-util-visit` (the remark plugin's direct dep, no longer hoisted by bun the way npm hoisted it)
- **Bumped** `bun.lock` to the new workspace lockfile

### Bun workspace quirks worth knowing

- Bun's per-workspace installs are local by default. Each member's `node_modules/` has its own copies of overlapping deps. Not a correctness problem, just a disk thing.
- Bun doesn't hoist transitive deps to the root `node_modules/` the way `npm install` did. The `remark-strip-notebook-html.mjs` plugin imports `unist-util-visit` directly, so it's now an explicit root devDep.
- `bun.lock` at the project root is the workspace lockfile. Commit it.

Build verified: 27 pages, 0 warnings, served HTML has `--accent-color` set, title and H1 source from .md. The scrolly's bundle size is essentially unchanged (the core gets bundled into the same single JS/CSS asset).

## v0.7 — Article title now sources from the .md (2026-07-17)

The article's title, meta description, and H1 are no longer hardcoded in `index.html`. They are patched at build time from the .md frontmatter (`title:` and `metaDescription:`), so the .md is the single source of truth for what the article is called.

### What changed

- The previous `<title>` had a format leak: `NammaMetro: The Conspiracy Theory — A scrollytelling investigation`. The "— A scrollytelling investigation" suffix is now gone. The `<title>` is exactly the .md's `title:`.
- The previous `<meta name="description">` had a similar leak: `... Scrollytelling version.`. Now exactly the .md's `metaDescription:`.
- The previous `<h1 class="title">` was `NammaMetro: The Conspiracy Theory 😈` (with the editorial emoji). The .md's title is now `NammaMetro: The Conspiracy Theory 😈` — same emoji, but the .md is the source. Change the .md, the article follows.

### Files touched

- `scripts/build_scrolly.mjs` — new `patchScrollyHtml()` step runs after `vite build`, replaces `<title>`, `<meta name="description">`, and `<h1 class="title">` in the built HTML with the .md's values. `escapeHtml()` handles special characters in attributes.
- `scripts/scaffold-integration.ts` — added a per-scrolly chokidar watcher on the .md file so dev mode re-patches the HTML when the title/description in the .md changes (no manual rebuild needed).
- `content/datastory/bangalore-metro-conspiracy-theory.md` — `title:` updated to `NammaMetro: The Conspiracy Theory 😈` to preserve the H1 emoji (the .md is the source now, so the emoji lives there).
- `content/datastory/bangalore-metro-conspiracy-theory.notebook.html` — deleted. Dead weight: the entry is `format: scrolly`, not notebook. `render_notebook.py` skips scrolly entries and won't regenerate it.

## v0.6 — Architectural refactor: scrolly source colocation, public/ stays clean (2026-07-17)

The scrolly is now fully self-contained: source lives next to the `.md` entry, build output stays in the scrolly's own `dist/`, and **nothing the scrolly produces lands in the Astro project's `public/`**. `public/` is reserved for site assets only — fonts, image archive, `.htaccess`, `_headers`, `ads.txt`, `robots.txt`, `favicon`. No page content.

### Why

The previous design copied the Vite build output into `public/datastory/<slug>/` and let Astro's static file priority serve it directly. Two issues with that: (1) the `index.html` in `public/` was "site content" living in a folder that should only hold assets, and (2) Astro's build emitted a noisy warning about the dynamic route being shadowed by a static file in `public/`. Both are now gone.

### Where things live now

```
content/datastory/
  bangalore-metro-conspiracy-theory.md           # entry
  bangalore-metro-conspiracy-theory/             # scrolly Vite project (source)
    package.json
    vite.config.js
    src/                                          # chapters, viz, motion, components
    public/data/                                  # scrolly's own Vite public (JSONs)
    images/                                       # 13 photo assets
    .gitignore                                    # gitignores dist/ + public/data/*.json
    dist/                                         # Vite build output (gitignored)
      index.html
      assets/
      data/
```

- The scrolly's Vite project sits next to its `.md` entry. `source:` in the frontmatter is now `./bangalore-metro-conspiracy-theory` (relative to the `.md`'s directory).
- Vite's `--base=/datastory/<slug>/` is unchanged — the deployed URL is the same.
- `public/` (at the Astro project root) is now scrolly-free.

### Build pipeline changes

- `scripts/build_scrolly.mjs` no longer copies `dist/*` into `public/`. Vite builds into the scrolly's own `dist/` and stops there.
- `src/pages/datastory/[...slug].astro` now reads `<source>/dist/index.html` (not `public/<baseUrl>/index.html`) and returns it as a `Response`. Astro writes the response body to `dist/datastory/<slug>/index.html`.
- `scripts/scaffold-integration.ts` adds an `astro:build:done` hook that copies the scrolly's `dist/{assets,data}/` into `dist/datastory/<slug>/{assets,data}/` so the bundled JS/CSS and fetched JSONs land alongside the route's HTML.
- `scripts/scaffold-integration.ts` adds an `astro:server:setup` Vite middleware that serves `/datastory/<slug>/<file>` from `<source>/dist/<file>` in dev mode. The dev server then serves both the route's HTML response and the bundled assets without `public/` pollution.

### Other small fixes that came along

- `src/content.config.ts` — the content collection glob was `**/*.{md,mdx}` (recursive). Now `*.{md,mdx}` (top-level only). Without this, the scrolly's own `README.md` was being picked up as a datastory entry and failing schema validation. The new pattern means scrolly subdirectories are properly excluded.
- `.gitignore` — drops `public/datastory/`, adds `content/datastory/*/dist/` and `content/datastory/*/node_modules/` so any scrolly's own build artifacts are ignored at the project level too.
- `remote-only/datastory/` is gone (the live-site mirror dir is back to its original purpose: `.htaccess`, `_headers`, `ads.txt`, `favicon.ico`, `robots.txt` only).
- `remote-only/datastory/bangalore-metro-conspiracy-theory-scrolly/` (the previous-name version with the `-scrolly` suffix) is also gone.

### Files touched

- `content/datastory/bangalore-metro-conspiracy-theory.md` — `source:` updated to relative path
- `content/datastory/bangalore-metro-conspiracy-theory/` (the whole Vite project) — moved from `remote-only/datastory/bangalore-metro-conspiracy-theory/`
- `scripts/build_scrolly.mjs` — drop the dist → public/ copy
- `src/pages/datastory/[...slug].astro` — read from `<source>/dist/index.html`
- `scripts/scaffold-integration.ts` — add `findScrollyEntries()`, `copyScrollyAssets()`, `setupScrollyMiddleware()`, hook them into `astro:build:done` and `astro:server:setup`
- `src/content.config.ts` — glob to top-level only
- `.gitignore` — drop `public/datastory/`, add `content/datastory/*/dist/`

## v0.5 — 50-block reveal, hero excluded, prominent citation title (2026-07-16)

The image reveal is now 50 random blocks (up from 20) with a tighter scroll range. The hero image is excluded from the animation — it loads normally on page load. The citation popover's title is now the visual hero of the card: prominent serif, bold, never truncated.

### Image reveal: 50 blocks, tighter range, hero excluded

- The grid is now **5×10 = 50 blocks** (up from 4×5 = 20). Each block is `background-size: 1000% 500%` with a `background-position` targeting its 1/10 × 1/5 portion. The assembly reads as a finer pixelation — the image looks like it resolves out of a denser grid.
- The trigger end is now **`top 50%`** (was `top 30%`). The reveal completes by the time the top edge of an image reaches 50% of the viewport height, instead of waiting until it's well into view. The 50 blocks share the 90% → 50% scroll range so each gets an equal slice.
- **The hero image is excluded from the animation.** `setupImageReveals()` now targets only `.datastory-photo img`. The hero (`<figure class="datastory-header .hero">`) loads immediately on page load with no mask, no block grid, no scroll trigger. The CSS rule for `.datastory-header .hero img` is just `width: 100%; height: auto; display: block` — no opacity: 0, no `img-reveal` wrapper.

### Citation popover: prominent title, default OG thumbnail

- The article title is now the visual hero of the card. It uses the **Fraunces** display serif at **1.02rem, weight 700, line-height 1.2**, letter-spacing `-0.005em`. It never truncates — wraps freely to up to 2 lines (clamped via `-webkit-line-clamp: 2`).
- When a footnote supplies an `og.image`, that's used as the 64×64 thumbnail. When it doesn't, the popover shows a **default document-icon SVG** drawn in Namma Metro purple (`color-mix(in srgb, #5E2D8C 6%, #fff)` background, `currentColor: #5E2D8C` strokes). The icon is a sheet with three lines and a folded corner — the visual metaphor for "an article". Defined as `DEFAULT_THUMB_SVG` in `src/components/footnote.js`.

### Files touched

- `src/motion/image-reveal.js` — `ROWS = 5`, `COLS = 10`, `REVEAL_END = 'top 50%'`, selector narrowed to `.datastory-photo img`
- `src/components/footnote.js` — `DEFAULT_THUMB_SVG` constant, used when `og.image` is absent
- `styles/scrolly.css` — 5×10 grid template, `background-size: 1000% 500%`, prominent title styles, default-thumb styles

---

## v0.4.6 — Alternating chapter backgrounds (2026-07-16)

Chapters now alternate between **paper white** (odd: 1, 3, 5, 7, 9) and a **very light hint of NammaMetro purple** (even: 2, 4, 6, 8) — a `color-mix(in srgb, #5E2D8C 5%, #fff)` that lands at roughly `#f7f4f9`. Just enough to read as a new section without competing with the content.

### How it works

- Each `.chapter` declares a `--chapter-bg` custom property. The base is `var(--paper)`; `:nth-of-type(even)` overrides it to `var(--chapter-bg-soft)`.
- A `::before` pseudo-element on each chapter is `position: absolute; width: 100vw; transform: translateX(-50%)` so the colour bleeds past the centred 960px content column to the viewport edges. The `::before` carries a 1px hairline `box-shadow` at the top and bottom so adjacent sections meet with a soft rule rather than an abrupt seam.
- `isolation: isolate` on the chapter scopes the `::before`'s `z-index: -1` to the chapter (it doesn't drop behind the page background).
- The `.chapter__title` (sticky) inherits `--chapter-bg` for its own background so the title blends seamlessly into its section — no visible edge where the title meets the section colour.
- `body { overflow-x: hidden }` to prevent horizontal scroll from the `100vw`-wide `::before`.

### Tuning

The purple intensity is a single property on `.chapter`:

```css
--chapter-bg-soft: color-mix(in srgb, #5E2D8C 5%, #fff);
```

Bump the `5%` up for a more visible hint, down to `3%` for even more subtle, or swap `#5E2D8C` for a different brand colour. The override cascades to the title automatically.

---

## v0.4.5 — Block reveal, OpenGraph citations, global counter (2026-07-16)

### Block-based image reveal (20 random blocks)

The reveal effect was a top-to-bottom mask wipe. It's now **20 blocks** fading in **random order** as the user scrolls. Each image is wrapped in a 4×5 grid of divs, each div the same image as `background-image` with `background-size: 500% 400%` and a `background-position` that targets its 1/5 × 1/4 portion. The blocks animate from opacity 0 → 1 in a shuffled order — a different sequence per page load.

The reveal range is the same as the chart triggers: image top at 90% of viewport → image top at 30%. Each of the 20 blocks gets an equal slice of that scroll range. With `scrub: 0.4` the assembly feels unhurried, not jumpy.

The original `<img>` stays in the DOM (opacity 0) for screen readers and to provide the container's aspect ratio. The visible image is the block grid.

### Continuous citation numbering across chapters

`footnote.js` now uses a module-level counter that keeps incrementing across `wireFootnotes` calls. Previously, each chapter started its footnotes at 1, so the 4 footnotes in Ch 8 were numbered 1–4 instead of continuing from where Ch 7 left off. Now the first footnote in the document is "1", the second is "2", …, the 8th (the first in Ch 8) is "8".

`wireFootnotes` also now walks all `.fn-slot` elements in document order each time it's called, so even if a later chapter scrolls into view before an earlier one, the numbering comes out correct.

### OpenGraph in the citation modal

The footnote popover used to show only a title, optional quote, and "View source →" link — sparse for a 3:1 rectangle. It now displays OpenGraph-style metadata when the chapter provides it: a 64×64 thumbnail on the left, a 2-line description, the site name in the bottom-left, and the link in the bottom-right. Layout:

```
+----------------------------------------------------+
| Title                                              |
| [thumb]  description text...                       |
|         SITE NAME              View source →       |
+----------------------------------------------------+
```

The title is clamped to one line with ellipsis; the description to two lines. Footnote dicts now accept an `og: { title, description, image, siteName }` block. The three chapters that have footnotes (Ch 1, Ch 2, Ch 8) supply `og` data for each. When `og` is missing, the modal falls back to the old `quote` field for the description.

### H1 includes "NammaMetro"

The visible H1 was `The Conspiracy Theory 😈` — missing the `NammaMetro:` prefix that the source notebook title has. Now it reads `NammaMetro: The Conspiracy Theory 😈`, matching the notebook. The browser tab `<title>` was already correct; this was the in-page H1.

### Files touched

- `src/motion/image-reveal.js` — full rewrite: 4×5 block grid with shuffled reveal order
- `styles/scrolly.css` — block-grid CSS, footnote popover new layout
- `src/components/footnote.js` — global counter, `renderFootnote()` with OpenGraph layout, single-attached global handlers
- `src/chapters/ch1-one-day.js`, `ch2-crowded.js`, `ch8-fare-hike.js` — `og:` data on each footnote
- `index.html` — H1 now includes "NammaMetro"

---

## v0.4.4 — Image reveal everywhere, sticky titles, tooltip persistence (2026-07-16)

A grab bag of polish from a single editing session.

### Image reveal extended to all content images

The top-to-bottom scroll-driven reveal was previously scoped to `.datastory-photo img` (chapter photos only). It's now applied to **every static image in the content** — the hero in `.datastory-header .hero` and every chapter photo. The CSS selector is `.datastory-header .hero img, .datastory-photo img`; the JS selector matches. The hero is at the top of the page, so its ScrollTrigger fires at progress 1 on initial load and the image is revealed immediately.

### Animation triggers pulled closer to the viewport bottom

Every chart animation's ScrollTrigger `start` was `top 80%` (viz top at 20% from the bottom of the viewport). Now it's **`top 90%`** (viz top at 10% from the bottom) — "50% closer to the bottom" as the user put it. The animation has less scroll distance to complete, so it finishes faster relative to when the viz comes into view. 17 trigger points across 9 chapter files were updated:

```
src/chapters/ch1-one-day.js        (2)
src/chapters/ch2-crowded.js        (2)
src/chapters/ch3-one-week.js       (2)
src/chapters/ch4-traffic-bands.js  (1)
src/chapters/ch5-one-month.js      (2)
src/chapters/ch6-long-weekend.js   (1)
src/chapters/ch7-visitor-economy.js(1)
src/chapters/ch8-fare-hike.js      (3)
src/chapters/ch9-conspiracy.js     (3)
```

To adjust this yourself, the value lives in the `start:` field of each `ScrollTrigger.create({...})` in those files. Search for `start: 'top 90%'` (or any other `top N%` you want to try) to find them. Each chapter is independent — you can tune them per-chapter if some need a different threshold.

### Tooltip persistence on the calendar

The Ch 1 "120 days" calendar tooltip used to vanish the moment the mouse left a cell. Dragging the mouse across a row would flicker the tooltip through the gaps. Now the tooltip hides with an **80ms delay** on `mouseleave`/`blur`; if the mouse enters another cell within that window, the hide is cancelled and the tooltip just updates its content for the new cell. The delay is in `src/viz/calendar-strip.js` as `HIDE_DELAY_MS` (top of the hover-handler block) — adjust if you want a different feel.

### Chapter title: kicker folded into the title

The two-line chapter heading ("Chapter 1" / "One Day on NammaMetro") was eating too much vertical space. The kicker is gone; the chapter number is now prefixed into the title: "1. One Day on NammaMetro", "2. \"The Metro is Getting Crowded!\"", …, "9. The Conspiracy Theory 😈". All 9 chapter HTML blocks in `index.html` were updated; the `.chapter__kicker` CSS rule is no longer used (left in place in case you want to restore it).

### Sticky chapter title

Each chapter title now freezes below the site header as the user scrolls through the chapter. Implementation: `position: sticky; top: calc(var(--site-header-height) + 0.5rem)` on `.chapter__title`, with a `var(--surface)` background and a `0 1px 0 var(--hairline)` underline so content scrolling under the title is hidden, not visible through it. The title unsticks automatically when the chapter scrolls out of view (the natural behaviour of `position: sticky`).

---

## v0.4.3 — Footnote popover reshaped to 3:1 (2026-07-16)

The footnote citation popover used to be a tall, narrow column (`max-width: 320px`, no height control, content stacked vertically) — it ended up looking thin and stretched on most content. It's been reshaped into a proper **3:1 rectangle** with horizontal content flow.

### Layout

```
+----------------------------------------------------+
| Title (spans full width, top row)                  |
| Quote text here...                  View source →  |
+----------------------------------------------------+
```

A 2×2 CSS grid places:

- **Title** on the top row, spanning both columns (`grid-column: 1 / -1`)
- **Quote** on the bottom-left (`grid-column: 1`)
- **Link** on the bottom-right, aligned to the bottom-right corner (`grid-column: 2; align-self: end; justify-self: end`)

### Sizing

- `width: 480px` (fixed)
- `aspect-ratio: 3 / 1` (height = width / 3 = 160px on desktop)
- `max-width: min(90vw, 520px)` so the popover caps at 90% of the viewport on small screens and never exceeds 520px. The 3:1 aspect ratio is preserved at every width.
- Compact typography: title 0.86rem, quote/link 0.78rem, line-height 1.3. Fits comfortably in the 160px height with breathing room.

The popover is now confident and wide — a proper rectangle — not a tall thin column.

---

## v0.4.2 — Scroll-driven image reveal (2026-07-16)

Every chapter photo (`.datastory-photo img`) now reveals itself from the top row of pixels to the bottom as the user scrolls it into view. The reveal is gentle — an 8% soft fade at the leading edge — so it never feels like a hard clip.

### How it works

A CSS custom property `--reveal` (unitless, 0–100) drives a `linear-gradient` mask on each image. The mask's white (visible) zone extends from `0%` to `calc(var(--reveal) * 1%)`, then transitions to transparent over the next 8%, then stays transparent to the bottom. As `--reveal` grows from 0 to 100, the white zone sweeps down, wiping the image into view.

```css
mask-image: linear-gradient(
  to bottom,
  #fff 0%,
  #fff calc(var(--reveal) * 1%),
  transparent calc(var(--reveal) * 1% + 8%),
  transparent 100%
);
```

A new module `src/motion/image-reveal.js` sets up a `ScrollTrigger` per image. The trigger range is wide (image top at 90% of viewport → image top at 30%) so the reveal is gradual, not jumpy. `scrub: 0.5` smooths the leading edge.

### Other changes

- **Image height cap**: every chapter photo is now capped at `max-height: 90vh`. A wide landscape photo keeps its column width; a tall portrait photo will be clamped to 90vh with `width: 100%` and `height: auto`. (The drop shadow now correctly surrounds only the visible portion of the image, since `filter: drop-shadow` respects the mask.)
- The hero image (`.datastory-header .hero img`) is intentionally excluded — it lives at the top of the page and renders normally.

### Files touched

- `styles/scrolly.css` — added the mask and the `max-height: 90vh` cap on `.datastory-photo img`
- `src/motion/image-reveal.js` — new module
- `src/main.js` — imports and calls `setupImageReveals()` alongside the chapter mount

---

## v0.4.1 — Calendar polish + hover tooltip (2026-07-16)

The Ch 1 "120 days at a glance" calendar gets a few more rounds of refinement.

### Visual polish

- **Missing days** (in-range, not reported) now show a visible **X** mark drawn as two diagonal SVG lines. Background is a slightly more visible `rgba(0, 0, 0, 0.08)`. With the current data all 120 in-range days are reported, so the X won't appear unless a future notebook run has missing days — but the chart is now robust to that.
- **Days outside the editorial window** (the partial weeks at the edges of the calendar) have **no border** and no fill. They're truly empty — just the grid structure holding the calendar together.
- **Y-axis labels** (Mon, Tue, …) reduced from 11px / weight 600 to 9px / weight 400 with a faint letter-spacing — quieter, less competing with the data.
- **Chart-to-caption gap** reduced from 3rem to 0.5rem on the bottom of `.viz` (the caption has its own 0.75rem top margin, so the effective gap is now ~12px instead of ~48px).

### Hover tooltip

Hovering or keyboard-focusing any in-range cell now pops up a confident tooltip with:

1. **Date** in long human-readable form ("Saturday, November 16, 2024")
2. **Value** in Indian-grouped numerals ("8,36,751 riders") — or "Not reported by BMRCL" for missing days
3. **Vertical bar** on a 110×100 mini chart, scaled to 0 … (max + 10%). The bar is the Namma Metro deep purple (`#5E2D8C`); missing days show a stub 4% grey bar.

The tooltip is positioned above the cell by default, falling back to **below** for cells in the top row (Mon, Tue) where above would clip. It's keyboard-accessible — cells are now `tabindex="0"` and respond to focus/blur in addition to mouseenter/mouseleave. Native `<title>` is retained for screen readers.

The tooltip is built as a sibling div inside `.viz` (the container has `position: relative`); it has `pointer-events: none` so it never interferes with the cell hover.

---

## v0.4 — Calendar grid, Namma Metro purple, refined chrome (2026-07-16)

### Calendar strip rewrite (Chapter 1)

The "191 days at a glance" viz was previously a 28×7 grid with days along the columns and 7 payment channels as rows. It's been restructured as a true **calendar grid**:

- **7 rows = days of the week** (Mon at the top, Sun at the bottom), labelled on the Y-axis.
- **N columns = weeks**. The first column starts on the Monday on or before the editorial window's start date; the last column ends on the Sunday on or after the end date. Cells outside the window are rendered as empty (transparent); cells inside the window that BMRCL didn't publish are faint placeholders.
- **Animation** now reveals rows top to bottom as you scroll: progress `0 → 1/7` reveals Mon, `1/7 → 2/7` reveals Tue, and so on. The row is the unit of reveal — no more column-by-column.
- **Colour scale** is now a sequential **Namma Metro purple** gradient (`#f0e6f7` light → `#5E2D8C` deep, matching BMRCL Purple Line signage). Cells coloured by total ridership.
- Adapts dynamically to whatever data range the notebook produces — no hardcoded `COLS=28` or `ROWS=7` for the data; the grid is computed from the data's start/end dates.

### Chrome refinements

- **Hero image** is no longer full-bleed. It's now capped at `max-width: 1080px` (a little wider than the 960px content column) and centred, so it sits inside the content width with margin on both sides.
- **Photo drop shadow** reduced from 5px to 2px. Same offset, same hard black — just lighter.
- **Chapter 1 prose** updated to match the new data window (Nov 16 2024 → Apr 14 2025, 120 days, Namma Metro purple).

### Bug fix

- `ch1-one-day.js`'s hardcoded `FALLBACK_DAY_ISO = '2025-04-30'` is no longer in the data (window now ends Apr 14). The fallback now walks backwards from the last day and picks the most recent Mon–Thu. The representative weekday is no longer pinned to a specific ISO date.

---

## v0.3.2 — Dev server integration fix (2026-07-16)

The dev server (`bun run dev`) was returning 404 on the scrolly URL because the dynamic route `src/pages/datastory/[...slug].astro` was shadowing the `public/datastory/<slug>/index.html` file. Three things fixed it:

1. **`predev` script** added to `package.json` so `node scripts/build_scrolly.mjs` runs before the dev server starts. Without this, the `public/` scrolly files don't exist in dev, and the route 404s.

2. **Route file** (`src/pages/datastory/[...slug].astro`) updated: instead of filtering scrolly entries out of `getStaticPaths`, it now generates a path for every published datastory and dispatches by format. For scrolly entries, the route reads the prebuilt `public/<baseUrl>/index.html` and serves it via `Response`. For notebook entries, it renders via `Datastory.astro` as before. The same code path works in dev and in production build.

3. **Scrolly source watcher** in `scripts/scaffold-integration.ts`: when running in dev, watches each scrolly source directory for changes and re-runs `node scripts/build_scrolly.mjs` (debounced 200ms). Edits to the scrolly source hot-rebuild and the dev server picks up the new public/ file. The watcher ignores `node_modules/`, `dist/`, and `public/data/*.json` (the JSONs are regenerated by the scrolly's own `data` step).

### Side fixes

- The scrolly source directory was renamed from `bangalore-metro-conspiracy-theory-scrolly` to `bangalore-metro-conspiracy-theory` (matching the slug). The `.md` `source:` field updated to match. This is consistent with the user's earlier directive that "scrolly" is an internal reference and should not appear in the public URL — the source dir is internal too, so dropping the suffix keeps the naming uniform.
- A subtle path bug in the route file: `path.resolve("public", story.data.baseUrl, "index.html")` was treating the absolute `baseUrl` (e.g. `/datastory/...`) as the new root, ignoring `public`. Fixed by stripping the leading slash with `replace(/^\/+/, "")` and using `path.resolve(process.cwd(), "public", relativePath, "index.html")`.

### Verified

- `bun run dev` → predev runs build_scrolly.mjs, dev server starts
- `/datastory/bangalore-metro-conspiracy-theory/` → 200 (scrolly, served via route + public/ read)
- `/datastory/<other-slug>/` → 200 (notebook, served via route + Datastory.astro)
- `/datastory/bangalore-metro-conspiracy-theory-scrolly/` → 404 (the suffix never appears in the public URL)
- Editing a file in the scrolly source → dev server rebuilds within 200ms, refresh picks up the change

---

## v0.3.1 — Schema flattened (2026-07-16)

The Astro datastory schema is now a Zod **discriminated union** keyed on `format`. The `notebook:` and `scrolly:` wrappers are gone — all format-specific fields appear at the top level of the frontmatter.

### Before

```yaml
format: scrolly
scrolly:
  source: "./remote-only/datastory/..."
  baseUrl: "/datastory/.../"
```

```yaml
format: notebook       # or implicit
notebook:
  engine: jupyter
  entry: "https://..."
  excludeCodeCells: true
```

### After

```yaml
format: scrolly
source: "./remote-only/datastory/..."
baseUrl: "/datastory/.../"
```

```yaml
format: notebook
engine: jupyter
entry: "https://..."
excludeCodeCells: true
```

The discriminator is `format` itself. TypeScript narrows correctly: when `data.format === 'scrolly'`, `data.source` and `data.baseUrl` are typed as required strings; when `data.format === 'notebook'`, `data.engine`, `data.entry`, `data.excludeCodeCells` are typed.

### Files touched

- `src/content.config.ts` — schema switched to `z.discriminatedUnion("format", [...])`
- `scripts/render_notebook.py` — frontmatter parser now reads `entry` and `excludeCodeCells` at the top level; skips entries with `format !== "notebook"`
- `scripts/build_scrolly.mjs` — frontmatter reader now reads `source` and `baseUrl` at the top level
- `scripts/scaffold-integration.ts` — datastory template flattened
- All 5 `.md` files migrated to the flat format

### Why

A redundant wrapper is noise. The format is already the discriminator; the wrapper added a level of indentation for no reason. Flat is cleaner.

---

## v0.3 — Integrated with Astro (2026-07-16)

The scrolly is now a first-class output of `thecontrarian.in`'s Astro build. Production deploys go through `bun run build` (CI), not through a manual scrolly-side build.

### What changed

1. **Public URL is now format-agnostic.** The scrolly is served at `/datastory/bangalore-metro-conspiracy-theory/` — the same URL the notebook version used. The previous `-scrolly` suffix was an internal reference, not a public one. The "scrolly" word appears only in `content/datastory/*.md` frontmatter (the `format: scrolly` field) and never in any public-facing artifact (URL, title, listing, meta).
2. **Astro content schema** (`src/content.config.ts`) now has a `format: 'notebook' | 'scrolly'` field. Defaults to `notebook` (so all existing datastory entries are unaffected). A `scrolly: { source, baseUrl }` block is required when `format === 'scrolly'`.
3. **A new build script** `scripts/build_scrolly.mjs` runs as part of the Astro `prebuild` step. It walks `content/datastory/*.md`, finds scrolly entries, and for each: installs deps (skips if `node_modules` exists), runs `data`, runs `vite build --base=<baseUrl>` (overrides the scrolly's own `vite.config.js` `base`), and copies `dist/*` to `public/<baseUrl>/`. The Astro build then copies that to `dist/<baseUrl>/` automatically.
4. **The slug route** (`src/pages/datastory/[...slug].astro`) filters out scrolly entries from `getStaticPaths`, so Astro does not emit a route HTML for them — the static files in `public/<baseUrl>/` are served directly.
5. **The existing notebook HTML** at `content/datastory/bangalore-metro-conspiracy-theory.notebook.html` is now dead (the format is scrolly). Kept on disk for archival. To restore the notebook, revert the format field in the .md and re-render with `render_notebook.py`.
6. **Scrolly's `vite.config.js`** `base` is now `/datastory/bangalore-metro-conspiracy-theory/` (the public URL). Local dev runs at this URL pattern too.

### For future scrolly pieces

1. Copy this directory (or make a new one with the same structure: `package.json`, `vite.config.js`, `src/`, `scripts/fetch-data.mjs`, `public/data/`).
2. Update `vite.config.js` `base` to the new URL.
3. Update `scripts/fetch-data.mjs` to point at the new JSONs on GitHub (or whatever data source).
4. Write the chapters in `index.html` and the viz modules in `src/viz/`.
5. Add a content file `content/datastory/<slug>.md` with:
   ```md
   ---
   title: "..."
   format: scrolly
   scrolly:
     source: "./remote-only/datastory/<slug>"
     baseUrl: "/datastory/<slug>/"
   ---
   ```
6. Run `bun run build` (or `npm run build`). The prebuild step handles the scrolly build automatically.

### Verification

- `dist/datastory/bangalore-metro-conspiracy-theory/index.html` ✓
- `dist/datastory/bangalore-metro-conspiracy-theory/assets/index-*.js` (243 KB) ✓
- `dist/datastory/bangalore-metro-conspiracy-theory/assets/*.jpg` (8 photos) ✓
- `dist/datastory/bangalore-metro-conspiracy-theory/data/*.json` (7 JSONs) ✓
- All asset URLs in the scrolly's HTML reference `/datastory/bangalore-metro-conspiracy-theory/...` (no `-scrolly` suffix) ✓
- The 0 occurrences of the word "scrolly" in `dist/datastory/index.html` and `dist/index.html` ✓
- Other datastory entries (notebook format) unaffected: `aditya-L1-solar-explorer`, `bangalore-metro-phenomena-inspector`, `rolling-relative-route-scoring-system`, `traffic-monitor-lizard` all build at their original URLs ✓

---

## v0.2 — Datastory design + viz-centered scroll (2026-07-16)

### Bug fixes

1. **Adopted the existing datastory design** from the Astro project's `src/styles/datastory.css`. The header is now a data-journalism masthead:
   - 3px top rule above the kicker
   - "Data Story" kicker chip (Inter 700, black background, white text, 0.22em letter-spacing)
   - Inter 900 title with -0.05em letter-spacing
   - Fraunces italic subtitle (light weight, max-width 55ch)
   - Byline + date
   - Full-bleed hero image below the text (no cinematic overlay, no min-height 100vh)
   - Site header is now always dark gray (`#2a2a2a`) with white text, matching the Astro datastory layout
2. **ScrollTrigger now per-viz, viz-centered.** Every chapter's viz now has its own ScrollTrigger:
   - `trigger: <vizSlot>` (the viz element, not the whole chapter)
   - `start: 'top 80%'`
   - `end: 'center center'` (animation completes when the viz center is at viewport center)
   - Removed the staggered-progress logic — each viz animates independently as it scrolls into view
3. **Content container widened** from 720px to 960px (the datastory's default). Removed the `chapter--wide` modifier since the default is now wide.

### Files changed

- `styles/scrolly.css` — full rewrite to match the datastory design
- `index.html` — new `.datastory-header` structure (kicker chip, Inter 900 title, italic subtitle, byline, date, full-bleed hero below)
- `src/main.js` — site-header is now always dark (no scroll observer, removed the hero IntersectionObserver)
- All 9 `src/chapters/ch*.js` — viz-as-trigger pattern with `end: 'center center'`

### Build stats

- 29.4KB HTML (gzipped 9.7KB)
- 10.2KB CSS (gzipped 2.9KB) — up from 7.9KB because the datastory design has more typography rules
- 243KB JS (gzipped 87KB) — unchanged
- 1.0s build time

---

## v0.1 — Initial build (2026-07-16)

First end-to-end build. All 9 chapters of the notebook rendered as a scrollytelling experience.

### What's in the box

- **9 chapters**, with notebook prose preserved verbatim (emoji callouts `👆🏼 💡 ✨ 📘`, yellow highlights, etc.)
- **11 D3 viz modules** in `src/viz/`:
  - `calendar-strip.js` — 191-day × 7-row grid, color = ridership (Ch 1)
  - `stacked-bar.js` — 7-mode stacked bar for a single day (Ch 1)
  - `horizontal-bar.js` — top-10 busiest/quietest (Ch 2)
  - `ridership-line.js` — generic line chart (Ch 3, 5, 8)
  - `day-of-week.js` — bar chart by day of week (Ch 3)
  - `stacked-area.js` — Commute vs Casual over time (Ch 4, 5, 8)
  - `event-line.js` — line with event markers (Ch 7)
  - `boxplot.js` — by month (Ch 5)
  - `ci-bar.js` — horizontal bar with confidence intervals (Ch 8, 9)
  - `before-after.js` — paired bars for hypothesis test (Ch 9)
  - `multi-ridership-line.js` — multi-line for the Jan 15-16 anomaly (Ch 9)
- **8 chapter mount modules** in `src/chapters/`, each wiring data + viz + ScrollTrigger
- **In-line footnote popovers** (`src/components/footnote.js`) — keyboard-accessible, click-outside-to-close
- **Photo polaroid** CSS in `styles/scrolly.css` — preserves the notebook's colored drop-shadows
- **GSAP ScrollTrigger** drives all scroll choreography (no D3 transitions compete with it)
- **Site chrome** — header (white-on-transparent, darkens on scroll) and footer (socials + ©) replicated from thecontrarian.in's Astro site

### Architecture

- **Standalone Vite 5** + vanilla JS. No React, no Astro.
- **Data flow:** notebook → GitHub JSONs → `npm run data` → `public/data/*.json` → fetched at runtime
- **D3 ↔ GSAP contract:** viz modules are pure (input data → rendered SVG + `update(progress)`); GSAP is the only thing that calls `requestAnimationFrame`

### Decisions made (without asking, documented for review)

1. **Header is white-on-transparent, darkens on scroll**, exactly like the Astro site. Pinned at top with `position: fixed; z-index: 10000;`. Same nav (Home / The Projects / About Me / Contact) pointing to `/#...` which lands on the main site. (v0.2: changed to always-dark-gray, no scroll-based darkening, matching the Astro datastory layout.)
2. **Footer** has X / LinkedIn / WhatsApp / Instagram / GitHub icons, plus the © line.
3. **Photo placement** matches the notebook: each photo at the same narrative moment with the same caption and the same colored box-shadow.
4. **Yellow highlights** (`<span class="highlight">`) and **emoji callouts** (`> 👆🏼 ...`) are preserved as in the notebook.
5. **In-line footnotes** are superscript numbers that open a popover on click, not end-of-piece citations. Each chapter defines its own footnotes.
6. **Lazy chapter mounting** via IntersectionObserver: D3 viz don't render until the chapter is about to scroll into view (1500px rootMargin). Initial bundle cost is just the CSS + main.js + lightbox-style chrome.
7. **CI bar values for Ch 8 and Ch 9 are illustrative** — they follow the pattern from the notebook's hypothesis tests (e.g., NCMC +39.4%, Smart Card -9.4% for Ch 8) but the exact numbers should be verified against the notebook's actual t-test output.
8. **`prefers-reduced-motion`** is honoured at the CSS level (all animations become 0.01ms). ScrollTrigger still works, just no scrubbing.
9. **No "Last Major Update: 2025-02-28" line** in the scrolly — that line lives in the notebook's first cell. The scrolly drops it.
10. **The Jan 15-16 anomaly is the analytical climax** (Ch 9), not Feb 9. The notebook's data analysis is anchored on the *pre-hike* anomaly, with the Feb 9 hike as either cover or the second wave.

### Things to verify before deploy

- [ ] Open `dist/index.html` via `npm run preview` and walk the full scroll. Confirm scroll feel, viz reveal timing, footnote popover positioning, photo shadows.
- [ ] Check the CI bar values in Ch 8 and Ch 9 against the notebook's actual t-test output. I used illustrative values based on the pattern.
- [ ] Confirm the 14-day hypothesis window JSON (`hypothesis-window.json`) is what you want — I chose 14 days each side per the earlier sign-off.
- [ ] Consider compressing the hero image (3MB → 100-200KB WebP) for faster first paint.
- [ ] Add a favicon (the Astro site has one at `dist/favicon.ico`).

### Known limitations

- The nav links point to `/#...` and `/`, which only work if the scrolly is hosted at the same domain as the main site (which it is, but worth noting for any future deploy to a different host).
- The big photos (3-4MB each) are loaded as-is. With 7 of them, that's ~20MB of image data on the page. Browsers lazy-load off-screen images by default, so this is OK, but compression would be a big win.
- The scrolly is a static site, so any future updates to the data require a re-build (`npm run data && npm run build`).

### Reusability

This is designed to be a template for future notebook-based scrollytelling pieces:
- **Reusable parts** (header, footer, photo polaroid, footnote popover, viz library, motion wrapper) stay
- **Per-instance parts** (chapter prose, data, photos) get replaced

To make a new scrolly from a different notebook:
1. Copy this directory
2. Update `package.json` (name, description)
3. Replace `public/data/*.json` with new data (via `scripts/fetch-data.mjs` pointed at a new repo path)
4. Replace `index.html` with new chapters
5. Replace `src/chapters/*.js` with new chapter mounts
6. Update the title in `index.html` and `<title>`

The viz library, motion wrapper, footnote popover, photo polaroid, and site chrome are all reusable as-is.

## v0.9 — Inline footnotes + auto-fetched citation OG (2026-07-17)

The footnote system is now self-contained in `index.html`. Two improvements over the previous design:

### What's new

**Unified footnote trigger.** A single class, `<sup class="fn-footnote">CONTENT</sup>`, replaces the old `<sup class="fn-slot" data-fn-id="...">` + separate JS payload pattern. Two content kinds:

- URL inside the sup → citation popover with OG title/desc/site
- Plain text inside the sup → text-only footnote popover

The build determines the kind by sniffing whether the content is a URL.

**Auto-fetched citation OG.** A new build script `scripts/fetch_citations.mjs` walks `index.html`, finds every URL footnote, and writes its OG metadata to `<script id="article-citations">` (keyed by URL). The script is idempotent — already-cached URLs aren't re-fetched. To re-fetch (e.g. a page's OG changed), delete the entry and rebuild.

The script runs as a step in `scripts/build_scrolly.mjs`, so every Astro `dev` / `build` invocation picks up new citations automatically.

### How to add a citation now

Just paste the URL into the article body:

```html
BMRCL publishes a daily breakdown of ridership by payment methods
<sup class="fn-footnote">https://english.bmrc.co.in/ridership/</sup>.
```

The build fetches the OG info and writes it to `#article-citations`. The runtime promotes the sup to a numbered button with a popover.

### How to add a pure footnote (no link)

Put text inside the sup:

```html
The NammaMetro system opened in 2011<sup class="fn-footnote">The system's first section opened on 20 October 2011.</sup>.
```

The popover shows that text — no link, no thumbnail.

### Files changed

- **Modified** `packages/scrollytelling-core/src/components/footnote.js` — `wireFootnotes(footnotes)` removed; `setupFootnotes()` now reads from `#article-citations` and walks `<sup class="fn-footnote">` instead of `.fn-slot`. Two render branches: citation vs. pure text.
- **Modified** `packages/scrollytelling-core/src/index.js` — barrel re-export updated.
- **Modified** `index.html` — 7 `<sup class="fn-slot" data-fn-id="...">` triggers replaced with `<sup class="fn-footnote">URL</sup>`. JSON block renamed from `article-footnotes` to `article-citations`, keyed by URL.
- **New** `scripts/fetch_citations.mjs` — walks `index.html`, fetches missing URLs' OG, rewrites `#article-citations`. ~150 lines.
- **Modified** `scripts/build_scrolly.mjs` — runs the citation fetch as a step after `data`, before `vite build`.
- **Modified** `src/main.js` — calls `setupFootnotes()` once on page load (already there, no change needed).
- **Modified** `package.json` — added `citations` script (called from `build_scrolly.mjs`).
