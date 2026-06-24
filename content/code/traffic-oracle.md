---
title: traffic-oracle
description: Hyperlocal Road Traffic Monitor – compare current speeds with historical patterns across major routes. Know before you go.
author: Mahesh Shantaram
status: draft
repoOwner: thecont1
repoName: traffic-oracle
license: NOASSERTION
createdDate: 2026-06-25
lastUpdated: 2026-06-11
tags:
  - "public-data"
  - "traffic-analysis"
  - "urban-data-science"
repoUrl: "https://github.com/thecont1/traffic-oracle"
repoEmail: ms@thecontrarian.in
appUrl: "https://co.thecontrarian.in/"
fileTree:
  - ".gitignore"
  - "LICENSE.md"
  - "README.md"
  - "WARP.md"
  - "bun.lock"
  - "bunfig.toml"
  - "components.json"
  - "design_spec.md"
  - "docs/CAR_ANIMATION.md"
  - "docs/WEEKLY_SPEED_DISTRIBUTION.md"
  - "index.html"
  - "open-location-code.d.ts"
  - "package.json"
  - "playwright.config.ts"
  - "public/android-chrome-192x192.png"
  - "public/android-chrome-512x512.png"
  - "public/apple-touch-icon.png"
  - "public/co-og.jpg"
  - "public/favicon-16x16.png"
  - "public/favicon-32x32.png"
  - "public/favicon.ico"
  - "public/mapshots/airport_expy_1050.png"
  - "public/mapshots/central_diagonal_1_1050.png"
  - "public/mapshots/central_diagonal_2_1050.png"
  - "public/mapshots/double_decker_flyover_1050.png"
  - "public/mapshots/east_inner_ring_1050.png"
  - "public/mapshots/east_outer_ring_1050.png"
  - "public/mapshots/hosur_road_1050.png"
  - "public/mapshots/mysore_road_1050.png"
  - "public/mapshots/north_inner_ring_1050.png"
  - "public/mapshots/north_outer_ring_1050.png"
  - "public/mapshots/old_airport_road_1050.png"
  - "public/mapshots/sarjapur_road_1050.png"
  - "public/mapshots/south_outer_ring_1050.png"
  - "public/mapsots/airport_expy_1050.png"
  - "public/mapsots/central_diagonal_1_1050.png"
  - "public/mapsots/central_diagonal_2_1050.png"
  - "public/mapsots/double_decker_flyover_1050.png"
  - "public/mapsots/east_inner_ring_1050.png"
  - "public/mapsots/east_outer_ring_1050.png"
  - "public/mapsots/hosur_road_1050.png"
  - "public/mapsots/mysore_road_1050.png"
  - "public/mapsots/north_inner_ring_1050.png"
  - "public/mapsots/north_outer_ring_1050.png"
  - "public/mapsots/old_airport_road_1050.png"
  - "public/mapsots/sarjapur_road_1050.png"
  - "public/mapsots/south_outer_ring_1050.png"
  - "public/robots.txt"
  - "public/site.webmanifest"
  - "public/trafficoracle-dark.png"
  - "public/trafficoracle-light.png"
  - "src/App.tsx"
  - "src/components/BaselineReferenceLines.tsx"
  - "src/components/CalendarWidget.tsx"
  - "src/components/RouteBrowserPane.tsx"
  - "src/components/RrsContextBlock.tsx"
  - "src/components/RrsDebugBlock.tsx"
  - "src/components/UncertaintyBandChart.tsx"
  - "src/components/shared/ChartTooltipFactory.tsx"
  - "src/components/shared/Chip.tsx"
  - "src/components/shared/LocationDropdown.tsx"
  - "src/components/shared/NapkinChart.tsx"
  - "src/components/shared/NestedScaleChart.tsx"
  - "src/components/shared/Route404.tsx"
  - "src/components/ui/InfoTip.tsx"
  - "src/components/ui/accordion.tsx"
  - "src/components/ui/alert-dialog.tsx"
  - "src/components/ui/alert.tsx"
  - "src/components/ui/aspect-ratio.tsx"
  - "src/components/ui/avatar.tsx"
  - "src/components/ui/badge.tsx"
  - "src/components/ui/breadcrumb.tsx"
  - "src/components/ui/button-group.tsx"
  - "src/components/ui/button.tsx"
  - "src/components/ui/calendar.tsx"
  - "src/components/ui/card.tsx"
  - "src/components/ui/carousel.tsx"
  - "src/components/ui/chart.tsx"
  - "src/components/ui/checkbox.tsx"
  - "src/components/ui/collapsible.tsx"
  - "src/components/ui/command.tsx"
  - "src/components/ui/context-menu.tsx"
  - "src/components/ui/dialog.tsx"
  - "src/components/ui/drawer.tsx"
  - "src/components/ui/dropdown-menu.tsx"
  - "src/components/ui/empty.tsx"
  - "src/components/ui/field.tsx"
  - "src/components/ui/form.tsx"
  - "src/components/ui/hover-card.tsx"
  - "src/components/ui/input-group.tsx"
  - "src/components/ui/input-otp.tsx"
  - "src/components/ui/input.tsx"
  - "src/components/ui/item.tsx"
  - "src/components/ui/kbd.tsx"
  - "src/components/ui/label.tsx"
  - "src/components/ui/menubar.tsx"
  - "src/components/ui/navigation-menu.tsx"
  - "src/components/ui/pagination.tsx"
  - "src/components/ui/popover.tsx"
  - "src/components/ui/progress.tsx"
  - "src/components/ui/radio-group.tsx"
  - "src/components/ui/resizable.tsx"
  - "src/components/ui/scroll-area.tsx"
  - "src/components/ui/select.tsx"
  - "src/components/ui/separator.tsx"
  - "src/components/ui/sheet.tsx"
  - "src/components/ui/sidebar.tsx"
  - "src/components/ui/skeleton.tsx"
  - "src/components/ui/slider.tsx"
  - "src/components/ui/sonner.tsx"
  - "src/components/ui/spinner.tsx"
  - "src/components/ui/switch.tsx"
  - "src/components/ui/table.tsx"
  - "src/components/ui/tabs.tsx"
  - "src/components/ui/textarea.tsx"
  - "src/components/ui/toast.tsx"
  - "src/components/ui/toaster.tsx"
  - "src/components/ui/toggle-group.tsx"
  - "src/components/ui/toggle.tsx"
  - "src/components/ui/tooltip.tsx"
  - "src/config.json"
  - "src/core/constants.ts"
  - "src/core/format.ts"
  - "src/core/index.ts"
  - "src/core/periodLogic.ts"
  - "src/core/trafficNow.ts"
  - "src/core/urlState.ts"
  - "src/docs/architecture.md"
  - "src/hooks/use-fingerprint.ts"
  - "src/hooks/use-mobile.tsx"
  - "src/hooks/use-toast.ts"
  - "src/index.css"
  - "src/lib/ThemeContext.tsx"
  - "src/lib/TimeTravelContext.tsx"
  - "src/lib/chartHelpers.ts"
  - "src/lib/config.ts"
  - "src/lib/forecastBands.ts"
  - "src/lib/routeConditionCopy.ts"
  - "src/lib/routeMapshots.ts"
  - "src/lib/rrsData.ts"
  - "src/lib/theme.ts"
  - "src/lib/tooltipContent.ts"
  - "src/lib/trailingPercentiles.ts"
  - "src/lib/ttStateHelpers.ts"
  - "src/lib/useTrafficData.ts"
  - "src/lib/utils.ts"
  - "src/main.tsx"
  - "src/mobile/MobileApp.tsx"
  - "src/mobile/components/SwipeableRouteCards.tsx"
  - "src/mobile/hooks/useMobileShare.ts"
  - "src/pages/Dashboard.tsx"
  - "src/pages/not-found.tsx"
  - "src/worker.ts"
  - "tests/e2e/calendar-widget.spec.ts"
  - "tests/e2e/dashboard-cards.spec.ts"
  - "tests/e2e/forecast-bands.spec.ts"
  - "tests/fixtures/e2e-forecast-bands.csv"
  - "tests/fixtures/e2e-routes.csv"
  - "tests/fixtures/e2e-traffic.csv"
  - "tests/fixtures/routes-sample.csv"
  - "tests/fixtures/traffic-sample.csv"
  - "tests/setup.ts"
  - "tests/unit/buildBands.test.ts"
  - "tests/unit/calendarColor.test.ts"
  - "tests/unit/calendarWidget.test.tsx"
  - "tests/unit/chartHelpers.test.ts"
  - "tests/unit/computeStats.test.ts"
  - "tests/unit/deriveVerdict.test.ts"
  - "tests/unit/matchesToD.test.ts"
  - "tests/unit/trailingPercentiles.test.ts"
  - "tests/unit/tt-state-preservation.test.ts"
  - "tests/unit/useTrafficData.test.ts"
  - "tools/audit_calendar.py"
  - "tools/generate-mapsots.ts"
  - "tsconfig.json"
  - "vite.config.ts"
  - "wrangler.jsonc"
