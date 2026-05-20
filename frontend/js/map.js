let map = null;
let userMarker = null;
let objectMarkers = [];
let overpassMarkers  = [];
let shownPlaceIds    = new Set();   // dedup across radius expansions
let allOverpassPlaces = [];         // accumulated list across radius expansions
let activePOICategory  = null;
let activePOISubFilter = 'all';
let currentRadius      = 1000;      // search radius in metres
let userAddress = null; // human-readable address from reverse geocoding

// ── POI category definitions (Google Places) ──────────────────────────────────

const POI_DEFS = {
  food:     { icon: '🍽️', color: '#f97316', hasSubs: 'food' },
  sights:   { icon: '🏛️', color: '#a855f7', hasDistance: true },
  shopping: { icon: '🛍️', color: '#ec4899', hasSubs: 'shopping' },
  hotels:   { icon: '🏨', color: '#06b6d4', hasDistance: true },
};

// ── Map init ──────────────────────────────────────────────────────────────────

function showMapFallback() {
  document.getElementById('map').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;color:#94a3b8;text-align:center;padding:32px;background:#0f172a;">
      <div style="font-size:56px;">🗺️</div>
      <h3 style="color:#f1f5f9;font-size:18px;">Google Maps API key not configured</h3>
      <p>Add your key to <code style="background:#1e293b;padding:2px 6px;border-radius:4px;">.env</code> and restart the server:</p>
      <code style="background:#1e293b;padding:8px 14px;border-radius:6px;font-size:13px;">GOOGLE_MAPS_API_KEY=your_key_here</code>
      <p style="font-size:13px;margin-top:4px;">Get a free key at <a href="https://console.cloud.google.com" target="_blank" style="color:#3b82f6">console.cloud.google.com</a> → Maps JavaScript API</p>
      <p style="font-size:12px;color:#64748b;margin-top:8px;">All other features (chat, history, admin) work without a Maps key.</p>
    </div>
  `;
  loadObjectsOnList();
}

// Called by Google Maps when the key is invalid/missing
window.gm_authFailure = showMapFallback;

async function initMap() {
  // Start geolocation immediately — don't wait for Maps API
  trackLocationOnly();

  const cfg = await api.get('/api/config').catch(() => ({ google_maps_key: '' }));
  const key = cfg.google_maps_key;

  // Treat placeholder value as no key
  const hasKey = key && !key.startsWith('AIza...') && key.length > 10;

  if (!hasKey) {
    showMapFallback();
    return;
  }

  window.onGoogleMapsLoaded = function () {
    map = window.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 56.953218, lng: 24.104180 },
      zoom: 14,
      styles: (typeof getTheme === 'function' && getTheme() === 'light') ? [] : darkMapStyle(),
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
    });

    // Map loaded — add marker at already-known location (if any)
    if (userLocation) placeUserMarker(userLocation);
    loadObjectMarkers(userLocation?.lat, userLocation?.lng);
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=onGoogleMapsLoaded`;
  script.async = true;
  document.head.appendChild(script);
}

// ── User location controls ────────────────────────────────────────────────────

function locateUser() {
  if (userLocation && map) {
    map.setCenter(userLocation);
    placeUserMarker(userLocation);
  }
}

function placeUserMarker(loc) {
  if (!map) return;
  if (userMarker) userMarker.setMap(null);
  userMarker = new google.maps.Marker({
    position: loc,
    map,
    title: 'You are here',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#3b82f6',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    },
    zIndex: 999,
  });
}

// ── DB object markers (custom) ────────────────────────────────────────────────

async function loadObjectMarkers(lat, lng) {
  let url = '/api/objects';
  if (lat && lng) url += `?lat=${lat}&lng=${lng}&radius=10`;

  const objects = await api.get(url).catch(() => []);

  objectMarkers.forEach(m => m.setMap(null));
  objectMarkers = [];

  if (!map) {
    renderObjectList(objects);
    return;
  }

  const iconMap = {
    monument: '🗽', church: '⛪', historic: '🏛️', castle: '🏰',
    museum: '🖼️', street: '🛣️', market: '🏪', theater: '🎭',
  };

  objects.forEach(obj => {
    if (!obj.latitude || !obj.longitude) return;

    const label = iconMap[obj.kategorija] || '📍';

    const marker = new google.maps.Marker({
      position: { lat: parseFloat(obj.latitude), lng: parseFloat(obj.longitude) },
      map,
      title: obj.nosaukums,
      label: { text: label, fontSize: '20px' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 18,
        fillColor: '#1e293b',
        fillOpacity: 0.9,
        strokeColor: '#3b82f6',
        strokeWeight: 2,
      },
    });

    marker.addListener('click', () => showObjectInfo(obj));
    objectMarkers.push(marker);
  });

  renderObjectList(objects);
}

