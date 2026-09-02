// ---- Supabase client ----
// The anon/publishable key is safe to expose in frontend code by design —
// access control is enforced by Row Level Security policies in the database,
// not by keeping this key secret. See lib/supabase.js on the backend for the
// same URL + key pair used server-side.
// TODO: fill in your project's real values (Supabase dashboard > Project Settings > API).
// ---- Supabase client ----
const SUPABASE_URL = "https://fpvlbkdcqmcatvxhuzta.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jJ_I0osFLEfqcjR2t3tz8A_3DsYKPwE";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
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
// { blood_group, quantity, city, coords }. TODO: match to schema once
// the /inventory endpoint's real query params are finalized.
const findBloodState = {
  bloodGroup: null,
  quantity: null,
  city: null,
  coords: null,
};

const quickCities = ["Islamabad", "Lahore", "Karachi", "Peshawar"];
const chipsContainer = document.getElementById("quick-search-chips");
const citySelect = document.getElementById("city-select");

// Approximate city centers — used to turn a picked city into coordinates so
// filtering/sorting can run on lat/long (matching facilities.latitude/longitude)
// the same way a GPS-based search would, instead of a separate string match.
const CITY_COORDS = {
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Lahore: { lat: 31.5497, lng: 74.3436 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.975 },
  Multan: { lat: 30.1575, lng: 71.5249 },
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

if (chipsContainer) {
  quickCities.forEach((city) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = city;
    btn.addEventListener("click", () => setCity(city));
    chipsContainer.appendChild(btn);
  });
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

// Quantity — presets or custom input, mutually exclusive
const quantityPresets = [1, 5, 10];
const qtyRow = document.getElementById("quantity-options");
let customInput;
let customWrap;

function selectPresetQty(value, btn) {
  findBloodState.quantity = value;
  if (customInput) customInput.value = "";
  if (customWrap) customWrap.classList.remove("is-active");
  qtyRow
    .querySelectorAll(".qty-btn")
    .forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");
}

function useCustomQty() {
  const value = parseInt(customInput.value, 10);
  findBloodState.quantity = Number.isNaN(value) ? null : value;
  qtyRow
    .querySelectorAll(".qty-btn")
    .forEach((b) => b.classList.remove("is-active"));
  customWrap.classList.toggle("is-active", !Number.isNaN(value) && value > 0);
}

if (qtyRow) {
  quantityPresets.forEach((qty) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qty-btn";
    btn.textContent = qty;
    btn.addEventListener("click", () => selectPresetQty(qty, btn));
    qtyRow.appendChild(btn);
  });

  customWrap = document.createElement("div");
  customWrap.className = "find-blood__qty-custom";
  customWrap.innerHTML = `
    <input type="number" min="1" class="find-blood__qty-custom-input" placeholder="Select Custom">
    <button type="button" class="find-blood__qty-step">+1</button>
  `;
  qtyRow.appendChild(customWrap);

  customInput = customWrap.querySelector(".find-blood__qty-custom-input");
  const stepBtn = customWrap.querySelector(".find-blood__qty-step");

  customInput.addEventListener("input", useCustomQty);
  stepBtn.addEventListener("click", () => {
    const current = parseInt(customInput.value, 10) || 0;
    customInput.value = current + 1;
    useCustomQty();
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
// ---- Find Blood Now: results (Step 3) ----
// Mirrors your real schema: `facilities` (location data) joined with
// `inventory` (stock per blood_group, owned/updated by partner hospitals).
// Profile and Exchange Request aren't needed for public search, so they're
// left out here. TODO: swap these two arrays for
// GET /facilities + GET /inventory once the backend is wired up.
//
// =============================================================================
// MOCK ASSET MAP — README
// -----------------------------------------------------------------------------
// `photo` / `logo` below are placeholders, not final assets. Until real
// facility photography exists, `photo` points at a hand-picked Unsplash
// hospital/medical image (5 distinct banners, cycled across 7 facilities so
// no two adjacent cards repeat the same shot) and `logo` points at a
// ui-avatars.com initials badge (neutral, auto-colored per facility name —
// no real hospital logos are implied or used).
//
// When a real photo/logo is ready for a facility:
//   1. Drop the file into assets/mock/ using the filename in the table below
//      (created alongside this file — see assets/mock/README.md).
//   2. Replace that facility's `photo`/`logo` string with the local path,
//      e.g. 'assets/mock/facility-1-photo.jpg'.
// No HTML/CSS changes are needed — `.result-card__photo` expects a ~4:3/16:9
// crop and `.result-card__logo` expects a square image; both are already
// `object-fit`, and the broken-image fallback in style.css keeps any
// still-missing file from breaking the card layout in the meantime.
//
//   facility id | real file to swap in                    | current mock source
//   ------------|------------------------------------------|---------------------------------
//   1           | assets/mock/facility-1-photo.jpg          | Unsplash — hospital corridor
//               | assets/mock/facility-1-logo.png           | ui-avatars initials
//   2           | assets/mock/facility-2-photo.jpg          | Unsplash — hospital exterior
//               | assets/mock/facility-2-logo.png           | ui-avatars initials
//   3           | assets/mock/facility-3-photo.jpg          | Unsplash — blood donation drive
//               | assets/mock/facility-3-logo.png           | ui-avatars initials
//   4           | assets/mock/facility-4-photo.jpg          | Unsplash — medical staff/ward
//               | assets/mock/facility-4-logo.png           | ui-avatars initials
//   5           | assets/mock/facility-5-photo.jpg          | Unsplash — ER entrance
//               | assets/mock/facility-5-logo.png           | ui-avatars initials
//   6           | assets/mock/facility-6-photo.jpg          | reuses banner #2 (only 5 distinct banners on hand)
//               | assets/mock/facility-6-logo.png           | ui-avatars initials
//   7           | assets/mock/facility-7-photo.jpg          | reuses banner #4 (only 5 distinct banners on hand)
//               | assets/mock/facility-7-logo.png           | ui-avatars initials
// =============================================================================
const MOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=640&q=60", // hospital corridor
  "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&w=640&q=60", // hospital exterior
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=640&q=60", // blood donation drive
  "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=640&q=60", // medical staff/ward
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=640&q=60", // ER entrance
];

function mockLogoFor(name) {
  // Neutral initials avatar — distinct color per name, no real logo implied.
  return `https://ui-avatars.com/api/?background=F0B856&color=1C0204&bold=true&size=96&name=${encodeURIComponent(name)}`;
}

const mockFacilities = [
  {
    id: 1,
    name: "Pakistan Red Crescent Society",
    location: "Ashfaq Ahmed Road, Sector H-8/2, Islamabad",
    latitude: 33.7106,
    longitude: 73.0497,
    has_emr: true,
    photo: MOCK_PHOTOS[0],
    logo: mockLogoFor("Pakistan Red Crescent Society"),
    phone: "+92 51 111 111 222",
  },
  {
    id: 2,
    name: "Al Khidmat Raazi Hospital",
    location: "24-B-1, near Chandni Chowk Flyover, Satellite Town, Islamabad",
    latitude: 33.66,
    longitude: 73.0169,
    has_emr: false,
    photo: MOCK_PHOTOS[1],
    logo: mockLogoFor("Al Khidmat Raazi Hospital"),
    phone: "+92 51 111 222 333",
  },
  {
    id: 3,
    name: "Services Hospital Blood Bank",
    location: "Jail Road, Lahore",
    latitude: 31.5204,
    longitude: 74.3345,
    has_emr: true,
    photo: MOCK_PHOTOS[2],
    logo: mockLogoFor("Services Hospital Blood Bank"),
    phone: "+92 42 111 333 444",
  },
  {
    id: 4,
    name: "Indus Hospital Karachi",
    location: "Korangi Crossing, Karachi",
    latitude: 24.8447,
    longitude: 67.1364,
    has_emr: true,
    photo: MOCK_PHOTOS[3],
    logo: mockLogoFor("Indus Hospital Karachi"),
    phone: "+92 21 111 444 555",
  },
  {
    id: 5,
    name: "Lady Reading Hospital",
    location: "Soekarno Chowk, Peshawar",
    latitude: 34.0083,
    longitude: 71.5405,
    has_emr: false,
    photo: MOCK_PHOTOS[4],
    logo: mockLogoFor("Lady Reading Hospital"),
    phone: "+92 91 111 555 666",
  },
  {
    id: 6,
    name: "Sandeman Provincial Hospital",
    location: "Jinnah Town, Quetta",
    latitude: 30.2095,
    longitude: 67.0182,
    has_emr: false,
    photo: MOCK_PHOTOS[1],
    logo: mockLogoFor("Sandeman Provincial Hospital"),
    phone: "+92 81 111 666 777",
  },
  {
    id: 7,
    name: "Nishtar Hospital Blood Bank",
    location: "Nishtar Road, Multan",
    latitude: 30.1969,
    longitude: 71.4306,
    has_emr: true,
    photo: MOCK_PHOTOS[3],
    logo: mockLogoFor("Nishtar Hospital Blood Bank"),
    phone: "+92 61 111 777 888",
  },
];

// TODO: schema has no facility contact field yet — CTA phone numbers above
// are placeholders standing in until Profile/facility contact info exists.
const mockInventory = [
  // NOTE: Indus Hospital Karachi (facility_id 4) is intentionally left with
  // zero available stock across the board — it's the one deliberate demo
  // card showing the "Unavailable" state + Contact CTA. Every other
  // facility below always has at least one group in stock, so they only
  // ever render as Available or Low Stock.
  {
    id: 1,
    facility_id: 1,
    blood_group: "A+",
    quantity: 4,
    status: "available",
    expiry_date: "2026-09-15",
  },
  {
    id: 2,
    facility_id: 1,
    blood_group: "O+",
    quantity: 6,
    status: "available",
    expiry_date: "2026-09-10",
  },
  {
    id: 3,
    facility_id: 1,
    blood_group: "B-",
    quantity: 0,
    status: "expired",
    expiry_date: "2026-08-01",
  },
  {
    id: 4,
    facility_id: 2,
    blood_group: "O+",
    quantity: 2,
    status: "available",
    expiry_date: "2026-09-05",
  },
  {
    id: 5,
    facility_id: 2,
    blood_group: "AB+",
    quantity: 1,
    status: "available",
    expiry_date: "2026-09-20",
  },
  {
    id: 6,
    facility_id: 3,
    blood_group: "A+",
    quantity: 3,
    status: "available",
    expiry_date: "2026-09-08",
  },
  {
    id: 7,
    facility_id: 3,
    blood_group: "O-",
    quantity: 1,
    status: "available",
    expiry_date: "2026-09-02",
  },
  {
    id: 8,
    facility_id: 4,
    blood_group: "B+",
    quantity: 0,
    status: "reserved",
    expiry_date: "2026-09-18",
  },
  {
    id: 9,
    facility_id: 4,
    blood_group: "O+",
    quantity: 0,
    status: "reserved",
    expiry_date: "2026-09-01",
  },
  {
    id: 10,
    facility_id: 5,
    blood_group: "AB-",
    quantity: 2,
    status: "available",
    expiry_date: "2026-09-12",
  },
  {
    id: 11,
    facility_id: 5,
    blood_group: "A+",
    quantity: 4,
    status: "available",
    expiry_date: "2026-09-14",
  },
  {
    id: 12,
    facility_id: 6,
    blood_group: "B+",
    quantity: 3,
    status: "available",
    expiry_date: "2026-09-09",
  },
  {
    id: 13,
    facility_id: 6,
    blood_group: "O+",
    quantity: 2,
    status: "available",
    expiry_date: "2026-09-06",
  },
  {
    id: 14,
    facility_id: 7,
    blood_group: "A-",
    quantity: 2,
    status: "available",
    expiry_date: "2026-09-11",
  },
  {
    id: 15,
    facility_id: 7,
    blood_group: "O+",
    quantity: 5,
    status: "available",
    expiry_date: "2026-09-07",
  },
];
// Auto-generate complete stock for all 8 blood groups across all facilities
const ALL_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

mockFacilities.forEach((facility) => {
  if (facility.id === 4) return; // Keep Indus Hospital as Out of Stock test case

  ALL_BLOOD_GROUPS.forEach((group) => {
    const exists = mockInventory.some(
      (item) => item.facility_id === facility.id && item.blood_group === group,
    );

    if (!exists) {
      mockInventory.push({
        id: mockInventory.length + 1,
        facility_id: facility.id,
        blood_group: group,
        quantity: Math.floor(Math.random() * 6) + 1,
        status: "available",
        expiry_date: "2026-09-30",
      });
    }
  });
});

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

// Rough drive-time estimate from straight-line distance, assuming ~30km/h
// average city traffic. Good enough for card sorting/display without a real
// routing API; TODO: swap for a maps ETA once one is wired up.
function formatEta(km) {
  const AVG_CITY_SPEED_KMH = 30;
  const totalMinutes = Math.max(5, Math.round((km / AVG_CITY_SPEED_KMH) * 60));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return mins > 0 ? `${hrs} hr ${mins} mins` : `${hrs} hr`;
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

function getInventoryFor(facilityId, group) {
  const rows = mockInventory.filter((row) => row.facility_id === facilityId);
  if (group) return rows.find((row) => row.blood_group === group);
  return rows.find((row) => row.status === "available" && row.quantity > 0);
}

function facilityHasGroup(facilityId, group) {
  return mockInventory.some(
    (row) =>
      row.facility_id === facilityId &&
      row.blood_group === group &&
      row.status === "available" &&
      row.quantity > 0,
  );
}
// Evaluates facility stock eligibility and returns a ranking tier:
// Tier 0: Fully available (meets or exceeds requested quantity)
// Tier 1: Low stock (available, but quantity is low or below requested amount)
// Tier 2: Unavailable / Out of stock
function getStockTier(facilityId, bloodGroup, reqQty = 1) {
  if (!bloodGroup) return 0;
  const targetQty = reqQty || 1;
  const row = mockInventory.find(
    (r) => r.facility_id === facilityId && r.blood_group === bloodGroup,
  );

  if (!row || row.status !== "available" || row.quantity <= 0) return 2; // Out of stock
  if (row.quantity < targetQty || row.quantity <= 2) return 1; // Low stock
  return 0; // Fully available
}
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

// Mock API call — shaped like a future
// fetch(`/inventory?blood_group=${bloodGroup}&lat=${lat}&lng=${lng}`).then(r => r.json())
// so swapping this out later is a one-function change.
// function fetchFacilities(state) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const filtered = mockFacilities
//         .filter((f) => !state.bloodGroup || facilityHasGroup(f.id, state.bloodGroup))
//         .sort((a, b) => {
//           if (!state.coords) return 0;
//           const distA = distanceKm(state.coords.lat, state.coords.lng, a.latitude, a.longitude);
//           const distB = distanceKm(state.coords.lat, state.coords.lng, b.latitude, b.longitude);
//           return distA - distB;
//         });
//       resolve(filtered);
//     }, 500);
//   });
// }
function fetchFacilities(state) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const targetQty = state.quantity || 1;
      const selectedCity = (state.city || "").toLowerCase();

      const sorted = [...mockFacilities]
        .map((facility) => {
          const inSelectedCity =
            selectedCity &&
            facility.location.toLowerCase().includes(selectedCity);
          const dist = state.coords
            ? distanceKm(
                state.coords.lat,
                state.coords.lng,
                facility.latitude,
                facility.longitude,
              )
            : Infinity;
          const tier = getStockTier(facility.id, state.bloodGroup, targetQty);

          return { facility, inSelectedCity, dist, tier };
        })
        .sort((a, b) => {
          // 1. Same-city matches come first
          if (a.inSelectedCity !== b.inSelectedCity)
            return a.inSelectedCity ? -1 : 1;
          // 2. Best stock tier next (Available > Low Stock > Out of Stock)
          if (a.tier !== b.tier) return a.tier - b.tier;
          // 3. Closest distance last
          return a.dist - b.dist;
        })
        .map((item) => item.facility);

      resolve(sorted);
    }, 500);
  });
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

    loginSubmitBtnText.textContent = "Logged In ✓";
    window.location.href = "dashboard.html";
  });
}
