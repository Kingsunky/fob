// FOB Interactive Map & Distance Calculator (PRD Section 22: FR-25..33, 23.5)
// Uses Google Maps Embed API (free, no key needed) + Directions API
import { FOB_LAT, FOB_LNG, FOB_ADDRESS, GOOGLE_MAPS_EMBED_URL, GOOGLE_MAPS_DIRECTIONS_URL } from "./config.js";

// Haversine straight-line distance formula (PRD Section 23.5, FR-30)
export function straightLineKm(a, b) {
  const R = 6371; // Earth radius in km
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getDirectionsUrl(lat = FOB_LAT, lng = FOB_LNG, mode = "driving", origin = null) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const originParam = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  const travelmode = mode === "walking" ? "walking" : "driving";

  if (isIOS) {
    const dirflg = mode === "walking" ? "w" : "d";
    const saddr = origin ? `&saddr=${origin.lat},${origin.lng}` : '';
    return `maps://maps.apple.com/?daddr=${encodeURIComponent(FOB_ADDRESS)}${saddr}&dirflg=${dirflg}`;
  }

  // Official Google Maps Directions API URL
  const destQuery = encodeURIComponent(FOB_ADDRESS);
  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destQuery}&travelmode=${travelmode}`;
}

export function initMapModule() {
  const mapWrap = document.querySelector(".fob-map-wrap");
  if (!mapWrap) return;

  const showMapBtn = document.getElementById("fob-show-map-btn");
  const placeholder = document.querySelector(".fob-map-placeholder");
  const locationBtn = document.getElementById("fob-locate-btn");
  const summaryEl = document.getElementById("fob-route-summary");
  const directionsBtn = document.getElementById("fob-directions-btn");
  const modeBtns = document.querySelectorAll(".fob-mode-btn");

  let userPosition = null;
  let currentMode = "driving";

  // Directions link default setup
  if (directionsBtn) {
    directionsBtn.href = getDirectionsUrl(FOB_LAT, FOB_LNG, currentMode);
  }

  // FR-25: Show map only on tap
  if (showMapBtn) {
    showMapBtn.addEventListener("click", () => {
      placeholder.classList.add("is-hidden");
      loadGoogleMapsEmbed();
    });
  }

  // Mode toggles (Driving / Walking)
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentMode = btn.dataset.mode || "driving";
      if (directionsBtn) {
        directionsBtn.href = getDirectionsUrl(FOB_LAT, FOB_LNG, currentMode);
      }
      if (userPosition) {
        updateRouteSummary(userPosition);
      }
    });
  });

  // FR-26: Use my location on tap
  if (locationBtn) {
    locationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }

      locationBtn.disabled = true;
      locationBtn.textContent = "Locating you...";

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationBtn.disabled = false;
          locationBtn.textContent = "Location Updated ✓";
          userPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };

          // Store session position for fixture cards (FR-31)
          try {
            sessionStorage.setItem("fob_user_loc", JSON.stringify(userPosition));
          } catch (e) {}

          if (placeholder && !placeholder.classList.contains("is-hidden")) {
            placeholder.classList.add("is-hidden");
            loadGoogleMapsEmbed();
          }

          updateRouteSummary(userPosition);

          // Update map to show directions from user location
          updateMapWithDirections(userPosition);
        },
        (err) => {
          locationBtn.disabled = false;
          locationBtn.textContent = "Use my location";
          let message = "Could not get your location. Tap Directions below to open in your maps app.";
          if (err.code === 1) message = "Location permission was denied. Tap Directions below to plan your trip.";
          alert(message);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  function updateRouteSummary(pos) {
    const distStraight = straightLineKm(pos, { lat: FOB_LAT, lng: FOB_LNG });
    // In Lagos, road distance is approx 1.25x straight line due to lagoon/bridges
    const roadDistKm = Math.max(0.5, distStraight * 1.28);
    const roundedDist = roadDistKm.toFixed(1);

    // Approximate travel duration in Lagos traffic:
    // Driving: average speed ~22 km/h + 5 min buffer
    // Walking: average speed ~4.5 km/h
    let minutes = currentMode === "walking"
      ? Math.round((roadDistKm / 4.5) * 60)
      : Math.round((roadDistKm / 22) * 60 + 4);

    if (summaryEl) {
      summaryEl.style.display = "flex";
      summaryEl.innerHTML = `
        <div>
          <span class="fob-section-tag" style="font-size: 0.75rem;">Your Route to FOB</span>
          <div class="fob-route-summary__dist">${roundedDist} km • approx ${minutes} mins</div>
          <span style="font-size: 0.8rem; color: var(--fob-white-70);">
            Mode: ${currentMode === 'walking' ? 'Walking' : 'Driving (with typical Lagos traffic)'}
          </span>
        </div>
        <a href="${getDirectionsUrl(FOB_LAT, FOB_LNG, currentMode, pos)}" target="_blank" rel="noopener noreferrer" class="fob-btn fob-btn--primary fob-btn--sm" data-fob-event="start_navigation">
          Start Navigation
        </a>
      `;
    }
  }

  function loadGoogleMapsEmbed() {
    const mapDiv = document.getElementById("fob-live-map");
    if (!mapDiv) return;

    // Use Google Maps Embed API
    const iframe = document.createElement("iframe");
    const query = encodeURIComponent("2 Lawani Ode Street, Alakara Bus Stop, Ashipa, Ayobo, Lagos");
    iframe.src = `https://www.google.com/maps?q=${query}&z=16&output=embed`;
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "0";
    iframe.style.borderRadius = "16px";
    iframe.style.minHeight = "400px";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.setAttribute("aria-label", "Google Maps showing FOB Recreation Centre at " + FOB_ADDRESS);

    mapDiv.innerHTML = "";
    mapDiv.appendChild(iframe);
    mapDiv.style.minHeight = "400px";
    mapDiv.style.borderRadius = "16px";
    mapDiv.style.overflow = "hidden";
    mapDiv.style.border = "2px solid var(--fob-white-16)";
  }

  function updateMapWithDirections(pos) {
    const mapDiv = document.getElementById("fob-live-map");
    if (!mapDiv) return;

    // Update the iframe to show directions from user's location
    const iframe = mapDiv.querySelector("iframe");
    if (iframe) {
      iframe.src = `https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d50000!2d${FOB_LNG}!3d${FOB_LAT}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e${currentMode === 'walking' ? '2' : '0'}!4m5!1s!2d${pos.lng}!3d${pos.lat}!4m5!1s!2d${FOB_LNG}!3d${FOB_LAT}!5e0!3m2!1sen!2sng`;
    }
  }
}
