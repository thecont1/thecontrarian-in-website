/* main.js — Hero counter, progress bar, TOC nav, init */
(function() {
  // ── Hero Counter Animation ────────────────────────────────────────
  function initHeroCounter() {
    const counter = document.getElementById('hero-counter');
    if (!counter) return;
    const target = METRO_DATA.meta.cumulativeRidership;
    counter.setAttribute('data-target', target);
    
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      counter.textContent = target.toLocaleString();
      return;
    }

    const duration = 2000;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(eased * target);
      counter.textContent = value.toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
      else counter.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  // ── Progress Bar (9-segment, handled by scrolly.js) ───────────────
  function updateProgressBar() {
    // Progress bar segments are now managed by scrolly.js based on active act.
    // This function is kept for backward compatibility but does nothing.
  }

  // ── Contents Sidebar Toggle ───────────────────────────────────────
  function initContents() {
    const toggle = document.getElementById("toc-toggle");
    const sidebar = document.getElementById("toc-sidebar");
    const overlay = document.getElementById("toc-overlay");
    if (!toggle || !sidebar) return;

    function open() {
      sidebar.classList.add("open");
      if (overlay) overlay.classList.add("visible");
      toggle.classList.add("active");
    }
    function close() {
      sidebar.classList.remove("open");
      if (overlay) overlay.classList.remove("visible");
      toggle.classList.remove("active");
    }

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains("open")) close(); else open();
    });

    if (overlay) overlay.addEventListener("click", close);

    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Smooth scroll on click
    sidebar.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href");
        const target = document.querySelector(targetId);
        if (target) {
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: "smooth" });
          close();
        }
      });
    });
  }

  // ── Mobile menu toggle ─────────────────────────────────────────────
  function initMobileMenu() {
    const btn = document.querySelector(".mobile-menu-toggle");
    const nav = document.querySelector(".site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      nav.classList.toggle("mobile-open");
      btn.classList.toggle("active");
    });
  }

  // ── Active TOC link on scroll ─────────────────────────────────────
  function updateActiveTOC() {
    const acts = document.querySelectorAll(".act");
    let activeSection = null;
    const scrollPos = window.scrollY + window.innerHeight * 0.4;

    acts.forEach(act => {
      const top = act.offsetTop;
      const bottom = top + act.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        activeSection = act.getAttribute("id");
      }
    });

    if (activeSection) {
      document.querySelectorAll(".sticky-toc ul li a").forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + activeSection);
      });
    }
  }

  // ── Scroll handler (throttled) ────────────────────────────────────
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveTOC();
        ticking = false;
      });
      ticking = true;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    initHeroCounter();
    initContents();
    initMobileMenu();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Initialize Scrollama after DOM is ready
    if (typeof Scrolly !== "undefined") {
      Scrolly.init();
    }

    // Register GSAP ScrollTrigger if available
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Datastory header entrance animation
    if (typeof gsap !== "undefined") {
      gsap.from(".datastory-header .post-title", { y: 30, opacity: 0, duration: 1, ease: "power3.out" });
      gsap.from(".datastory-header .post-subtitle", { y: 20, opacity: 0, duration: 0.8, delay: 0.3, ease: "power3.out" });
      gsap.from(".datastory-header .post-author-line", { y: 15, opacity: 0, duration: 0.6, delay: 0.5, ease: "power3.out" });
      gsap.from(".datastory-header .post-date-line", { y: 15, opacity: 0, duration: 0.6, delay: 0.6, ease: "power3.out" });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
