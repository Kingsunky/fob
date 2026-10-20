// FOB Lock It In Sheet Dialog (PRD Section 10: ANI-14, 19: FR-19, 23.5)
import { whatsappUrl, zoneMessage } from "./whatsapp.js";

class LockItInSheet {
  constructor() {
    this.backdrop = null;
    this.selectedZone = "Football Pitch";
    this.selectedDay = "Today";
    this.selectedTime = "7:00 pm";
    this.selectedCrew = "10";
    this.init();
  }

  init() {
    this.createSheetDOM();
    this.bindGlobalTriggers();
  }

  createSheetDOM() {
    const backdrop = document.createElement("div");
    backdrop.className = "fob-dialog-backdrop";
    backdrop.id = "fob-lock-sheet";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Lock In Your Booking");

    backdrop.innerHTML = `
      <div class="fob-sheet" id="fob-sheet-modal">
        <div class="fob-sheet__header">
          <div>
            <span class="fob-section-tag">Booking In 3 Taps</span>
            <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #FFF; margin-top: 0.25rem;">Lock It In</h3>
          </div>
          <button type="button" class="fob-sheet__close" id="fob-sheet-close-btn" aria-label="Close booking sheet">&times;</button>
        </div>

        <!-- Step 1: Pick Zone -->
        <div class="fob-sheet__step">
          <div class="fob-sheet__step-title">1. Pick Your Zone</div>
          <div class="fob-sheet__chips" id="sheet-zone-chips">
            <button type="button" class="fob-chip-btn is-selected" data-zone="Football Pitch">Football Pitch</button>
            <button type="button" class="fob-chip-btn" data-zone="Football Viewing Centre">Viewing Centre</button>
            <button type="button" class="fob-chip-btn" data-zone="Gym & Fitness">Gym</button>
            <button type="button" class="fob-chip-btn" data-zone="Basketball Court">Basketball</button>
            <button type="button" class="fob-chip-btn" data-zone="Snooker Lounge">Snooker</button>
            <button type="button" class="fob-chip-btn" data-zone="Table Tennis">Table Tennis</button>
            <button type="button" class="fob-chip-btn" data-zone="Gaming Lounge">Gaming</button>
          </div>
        </div>

        <!-- Step 2: Pick Day -->
        <div class="fob-sheet__step">
          <div class="fob-sheet__step-title">2. When Are You Coming?</div>
          <div class="fob-sheet__chips" id="sheet-day-chips">
            <button type="button" class="fob-chip-btn is-selected" data-day="Today">Today</button>
            <button type="button" class="fob-chip-btn" data-day="Tomorrow">Tomorrow</button>
            <button type="button" class="fob-chip-btn" data-day="This Weekend">This Weekend</button>
            <button type="button" class="fob-chip-btn" data-day="Next Week">Next Week</button>
          </div>
        </div>

        <!-- Step 3: Time & Crew Size -->
        <div class="fob-sheet__step">
          <div class="fob-sheet__step-title">3. Time & Crew Size</div>
          <div class="fob-sheet__grid">
            <div>
              <label style="font-size: 0.75rem; color: var(--fob-white-70); display: block; margin-bottom: 0.35rem;">Preferred Time</label>
              <select class="fob-input" id="sheet-time-select">
                <option value="Morning (8:00 am - 12:00 pm)">Morning (8am - 12pm)</option>
                <option value="Afternoon (1:00 pm - 4:00 pm)">Afternoon (1pm - 4pm)</option>
                <option value="Evening (5:00 pm - 8:00 pm)" selected>Evening (5pm - 8pm)</option>
                <option value="Late Night (9:00 pm - 11:30 pm)">Late Night (9pm - 11:30pm)</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.75rem; color: var(--fob-white-70); display: block; margin-bottom: 0.35rem;">Number of People</label>
              <select class="fob-input" id="sheet-crew-select">
                <option value="Just me (Solo)">Just me (1)</option>
                <option value="2 to 4 people">2 – 4 people</option>
                <option value="5 to 8 people">5 – 8 people</option>
                <option value="10 to 14 people (Full Squad)" selected>10 – 14 people (Squad)</option>
                <option value="15+ Large Group">15+ Group / Party</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Live Preview Box -->
        <div class="fob-sheet__preview">
          <span class="fob-sheet__preview-label">Pre-filled WhatsApp Message:</span>
          <p id="sheet-message-preview" style="font-style: italic;"></p>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 0.75rem;">
          <a href="#" id="sheet-submit-btn" class="fob-btn fob-btn--primary fob-btn--lg" style="flex: 1;" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.76-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.53.61.2 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.18-.47-.3z"/></svg>
            Continue to WhatsApp
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    this.backdrop = backdrop;

    this.bindSheetEvents();
    this.updatePreview();
  }

  bindSheetEvents() {
    const closeBtn = document.getElementById("fob-sheet-close-btn");
    closeBtn.addEventListener("click", () => this.close());

    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.backdrop.classList.contains("is-open")) {
        this.close();
      }
    });

    // Zone chip clicks
    const zoneChips = document.querySelectorAll("#sheet-zone-chips .fob-chip-btn");
    zoneChips.forEach(chip => {
      chip.addEventListener("click", () => {
        zoneChips.forEach(c => c.classList.remove("is-selected"));
        chip.classList.add("is-selected");
        this.selectedZone = chip.dataset.zone;
        this.updatePreview();
      });
    });

    // Day chip clicks
    const dayChips = document.querySelectorAll("#sheet-day-chips .fob-chip-btn");
    dayChips.forEach(chip => {
      chip.addEventListener("click", () => {
        dayChips.forEach(c => c.classList.remove("is-selected"));
        chip.classList.add("is-selected");
        this.selectedDay = chip.dataset.day;
        this.updatePreview();
      });
    });

    // Select changes
    const timeSelect = document.getElementById("sheet-time-select");
    timeSelect.addEventListener("change", (e) => {
      this.selectedTime = e.target.value;
      this.updatePreview();
    });

    const crewSelect = document.getElementById("sheet-crew-select");
    crewSelect.addEventListener("change", (e) => {
      this.selectedCrew = e.target.value;
      this.updatePreview();
    });

    // Submit animation (ANI-14)
    const submitBtn = document.getElementById("sheet-submit-btn");
    submitBtn.addEventListener("click", () => {
      this.showToastConfirmation();
      setTimeout(() => this.close(), 600);
    });
  }

  updatePreview() {
    const msg = zoneMessage({
      zone: this.selectedZone,
      date: this.selectedDay,
      time: this.selectedTime,
      people: this.selectedCrew
    });

    const previewEl = document.getElementById("sheet-message-preview");
    if (previewEl) previewEl.textContent = `"${msg}"`;

    const submitBtn = document.getElementById("sheet-submit-btn");
    if (submitBtn) submitBtn.href = whatsappUrl(msg);
  }

  open(presetZone = null) {
    if (presetZone) {
      this.selectedZone = presetZone;
      const zoneChips = document.querySelectorAll("#sheet-zone-chips .fob-chip-btn");
      zoneChips.forEach(chip => {
        if (chip.dataset.zone.toLowerCase().includes(presetZone.toLowerCase())) {
          zoneChips.forEach(c => c.classList.remove("is-selected"));
          chip.classList.add("is-selected");
        }
      });
      this.updatePreview();
    }
    this.backdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  close() {
    this.backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  showToastConfirmation() {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "var(--fob-volt)";
    toast.style.color = "var(--fob-ink)";
    toast.style.fontFamily = "var(--font-display)";
    toast.style.fontWeight = "800";
    toast.style.padding = "1rem 2rem";
    toast.style.borderRadius = "var(--radius-pill)";
    toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
    toast.style.zIndex = "9999";
    toast.textContent = "You're in. Bring your crew!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  bindGlobalTriggers() {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-fob-sheet]");
      if (trigger) {
        e.preventDefault();
        const presetZone = trigger.dataset.fobSheetZone || null;
        this.open(presetZone);
      }
    });
  }
}

export const lockSheet = new LockItInSheet();
