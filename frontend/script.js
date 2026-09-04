// ---- Supabase client ----
// The anon/publishable key is safe to expose in frontend code by design —
// access control is enforced by Row Level Security policies in the database,
// not by keeping this key secret. See lib/supabase.js on the backend for the
// same URL + key pair used server-side.
// TODO: fill in your project's real values (Supabase dashboard > Project Settings > API).


// Backend base URL — the backend is a separate Next.js app (its API routes
// live under app/api/), not served from the same origin as this static
// frontend, so calls to it need an absolute base.
// TODO: point this at your backend's real deployed/dev URL.
const BACKEND_BASE_URL = "http://localhost:3000";

// ---- Why SURKH: cards rendered from data, not hand-written ----
const whyCards = [
  {
    accent: "var(--color-accent)",
    icon: "assets/icon-hospital.png",
    title: "Connecting <span>hospitals</span> in the donor-patient loop",
    desc: "Develop trust channels through certified facilities",
  },
  {
    accent: "var(--color-secondary)",
    icon: "assets/icon-sync.png",
    title: "Allowing facilities to <span>sync</span> blood inventories",
    desc: "Real-time updates about available blood nearby",
  },
  {
    accent: "var(--color-primary)",
    icon: "assets/icon-network.png",
    title: "Including smaller blood camps via <span>AI</span> technology",
    desc: "AI Ledger Reader enables local setups to get connected",
  },
];

const cardsContainer = document.getElementById("why-cards");

if (cardsContainer) {
  whyCards.forEach((card) => {
    const el = document.createElement("div");
    el.className = "why-card";
    el.style.setProperty("--card-accent", card.accent);
    el.innerHTML = `
      <img src="${card.icon}" alt="" class="why-card__icon">
      <h4 class="why-card__title">${card.title}</h4>
      <p class="why-card__desc">${card.desc}</p>
    `;
    cardsContainer.appendChild(el);
  });
}

// ---- Footer: always show the current year, never a hardcoded one ----
const footerYear = document.getElementById("footer-year");
if (footerYear) footerYear.textContent = new Date().getFullYear();

// ---- Float-in on scroll for heading/paragraph ----
const floatTargets = document.querySelectorAll(".js-float-in");

if (floatTargets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  floatTargets.forEach((el) => observer.observe(el));
}

// ---- Find Blood Now: interactive state (Step 2) ----
// This mirrors the shape a future API call will need:
// { blood_group, city, coords }. TODO: match to schema once
// the /inventory endpoint's real query params are finalized.
const findBloodState = {
  bloodGroup: null,
  city: null,
  coords: null,
};

const chipsContainer = document.getElementById("quick-search-chips");
const citySelect = document.getElementById("city-select");