function renderObjectList(objects) {
  const listEl = document.getElementById('objects-tab');
  if (!listEl) return;

  if (!objects.length) {
    listEl.innerHTML = '<p style="padding:16px;color:var(--text-muted);text-align:center;font-size:13px;">No places found nearby</p>';
    return;
  }

  listEl.innerHTML = objects.map(o => `
    <div class="object-list-item" onclick="showObjectInfo(${JSON.stringify(o).replace(/"/g, '&quot;')})">
      <strong>${o.nosaukums}</strong>
      <p>${o.iss_apraksts ? o.iss_apraksts.substring(0, 80) + '...' : ''}</p>
    </div>
  `).join('');
}

function showObjectInfo(obj) {
  const panel = document.getElementById('info-panel');
  if (!panel) return;

  document.getElementById('info-name').textContent = obj.nosaukums;
  document.getElementById('info-desc').textContent = obj.iss_apraksts || '';
  document.getElementById('info-location').textContent = obj.lokacijas_vieta || '';
  panel.style.display = 'block';

  document.getElementById('ask-ai-btn').onclick = () => {
    switchTab('chat');
    askAboutObject(obj);
  };

  if (map && obj.latitude && obj.longitude) {
    map.panTo({ lat: parseFloat(obj.latitude), lng: parseFloat(obj.longitude) });
  }
}

function hideInfoPanel() {
  const panel = document.getElementById('info-panel');
  if (panel) panel.style.display = 'none';
}

// ── Overpass API (OpenStreetMap POIs) ─────────────────────────────────────────

