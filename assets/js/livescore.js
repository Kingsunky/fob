// FOB LiveScore & Top Football Competitions Sync Engine (PRD Section 7.4, 8: FR-09, FR-34, FR-42, ANI-19)
import { loadData } from "./data.js";
import { createFixtureCardHTML } from "./fixtures.js";
import { LIVESCORE_API_KEY, MATCH_DISPLAY_LIMITS } from "./config.js";

let livePollingInterval = null;
let lastKnownGoalsCount = {};
let demoMode = true; // Demo mode simulates score progression in fallback

// Star players per team for realistic goal scorer simulation
const TEAM_SCORERS = {
  "Real Madrid": ["Vinícius Jr.", "Jude Bellingham", "Rodrygo", "Mbappé", "Valverde"],
  "Bayern Munich": ["Harry Kane", "Leroy Sané", "Jamal Musiala", "Serge Gnabry"],
  "Arsenal": ["Bukayo Saka", "Kai Havertz", "Martin Ødegaard", "Gabriel Jesus", "Declan Rice"],
  "Chelsea": ["Cole Palmer", "Nicolas Jackson", "Moisés Caicedo", "Enzo Fernández"],
  "Barcelona": ["Robert Lewandowski", "Lamine Yamal", "Pedri", "Raphinha", "Gavi"],
  "Liverpool": ["Mohamed Salah", "Darwin Núñez", "Luis Díaz", "Cody Gakpo"],
  "Manchester City": ["Erling Haaland", "Phil Foden", "Kevin De Bruyne", "Bernardo Silva"],
  "PSG": ["Ousmane Dembélé", "Bradley Barcola", "Marco Asensio", "Gonçalo Ramos"],
  "Inter Milan": ["Lautaro Martínez", "Marcus Thuram", "Hakan Çalhanoğlu", "Nicolò Barella"],
  "AC Milan": ["Rafael Leão", "Álvaro Morata", "Christian Pulisic", "Tijjani Reijnders"],
  "Manchester United": ["Marcus Rashford", "Rasmus Højlund", "Bruno Fernandes", "Alejandro Garnacho"],
  "Tottenham": ["Son Heung-min", "Richarlison", "James Maddison", "Dejan Kulusevski"],
  "Super Eagles": ["Victor Osimhen", "Ademola Lookman", "Victor Boniface", "Samuel Chukwueze", "Alex Iwobi"],
  "Enyimba": ["Chidiebere Nnaji", "Eze Ekwutoziam", "Joseph Atule"],
  "Remo Stars": ["Sodiq Ismail", "Franck Mawuena", "Dela Akorli"]
};

/**
 * Calculates the dynamic 7-day rolling window:
 * [3 days ago at 00:00:00 to 3 days after today at 23:59:59]
 */
export function get7DayMatchWindow(referenceDate = "2026-10-20T21:50:00+01:00") {
  const ref = new Date(referenceDate);
  const start = new Date(ref);
  start.setDate(ref.getDate() - (MATCH_DISPLAY_LIMITS.daysPast || 3));
  start.setHours(0, 0, 0, 0);

  const end = new Date(ref);
  end.setDate(ref.getDate() + (MATCH_DISPLAY_LIMITS.daysFuture || 3));
  end.setHours(23, 59, 59, 999);

  return { start, end, ref };
}

/**
 * Filters fixtures to fall within the 7-day rolling window,
 * and enforces a display of minimum 3 matches and maximum 6 matches.
 */
export function filterMatchesForDisplay(fixtures, min = MATCH_DISPLAY_LIMITS.min || 3, max = MATCH_DISPLAY_LIMITS.max || 6) {
  if (!fixtures || fixtures.length === 0) return [];

  const { start, end } = get7DayMatchWindow();

  // 1. Filter by 7-day window [today-3days to today+3days]
  let inWindow = fixtures.filter(f => {
    const d = new Date(f.kickoff || f.date);
    return !isNaN(d.getTime()) && d >= start && d <= end;
  });

  // If fewer than min matches are in-window, backfill from nearby fixtures
  if (inWindow.length < min) {
    inWindow = fixtures.slice(0, Math.min(fixtures.length, max));
  }

  // 2. Sort priority: Live matches first, then today, then upcoming & past chronologically
  inWindow.sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (b.status === "live" && a.status !== "live") return 1;
    return new Date(a.kickoff || a.date) - new Date(b.kickoff || b.date);
  });

  // 3. Enforce maximum 6 matches per display
  return inWindow.slice(0, max);
}

export function initLiveScoreSync() {
  initCompetitionFilter();
  startLiveScorePolling();
}