// Approximate city centers — used to turn a picked city into coordinates so
// filtering/sorting can run on lat/long (matching facilities.latitude/longitude)
// the same way a GPS-based search would, instead of a separate string match.
// This stays as a static reference table for the reverse-geocode feature
// (nearestCityFromCoords); cities from the API that aren't listed here
// simply won't have coordinate lookup, but the text-based search still works.
const CITY_COORDS = {
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Lahore: { lat: 31.5497, lng: 74.3436 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.975 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Faisalabad: { lat: 31.4504, lng: 73.1350 },
  Bahawalpur: { lat: 29.3544, lng: 71.6911 },
  Larkana: { lat: 27.5551, lng: 68.2147 },
};

// Reverse-geocode-lite: given raw GPS coords, find the closest known city so
// the dropdown can auto-fill without a real geocoding API. Real coords are
// still kept for distance sorting — this only drives the displayed label.
function nearestCityFromCoords(lat, lng) {
  let closest = null;
  let minDist = Infinity;
  Object.entries(CITY_COORDS).forEach(([name, coord]) => {
    const dist = distanceKm(lat, lng, coord.lat, coord.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  });
  return closest;
}

// Keep quick-search chips and the city dropdown in sync with each other
function setCity(cityName) {
  findBloodState.city = cityName;
  findBloodState.coords = CITY_COORDS[cityName] || null;

  // Picking a city overrides any GPS lock — reset that button's label
  if (locationBtnText) locationBtnText.textContent = "Use Live Location";
  if (locationStatus) {
    locationStatus.textContent = "";
    locationStatus.className = "find-blood__location-status";
  }

  if (citySelect) {
    const match = Array.from(citySelect.options).find(
      (opt) => opt.textContent.trim().toLowerCase() === cityName.toLowerCase(),
    );
    if (match) citySelect.value = match.value;
  }

  if (chipsContainer) {
    chipsContainer.querySelectorAll(".chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.textContent.trim() === cityName);
    });
  }
}

if (citySelect) {
  citySelect.addEventListener("change", () => {
    const cityName = citySelect.selectedOptions[0]?.textContent.trim() || null;
    findBloodState.city = cityName;
    findBloodState.coords = cityName ? CITY_COORDS[cityName] || null : null;
    if (chipsContainer) {
      chipsContainer.querySelectorAll(".chip").forEach((chip) => {
        chip.classList.toggle(
          "is-active",
          chip.textContent.trim() === cityName,
        );
      });
    }
  });
}

// Populate city dropdown and quick-search chips dynamically from the
// facilities API. Runs once on page load. The dropdown gets every unique
// city; the chips are rebuilt from the same list so both stay in sync.
// Cities that aren't in CITY_COORDS still work for text-based search —
// they just won't have GPS coordinate lookup.
(async function loadCityOptions() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/facilities`);
    if (!res.ok) return;
    const facilities = await res.json();
    const cities = [...new Set(facilities.map((f) => f.city).filter(Boolean))].sort();

    // Populate dropdown
    if (citySelect) {
      const currentVal = citySelect.value;
      cities.forEach((city) => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });
      // Restore selection if it still exists in the new list
      if (currentVal) citySelect.value = currentVal;
    }

    // Rebuild chips from the full city list
    if (chipsContainer) {
      chipsContainer.innerHTML = "";
      cities.forEach((city) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.textContent = city;
        btn.addEventListener("click", () => setCity(city));
        chipsContainer.appendChild(btn);
      });
    }
  } catch {
    // If the fetch fails, the dropdown stays empty and the user can still
    // type a city manually or use live-location — no hard crash.
  }
})();

// Blood group — single select, click again to deselect
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DEFAULT_BLOOD_GROUP = "O+"; // pre-selected so the user has a visual cue on load
const groupGrid = document.getElementById("blood-group-grid");

if (groupGrid) {
  bloodGroups.forEach((group) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "group-btn";
    btn.textContent = group;

    if (group === DEFAULT_BLOOD_GROUP) {
      btn.classList.add("is-active");
      findBloodState.bloodGroup = group;
    }

    btn.addEventListener("click", () => {
      const alreadyActive = btn.classList.contains("is-active");
      groupGrid
        .querySelectorAll(".group-btn")
        .forEach((b) => b.classList.remove("is-active"));
      if (!alreadyActive) {
        btn.classList.add("is-active");
        findBloodState.bloodGroup = group;
      } else {
        findBloodState.bloodGroup = null;
      }
    });
    groupGrid.appendChild(btn);
  });
}

// Use Live Location — real Geolocation API call
const locationBtn = document.getElementById("use-location-btn");
const locationBtnText = document.getElementById("location-btn-text");
const locationStatus = document.getElementById("location-status");

if (locationBtn) {
  locationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      locationStatus.textContent =
        "Geolocation is not supported on this device.";
      locationStatus.className =
        "find-blood__location-status find-blood__location-status--error";
      return;
    }

    locationBtn.disabled = true;
    locationBtnText.textContent = "Locating…";
    locationStatus.textContent = "";
    locationStatus.className = "find-blood__location-status";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        findBloodState.coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Fill the city select/chip with the nearest known city for display,
        // but keep the exact GPS coords above for real distance sorting.
        const nearestCity = nearestCityFromCoords(
          findBloodState.coords.lat,
          findBloodState.coords.lng,
        );
        findBloodState.city = nearestCity;

        if (citySelect) {
          const match = Array.from(citySelect.options).find(
            (opt) =>
              opt.textContent.trim().toLowerCase() ===
              (nearestCity || "").toLowerCase(),
          );
          citySelect.value = match ? match.value : "";
        }
        if (chipsContainer) {
          chipsContainer.querySelectorAll(".chip").forEach((chip) => {
            chip.classList.toggle(
              "is-active",
              chip.textContent.trim() === nearestCity,
            );
          });
        }

        locationBtn.disabled = false;
        locationBtnText.textContent = "Location Detected ✓";
        locationStatus.textContent = nearestCity
          ? `Using your current location — closest to ${nearestCity}.`
          : "Using your current location for nearby results.";
        locationStatus.className =
          "find-blood__location-status find-blood__location-status--success";
      },
      (error) => {
        findBloodState.coords = null;
        locationBtn.disabled = false;
        locationBtnText.textContent = "Use Live Location";
        locationStatus.textContent =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied — select a city instead."
            : "Could not detect location — select a city instead.";
        locationStatus.className =
          "find-blood__location-status find-blood__location-status--error";
      },
    );
  });
}

// Form submit — validates, then hands off a clean state object
// (this is the exact shape a real fetch('/inventory?...') call would consume)
const findBloodForm = document.getElementById("find-blood-form");
const searchBtn = document.getElementById("search-blood-btn");
const searchBtnText = document.getElementById("search-btn-text");
const formError = document.getElementById("form-error");
const resultsSection = document.querySelector(".find-blood__results");

if (findBloodForm) {
  findBloodForm.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.textContent = "";

    let invalid = false;

    if (!findBloodState.bloodGroup) {
      formError.textContent = "Please select a blood group.";
      invalid = true;
    } else if (!findBloodState.coords) {
      formError.textContent = "Please select a city or use your live location.";
      invalid = true;
    }

    if (invalid) {
      // Visible shake so a blocked submit is never mistaken for "nothing happened"
      findBloodForm.classList.remove("shake");
      // eslint-disable-next-line no-unused-expressions
      void findBloodForm.offsetWidth; // restart the animation if triggered twice in a row
      findBloodForm.classList.add("shake");
      return;
    }

    searchBtn.disabled = true;
    searchBtnText.textContent = "Searching…";

    fetchInventoryFromApi(findBloodState.bloodGroup, findBloodState.city)
      .then((rows) => {
        searchBtn.disabled = false;
        searchBtnText.textContent = "Search Blood";
        currentFilteredResults = groupByFacility(rows);
        visibleResultsCount = RESULTS_PAGE_SIZE;
        resultsSubtext.textContent = "Showing Closest to You";
        renderResultsList();
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch((err) => {
        searchBtn.disabled = false;
        searchBtnText.textContent = "Search Blood";
        formError.textContent = "Search failed — please try again.";
        console.error("Blood search failed:", err);
      });
  });
}

// Haversine distance in km — real GPS/city coords in, sorted-by-proximity out,
// the same way a real facilities.latitude/longitude query would work.
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- API: fetch inventory from backend ----
// GET /api/inventory returns one row per blood-group-per-facility:
//   { blood_group, quantity, expiry_date, Facility: { name, city, location } }
// Always filtered to status='available' and quantity>0 server-side.
async function fetchInventoryFromApi(bloodGroup, city) {
  const params = new URLSearchParams();
  if (bloodGroup) params.set('blood_group', bloodGroup);
  if (city) params.set('city', city);

  const res = await fetch(
    `${BACKEND_BASE_URL}/api/inventory${params.toString() ? '?' + params.toString() : ''}`
  );
  if (!res.ok) {
    throw new Error(`Search failed (${res.status})`);
  }
  return res.json();
}

// Group flat inventory rows by facility name so each result card
// represents one facility (matching the previous mock-based shape).
function groupByFacility(rows) {
  const map = {};
  rows.forEach((row) => {
    const name = row.Facility?.name || 'Unknown Facility';
    if (!map[name]) {
      map[name] = {
        name,
        city: row.Facility?.city || '',
        location: row.Facility?.location || '',
        inventory: [],
      };
    }
    map[name].inventory.push({
      blood_group: row.blood_group,
      quantity: row.quantity,
      expiry_date: row.expiry_date,
    });
  });
  return Object.values(map);
}

const RESULTS_PAGE_SIZE = 3; // matches the 3-cards-per-row desktop grid

let currentFilteredResults = [];
let visibleResultsCount = RESULTS_PAGE_SIZE;

const resultsList = document.getElementById("results-list");
const resultsEmpty = document.getElementById("results-empty");
const resultsSubtext = document.getElementById("results-subtext");
const seeAllBtn = document.getElementById("see-all-btn");

function buildResultCard(facility) {
  // Find stock for the currently selected blood group in this facility's
  // grouped inventory rows (all already status='available', quantity>0
  // per the backend filter).
  const group = findBloodState.bloodGroup;
  const stock = group
    ? facility.inventory.find((r) => r.blood_group === group)
    : facility.inventory[0];
  const available = !!stock;
  const lowStock = available && stock.quantity <= 2;

  const card = document.createElement("div");
  card.className = "result-card";

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  card.innerHTML = `
    <div class="result-card__photo-wrap">
      <img src="assets/donation-camp.jpg" alt="${esc(facility.name)}" class="result-card__photo">
      ${
        available
          ? lowStock
            ? '<span class="result-card__badge result-card__badge--low">Low Stock</span>'
            : '<span class="result-card__badge">Available</span>'
          : '<span class="result-card__badge result-card__badge--out">Unavailable</span>'
      }
    </div>
    <div class="result-card__body">
      ${lowStock ? '<p class="result-card__notice">Low Stock — confirm availability directly via contact as well.</p>' : ""}
      <div class="result-card__top">
        <img src="assets/logo.jpg" alt="" class="result-card__logo">
        <div>
          <p class="result-card__name">${esc(facility.name)}</p>
          <p class="result-card__address">${esc(facility.location)}</p>
        </div>
      </div>
      <div class="result-card__bottom">
        <span class="result-card__eta"></span>
        ${
          available
            ? `<button type="button" class="result-card__reserve" data-facility-name="${esc(facility.name)}" data-facility-location="${esc(facility.location)}">Reserve Blood</button>`
            : `<button type="button" class="result-card__reserve result-card__reserve--contact" data-facility-name="${esc(facility.name)}" data-facility-location="${esc(facility.location)}" data-contact-only="true">Contact on WhatsApp</button>`
        }
      </div>
    </div>
  `;
  return card;
}

function renderResultsList() {
  if (!resultsList) return;
  resultsList.innerHTML = "";
  const toShow = currentFilteredResults.slice(0, visibleResultsCount);

  toShow.forEach((facility) =>
    resultsList.appendChild(buildResultCard(facility)),
  );

  if (resultsEmpty)
    resultsEmpty.classList.toggle(
      "is-visible",
      currentFilteredResults.length === 0,
    );
  if (seeAllBtn)
    seeAllBtn.style.display =
      visibleResultsCount < currentFilteredResults.length
        ? "inline-flex"
        : "none";
}



if (seeAllBtn) {
  seeAllBtn.addEventListener("click", () => {
    visibleResultsCount = currentFilteredResults.length;
    renderResultsList();
  });
}

// Reserve Blood — opens a dialog with the searched blood group, contact info,
// and a WhatsApp hand-off CTA (only the dialog is built here; the actual send
// happens on WhatsApp's side via the wa.me link).
const reserveModal = document.getElementById("reserve-modal");
const reserveModalBackdrop = document.getElementById("reserve-modal-backdrop");
const reserveModalClose = document.getElementById("reserve-modal-close");
const reserveModalTitle = document.getElementById("reserve-modal-title");
const reserveModalGroup = document.getElementById("reserve-modal-group");
const reserveModalFacility = document.getElementById("reserve-modal-facility");
const reserveModalContact = document.getElementById("reserve-modal-contact");
const reserveModalCta = document.getElementById("reserve-modal-cta");

function openReserveModal(facility, isContactOnly) {
  const group = findBloodState.bloodGroup || "Blood";
  const phoneDigits = (facility.phone || "").replace(/\D/g, "");

  if (isContactOnly) {
    reserveModalTitle.textContent = "Blood Not Available";
    reserveModalGroup.textContent = `${group} is not currently available at this facility, but you may contact them for further details.`;
    reserveModalFacility.textContent = `${facility.name} — ${facility.location}`;
    reserveModalContact.textContent =
      facility.phone || "Contact info not available";
    const message = `Hi, I'm checking whether ${group} blood is available at ${facility.name}.`;
    reserveModalCta.href = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    reserveModalCta.textContent = "Contact on WhatsApp";
  } else {
    reserveModalTitle.textContent = "Blood Available";
    reserveModalGroup.textContent = `${group} is available at this facility`;
    reserveModalFacility.textContent = `${facility.name} — ${facility.location}`;
    reserveModalContact.textContent =
      facility.phone || "Contact info not available";
    const message = `Hi, I'd like to reserve ${group} blood at ${facility.name}.`;
    reserveModalCta.href = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    reserveModalCta.textContent = "Send Report on WhatsApp";
  }

  reserveModal.hidden = false;
}

