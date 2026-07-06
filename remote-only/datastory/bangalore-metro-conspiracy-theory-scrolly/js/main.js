/* main.js — Progress bar, TOC nav, init */
(function() {
  // ── Progress Bar ──────────────────────────────────────────────────
  function updateProgressBar() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const pct = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;
    const fill = document.getElementById("progress-fill");
    if (fill) fill.style.width = pct + "%";
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
        updateProgressBar();
        updateActiveTOC();
        ticking = false;
      });
      ticking = true;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    initContents();
    initMobileMenu();
    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgressBar();

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
      gsap.from(".datastory-header .post-hero", { opacity: 0, duration: 1, delay: 0.4, ease: "power2.out" });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
