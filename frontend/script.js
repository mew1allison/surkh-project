// ---- Why SURKH: cards rendered from data, not hand-written ----
const whyCards = [
  {
    accent: 'var(--color-accent)',
    icon: 'assets/icon-hospital.png',
    title: 'Connecting <span>hospitals</span> in the donor-patient loop',
    desc: 'Develop trust channels through certified facilities'
  },
  {
    accent: 'var(--color-secondary)',
    icon: 'assets/icon-sync.png',
    title: 'Allowing facilities to <span>sync</span> blood inventories',
    desc: 'Real-time updates about available blood nearby'
  },
  {
    accent: 'var(--color-primary)',
    icon: 'assets/icon-network.png',
    title: 'Including smaller blood camps via <span>AI</span> technology',
    desc: 'AI Ledger Reader enables local setups to get connected'
  }
];

const cardsContainer = document.getElementById('why-cards');

if (cardsContainer) {
  whyCards.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'why-card';
    el.style.setProperty('--card-accent', card.accent);
    el.innerHTML = `
      <img src="${card.icon}" alt="" class="why-card__icon">
      <h4 class="why-card__title">${card.title}</h4>
      <p class="why-card__desc">${card.desc}</p>
    `;
    cardsContainer.appendChild(el);
  });
}

// ---- Footer: always show the current year, never a hardcoded one ----
const footerYear = document.getElementById('footer-year');
if (footerYear) footerYear.textContent = new Date().getFullYear();

// ---- Float-in on scroll for heading/paragraph ----
const floatTargets = document.querySelectorAll('.js-float-in');

if (floatTargets.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

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
  coords: null
};

const quickCities = ['Islamabad', 'Lahore', 'Karachi', 'Peshawar'];
const chipsContainer = document.getElementById('quick-search-chips');
const citySelect = document.getElementById('city-select');

// Approximate city centers — used to turn a picked city into coordinates so
// filtering/sorting can run on lat/long (matching facilities.latitude/longitude)
// the same way a GPS-based search would, instead of a separate string match.
const CITY_COORDS = {
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Lahore: { lat: 31.5497, lng: 74.3436 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.9750 },
  Multan: { lat: 30.1575, lng: 71.5249 }
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
  if (locationBtnText) locationBtnText.textContent = 'Use Live Location';
  if (locationStatus) {
    locationStatus.textContent = '';
    locationStatus.className = 'find-blood__location-status';
  }

  if (citySelect) {
    const match = Array.from(citySelect.options).find(
      (opt) => opt.textContent.trim().toLowerCase() === cityName.toLowerCase()
    );
    if (match) citySelect.value = match.value;
  }

  if (chipsContainer) {
    chipsContainer.querySelectorAll('.chip').forEach((chip) => {
      chip.classList.toggle('is-active', chip.textContent.trim() === cityName);
    });
  }
}

if (chipsContainer) {
  quickCities.forEach((city) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = city;
    btn.addEventListener('click', () => setCity(city));
    chipsContainer.appendChild(btn);
  });
}

if (citySelect) {
  citySelect.addEventListener('change', () => {
    const cityName = citySelect.selectedOptions[0]?.textContent.trim() || null;
    findBloodState.city = cityName;
    findBloodState.coords = cityName ? CITY_COORDS[cityName] || null : null;
    if (chipsContainer) {
      chipsContainer.querySelectorAll('.chip').forEach((chip) => {
        chip.classList.toggle('is-active', chip.textContent.trim() === cityName);
      });
    }
  });
}

// Blood group — single select, click again to deselect
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DEFAULT_BLOOD_GROUP = 'O+'; // pre-selected so the user has a visual cue on load
const groupGrid = document.getElementById('blood-group-grid');