function closeReserveModal() {
  reserveModal.hidden = true;
}

if (resultsList) {
  resultsList.addEventListener("click", (e) => {
    const btn = e.target.closest(".result-card__reserve");
    if (!btn) return;
    const facility = {
      name: btn.dataset.facilityName || '',
      location: btn.dataset.facilityLocation || '',
      phone: null,
    };
    openReserveModal(facility, btn.dataset.contactOnly === "true");
  });
}

if (reserveModalClose)
  reserveModalClose.addEventListener("click", closeReserveModal);
if (reserveModalBackdrop)
  reserveModalBackdrop.addEventListener("click", closeReserveModal);

// Initial render — fetch all available inventory from the API
(async () => {
  try {
    const rows = await fetchInventoryFromApi();
    currentFilteredResults = groupByFacility(rows);
  } catch (err) {
    console.error('Failed to load initial inventory:', err);
  }
  renderResultsList();
})();
// Nav toggle — opens/closes the mobile nav dropdown
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.getElementById("main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.classList.toggle("is-active", !isOpen);
    mainNav.classList.toggle("is-open", !isOpen);
  });

  // Close the menu after picking a link, so it doesn't stay open post-navigation
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.classList.remove("is-active");
      mainNav.classList.remove("is-open");
    });
  });
}

