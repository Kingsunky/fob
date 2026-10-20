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

// Mobile Navigation Drawer Toggle
function initMobileNav() {
  const toggleBtn = document.querySelector(".fob-menu-toggle");
  const mobileNav = document.getElementById("fob-mobile-nav");
  const closeBtn = document.getElementById("fob-mobile-close-btn");

  if (!toggleBtn || !mobileNav) return;

  const openNav = () => {
    mobileNav.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeNav = () => {
    mobileNav.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  toggleBtn.addEventListener("click", openNav);
  if (closeBtn) closeBtn.addEventListener("click", closeNav);

  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeNav);
  });
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