if (groupGrid) {
  bloodGroups.forEach((group) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group-btn';
    btn.textContent = group;

    if (group === DEFAULT_BLOOD_GROUP) {
      btn.classList.add('is-active');
      findBloodState.bloodGroup = group;
    }

    btn.addEventListener('click', () => {
      const alreadyActive = btn.classList.contains('is-active');
      groupGrid.querySelectorAll('.group-btn').forEach((b) => b.classList.remove('is-active'));
      if (!alreadyActive) {
        btn.classList.add('is-active');
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
const qtyRow = document.getElementById('quantity-options');
let customInput;
let customWrap;

function selectPresetQty(value, btn) {
  findBloodState.quantity = value;
  if (customInput) customInput.value = '';
  if (customWrap) customWrap.classList.remove('is-active');
  qtyRow.querySelectorAll('.qty-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
}

function useCustomQty() {
  const value = parseInt(customInput.value, 10);
  findBloodState.quantity = Number.isNaN(value) ? null : value;
  qtyRow.querySelectorAll('.qty-btn').forEach((b) => b.classList.remove('is-active'));
  customWrap.classList.toggle('is-active', !Number.isNaN(value) && value > 0);
}

if (qtyRow) {
  quantityPresets.forEach((qty) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qty-btn';
    btn.textContent = qty;
    btn.addEventListener('click', () => selectPresetQty(qty, btn));
    qtyRow.appendChild(btn);
  });

  customWrap = document.createElement('div');
  customWrap.className = 'find-blood__qty-custom';
  customWrap.innerHTML = `
    <input type="number" min="1" class="find-blood__qty-custom-input" placeholder="Select Custom">
    <button type="button" class="find-blood__qty-step">+1</button>
  `;
  qtyRow.appendChild(customWrap);

  customInput = customWrap.querySelector('.find-blood__qty-custom-input');
  const stepBtn = customWrap.querySelector('.find-blood__qty-step');

  customInput.addEventListener('input', useCustomQty);
  stepBtn.addEventListener('click', () => {
    const current = parseInt(customInput.value, 10) || 0;
    customInput.value = current + 1;
    useCustomQty();
  });
}

// Use Live Location — real Geolocation API call
const locationBtn = document.getElementById('use-location-btn');
const locationBtnText = document.getElementById('location-btn-text');
const locationStatus = document.getElementById('location-status');

if (locationBtn) {
  locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      locationStatus.textContent = 'Geolocation is not supported on this device.';
      locationStatus.className = 'find-blood__location-status find-blood__location-status--error';
      return;
    }

    locationBtn.disabled = true;
    locationBtnText.textContent = 'Locating…';
    locationStatus.textContent = '';
    locationStatus.className = 'find-blood__location-status';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        findBloodState.coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Fill the city select/chip with the nearest known city for display,
        // but keep the exact GPS coords above for real distance sorting.
        const nearestCity = nearestCityFromCoords(findBloodState.coords.lat, findBloodState.coords.lng);
        findBloodState.city = nearestCity;

        if (citySelect) {
          const match = Array.from(citySelect.options).find(
            (opt) => opt.textContent.trim().toLowerCase() === (nearestCity || '').toLowerCase()
          );
          citySelect.value = match ? match.value : '';
        }
        if (chipsContainer) {
          chipsContainer.querySelectorAll('.chip').forEach((chip) => {
            chip.classList.toggle('is-active', chip.textContent.trim() === nearestCity);
          });
        }

        locationBtn.disabled = false;
        locationBtnText.textContent = 'Location Detected ✓';
        locationStatus.textContent = nearestCity
          ? `Using your current location — closest to ${nearestCity}.`
          : 'Using your current location for nearby results.';
        locationStatus.className = 'find-blood__location-status find-blood__location-status--success';
      },
      (error) => {
        findBloodState.coords = null;
        locationBtn.disabled = false;
        locationBtnText.textContent = 'Use Live Location';
        locationStatus.textContent =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied — select a city instead.'
            : 'Could not detect location — select a city instead.';
        locationStatus.className = 'find-blood__location-status find-blood__location-status--error';
      }
    );
  });
}

// Form submit — validates, then hands off a clean state object
// (this is the exact shape a real fetch('/inventory?...') call would consume)
const findBloodForm = document.getElementById('find-blood-form');
const searchBtn = document.getElementById('search-blood-btn');
const searchBtnText = document.getElementById('search-btn-text');
const formError = document.getElementById('form-error');
const resultsSection = document.querySelector('.find-blood__results');

