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

// ANI-15: Custom Desktop Cursor with Volt O
function initCustomCursor() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const cursor = document.createElement("div");
  cursor.className = "fob-cursor-o";
  document.body.appendChild(cursor);

  window.addEventListener("mousemove", (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
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

// Scroll reveals for cards & sections
function initScrollReveals() {
  const revealItems = document.querySelectorAll(".fob-reveal");
  if (!revealItems.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
      }
    });
  }, { threshold: 0.15 });

  revealItems.forEach(item => observer.observe(item));
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
