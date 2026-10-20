// FOB Privacy-Friendly Analytics (PRD Section 8: FR-16, FR-17, 23.5)

export function initAnalytics() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-fob-event]");
    if (!target) return;

    const eventName = target.dataset.fobEvent;
    const eventPayload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      targetText: target.textContent.trim().substring(0, 40)
    };

    // Minimal privacy-first dispatch (no cookies, no PII)
    if (window.console && console.info) {
      console.info("[FOB Analytics Event]:", eventPayload);
    }

    // In production, can use navigator.sendBeacon to endpoint
    if (navigator.sendBeacon && window.FOB_ANALYTICS_ENDPOINT) {
      navigator.sendBeacon(window.FOB_ANALYTICS_ENDPOINT, JSON.stringify(eventPayload));
    }
  });
}
