/* scrolly.js — Scrollama step detection + sub-step model + chart updates */
const Scrolly = (function() {
  let scroller = null;
  let currentChart = null;
  let currentSubstep = null;

  // Chart title and section label mapping
  const chartMeta = {
    "s1-intro":      { title: "NammaMetro Ridership Data Source", section: "Act 1 — One Day" },
    "s1-records":    { title: "First Day vs Last Day — Payment Methods", section: "Act 1 — One Day" },
    "s1-calendar":   { title: "Calendar Heatmap — Daily Ridership", section: "Act 1 — One Day" },
    "s1-glance":     { title: "The Dataset at a Glance", section: "Act 1 — One Day" },
    "s2-intro":      { title: "NammaMetro Ridership Milestone", section: "Act 2 — Getting Crowded" },
    "s2-milestone":  { title: "Ridership Milestone Timeline", section: "Act 2 — Getting Crowded" },
    "s2-top10":      { title: "Top 10 Busiest Days", section: "Act 2 — Getting Crowded" },
    "s2-bottom10":   { title: "Top 10 vs 10 Least Busy Days", section: "Act 2 — Getting Crowded" },
    "s3-7days":      { title: "Last 7 Days Ridership", section: "Act 3 — One Week" },
    "s3-dow":        { title: "Ridership by Day of Week", section: "Act 3 — One Week" },
    "s3-payment":    { title: "Payment Method by Day of Week", section: "Act 3 — One Week" },
    "s4-intro":      { title: "Three Traffic Bands Defined", section: "Act 4 — Traffic Bands" },
    "s4-crossover":  { title: "Commute vs Casual Crossover", section: "Act 4 — Traffic Bands" },
    "s4-bands":      { title: "Traffic Band Callouts", section: "Act 4 — Traffic Bands" },
    "s5-monthly":    { title: "Monthly Ridership Estimates", section: "Act 5 — One Month" },
    "s5-boxplot":    { title: "Daily Ridership Spread (Boxplot)", section: "Act 5 — One Month" },
    "s5-ebbflow":    { title: "Ebb and Flow of Daily Traffic", section: "Act 5 — One Month" },
    "s5-wave":       { title: "A Wave Rides NammaMetro", section: "Act 5 — One Month" },
    "s6-sankranti":  { title: "Sankranti Period — Commute vs Casual", section: "Act 6 — Long Weekend" },
    "s6-towers":     { title: "Ridership Towers — Payment Methods", section: "Act 6 — Long Weekend" },
    "s6-split":      { title: "Jan 15-16 Split-Screen", section: "Act 6 — Long Weekend" },
    "s7-visitor":    { title: "Visitor Pass Sales — Ranji Trophy", section: "Act 7 — Visitor Economy" },
    "s8-intro":      { title: "Fare Hike Overview", section: "Act 8 — Fare Hike" },
    "s8-trend":      { title: "6-Week Ridership Trend (R²=0.740)", section: "Act 8 — Fare Hike" },
    "s8-who":        { title: "Who Did It Hurt?", section: "Act 8 — Fare Hike" },
    "s8-ci":         { title: "Statistical Impact — Confidence Intervals", section: "Act 8 — Fare Hike" },
    "s8-heatmap":    { title: "Correlation Heatmap", section: "Act 8 — Fare Hike" },
    "s9-curious":    { title: "The Jan 15-16 Payment Disruption", section: "Act 9 — Conspiracy" },
    "s9-patterns":   { title: "Examining the Patterns", section: "Act 9 — Conspiracy" },
    "s9-hypothesis": { title: "99.9% CI — Hypothesis Test", section: "Act 9 — Conspiracy" }
  };

  // Scoreboard focus mapping: which payment methods to highlight per chart key
  const scoreboardFocus = {
    "s1-earliest":   ["smartCards","ncmc","tokens","qr","groupTicket"],
    "s1-latest":     ["smartCards","ncmc","tokens","qr","groupTicket"],
    "s3-payment":    ["smartCards","ncmc","tokens","qr"],
    "s4-crossover":  ["smartCards","tokens"],
    "s6-towers":     ["smartCards","ncmc","tokens","qr"],
    "s8-trend":      [],
    "s8-ci":         ["smartCards","ncmc","tokens","qr"],
    "s9-curious":    ["smartCards","tokens","qr"],
    "s9-hypothesis": ["smartCards","tokens","qr","ncmc"]
  };

  function updateScoreboard(chartKey, substep) {
    const focus = scoreboardFocus[chartKey] || [];
    document.querySelectorAll('.payment-chip').forEach(chip => {
      const method = chip.getAttribute('data-method');
      chip.classList.toggle('focused', focus.includes(method));
    });

    // Update chip values based on chart context
    const data = METRO_DATA;
    let values = null;
    if (chartKey === 's1-earliest') values = data.section1.earliestRecord;
    else if (chartKey === 's1-latest') values = data.section1.latestRecord;
    
    if (values) {
      const fmt = v => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v;
      const setChip = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
      setChip('chip-smartCards', values.totalSmartCards);
      setChip('chip-ncmc', values.totalNCMC);
      setChip('chip-tokens', values.totalTokens);
      setChip('chip-qr', values.totalQR);
      setChip('chip-groupTicket', values.groupTicket);
      document.getElementById('scoreboard-date').textContent = values.date;
    } else {
      document.getElementById('scoreboard-date').textContent = 'Oct 26, 2024 – May 5, 2025';
    }
  }

  function updateProgressBar(actNum) {
    document.querySelectorAll('.progress-segment').forEach(seg => {
      const segAct = parseInt(seg.getAttribute('data-act'));
      seg.classList.remove('active', 'completed');
      if (segAct < actNum) seg.classList.add('completed');
      else if (segAct === actNum) seg.classList.add('active');
    });
  }

  function updateChartPanel(chartKey, substep, direction) {
    const key = chartKey + ':' + substep;
    if (key === currentChart + ':' + currentSubstep) return;

    const meta = chartMeta[chartKey] || { title: chartKey, section: "" };
    const titleEl = document.getElementById("chart-title");
    const labelEl = document.getElementById("chart-section-label");

    // GSAP fade transition for title
    if (typeof gsap !== "undefined") {
      gsap.to([titleEl, labelEl], {
        opacity: 0, duration: 0.2, onComplete: () => {
          titleEl.textContent = meta.title;
          labelEl.textContent = meta.section;
          gsap.to([titleEl, labelEl], { opacity: 1, duration: 0.3 });
        }
      });
    } else {
      titleEl.textContent = meta.title;
      labelEl.textContent = meta.section;
    }

    // Determine if this is a substep update or a new chart
    const isSubstepUpdate = chartKey === currentChart && substep !== currentSubstep;
    
    if (isSubstepUpdate && typeof Charts.update === "function") {
      // Sub-step update: mutate existing chart
      Charts.update(chartKey, substep, direction);
    } else {
      // New chart: full render
      Charts.render(chartKey, substep);
    }

    // Update scoreboard
    updateScoreboard(chartKey, substep);

    // Update ARIA label on chart wrapper
    const wrapper = document.getElementById("chart-svg-wrapper");
    if (wrapper) {
      wrapper.setAttribute("aria-label", meta.title + " — " + meta.section);
    }

    currentChart = chartKey;
    currentSubstep = substep;
  }

  function handleStepEnter(response) {
    const { element, index, direction } = response;
    const chartKey = element.getAttribute("data-chart");
    const substep = element.getAttribute("data-substep") || "0";

    // Add active class to current step
    element.classList.add("active");

    // GSAP entrance animation: scroll in from the direction of travel
    if (typeof gsap !== "undefined") {
      gsap.killTweensOf(element);
      const fromY = direction === "down" ? 60 : -60;
      gsap.fromTo(element,
        { opacity: 0, y: fromY },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", overwrite: true }
      );
    }

    // Update chart panel
    updateChartPanel(chartKey, parseInt(substep), direction);

    // Update progress bar based on act
    const section = element.closest(".act");
    if (section) {
      const actNum = parseInt(section.getAttribute("data-section"));
      updateProgressBar(actNum);

      // Update TOC active link
      const sectionId = section.getAttribute("id");
      document.querySelectorAll(".sticky-toc ul li a").forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + sectionId);
      });
    }
  }

  function handleStepExit(response) {
    const { element, direction } = response;

    // GSAP exit animation: scroll out and vanish before removing the active state
    if (typeof gsap !== "undefined") {
      gsap.killTweensOf(element);
      const toY = direction === "down" ? -60 : 60;
      gsap.to(element, {
        opacity: 0, y: toY, duration: 0.5, ease: "power2.in",
        onComplete: () => {
          element.classList.remove("active");
          gsap.set(element, { y: 0 });
        }
      });
    } else {
      element.classList.remove("active");
    }
  }

  function init() {
    if (typeof scrollama === "undefined") {
      console.error("Scrollama not loaded");
      return;
    }

    scroller = scrollama();
    scroller.setup({
      step: ".step",
      offset: 0.55,
      progress: false,
      debug: false
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(handleStepExit);

    // Handle resize
    window.addEventListener("resize", () => {
      if (scroller) scroller.resize();
      if (currentChart) {
        setTimeout(() => Charts.render(currentChart, currentSubstep), 100);
      }
    });

    // Render the first chart immediately
    const firstStep = document.querySelector(".step");
    if (firstStep) {
      const firstChart = firstStep.getAttribute("data-chart");
      const firstSubstep = firstStep.getAttribute("data-substep") || "0";
      updateChartPanel(firstChart, parseInt(firstSubstep), "down");
    }
  }

  return { init };
})();
