// FOB Hours & Open Status Calculator (PRD Section 8: FR-10, Decision 30)
import { TIMEZONE } from "./config.js";

export function getLagosTime(date = new Date()) {
  const options = {
    timeZone: TIMEZONE,
    hour12: false,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;

  const weekday = map.weekday.toLowerCase();
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const isoDate = `${map.year}-${map.month}-${map.day}`;
  const minutesSinceMidnight = hour * 60 + minute;

  return { weekday, hour, minute, isoDate, minutesSinceMidnight };
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime12(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minuteStr = m === 0 ? "" : `:${m.toString().padStart(2, "0")}`;
  return `${hour12}${minuteStr} ${period}`;
}

export function getOperatingStatus(hoursData) {
  if (!hoursData || !hoursData.schedule) {
    return { isOpen: true, statusText: "Open Now", todaySchedule: "Morning: 7am–11am • Evening: 5pm–9pm" };
  }

  const { weekday, isoDate, minutesSinceMidnight } = getLagosTime();

  // Check special overrides first
  if (hoursData.specialOverrides && Array.isArray(hoursData.specialOverrides)) {
    const override = hoursData.specialOverrides.find(o => o.date === isoDate);
    if (override) {
      const openMin = parseTimeToMinutes(override.open);
      let closeMin = parseTimeToMinutes(override.close);
      if (closeMin <= openMin) closeMin += 24 * 60; // Next day

      const isOpen = minutesSinceMidnight >= openMin && minutesSinceMidnight < closeMin;
      return {
        isOpen,
        statusText: isOpen ? "Open Now (Special Hours)" : "Closed Now",
        todaySchedule: `${formatTime12(override.open)} – ${formatTime12(override.close)}`,
        note: override.reason
      };
    }
  }

  // Standard schedule check
  const daySched = hoursData.schedule[weekday];
  if (!daySched) {
    return { isOpen: true, statusText: "Open Today" };
  }

  // Dual-session schedule support
  if (Array.isArray(daySched.sessions) && daySched.sessions.length > 0) {
    let activeSession = null;
    let nextSession = null;

    for (const session of daySched.sessions) {
      const openMin = parseTimeToMinutes(session.open);
      let closeMin = parseTimeToMinutes(session.close);
      if (closeMin <= openMin) closeMin += 24 * 60;

      if (minutesSinceMidnight >= openMin && minutesSinceMidnight < closeMin) {
        activeSession = session;
        break;
      }
      if (minutesSinceMidnight < openMin && !nextSession) {
        nextSession = session;
      }
    }

    if (activeSession) {
      return {
        isOpen: true,
        activeSession: activeSession.name,
        statusText: `Open Now (${activeSession.name})`,
        todaySchedule: daySched.label || "Morning: 7am–11am • Evening: 5pm–9pm"
      };
    }

    // Currently closed
    let statusText = "Closed Now";
    let opensAt = null;

    if (nextSession) {
      opensAt = formatTime12(nextSession.open);
      statusText = `Closed (Opens ${opensAt} for ${nextSession.name})`;
    } else {
      // Past today's final session
      opensAt = weekday === "saturday" ? "Tomorrow 5:00 pm" : "Tomorrow 7:00 am";
      statusText = `Closed (Opens ${opensAt})`;
    }

    return {
      isOpen: false,
      statusText,
      todaySchedule: daySched.label || "Morning: 7am–11am • Evening: 5pm–9pm",
      opensAt
    };
  }

  // Fallback for single continuous range
  const openMin = parseTimeToMinutes(daySched.open);
  let closeMin = parseTimeToMinutes(daySched.close);
  if (closeMin <= openMin) closeMin += 24 * 60;

  const isOpen = minutesSinceMidnight >= openMin && minutesSinceMidnight < closeMin;

  return {
    isOpen,
    statusText: isOpen ? "Open Now" : "Closed Now",
    todaySchedule: daySched.label || `${formatTime12(daySched.open)} – ${formatTime12(daySched.close)}`,
    opensAt: !isOpen ? formatTime12(daySched.open) : null
  };
}

export function getZoneOperatingStatus(zoneKey, hoursData) {
  const { weekday } = getLagosTime();
  const baseStatus = getOperatingStatus(hoursData);

  // Sunday gym rule: strictly closed
  if (zoneKey === "gym" && weekday === "sunday") {
    return {
      isOpen: false,
      statusText: "Closed on Sundays",
      todaySchedule: "Closed on Sundays (Mon–Sat: 7am–11am & 5pm–9pm)",
      opensAt: "Monday 7:00 am"
    };
  }

  // Sunday pitch and hoops rule: evening session only
  if ((zoneKey === "football-pitch" || zoneKey === "basketball") && weekday === "sunday") {
    return {
      ...baseStatus,
      todaySchedule: "Sunday: Evening Session only (5:00 pm – 9:00 pm)"
    };
  }

  return baseStatus;
}
