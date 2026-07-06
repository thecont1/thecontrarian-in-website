# CHANGELOG — NammaMetro: The Conspiracy Theory (Scrollytelling Reconstruction)

## 2025-07-06: Initial Build

### Source
Reconstructed from Jupyter notebook HTML output by Mahesh Shantaram (2025-02-28).
Original notebook analyzed NammaMetro ridership data from `english.bmrc.co.in/ridership/`.

### What Was Built
- **Static scrollytelling site** with 9 narrative sections ("Acts")
- **D3 v7 charts** rendered in a sticky panel that updates as the user scrolls
- **Scrollama** for scroll-driven step detection
- **GSAP** for entrance animations and chart panel transitions
- **Progress bar** and **TOC navigation** for orientation
- **Responsive layout**: 375px mobile (stacked) → 1920px desktop (side-by-side)
- **Zero build step**: pure HTML/CSS/JS, all vendor libs downloaded locally

### Data Accuracy
All hard numbers from the notebook are preserved exactly:
- Earliest/latest records (Oct 26, 2024 / May 5, 2025)
- Top 10 / bottom 10 busiest days
- Weekly average ridership by payment method
- Commute vs Casual crossover table
- Monthly estimated ridership (Nov 2024 – Apr 2025)
- R² values (0.740 trend, 0.105 casual, 0.005 commuter)
- 99% / 95% / 99.9% confidence interval tables
- Correlation matrix values (0.79, 0.81, -0.73, -0.88, etc.)
- Jan 15-16 disruption data (Smart Cards 550K/650K, Tokens 90K, QR ~0)

### Reconstructed / Approximated Data
The following datasets were reconstructed from narrative descriptions since the original notebook's full daily CSV was not available in the HTML output:

1. **`dailyFlow`** (Section 5): Reconstructed ~100 days of daily total ridership showing weekly patterns with weekend dips. Values are approximate but follow the described patterns.
2. **`waveData`** (Section 5): Reconstructed Commute vs Casual daily values for the dual-axis wave chart. Based on weekly averages and described inverse relationship.
3. **`boxplotData`** (Section 5): Boxplot statistics (Q1, median, Q3, min, max, outliers) reconstructed from described patterns. Outlier values are exact (from top/bottom 10 tables).
4. **`sankrantiPeriod`** (Section 6): Reconstructed daily Commute/Casual values for Jan 6-31, 2025, showing the Sankranti dip and Jan 15-16 anomaly.
5. **`ridershipTowers`** (Section 6): Reconstructed daily payment method breakdown for Jan 2025.
6. **`visitorPassData`** (Section 7): Reconstructed pass sales around Jan 25 (Ranji Trophy). The ~1,750 One-Day Pass spike is from the narrative; surrounding days are estimated.
7. **`fareHikeWindow`** (Section 8): Reconstructed 6-week daily ridership around Feb 9 fare hike. Pre-event averages match 874K weekday / post-event 777K.
8. **`disruptionData`** (Section 9): Reconstructed Jan 13-18 daily payment breakdown showing the Token/QR disruption and Smart Card surge.

### Deviations from Original
- **Photos**: Replaced with placeholder boxes (original photos are copyrighted by Mahesh Shantaram). Captions and credits preserved.
- **Interactive plots**: Original notebook used Plotly for some charts; reconstructed using D3 v7 for all visualizations.
- **Day-of-week line plots** (Section 3): Original showed 7 separate small multiples; simplified to a grouped bar chart for the sticky panel format.
- **Ridership towers** (Section 6): Original showed separate stacked bar charts; combined into a single stacked bar chart.
- **Correlation heatmap** (Section 8): Full 6×6 matrix reconstructed from the 4 explicitly stated correlation values + inferred values for remaining cells.

### File Structure
```
bangalore-metro-conspiracy-theory-scrolly/
├── index.html          # Full 9-section scrollytelling HTML
├── css/
│   └── style.css       # Responsive layout, callouts, dark theme
├── js/
│   ├── data.js         # All extracted data (METRO_DATA object)
│   ├── charts.js       # D3 v7 chart functions (Charts module)
│   ├── scrolly.js      # Scrollama step detection + chart updates
│   └── main.js         # Progress bar, TOC nav, init
├── lib/
│   ├── d3.min.js       # D3 v7 (local)
│   ├── scrollama.min.js # Scrollama 2.2.0 (local)
│   ├── gsap.min.js     # GSAP 3.12.5 (local)
│   └── ScrollTrigger.min.js # GSAP ScrollTrigger (local)
└── CHANGELOG.md        # This file
```

### To Run
Open `index.html` in any modern browser. No server required, but a local server is recommended for proper module loading:
```bash
python3 -m http.server 8000
# or
npx serve .
```
