let map = null;
let userMarker = null;
let objectMarkers = [];
let userAddress = null; // human-readable address from reverse geocoding

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
  // This ensures userLocation is available for chat & Live AI right away
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
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 56.946, lng: 24.106 },
      zoom: 14,
      styles: darkMapStyle(),
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
    });

    // Map loaded — add marker at already-known location (if any)
    if (userLocation) placeUserMarker(userLocation);
    loadObjectMarkers(userLocation?.lat, userLocation?.lng);
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=onGoogleMapsLoaded`;
  script.async = true;
  document.head.appendChild(script);
}

// Called from map controls button
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
  const listEl = document.getElementById('object-list');
  if (!listEl) return;

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

  document.getElementById('ask-ai-btn').onclick = () => askAboutObject(obj);

  if (map && obj.latitude && obj.longitude) {
    map.panTo({ lat: parseFloat(obj.latitude), lng: parseFloat(obj.longitude) });
  }
}

function hideInfoPanel() {
  const panel = document.getElementById('info-panel');
  if (panel) panel.style.display = 'none';
}

async function updateLocationBar(lat, lng) {
  const dot = document.getElementById('location-dot');
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
      // fallback: first two parts of display_name
      label = (data.display_name || '').split(',').slice(0, 2).join(',').trim();
    }

    text.textContent  = label ? '📍 ' + label : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    text.title        = data.display_name || '';  // full address on hover
    userAddress       = label || null;            // save for AI messages
  } catch (_) {
    // Keep coordinates on error
    text.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/** Start continuous location tracking — sets userLocation for the whole app */
function trackLocationOnly() {
  if (!navigator.geolocation) {
    updateLocationBar(null, null);
    return;
  }

  const onPos = pos => {
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const isFirst = !userLocation;
    userLocation = loc;

    updateLocationBar(loc.lat, loc.lng);

    // If Google Maps is already loaded, update marker too
    if (map) {
      if (isFirst) map.setCenter(loc);
      placeUserMarker(loc);
      if (isFirst) loadObjectMarkers(loc.lat, loc.lng);
    }
  };

  navigator.geolocation.getCurrentPosition(
    onPos,
    () => updateLocationBar(null, null),
    { enableHighAccuracy: true, timeout: 10000 }
  );

  navigator.geolocation.watchPosition(onPos, () => {}, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000,
  });
}

async function loadObjectsOnList() {
  const objects = await api.get('/api/objects').catch(() => []);
  renderObjectList(objects);
}

function darkMapStyle() {
  return [
    { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1a35' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ];
}