if (findBloodForm) {
  findBloodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formError.textContent = '';

    let invalid = false;

    if (!findBloodState.bloodGroup) {
      formError.textContent = 'Please select a blood group.';
      invalid = true;
    } else if (!findBloodState.coords) {
      formError.textContent = 'Please select a city or use your live location.';
      invalid = true;
    }

    if (invalid) {
      // Visible shake so a blocked submit is never mistaken for "nothing happened"
      findBloodForm.classList.remove('shake');
      // eslint-disable-next-line no-unused-expressions
      void findBloodForm.offsetWidth; // restart the animation if triggered twice in a row
      findBloodForm.classList.add('shake');
      return;
    }

    searchBtn.disabled = true;
    searchBtnText.textContent = 'Searching…';

    // TODO: replace fetchFacilities() with the real API call, e.g.
    // fetch(`/inventory?blood_group=${findBloodState.bloodGroup}&lat=${findBloodState.coords.lat}&lng=${findBloodState.coords.lng}`).then(r => r.json())
    fetchFacilities(findBloodState).then((results) => {
      searchBtn.disabled = false;
      searchBtnText.textContent = 'Search Blood';
      currentFilteredResults = results;
      visibleResultsCount = RESULTS_PAGE_SIZE;
      resultsSubtext.textContent = 'Showing Closest to You';
      renderResultsList();
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
// ---- Find Blood Now: results (Step 3) ----
// Mirrors your real schema: `facilities` (location data) joined with
// `inventory` (stock per blood_group, owned/updated by partner hospitals).
// Profile and Exchange Request aren't needed for public search, so they're
// left out here. TODO: swap these two arrays for
// GET /facilities + GET /inventory once the backend is wired up.
const mockFacilities = [
  { id: 1, name: 'Pakistan Red Crescent Society', location: 'Ashfaq Ahmed Road, Sector H-8/2, Islamabad', latitude: 33.7106, longitude: 73.0497, has_emr: true, photo: 'assets/donation-camp.jpg', logo: 'assets/logo.jpg', phone: '+92 51 111 111 222' },
  { id: 2, name: 'Al Khidmat Raazi Hospital', location: '24-B-1, near Chandni Chowk Flyover, Satellite Town, Islamabad', latitude: 33.6600, longitude: 73.0169, has_emr: false, photo: 'assets/donation-camp.jpg', logo: 'assets/logo.jpg', phone: '+92 51 111 222 333' },
  { id: 3, name: 'Services Hospital Blood Bank', location: 'Jail Road, Lahore', latitude: 31.5204, longitude: 74.3345, has_emr: true, photo: 'assets/donation-camp.jpg', logo: 'assets/logo.jpg', phone: '+92 42 111 333 444' },
  { id: 4, name: 'Indus Hospital Karachi', location: 'Korangi Crossing, Karachi', latitude: 24.8447, longitude: 67.1364, has_emr: true, photo: 'assets/donation-camp.jpg', logo: 'assets/logo.jpg', phone: '+92 21 111 444 555' },
  { id: 5, name: 'Lady Reading Hospital', location: 'Soekarno Chowk, Peshawar', latitude: 34.0083, longitude: 71.5405, has_emr: false, photo: 'assets/donation-camp.jpg', logo: 'assets/logo.jpg', phone: '+92 91 111 555 666' },
  { id: 6, name: 'Sandeman Provincial Hospital', location: 'Jinnah Town, Quetta', latitude: 30.2095, longitude: 67.0182, has_emr: false, photo: 'assets/donation-camp.jpg', logo: 'assets/logo.jpg', phone: '+92 81 111 666 777' },
  { id: 7, name: 'Nishtar Hospital Blood Bank', location: 'Nishtar Road, Multan', latitude: 30.1969, longitude: 71.4306, has_emr: true, photo: 'assets/donation-camp.jpg', logo: 'assets/logo.jpg', phone: '+92 61 111 777 888' }
];

// TODO: schema has no facility contact field yet — CTA phone numbers above
// are placeholders standing in until Profile/facility contact info exists.
const mockInventory = [
  { id: 1, facility_id: 1, blood_group: 'A+', quantity: 4, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-15' },
  { id: 2, facility_id: 1, blood_group: 'O+', quantity: 6, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-10' },
  { id: 3, facility_id: 1, blood_group: 'B-', quantity: 0, status: 'expired', component_type: 'Whole Blood', expiry_date: '2026-08-01' },
  { id: 4, facility_id: 2, blood_group: 'O+', quantity: 2, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-05' },
  { id: 5, facility_id: 2, blood_group: 'AB+', quantity: 1, status: 'available', component_type: 'Plasma', expiry_date: '2026-09-20' },
  { id: 6, facility_id: 3, blood_group: 'A+', quantity: 3, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-08' },
  { id: 7, facility_id: 3, blood_group: 'O-', quantity: 1, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-02' },
  { id: 8, facility_id: 4, blood_group: 'B+', quantity: 5, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-18' },
  { id: 9, facility_id: 4, blood_group: 'O+', quantity: 0, status: 'reserved', component_type: 'Whole Blood', expiry_date: '2026-09-01' },
  { id: 10, facility_id: 5, blood_group: 'AB-', quantity: 2, status: 'available', component_type: 'Plasma', expiry_date: '2026-09-12' },
  { id: 11, facility_id: 5, blood_group: 'A+', quantity: 4, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-14' },
  { id: 12, facility_id: 6, blood_group: 'B+', quantity: 3, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-09' },
  { id: 13, facility_id: 6, blood_group: 'O+', quantity: 2, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-06' },
  { id: 14, facility_id: 7, blood_group: 'A-', quantity: 2, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-11' },
  { id: 15, facility_id: 7, blood_group: 'O+', quantity: 5, status: 'available', component_type: 'Whole Blood', expiry_date: '2026-09-07' }
];

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
function estimateEtaMinutes(km) {
  const AVG_CITY_SPEED_KMH = 30;
  return Math.max(5, Math.round((km / AVG_CITY_SPEED_KMH) * 60));
}

const RESULTS_PAGE_SIZE = 3; // matches the 3-cards-per-row desktop grid

// Pre-search default view: all known facilities in no particular order,
// standing in for a real "popular/common searches" endpoint.
const commonSearches = [...mockFacilities];

let currentFilteredResults = commonSearches;
let visibleResultsCount = RESULTS_PAGE_SIZE;

const resultsList = document.getElementById('results-list');
const resultsEmpty = document.getElementById('results-empty');
const resultsSubtext = document.getElementById('results-subtext');
const seeAllBtn = document.getElementById('see-all-btn');

function getInventoryFor(facilityId, group) {
  const rows = mockInventory.filter((row) => row.facility_id === facilityId);
  if (group) return rows.find((row) => row.blood_group === group);
  return rows.find((row) => row.status === 'available' && row.quantity > 0);
}

function facilityHasGroup(facilityId, group) {
  return mockInventory.some(
    (row) => row.facility_id === facilityId && row.blood_group === group && row.status === 'available' && row.quantity > 0
  );
}

function buildResultCard(facility) {
  const stock = getInventoryFor(facility.id, findBloodState.bloodGroup);
  const available = !!stock && stock.status === 'available' && stock.quantity > 0;
  const lowStock = available && stock.quantity <= 2; // ADD THIS — low-stock threshold
  const distance = findBloodState.coords
    ? distanceKm(findBloodState.coords.lat, findBloodState.coords.lng, facility.latitude, facility.longitude)
    : null;

  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <div class="result-card__photo-wrap">
      <img src="${facility.photo}" alt="${facility.name}" class="result-card__photo">
      ${available
        ? lowStock
          ? '<span class="result-card__badge result-card__badge--low">Low Stock</span>'
          : '<span class="result-card__badge">Available</span>'
        : ''}
    </div>
    <div class="result-card__body">
      ${lowStock ? '<p class="result-card__notice">Low Stock — confirm availability directly via contact as well.</p>' : ''}
      <div class="result-card__top">
        <img src="${facility.logo}" alt="" class="result-card__logo">
        <div>
          <p class="result-card__name">${facility.name}</p>
          <p class="result-card__address">${facility.location}</p>
        </div>
      </div>
      <div class="result-card__bottom">
        <span class="result-card__eta"><img src="assets/icon-car.svg" alt="" class="icon-inline">${distance !== null ? `~${estimateEtaMinutes(distance)} min` : 'ETA N/A'}</span>
        <button type="button" class="result-card__reserve" data-facility-id="${facility.id}">Reserve Blood</button>
      </div>
    </div>
  `;
  return card;
      }

function renderResultsList() {
  if (!resultsList) return;
  resultsList.innerHTML = '';
  const toShow = currentFilteredResults.slice(0, visibleResultsCount);

  toShow.forEach((facility) => resultsList.appendChild(buildResultCard(facility)));

  if (resultsEmpty) resultsEmpty.classList.toggle('is-visible', currentFilteredResults.length === 0);
  if (seeAllBtn) seeAllBtn.style.display = visibleResultsCount < currentFilteredResults.length ? 'inline-flex' : 'none';
}

// Mock API call — shaped like a future
// fetch(`/inventory?blood_group=${bloodGroup}&lat=${lat}&lng=${lng}`).then(r => r.json())
// so swapping this out later is a one-function change.
function fetchFacilities(state) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = mockFacilities
        .filter((f) => !state.bloodGroup || facilityHasGroup(f.id, state.bloodGroup))
        .sort((a, b) => {
          if (!state.coords) return 0;
          const distA = distanceKm(state.coords.lat, state.coords.lng, a.latitude, a.longitude);
          const distB = distanceKm(state.coords.lat, state.coords.lng, b.latitude, b.longitude);
          return distA - distB;
        });
      resolve(filtered);
    }, 500);
  });
}

if (seeAllBtn) {
  seeAllBtn.addEventListener('click', () => {
    visibleResultsCount = currentFilteredResults.length;
    renderResultsList();
  });
}

// Reserve Blood — opens a dialog with the searched blood group, contact info,
// and a WhatsApp hand-off CTA (only the dialog is built here; the actual send
// happens on WhatsApp's side via the wa.me link).
const reserveModal = document.getElementById('reserve-modal');
const reserveModalBackdrop = document.getElementById('reserve-modal-backdrop');
const reserveModalClose = document.getElementById('reserve-modal-close');
const reserveModalGroup = document.getElementById('reserve-modal-group');
const reserveModalFacility = document.getElementById('reserve-modal-facility');
const reserveModalContact = document.getElementById('reserve-modal-contact');
const reserveModalCta = document.getElementById('reserve-modal-cta');

function openReserveModal(facility) {
  const group = findBloodState.bloodGroup || 'Blood';
  reserveModalGroup.textContent = `${group} is available at this facility`;
  reserveModalFacility.textContent = `${facility.name} — ${facility.location}`;
  reserveModalContact.textContent = facility.phone || 'Contact info not available';

  const phoneDigits = (facility.phone || '').replace(/\D/g, '');
  const message = `Hi, I'd like to reserve ${group} blood at ${facility.name}.`;
  reserveModalCta.href = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;

  reserveModal.hidden = false;
}

function closeReserveModal() {
  reserveModal.hidden = true;
}

if (resultsList) {
  resultsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.result-card__reserve');
    if (!btn) return;
    const facility = mockFacilities.find((f) => f.id === Number(btn.dataset.facilityId));
    if (facility) openReserveModal(facility);
  });
}

if (reserveModalClose) reserveModalClose.addEventListener('click', closeReserveModal);
if (reserveModalBackdrop) reserveModalBackdrop.addEventListener('click', closeReserveModal);

renderResultsList();
// Nav toggle — opens/closes the mobile nav dropdown
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navToggle.classList.toggle('is-active', !isOpen);
    mainNav.classList.toggle('is-open', !isOpen);
  });

  // Close the menu after picking a link, so it doesn't stay open post-navigation
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.classList.remove('is-active');
      mainNav.classList.remove('is-open');
    });
  });
}


// ================================================================
// Partner with Surkh — hospital sign-up form (partner.html only)
// TODO: replace the mock submit below with a real POST /facilities call
// (+ linked Profile row) once that backend endpoint exists. See
// partner-signup-wireframe.md for the full field-to-schema mapping.
// ================================================================
const partnerForm = document.getElementById('partner-signup-form');

if (partnerForm) {
  // has_emr — single-select Yes/No toggle
  const emrToggle = document.getElementById('has-emr-toggle');
  let hasEmr = false; // matches the pre-selected "No" button in the markup

  if (emrToggle) {
    emrToggle.querySelectorAll('.toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        emrToggle.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        hasEmr = btn.dataset.value === 'true';
      });
    });
  }

  // Precise location — same Geolocation API pattern as Find Blood, kept as
  // its own state here since this page has no shared findBloodState.
  const partnerLocationBtn = document.getElementById('partner-location-btn');
  const partnerLocationBtnText = document.getElementById('partner-location-btn-text');
  const partnerLocationStatus = document.getElementById('partner-location-status');
  let facilityCoords = null;

  if (partnerLocationBtn) {
    partnerLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        partnerLocationStatus.textContent = 'Geolocation is not supported on this device.';
        partnerLocationStatus.className = 'partner-form__location-status partner-form__location-status--error';
        return;
      }

      partnerLocationBtn.disabled = true;
      partnerLocationBtnText.textContent = 'Locating…';
      partnerLocationStatus.textContent = '';
      partnerLocationStatus.className = 'partner-form__location-status';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          facilityCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          partnerLocationBtn.disabled = false;
          partnerLocationBtnText.textContent = 'Location Detected ✓';
          partnerLocationStatus.textContent = "We'll use this as your facility's pinned location.";
          partnerLocationStatus.className = 'partner-form__location-status partner-form__location-status--success';
        },
        (error) => {
          facilityCoords = null;
          partnerLocationBtn.disabled = false;
          partnerLocationBtnText.textContent = 'Detect My Location';
          partnerLocationStatus.textContent =
            error.code === error.PERMISSION_DENIED
              ? 'Location permission denied — this is required to list your facility.'
              : 'Could not detect location — please try again.';
          partnerLocationStatus.className = 'partner-form__location-status partner-form__location-status--error';
        }
      );
    });
  }

  // Submit — validates required fields, then builds a payload shaped exactly
  // like facilities + Profile (see schema mapping in the wireframe doc).
  const partnerFormError = document.getElementById('partner-form-error');
  const partnerSubmitBtn = document.getElementById('partner-submit-btn');
  const partnerSubmitBtnText = document.getElementById('partner-submit-btn-text');

  partnerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    partnerFormError.textContent = '';

    const facilityName = document.getElementById('facility-name').value.trim();
    const facilityLocation = document.getElementById('facility-location').value.trim();
    const staffName = document.getElementById('staff-name').value.trim();
    const staffEmail = document.getElementById('staff-email').value.trim();
    const staffPassword = document.getElementById('staff-password').value;
    const staffRole = document.getElementById('staff-role').value;

    let invalid = false;
    if (!facilityName || !facilityLocation) {
      partnerFormError.textContent = 'Please fill in your facility name and address.';
      invalid = true;
    } else if (!facilityCoords) {
      partnerFormError.textContent = "Please detect your facility's location before continuing.";
      invalid = true;
    } else if (!staffName || !staffEmail || staffPassword.length < 8 || !staffRole) {
      partnerFormError.textContent = 'Please complete all of your details, including an 8+ character password.';
      invalid = true;
    }

    if (invalid) {
      // Reuses the same shake animation as the Find Blood form
      partnerForm.classList.remove('shake');
      // eslint-disable-next-line no-unused-expressions
      void partnerForm.offsetWidth;
      partnerForm.classList.add('shake');
      return;
    }

    // Matches facilities + Profile schema exactly — nothing invented here.
    // TODO: POST this to /facilities (creates facility + linked Profile row)
    const payload = {
      facility: {
        name: facilityName,
        location: facilityLocation,
        latitude: facilityCoords.lat,
        longitude: facilityCoords.lng,
        has_emr: hasEmr
      },
      profile: {
        full_name: staffName,
        email: staffEmail,
        role: staffRole
        // facility_id is assigned server-side once the facility row exists
      }
      // password goes to Supabase Auth directly — it's not a Profile column
    };

    partnerSubmitBtn.disabled = true;
    partnerSubmitBtnText.textContent = 'Creating Account…';

    // Mock network delay standing in for the real request above
    setTimeout(() => {
      partnerSubmitBtnText.textContent = 'Account Created ✓';
      // TODO: redirect to the hospital dashboard once it's built
    }, 900);
  });
}

// ---- Facility login form (login.html only) ----
const loginForm = document.getElementById('login-form');

if (loginForm) {
  const loginError = document.getElementById('login-form-error');
  const loginSubmitBtn = document.getElementById('login-submit-btn');
  const loginSubmitBtnText = document.getElementById('login-submit-btn-text');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      loginError.textContent = 'Please enter both your email and password.';
      loginForm.classList.remove('shake');
      void loginForm.offsetWidth;
      loginForm.classList.add('shake');
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtnText.textContent = 'Logging In…';

    // TODO: replace with a real Supabase Auth sign-in call
    setTimeout(() => {
      loginSubmitBtnText.textContent = 'Logged In ✓';
      // TODO: redirect to the hospital dashboard once it's built
    }, 900);
  });
}
