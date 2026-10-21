// FOB Motion, Scroll Behaviors & Cursor (PRD Section 10: ANI-05, ANI-10, ANI-15, ANI-18, 23.5)

export function initMotion() {
  initHeaderCompaction();
  initCountUp();
  initCustomCursor();
  initScrollReveals();
  initMarqueeIntersection();
}

// ANI-10: Header Compaction on Scroll
function initHeaderCompaction() {
  const header = document.querySelector(".fob-header");
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 120) {
          header.classList.add("fob-header--compact");
        } else {
          header.classList.remove("fob-header--compact");
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ANI-18: Count-up statistics on Trust Strip
function initCountUp() {
  const countElements = document.querySelectorAll("[data-fob-count]");
  if (!countElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetNum = parseInt(el.dataset.fobCount, 10);
        const suffix = el.dataset.fobSuffix || "";
        let current = 0;
        const step = Math.ceil(targetNum / 20) || 1;
        const timer = setInterval(() => {
          current += step;
          if (current >= targetNum) {
            current = targetNum;
            clearInterval(timer);
          }
          el.textContent = current + suffix;
        }, 35);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  countElements.forEach(el => observer.observe(el));
}

// ANI-15: Custom Desktop Cursor with Volt O (Hardware Accelerated)
function initCustomCursor() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  // Only init custom cursor on desktop with mouse pointer
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const cursor = document.createElement("div");
  cursor.className = "fob-cursor-o";
  document.body.appendChild(cursor);

  window.addEventListener("mousemove", (e) => {
    cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
  }, { passive: true });

  const interactiveElements = "a, button, input, select, details, [role='button']";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveElements)) {
      cursor.classList.add("is-hover");
    }
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveElements)) {
      cursor.classList.remove("is-hover");
    }
  });
}

// ANI-22: Progressive Scroll Reveals for Sections, Cards & Media (Zero Ongoing Overhead)
function initScrollReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".fob-reveal").forEach(el => el.classList.add("is-revealed"));
    return;
  }

  // Auto-target primary cards, specs, headers and media across all pages
  const targets = document.querySelectorAll(
    ".fob-spec-card, .fob-trust-item, .fob-accordion__item, .fob-cinematic-frame, .fob-zone-card, .fob-section-header, .fob-gallery-item"
  );
  if (!targets.length) return;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  targets.forEach((el) => {
    // If element is already in initial above-the-fold viewport, mark it revealed immediately to avoid flash of invisible content
    const rect = el.getBoundingClientRect();
    if (rect.top < viewportHeight && rect.bottom > 0) {
      el.classList.add("is-revealed");
      return;
    }
    el.classList.add("fob-reveal");

    // Add staggered delay to adjacent siblings within grids (up to 240ms max)
    const parent = el.parentElement;
    if (parent && (
      parent.classList.contains("fob-zone-specs-grid") ||
      parent.classList.contains("fob-gallery-strip") ||
      parent.classList.contains("fob-trust-strip__grid") ||
      parent.classList.contains("fob-zones-grid") ||
      parent.classList.contains("fob-gallery-grid")
    )) {
      const childIndex = Array.from(parent.children).indexOf(el);
      const delayMs = Math.min(childIndex * 60, 240);
      if (delayMs > 0) {
        el.style.transitionDelay = `${delayMs}ms`;
      }
    }
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        obs.unobserve(entry.target); // Unobserve immediately: zero ongoing cost after reveal
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

  document.querySelectorAll(".fob-reveal").forEach(el => observer.observe(el));
}

// ANI-05: Pause marquee when off-screen to save battery/CPU
function initMarqueeIntersection() {
  const marquee = document.querySelector(".fob-marquee");
  if (!marquee) return;

  const inner = marquee.querySelector(".fob-marquee__inner");
  if (!inner) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      inner.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
    });
  });

  observer.observe(marquee);
}
