// FOB Hours & Open Status Calculator (PRD Section 8: FR-10, 23.5)
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
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime12(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minuteStr = m === 0 ? "" : `:${m.toString().padStart(2, "0")}`;
  return `${hour12}${minuteStr} ${period}`;
}

export function getOperatingStatus(hoursData) {
  if (!hoursData || !hoursData.schedule) {
    return { isOpen: true, statusText: "Open Now", badgeClass: "fob-status-chip--open" };
  }

  const { weekday, isoDate, minutesSinceMidnight } = getLagosTime();

  // Check special overrides first
  if (hoursData.specialOverrides) {
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

  const openMin = parseTimeToMinutes(daySched.open);
  let closeMin = parseTimeToMinutes(daySched.close);
  if (closeMin <= openMin) closeMin += 24 * 60; // Handles 1:00 am next day

  const isOpen = minutesSinceMidnight >= openMin && minutesSinceMidnight < closeMin;

  return {
    isOpen,
    statusText: isOpen ? "Open Now" : "Closed Now",
    todaySchedule: daySched.label || `${formatTime12(daySched.open)} – ${formatTime12(daySched.close)}`,
    opensAt: !isOpen ? formatTime12(daySched.open) : null
  };
}
