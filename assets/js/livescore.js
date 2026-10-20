// FOB LiveScore & Top Football Competitions Sync Engine (PRD Section 7.4, 8: FR-09, FR-34, ANI-19)
// Enhanced Demo/Mock Feed — simulates live score changes for demonstration
import { loadData } from "./data.js";
import { createFixtureCardHTML } from "./fixtures.js";

let livePollingInterval = null;
let lastKnownGoalsCount = {};
let demoMode = true; // Demo mode simulates live score changes

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
  "Tottenham": ["Son Heung-min", "Richarlison", "James Maddison", "Dejan Kulusevski"]
};

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

  // Poll live scores every 30 seconds (PRD Section 7.4)
  livePollingInterval = setInterval(async () => {
    try {
      const data = await loadData("fixtures");
      if (data && data.fixtures) {
        // In demo mode, simulate score progression
        if (demoMode) {
          simulateLiveScoreChanges(data.fixtures);
        }
        checkForGoalUpdates(data.fixtures);
        rerenderLiveFixtures(data.fixtures);
      }
    } catch (e) {
      console.warn("LiveScore poll notice:", e);
    }
  }, 30000);
}

// Demo mode: randomly simulate a goal every ~2 minutes for live matches
function simulateLiveScoreChanges(fixtures) {
  fixtures.forEach(fix => {
    if (fix.status === "live" && Math.random() < 0.15) {
      // Simulate a goal!
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

      // Trigger the visual goal alert
      triggerGoalAlert(fix);
    }

    // Simulate match minute progression
    if (fix.status === "live" && fix.minute) {
      fix.minute = Math.min((fix.minute || 0) + 1, 90);

      // Auto-transition match periods
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

function rerenderLiveFixtures(fixtures) {
  const todayContainer = document.getElementById("fob-today-fixtures");
  const allContainer = document.getElementById("fob-all-fixtures");

  if (todayContainer) {
    const liveMatches = fixtures.filter(f => f.status === "live" || f.status === "finished");
    const listToRender = liveMatches.length > 0 ? liveMatches.slice(0, 3) : fixtures.slice(0, 3);
    todayContainer.innerHTML = listToRender.map(f => createFixtureCardHTML(f)).join("");
  }

  if (allContainer) {
    allContainer.innerHTML = fixtures.map(f => createFixtureCardHTML(f)).join("");
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
  // ANI-19: Goal Score Flash & Pulse
  const card = document.querySelector(`[data-fixture-id="${fixture.id}"]`);
  if (!card) return;

  const scoreEl = card.querySelector(".fob-fixture-card__score");
  if (scoreEl) {
    scoreEl.classList.add("is-goal-pop");
    setTimeout(() => scoreEl.classList.remove("is-goal-pop"), 1200);
  }

  // Toast / Badge Flash
  const banner = document.createElement("div");
  banner.className = "fob-goal-flash-banner";
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

      cards.forEach(card => {
        const cardComp = card.dataset.competition || "";
        if (comp === "all" || cardComp.toLowerCase().includes(comp.toLowerCase())) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}
