/* scrolly.js — Scrollama step detection + chart updates + GSAP animations */
const Scrolly = (function() {
  let scroller = null;
  let currentChart = null;

  // Chart title and section label mapping
  const chartMeta = {
    "s1-intro":    { title: "NammaMetro Ridership Data Source", section: "Act 1 — One Day" },
    "s1-earliest": { title: "Earliest Record — Payment Breakdown", section: "Act 1 — One Day" },
    "s1-latest":   { title: "Latest Record — Payment Breakdown", section: "Act 1 — One Day" },
    "s1-missing":  { title: "Missing Data Days", section: "Act 1 — One Day" },
    "s1-glance":   { title: "The Dataset at a Glance", section: "Act 1 — One Day" },
    "s2-intro":    { title: "NammaMetro Ridership Milestone", section: "Act 2 — Getting Crowded" },
    "s2-top10":    { title: "Top 10 Busiest Days", section: "Act 2 — Getting Crowded" },
    "s2-bottom10": { title: "10 Least Busy Days", section: "Act 2 — Getting Crowded" },
    "s3-7days":    { title: "Last 7 Days Ridership", section: "Act 3 — One Week" },
    "s3-dow":      { title: "Ridership by Day of Week", section: "Act 3 — One Week" },
    "s3-payment":  { title: "Payment Method by Day of Week", section: "Act 3 — One Week" },
    "s4-intro":    { title: "Three Traffic Bands Defined", section: "Act 4 — Traffic Bands" },
    "s4-crossover":{ title: "Commute vs Casual Crossover", section: "Act 4 — Traffic Bands" },
    "s5-monthly":  { title: "Monthly Ridership Estimates", section: "Act 5 — One Month" },
    "s5-boxplot":  { title: "Daily Ridership Spread (Boxplot)", section: "Act 5 — One Month" },
    "s5-ebbflow":  { title: "Ebb and Flow of Daily Traffic", section: "Act 5 — One Month" },
    "s5-wave":     { title: "A Wave Rides NammaMetro", section: "Act 5 — One Month" },
    "s6-sankranti":{ title: "Sankranti Period — Commute vs Casual", section: "Act 6 — Long Weekend" },
    "s6-towers":   { title: "Ridership Towers — Payment Methods", section: "Act 6 — Long Weekend" },
    "s7-visitor":  { title: "Visitor Pass Sales — Ranji Trophy", section: "Act 7 — Visitor Economy" },
    "s8-intro":    { title: "Fare Hike Overview", section: "Act 8 — Fare Hike" },
    "s8-trend":    { title: "6-Week Ridership Trend (R²=0.740)", section: "Act 8 — Fare Hike" },
    "s8-who":      { title: "Who Did It Hurt?", section: "Act 8 — Fare Hike" },
    "s8-ci":       { title: "Statistical Impact — Confidence Intervals", section: "Act 8 — Fare Hike" },
    "s8-heatmap":  { title: "Correlation Heatmap", section: "Act 8 — Fare Hike" },
    "s9-curious":  { title: "The Jan 15-16 Payment Disruption", section: "Act 9 — Conspiracy" },
    "s9-patterns": { title: "Examining the Patterns", section: "Act 9 — Conspiracy" },
    "s9-hypothesis": { title: "99.9% CI — Hypothesis Test", section: "Act 9 — Conspiracy" }
  };

  function updateChartPanel(chartKey) {
    if (chartKey === currentChart) return;
    currentChart = chartKey;

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

    // Render the chart
    Charts.render(chartKey);
  }

  function handleStepEnter(response) {
    const { element, index, direction } = response;
    const chartKey = element.getAttribute("data-chart");

    // Add active class to current step
    element.classList.add("active");

    // GSAP entrance animation
    if (typeof gsap !== "undefined") {
      gsap.fromTo(element,
        { opacity: 0.4, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }

    // Update chart panel
    updateChartPanel(chartKey);

    // Update TOC active link
    const section = element.closest(".act");
    if (section) {
      const sectionId = section.getAttribute("id");
      document.querySelectorAll(".sticky-toc ul li a").forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + sectionId);
      });
    }
  }

  function handleStepExit(response) {
    const { element } = response;
    element.classList.remove("active");
  }

  function handleStepProgress(response) {
    const { progress, element } = response;
    // Could use progress for chart animation, but keeping simple
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
      // Re-render current chart on resize
      if (currentChart) {
        setTimeout(() => Charts.render(currentChart), 100);
      }
    });

    // Render the first chart immediately
    const firstStep = document.querySelector(".step");
    if (firstStep) {
      const firstChart = firstStep.getAttribute("data-chart");
      updateChartPanel(firstChart);
    }
  }

  return { init };
})();
