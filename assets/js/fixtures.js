// FOB Fixtures Logic & Match-Day Screening Guide (PRD Version 2.0: Pure Match Screening Experience)
import { STALE_HOURS } from "./config.js";
import { whatsappUrl, fixtureMessage } from "./whatsapp.js";

export function effectiveStatus(fixture, now = Date.now()) {
  if (!fixture.statusUpdated) return fixture.venueStatus || "open";
  const age = now - Date.parse(fixture.statusUpdated);
  return age > STALE_HOURS * 3600000 ? "ask" : (fixture.venueStatus || "open");
}

export function formatFixtureTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "pm" : "am";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const minStr = minutes === 0 ? ":00" : `:${minutes.toString().padStart(2, "0")}`;
  return `${hours12}${minStr} ${period}`;
}

export function formatFixtureDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function getInitials(name) {
  if (!name) return "FOB";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function renderStatusChip(status, fixture) {
  const cleanStatus = (status || "").toLowerCase();

  if (fixture && fixture.date === "2026-10-20") {
    return `
      <span class="fob-live-badge" style="background: rgba(215, 255, 31, 0.15); border-color: var(--fob-volt); color: var(--fob-volt);">
        <span class="fob-live-badge__dot" style="background: var(--fob-volt); animation: none;"></span>
        Screening Tonight
      </span>
    `;
  }
  if (cleanStatus === "ask") {
    return `
      <span class="fob-status-chip fob-status-chip--ask" title="Live status unverified — ask staff on WhatsApp">
        <span class="fob-status-chip__dot"></span>
        Ask on WhatsApp
      </span>
    `;
  }
  if (cleanStatus === "filling up") {
    return `
      <span class="fob-status-chip fob-status-chip--filling-up">
        <span class="fob-status-chip__dot"></span>
        Filling Up
      </span>
    `;
  }
  if (cleanStatus === "full") {
    return `
      <span class="fob-status-chip fob-status-chip--full">
        <span class="fob-status-chip__dot"></span>
        Full House
      </span>
    `;
  }
  return `
    <span class="fob-status-chip fob-status-chip--open">
      <span class="fob-status-chip__dot"></span>
      Open Seating
    </span>
  `;
}

export function createFixtureCardHTML(fixture) {
  const venueStatus = effectiveStatus(fixture);
  const kickOffFormatted = formatFixtureTime(fixture.kickoff);
  const doorsFormatted = formatFixtureTime(fixture.doors);
  const dateFormatted = formatFixtureDate(fixture.date || fixture.kickoff);
  const matchTitle = `${fixture.home} vs ${fixture.away}`;
  const homeInitial = getInitials(fixture.home);
  const awayInitial = getInitials(fixture.away);
  const waAskUrl = whatsappUrl(fixtureMessage({ match: matchTitle, time: kickOffFormatted }));

  return `
    <article class="fob-fixture-card ${fixture.bigMatch ? 'fob-fixture-card--big-match' : ''}"
             data-fixture-id="${fixture.id}"
             data-competition="${fixture.competition || ''}">
      <div class="fob-fixture-card__top">
        <span class="fob-fixture-card__league">${fixture.competition || "Top Match"}</span>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${renderStatusChip(venueStatus, fixture)}
        </div>
      </div>

      <div class="fob-fixture-card__matchup-row">
        <!-- Home Team -->
        <div class="fob-fixture-card__team-col">
          <span class="fob-team-disc">${homeInitial}</span>
          <span class="fob-team-name">${fixture.home}</span>
        </div>

        <!-- Matchup Center Badge -->
        <div class="fob-fixture-card__score-center">
          <div class="fob-fixture-card__vs">VS</div>
          <span class="fob-fixture-card__period-tag">${dateFormatted}</span>
        </div>

        <!-- Away Team -->
        <div class="fob-fixture-card__team-col" style="align-items: flex-end;">
          <span class="fob-team-disc">${awayInitial}</span>
          <span class="fob-team-name" style="text-align: right;">${fixture.away}</span>
        </div>
      </div>

      ${fixture.bigMatch ? `
        <div style="background: rgba(255, 61, 165, 0.12); border-left: 3px solid var(--fob-magenta); padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.8rem; color: #FFF;">
          <strong>Big Match:</strong> ${fixture.note || "Massive crowd expected. Arrive right at doors-open time!"}
        </div>
      ` : ''}

      <div class="fob-fixture-card__times">
        <div>
          <span class="fob-fixture-card__time-label">Kick-Off</span>
          <span class="fob-fixture-card__time-val">${kickOffFormatted}</span>
        </div>
        <div>
          <span class="fob-fixture-card__time-label">Doors Open</span>
          <span class="fob-fixture-card__time-val" style="${fixture.bigMatch ? 'color: var(--fob-volt); font-weight: 800;' : ''}">${doorsFormatted}</span>
        </div>
      </div>

      <div class="fob-fixture-card__footer">
        <div class="fob-fixture-card__actions">
          <a href="/find-us/" class="fob-btn fob-btn--primary fob-btn--sm" data-fob-event="fixture_see_you_there">
            See you there
          </a>
          <a href="${waAskUrl}" target="_blank" rel="noopener noreferrer" class="fob-btn fob-btn--secondary fob-btn--sm" data-fob-event="fixture_ask_wa">
            Ask on WhatsApp
          </a>
          <button type="button" class="fob-btn fob-btn--secondary fob-btn--sm fob-share-btn"
                  data-share-title="${matchTitle} Screening at FOB"
                  data-share-text="${matchTitle} screening live at FOB viewing centre Lagos on ${dateFormatted} at ${kickOffFormatted}. Bring your crew!"
                  data-fob-event="fixture_share" aria-label="Send to crew">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}