// ================================================================
// Partner with Surkh — hospital staff sign-up form (signup.html only)
// Staff join a facility that's already been registered (looked up
// server-side by facility_code) — this form does not create a facility.
// Wired to the real POST /api/auth/signup contract in
// backend/app/api/auth/signup/route.js: { full_name, email, password,
// facility_code } only. role and facility_id are server-controlled and
// must never be sent from the client.
// ================================================================
const partnerForm = document.getElementById("partner-signup-form");

if (partnerForm) {
  const partnerFormError = document.getElementById("partner-form-error");
  const partnerSubmitBtn = document.getElementById("partner-submit-btn");
  const partnerSubmitBtnText = document.getElementById(
    "partner-submit-btn-text",
  );

  partnerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    partnerFormError.textContent = "";

    const facilityCode = document.getElementById("facility-code").value.trim();
    const staffName = document.getElementById("staff-name").value.trim();
    const staffEmail = document.getElementById("staff-email").value.trim();
    const staffPassword = document.getElementById("staff-password").value;

    if (!facilityCode || !staffName || !staffEmail || staffPassword.length < 8) {
      partnerFormError.textContent =
        "Please complete all fields, including an 8+ character password.";
      // Reuses the same shake animation as the Find Blood form
      partnerForm.classList.remove("shake");
      // eslint-disable-next-line no-unused-expressions
      void partnerForm.offsetWidth;
      partnerForm.classList.add("shake");
      return;
    }

    // Matches the signup route's expected body exactly — nothing invented here.
    const payload = {
      full_name: staffName,
      email: staffEmail,
      password: staffPassword,
      facility_code: facilityCode,
    };

    partnerSubmitBtn.disabled = true;
    partnerSubmitBtnText.textContent = "Creating Account…";

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        // e.g. "No facility found with that facility_code", weak password, etc.
        partnerFormError.textContent = data.error || "Could not create your account.";
        partnerSubmitBtn.disabled = false;
        partnerSubmitBtnText.textContent = "Create Hospital Account";
        return;
      }

      partnerSubmitBtnText.textContent = "Account Created ✓";
      // Signup creates the Auth user + Profile row but does not sign them in
      // (no session is returned) — send them to log in next.
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch (err) {
      partnerFormError.textContent = "Network error — please try again.";
      partnerSubmitBtn.disabled = false;
      partnerSubmitBtnText.textContent = "Create Hospital Account";
    }
  });
}

