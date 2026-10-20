// FOB WhatsApp URL & Message Generator (PRD Section 5, 23.5)
import { WHATSAPP_NUMBER } from "./config.js";

export function whatsappUrl(message) {
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
}

export function zoneMessage({ zone, date = "today", time = "evening", people = "a crew" }) {
  return `Hi FOB, I'd like to book ${zone} on ${date} at ${time} for ${people} people.`;
}

export function fixtureMessage({ match, time = "match time" }) {
  return `Hi FOB, is there space for ${match} at ${time}?`;
}

export function eventMessage({ eventType = "private event", people = "20", date = "an upcoming weekend" }) {
  return `Hi FOB, I'm planning a ${eventType} for ${people} people on ${date}.`;
}

export function generalMessage() {
  return "Hi FOB, I'd like to ask a quick question about visiting the centre.";
}