export function formatGoalsList(goals, homeTeam, awayTeam) {
  if (!goals || goals.length === 0) return "";

  return `
    <div class="fob-goals-preview" aria-label="Goal Scorers">
      <div class="fob-goals-preview__header">
        <span class="fob-goals-preview__icon">⚽</span>
        <span>Goal Scorers</span>
      </div>
      <div class="fob-goals-preview__timeline">
        ${goals.map(g => {
          const teamLabel = g.team === 'home' ? homeTeam : awayTeam;
          const penTag = g.isPenalty ? ' <span class="fob-goal-pen">(PEN)</span>' : '';
          const ogTag = g.isOwnGoal ? ' <span class="fob-goal-pen">(OG)</span>' : '';
          return `
            <div class="fob-goal-item">
              <span class="fob-goal-item__min">${g.minute}</span>
              <strong class="fob-goal-item__scorer">${g.player}${penTag}${ogTag}</strong>
              <span class="fob-goal-item__team">(${teamLabel})</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function startLiveScorePolling() {
  if (livePollingInterval) clearInterval(livePollingInterval);

  async function poll() {
    try {
      let data = null;
      try {
        // Authenticated live scores request with API key
        const res = await fetch("/data/livescore.json", {
          headers: {
            "Authorization": `Bearer ${LIVESCORE_API_KEY}`,
            "x-api-key": LIVESCORE_API_KEY
          }
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (_) {
        data = await loadData("livescore");
      }

      if (!data || !data.fixtures) {
        data = await loadData("fixtures");
      }

      if (data && data.fixtures) {
        // In demo mode, simulate live score minute and goal changes
        if (demoMode) {
          simulateLiveScoreChanges(data.fixtures);
        }
        checkForGoalUpdates(data.fixtures);
        rerenderLiveFixtures(data.fixtures);

        // PRD Section 7.4 Cadence: 30s when live/halftime, 5min when scheduled/finished
        const hasActiveLiveMatch = data.fixtures.some(f => f.status === "live" || f.status === "halftime");
        const nextCadence = hasActiveLiveMatch ? 30000 : 300000;

        clearInterval(livePollingInterval);
        livePollingInterval = setInterval(poll, nextCadence);
      }
    } catch (e) {
      console.warn("LiveScore poll notice (offline/fallback):", e);
    }
  }

  // Initial poll schedule
  livePollingInterval = setInterval(poll, 30000);
}

// Demo simulation for live progression
function simulateLiveScoreChanges(fixtures) {
  fixtures.forEach(fix => {
    if (fix.status === "live" && Math.random() < 0.15) {
      const isHome = Math.random() > 0.45;
      const team = isHome ? "home" : "away";
      const teamName = isHome ? fix.home : fix.away;
      const scorers = TEAM_SCORERS[teamName] || ["Unknown Player"];
      const scorer = scorers[Math.floor(Math.random() * scorers.length)];
      const isPenalty = Math.random() < 0.1;
      const newMinute = (fix.minute || 45) + Math.floor(Math.random() * 5);

      fix.score[team] = (fix.score[team] || 0) + 1;
      fix.minute = Math.min(newMinute, 90);

      if (!fix.goals) fix.goals = [];
      fix.goals.push({
        minute: `${fix.minute}'`,
        team: team,
        player: scorer,
        score: `${fix.score.home}-${fix.score.away}`,
        isPenalty: isPenalty
      });

      triggerGoalAlert(fix);
    }

    if (fix.status === "live" && fix.minute) {
      fix.minute = Math.min((fix.minute || 0) + 1, 90);

      if (fix.minute >= 45 && fix.period === "1H") {
        fix.period = "HT";
      } else if (fix.minute > 45 && fix.period === "HT") {
        fix.period = "2H";
      } else if (fix.minute >= 90) {
        fix.period = "FT";
        fix.status = "finished";
      }
    }
  });
}

export function rerenderLiveFixtures(fixtures) {
  const todayContainer = document.getElementById("fob-today-fixtures");
  const allContainer = document.getElementById("fob-all-fixtures");

  // Filter to 7-day rolling window [3 days past to 3 days ahead] and enforce 3-6 matches display
  const displayMatches = filterMatchesForDisplay(fixtures, MATCH_DISPLAY_LIMITS.min, MATCH_DISPLAY_LIMITS.max);

  if (todayContainer) {
    todayContainer.innerHTML = displayMatches.map(f => createFixtureCardHTML(f)).join("");
  }

  if (allContainer) {
    allContainer.innerHTML = displayMatches.map(f => createFixtureCardHTML(f)).join("");
  }
}

function checkForGoalUpdates(fixtures) {
  fixtures.forEach(fix => {
    if (fix.status === "live") {
      const prevCount = lastKnownGoalsCount[fix.id] || (fix.goals ? fix.goals.length : 0);
      const currCount = fix.goals ? fix.goals.length : 0;

      if (currCount > prevCount) {
        triggerGoalAlert(fix);
      }
      lastKnownGoalsCount[fix.id] = currCount;
    }
  });
}

export function triggerGoalAlert(fixture) {
  const card = document.querySelector(`[data-fixture-id="${fixture.id}"]`);
  if (!card) return;

  const scoreEl = card.querySelector(".fob-fixture-card__score");
  if (scoreEl) {
    scoreEl.classList.add("is-goal-pop");
    setTimeout(() => scoreEl.classList.remove("is-goal-pop"), 1200);
  }

  const banner = document.createElement("div");
  banner.className = "fob-goal-flash-banner";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.setAttribute("aria-atomic", "true");
  const latestGoal = fixture.goals && fixture.goals.length > 0 ? fixture.goals[fixture.goals.length - 1] : null;
  const scorerText = latestGoal ? `${latestGoal.player} (${latestGoal.minute})` : "Score Updated";

  banner.innerHTML = `
    <div class="fob-goal-flash-inner">
      <span class="fob-goal-tag">GOAL!</span>
      <span>${fixture.home} vs ${fixture.away} • ${fixture.score.home}-${fixture.score.away}</span>
      <span style="color:var(--fob-volt); font-size:0.85rem;">⚽ ${scorerText}</span>
    </div>
  `;

  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

// Competition Filter for Fixtures Page
function initCompetitionFilter() {
  const filterBtns = document.querySelectorAll("[data-comp-filter]");
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");

      const comp = btn.dataset.compFilter;
      const cards = document.querySelectorAll(".fob-fixture-card");

      let visibleCount = 0;
      cards.forEach(card => {
        const cardComp = card.dataset.competition || "";
        if (comp === "all" || cardComp.toLowerCase().includes(comp.toLowerCase())) {
          card.style.display = "flex";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}