// ---- Facility login form (login.html only) ----
const loginForm = document.getElementById("login-form");

if (loginForm) {
  const loginError = document.getElementById("login-form-error");
  const loginSubmitBtn = document.getElementById("login-submit-btn");
  const loginSubmitBtnText = document.getElementById("login-submit-btn-text");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      loginError.textContent = "Please enter both your email and password.";
      loginForm.classList.remove("shake");
      void loginForm.offsetWidth;
      loginForm.classList.add("shake");
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtnText.textContent = "Logging In…";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      loginError.textContent = error.message;
      loginSubmitBtn.disabled = false;
      loginSubmitBtnText.textContent = "Log In";
      loginForm.classList.remove("shake");
      void loginForm.offsetWidth;
      loginForm.classList.add("shake");
      return;
    }

    const selectedRole = document.getElementById("login-role").value;

    if (selectedRole === "admin") {
      // Verify the authenticated user actually holds the Admin role
      // server-side via /api/profile — never trust a client-supplied role.
      try {
        const profileRes = await fetch(`${BACKEND_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });

        if (!profileRes.ok) {
          throw new Error(`Profile fetch failed (${profileRes.status})`);
        }

        const profile = await profileRes.json();

        if (!profile || profile.role !== "Admin") {
          throw new Error("Not an admin");
        }

        loginSubmitBtnText.textContent = "Logged In ✓";
        window.location.href = "admin-dashboard.html";
      } catch (err) {
        loginError.textContent = "This account does not have admin privileges.";
        loginSubmitBtn.disabled = false;
        loginSubmitBtnText.textContent = "Log In as Admin";
        await supabaseClient.auth.signOut();
        return;
      }
    } else {
      // Staff login — verify the authenticated user is NOT an admin.
      // Admin accounts must not reach the Staff Dashboard.
      try {
        const profileRes = await fetch(`${BACKEND_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });

        if (!profileRes.ok) {
          throw new Error(`Profile fetch failed (${profileRes.status})`);
        }

        const profile = await profileRes.json();

        if (profile && profile.role === "Admin") {
          throw new Error("Admin account on staff login");
        }

        loginSubmitBtnText.textContent = "Logged In ✓";
        window.location.href = "dashboard.html";
      } catch (err) {
        loginError.textContent = "This account is not authorized for staff access.";
        loginSubmitBtn.disabled = false;
        loginSubmitBtnText.textContent = "Log In";
        await supabaseClient.auth.signOut();
        return;
      }
    }
  });
}