---

# traffiCOracle

<p align="center">
  <img src="public/trafficoracle-light.png" alt="traffiCOracle" height="64">
</p>

**traffiCOracle** is a free, live traffic dashboard for Bangalore. It shows you how fast (or slow) the city is moving right now — and how today's conditions compare to the last few months.

There is **no app to install, no login, and no server** running behind it. Open it in any browser, on your phone or laptop, and it works immediately. All the number-crunching happens inside your browser, and the data is pulled fresh from a public dataset that updates throughout the day.

---

## What is this for?

- **Commuters** deciding whether to leave now or wait 30 minutes
- **City planners** and journalists looking for historical traffic trends
- **Curious residents** who want to know which routes are unusually jammed today
- **Researchers** who need shareable, permalinked traffic views

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Data](#data)
- [How it works](#how-it-works)
- [Tips & Troubleshooting](#tips--troubleshooting)
- [License](#license)

---

## Features

- **TrafficNOW! — Live at a glance**  
  A constantly updating side panel that shows current speed and status for every monitored route. Routes are colour-coded from *unusually fast* to *unusually slow* based on percentile statistics, not simple averages. A pulsing green dot tells you the data is fresh.

- **Ask questions in plain English**  
  Pick a route, a time of day (weekday morning, evening, weekends…), and a time period, then choose a question: *"Has traffic improved?"*, *"Has traffic worsened?"*, or *"What is the typical situation?"* The dashboard answers with a verdict, an emoji summary, and a mini trend chart.

- **Baseline comparison slider**  
  Drag the slider to define your own "normal" weeks. Everything after that window is compared against your custom baseline, so you can see whether recent traffic is genuinely better or worse than what you consider typical.

- **Calendar heatmap**  
  A GitHub-style grid that colours every day by its average speed. One glance shows you which days were red (slow) and which were green (fast).

- **Uncertainty bands on every chart**  
  Instead of a single line, speed and duration charts show a shaded band that represents the typical range (15th–85th percentile) and the full possible range (5th–95th percentile). This tells you how *reliable* an average really is.

- **Three visual themes**  
  *Colour me surprised!* (vibrant dark), *Scale me gray!* (clean professional), and *Clear as day!* (warm light). One click cycles through them; your choice is remembered.

- **Zoom control**  
  A header pill lets you scale the entire UI (80 % → 115 %) so the dashboard feels comfortable on any screen size or eyesight preference.

- **Mobile companion**  
  On phones the dashboard transforms into a route-led swipeable experience. Pick a route, swipe through cards, and share the view.

- **Shareable URLs**  
  Every filter, theme, zoom level, and baseline choice is encoded in the address bar. Copy the link and someone else sees exactly what you see.

- **Accessible by design**  
  Charts use patterns and line weight, not just colour, to communicate meaning. All text and interface elements meet WCAG contrast guidelines.

---

## Quick Start

You do **not** need to run anything locally to use traffiCOracle. The public instance loads instantly in a browser.

If you want to hack on the code or run it offline:

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| **Bun** | JavaScript runtime & package manager | `curl -fsSL https://bun.sh/install \| bash` |

### Run locally

```bash
# Clone the repository
git clone https://github.com/thecont1/traffic-oracle && cd traffic-oracle

# Install dependencies
bun install

# Start the development server
bun run dev
```

Open **http://localhost:5173**. No database, no API key, no `.env` file — the dashboard fetches live data automatically.

### Useful commands

```bash
bun run typecheck   # Check TypeScript types
bun test            # Run the test suite
bun run build       # Build for production
bun run deploy      # Deploy to Cloudflare Workers
```

---

## Data

### Where the data comes from

traffiCOracle reads two CSV files that are published by its sister project, **[traffic-monitor-lizard](https://github.com/thecont1/traffic-monitor-lizard)**. That project uses a small automated script to check Google Maps travel times every 30 minutes and appends the results to a public CSV on GitHub. traffiCOracle fetches those files directly from GitHub's raw-content CDN.

- **Routes file** — metadata about each monitored road (`csv-routes-bangalore.csv`)
- **Traffic file** — timestamped speed and duration readings (`csv-traffic-bangalore.csv`)

### Traffic data columns

| Column | Example | Meaning |
|--------|---------|---------|
| `date` | `2026-04-01` | Calendar date of the reading |
| `time` | `08:30` | Time of day (24-hour format) |
| `route_code` | `R-100` | Internal route identifier |
| `label_full` | `Hosur Road` | Human-readable route name |
| `label_short` | `Hosur Road` | Short display label |
| `duration` | `35` | Travel time in minutes |
| `distance` | `18` | Route distance in kilometres |

From `duration` and `distance`, traffiCOracle computes **average speed** (km/h) for every row.

### Data quality

Before any number reaches a chart, the dashboard silently discards rows that fail common-sense checks:

- Trips longer than 5 hours (`duration > 300`)
- Speeds above 150 km/h (impossible in city traffic)
- Unreadable or missing dates
- Missing distance values (defaulted to 10 km to avoid crashes)

After validation, rows are aggregated by week and by day, and filtered by the route and time-of-day you select.

### How often it updates

- **First load** downloads the full historical dataset (tens of thousands of rows).
- **Background refresh** checks for new data every few minutes. If the CSV on GitHub has changed, only the new rows are downloaded and merged in.
- **When the tab is hidden** polling pauses to save bandwidth and battery; it resumes automatically when you return.

---

## How it works

traffiCOracle is a **zero-backend** React app. That means there is no private server holding your data, no login gate, and no API key to configure.

```
Your Browser
     │
     ├─► fetches CSV from GitHub (public raw URLs)
     │
     ├─► parses the CSV inside the browser
     │
     ├─► validates, cleans, and aggregates the numbers
     │
     └─► draws charts, cards, and maps
```

Everything from the raw CSV download to the final chart pixel happens on your device. The only external dependency is the public GitHub repository that stores the raw traffic readings.

### Why percentiles matter

City traffic is not normally distributed: most trips cluster around a "typical" speed, but a single accident can create a long tail of very slow trips. Simple averages hide this. traffiCOracle uses **percentiles** — the same approach used by professional traffic services like INRIX and TomTom — so the "typical" band truly represents what most commuters experience.
