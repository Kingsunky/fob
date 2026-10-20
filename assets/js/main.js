// FOB Website Main Controller (PRD Version 1.4)
import { loadData } from "./data.js";
import { getOperatingStatus } from "./hours.js";
import { createFixtureCardHTML, isLiveMatch } from "./fixtures.js";
import { initLiveScoreSync } from "./livescore.js";
import { initMotion } from "./motion.js";
import { initShare } from "./share.js";
import { initTapTheOToy } from "./tap-the-o.js";
import { initAnalytics } from "./analytics.js";
import { initMapModule } from "./map.js";
import "./sheet.js"; // Bootstraps Lock it in sheet modal & global triggers

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize core visual & interaction modules
  initMotion();
  initShare();
  initTapTheOToy();
  initAnalytics();
  initMapModule();
  initMobileNav();
  initMobileDock();
  initTabs();
  initGalleryFilter();
  initLiveScoreSync();

  // 2. Load hours and update live status badges
  try {
    const hoursData = await loadData("hours");
    if (hoursData) {
      updateHoursUI(hoursData);
    }
  } catch (err) {
    console.warn("Hours module init notice:", err);
  }

  // 3. Load fixtures and render Today at FOB & All Fixtures
  try {
    const fixturesData = await loadData("fixtures");
    if (fixturesData && fixturesData.fixtures) {
      renderFixtures(fixturesData.fixtures);
      checkMatchDayHero(fixturesData.fixtures);
    }
  } catch (err) {
    console.warn("Fixtures module init notice:", err);
  }

  // 4. Register Service Worker for Light Offline Mode (FR-22)
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
});

// Mobile Navigation Drawer Toggle (WCAG 2.2 AA Focus & Aria Management)
function initMobileNav() {
  const toggleBtn = document.querySelector(".fob-menu-toggle");
  const mobileNav = document.getElementById("fob-mobile-nav");
  const closeBtn = document.getElementById("fob-mobile-close-btn");

  if (!toggleBtn || !mobileNav) return;

  toggleBtn.setAttribute("aria-expanded", "false");

  const openNav = () => {
    mobileNav.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  };

  const closeNav = () => {
    mobileNav.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    toggleBtn.focus();
  };

  toggleBtn.addEventListener("click", openNav);
  if (closeBtn) closeBtn.addEventListener("click", closeNav);

  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileNav.classList.contains("is-open")) {
      closeNav();
    }
  });
}

// Mobile-First Sticky Action Dock (Thumb-Zone Quick Actions)
function initMobileDock() {
  if (document.querySelector(".fob-mobile-dock")) return;

  const dock = document.createElement("nav");
  dock.className = "fob-mobile-dock";
  dock.setAttribute("aria-label", "Mobile Quick Actions");
  dock.innerHTML = `
    <button type="button" class="fob-btn fob-btn--primary fob-mobile-dock__cta" data-fob-sheet data-fob-event="mobile_dock_lock_it_in">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
      <span>Lock In</span>
    </button>
    <a href="/find-us/" class="fob-btn fob-btn--secondary fob-mobile-dock__btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      <span>Directions</span>
    </a>
    <a href="tel:+2348030000362" class="fob-btn fob-btn--secondary fob-mobile-dock__btn" aria-label="Call Centre">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
      <span>Call</span>
    </a>
  `;
  document.body.appendChild(dock);
}

// Built Around Your Night Tab Switcher (ANI-11)
function initTabs() {
  const tabBtns = document.querySelectorAll(".fob-tab-btn");
  const tabPanels = document.querySelectorAll(".fob-tab-panel");
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove("is-active"));
      tabPanels.forEach(p => p.classList.remove("is-active"));

      btn.classList.add("is-active");
      const targetPanel = document.getElementById(`tab-panel-${targetId}`);
      if (targetPanel) targetPanel.classList.add("is-active");
    });
  });
}

// Gallery Zone Filter
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll("[data-gallery-filter]");
  const galleryItems = document.querySelectorAll("[data-gallery-zone]");
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      const filter = btn.dataset.galleryFilter;

      galleryItems.forEach(item => {
        if (filter === "all" || item.dataset.galleryZone === filter) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  });
}

// Update Open Now status on Trust Strip
function updateHoursUI(hoursData) {
  const status = getOperatingStatus(hoursData);
  const badgeEl = document.getElementById("fob-live-hours-badge");
  const scheduleEl = document.getElementById("fob-live-hours-schedule");

  if (badgeEl) {
    badgeEl.textContent = status.isOpen ? "Open Now" : "Closed Now";
    badgeEl.className = `fob-status-chip ${status.isOpen ? 'fob-status-chip--open' : 'fob-status-chip--full'}`;
  }

  if (scheduleEl && status.todaySchedule) {
    scheduleEl.textContent = status.todaySchedule;
  }
}

// Render Fixture Cards into Home and Viewing Page
function renderFixtures(fixtures) {
  const todayContainer = document.getElementById("fob-today-fixtures");
  const allContainer = document.getElementById("fob-all-fixtures");

  const todayMatches = fixtures.filter(f => f.status === "live" || f.status === "finished" || f.date === "2026-10-20");

  if (todayContainer) {
    const listToRender = todayMatches.length > 0 ? todayMatches.slice(0, 3) : fixtures.slice(0, 3);
    todayContainer.innerHTML = listToRender.map(f => createFixtureCardHTML(f)).join("");
  }

  if (allContainer) {
    allContainer.innerHTML = fixtures.map(f => createFixtureCardHTML(f)).join("");
  }
}

// FR-21: Match-Day Hero Switch with LiveScore
function checkMatchDayHero(fixtures) {
  const heroBadge = document.getElementById("fob-hero-badge");
  const heroAction = document.getElementById("fob-hero-match-action");
  if (!heroBadge) return;

  const liveOrNextMatch = fixtures.find(f => f.status === "live") || fixtures[0];

  if (liveOrNextMatch) {
    const matchName = `${liveOrNextMatch.home} vs ${liveOrNextMatch.away}`;
    const scoreStr = liveOrNextMatch.score ? `(${liveOrNextMatch.score.home}-${liveOrNextMatch.score.away})` : '';
    const statusText = liveOrNextMatch.status === "live" ? `LIVE ${liveOrNextMatch.minute}'` : 'TONIGHT';

    heroBadge.innerHTML = `
      <span class="fob-live-badge__dot"></span>
      ${statusText}: ${matchName} ${scoreStr} • ${liveOrNextMatch.competition}
    `;
    heroBadge.style.borderColor = "var(--fob-magenta)";
    heroBadge.style.color = "var(--fob-volt)";

    if (heroAction) {
      heroAction.textContent = liveOrNextMatch.status === "live" ? "Watch Live Scores & Screen" : "See Today's Matches";
      heroAction.href = "/football-viewing/";
    }
  }
}