async function filterPOI(btn, category) {
  // Clicking the same active category → deactivate
  if (activePOICategory === category) {
    clearOverpassMarkers();
    activePOICategory  = null;
    activePOISubFilter = 'all';
    currentRadius      = 1000;
    document.querySelectorAll('.poi-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.poi-filter-btn[data-cat=""]').classList.add('active');
    hideSubBar();
    loadObjectsOnList();
    return;
  }

  document.querySelectorAll('.poi-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activePOICategory  = category || null;
  activePOISubFilter = 'all';
  currentRadius      = 1000;

  clearOverpassMarkers();

  if (!category) {
    hideSubBar();
    loadObjectsOnList();
    return;
  }

  const lat = userLocation?.lat;
  const lng = userLocation?.lng;
  if (!lat || !lng) {
    showMapToast('📍 Waiting for location…');
    btn.classList.remove('active');
    document.querySelector('.poi-filter-btn[data-cat=""]').classList.add('active');
    activePOICategory = null;
    return;
  }

  showSubBar(category);
  await fetchOverpassPOIs(category, lat, lng);
}

// ── Sub-bar (food types / distance) ──────────────────────────────────────────

const SUB_BARS = {
  get food() { return `
    <button class="poi-sub-btn active" data-sub="all"        onclick="setSub(this,'all')">${t('sub_all')}</button>
    <button class="poi-sub-btn"        data-sub="restaurant" onclick="setSub(this,'restaurant')">${t('sub_restaurants')}</button>
    <button class="poi-sub-btn"        data-sub="cafe"       onclick="setSub(this,'cafe')">${t('sub_cafes')}</button>
    <button class="poi-sub-btn"        data-sub="bar"        onclick="setSub(this,'bar')">${t('sub_bars')}</button>
    <button class="poi-sub-btn"        data-sub="fastfood"   onclick="setSub(this,'fastfood')">${t('sub_fastfood')}</button>
  `; },
  get shopping() { return `
    <button class="poi-sub-btn active" data-sub="all"         onclick="setSub(this,'all')">${t('sub_shop_all')}</button>
    <button class="poi-sub-btn"        data-sub="mall"        onclick="setSub(this,'mall')">${t('sub_mall')}</button>
    <button class="poi-sub-btn"        data-sub="grocery"     onclick="setSub(this,'grocery')">${t('sub_grocery')}</button>
    <button class="poi-sub-btn"        data-sub="fashion"     onclick="setSub(this,'fashion')">${t('sub_fashion')}</button>
    <button class="poi-sub-btn"        data-sub="electronics" onclick="setSub(this,'electronics')">${t('sub_electronics')}</button>
    <button class="poi-sub-btn"        data-sub="home"        onclick="setSub(this,'home')">${t('sub_home')}</button>
  `; },
};

function getDistanceBar() { return `
  <span class="poi-sub-label">${t('sub_radius')}</span>
  <button class="poi-sub-btn active" data-r="1000" onclick="setRadius(this,1000)">${t('sub_1km')}</button>
  <button class="poi-sub-btn"        data-r="2000" onclick="setRadius(this,2000)">${t('sub_2km')}</button>
  <button class="poi-sub-btn"        data-r="5000" onclick="setRadius(this,5000)">${t('sub_5km')}</button>
`; }

function showSubBar(category) {
  const bar = document.getElementById('poi-sub-bar');
  if (!bar) return;
  const def = POI_DEFS[category];

  if (def?.hasSubs) {
    bar.innerHTML = SUB_BARS[def.hasSubs] || '';
    bar.style.display = 'flex';
  } else if (def?.hasDistance) {
    bar.innerHTML = getDistanceBar();
    bar.style.display = 'flex';
  } else {
    hideSubBar();
  }
}

function hideSubBar() {
  const bar = document.getElementById('poi-sub-bar');
  if (bar) { bar.style.display = 'none'; bar.innerHTML = ''; }
}

// Sub-filter changed (food type / shop type) → full reset & re-fetch
async function setSub(btn, sub) {
  document.querySelectorAll('#poi-sub-bar .poi-sub-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activePOISubFilter = sub;
  clearOverpassMarkers(); // new sub = start fresh
  const lat = userLocation?.lat, lng = userLocation?.lng;
  if (lat && lng && activePOICategory) await fetchOverpassPOIs(activePOICategory, lat, lng);
}

// Radius: accumulate only when growing, clear & re-fetch when shrinking
async function setRadius(btn, radius) {
  document.querySelectorAll('#poi-sub-bar .poi-sub-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const accumulate = radius > currentRadius;
  currentRadius = radius;
  const lat = userLocation?.lat, lng = userLocation?.lng;
  if (lat && lng && activePOICategory) await fetchOverpassPOIs(activePOICategory, lat, lng, accumulate);
}

// ─────────────────────────────────────────────────────────────────────────────

function clearOverpassMarkers() {
  overpassMarkers.forEach(m => m.setMap(null));
  overpassMarkers    = [];
  shownPlaceIds      = new Set();
  allOverpassPlaces  = [];
}

async function fetchOverpassPOIs(category, lat, lng, accumulate = false) {
  const def = POI_DEFS[category];
  if (!def) return;

  const btn = document.querySelector(`.poi-filter-btn[data-cat="${category}"]`);
  const origHTML = btn?.innerHTML;
  if (btn) { btn.classList.add('loading'); btn.innerHTML = '⏳'; }

  if (!accumulate) clearOverpassMarkers();

  try {
    const params = new URLSearchParams({
      lat, lng,
      category,
      sub:    activePOISubFilter,
      radius: currentRadius,
    });
    const places = await api.get(`/api/places?${params}`);

    // Filter to only places not already shown
    const newPlaces = places.filter(p => p.place_id && !shownPlaceIds.has(p.place_id));
    newPlaces.forEach(p => {
      shownPlaceIds.add(p.place_id);
      allOverpassPlaces.push(p);
    });

    renderOverpassMarkers(newPlaces, category);
    renderOverpassList(allOverpassPlaces, category);

  } catch (e) {
    console.error('Places error:', e);
    showMapToast('⚠️ Could not load places. Enable Places API in Google Cloud Console.');
  } finally {
    if (btn) { btn.classList.remove('loading'); btn.innerHTML = origHTML; }
  }
}

function renderOverpassMarkers(places, category) {
  if (!map) return;
  const def = POI_DEFS[category];

  places.forEach(p => {
    if (!p.lat || !p.lng) return;

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      map,
      title: p.name,
      label: { text: def.icon, fontSize: '16px' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 16,
        fillColor: '#1e293b',
        fillOpacity: 0.92,
        strokeColor: def.color,
        strokeWeight: 2.5,
      },
    });

    marker.addListener('click', () => showOverpassInfo(p, category));
    overpassMarkers.push(marker);
  });
}

function showOverpassInfo(p, category) {
  const def   = POI_DEFS[category];
  const panel = document.getElementById('info-panel');
  if (!panel) return;

  // Build type label from Google types array
  const typeLabel = (p.types || [])
    .filter(t => !['point_of_interest', 'establishment', 'food', 'premise'].includes(t))
    .slice(0, 2)
    .map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    .join(' · ');

  const lines = [def.icon + (typeLabel ? ' ' + typeLabel : '')];
  if (p.rating)    lines.push('⭐ ' + p.rating.toFixed(1) + ' / 5');
  if (p.open_now === true)  lines.push('🟢 Open now');
  if (p.open_now === false) lines.push('🔴 Closed now');
  const desc = lines.filter(Boolean).join('\n');

  document.getElementById('info-name').textContent     = p.name || 'Unknown';
  document.getElementById('info-desc').textContent     = desc;
  document.getElementById('info-location').textContent = p.address || '';
  panel.style.display = 'block';

  document.getElementById('ask-ai-btn').onclick = () => {
    switchTab('chat');
    askAboutObject({ nosaukums: p.name, iss_apraksts: typeLabel, lokacijas_vieta: p.address });
  };

  if (map && p.lat && p.lng) map.panTo({ lat: p.lat, lng: p.lng });
}

function renderOverpassList(places, category) {
  const def    = POI_DEFS[category];
  const listEl = document.getElementById('objects-tab');
  if (!listEl) return;

  const radiusLabel = currentRadius >= 1000 ? `${currentRadius / 1000} km` : `${currentRadius} m`;

  if (!places.length) {
    listEl.innerHTML = `<p style="padding:16px;color:var(--text-muted);text-align:center;font-size:13px;">No ${def.icon} places found within ${radiusLabel}</p>`;
    switchTab('chat');
    return;
  }

  listEl.innerHTML = places.map(p => {
    const typeLabel = (p.types || [])
      .filter(t => !['point_of_interest', 'establishment', 'food', 'premise'].includes(t))
      .slice(0, 1)
      .map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      .join('');
    const rating  = p.rating ? `⭐ ${p.rating.toFixed(1)}` : '';
    const openTag = p.open_now === true  ? `<span style="color:#22c55e;font-size:11px;">Open</span>`
                  : p.open_now === false ? `<span style="color:#ef4444;font-size:11px;">Closed</span>` : '';
    const meta = [typeLabel, rating, openTag].filter(Boolean).join(' · ');
    return `
      <div class="object-list-item"
           onclick='showOverpassInfo(${JSON.stringify(p).replace(/'/g, "&#39;")}, "${category}")'>
        <strong>${def.icon} ${p.name}</strong>
        <p>${meta}</p>
      </div>
    `;
  }).join('');

  switchTab('chat');
}

// ── Toast helper ──────────────────────────────────────────────────────────────

function showMapToast(msg) {
  let toast = document.getElementById('map-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'map-toast';
    toast.className = 'map-toast';
    document.querySelector('.map-wrapper').appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ── Reverse geocoding location bar ────────────────────────────────────────────

async function updateLocationBar(lat, lng) {
  const dot  = document.getElementById('location-dot');
  const text = document.getElementById('location-text');
  if (!dot || !text) return;

  if (!lat || !lng) {
    dot.className = 'dot';
    text.textContent = t('location_unavail') || 'Location unavailable';
    return;
  }

  // Show coordinates immediately while geocoding loads
  dot.className = 'dot active';
  text.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  try {
    const lang = getLang() === 'lv' ? 'lv' : getLang() === 'ru' ? 'ru' : 'en';
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': lang, 'User-Agent': 'AITouristApp/1.0' } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const addr = data.address || {};

    // Build: "Street Name 5 · City"
    const road   = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || '';
    const number = addr.house_number ? ' ' + addr.house_number : '';
    const city   = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';

    let label = '';
    if (road) {
      label = road + number;
      if (city) label += ' · ' + city;
    } else if (city) {
      label = city;
    } else {
      label = (data.display_name || '').split(',').slice(0, 2).join(',').trim();
    }

    text.textContent = label ? '📍 ' + label : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    text.title       = data.display_name || '';
    userAddress = window.userAddress = label || null;

    // Show country welcome banner once per session
    if (addr.country_code) maybeShowCountryBanner(addr.country_code);
  } catch (_) {
    text.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ── Country info modal ────────────────────────────────────────────────────────

let _countryLoaded = false;

function getFlagEmoji(code) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

async function maybeShowCountryBanner(countryCode) {
  if (_countryLoaded || !countryCode) return;
  _countryLoaded = true;

  const flag    = document.getElementById('info-modal-flag');
  const title   = document.getElementById('info-modal-country');
  const body    = document.getElementById('info-modal-body');

  try {
    const country = await api.get(`/api/countries/by-code/${countryCode.toLowerCase()}`);

    if (flag)  flag.textContent  = getFlagEmoji(countryCode);
    if (title) title.textContent = country.name;

    if (body) {
      // Split description into paragraphs on double-newline or every ~200 chars naturally
      const paragraphs = country.description
        .split(/\n\n+/)
        .filter(p => p.trim());

      body.innerHTML = paragraphs.length > 1
        ? paragraphs.map(p => `<p>${p.trim()}</p>`).join('')
        : `<p>${country.description}</p>`;
    }
  } catch (_) {
    // No description for this country — show a neutral fallback
    if (flag)  flag.textContent  = getFlagEmoji(countryCode);
    if (title) title.textContent = 'AI Tourist';
    if (body)  body.innerHTML    = `<p style="color:var(--text-muted);text-align:center;padding:12px 0;">No description available for your country yet.</p>`;
  }
}

// ── Continuous location tracking ──────────────────────────────────────────────

function trackLocationOnly() {
  if (!navigator.geolocation) {
    applySettingsFallback();
    return;
  }

  const onPos = pos => {
    const loc    = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const isFirst = !userLocation;
    userLocation = window.userLocation = loc;

    updateLocationBar(loc.lat, loc.lng);

    if (map) {
      if (isFirst) map.setCenter(loc);
      placeUserMarker(loc);
      if (isFirst) loadObjectMarkers(loc.lat, loc.lng);
    }
  };

  const onErr = async () => {
    try {
      const s = await api.get('/api/admin/settings');
      const loc = { lat: s.default_lat, lng: s.default_lng };
      userLocation = window.userLocation = loc;
      updateLocationBar(loc.lat, loc.lng);
      if (map) {
        map.setCenter(loc);
        if (s.default_category) {
          const btn = document.querySelector(`.poi-filter-btn[data-cat="${s.default_category}"]`);
          if (btn) filterPOI(btn, s.default_category);
        }
        loadObjectMarkers(loc.lat, loc.lng);
      }
    } catch(_) {
      updateLocationBar(null, null);
    }
  };

  navigator.geolocation.getCurrentPosition(
    onPos,
    onErr,
    { enableHighAccuracy: true, timeout: 10000 }
  );

  navigator.geolocation.watchPosition(onPos, () => {}, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000,
  });
}

async function applySettingsFallback() {
  try {
    const s = await api.get('/api/admin/settings');
    const loc = { lat: s.default_lat, lng: s.default_lng };
    userLocation = window.userLocation = loc;
    updateLocationBar(loc.lat, loc.lng);
    if (map) {
      map.setCenter(loc);
      if (s.default_category) {
        const btn = document.querySelector(`.poi-filter-btn[data-cat="${s.default_category}"]`);
        if (btn) filterPOI(btn, s.default_category);
      }
      loadObjectMarkers(loc.lat, loc.lng);
    }
  } catch(_) {
    updateLocationBar(null, null);
  }
}

async function loadObjectsOnList() {
  const objects = await api.get('/api/objects').catch(() => []);
  renderObjectList(objects);
}

// ── Dark map style ────────────────────────────────────────────────────────────

function darkMapStyle() {
  return [
    { elementType: 'geometry',           stylers: [{ color: '#0f172a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#94a3b8' }] },
    { featureType: 'road',         elementType: 'geometry',         stylers: [{ color: '#1e293b' }] },
    { featureType: 'road',         elementType: 'geometry.stroke',  stylers: [{ color: '#334155' }] },
    { featureType: 'road',         elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'water',        elementType: 'geometry',         stylers: [{ color: '#0c1a35' }] },
    { featureType: 'poi',          elementType: 'geometry',         stylers: [{ color: '#1e293b' }] },
    { featureType: 'poi',          elementType: 'labels.icon',      stylers: [{ visibility: 'off' }] },
    { featureType: 'poi',          elementType: 'labels.text',      stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',      stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative',       elementType: 'geometry.stroke',  stylers: [{ color: '#334155' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ];
}

// Called by toggleTheme() in i18n.js whenever the user switches theme
window.updateMapTheme = function () {
  if (!map) return;
  const isLight = typeof getTheme === 'function' && getTheme() === 'light';
  map.setOptions({ styles: isLight ? [] : darkMapStyle() });
};
