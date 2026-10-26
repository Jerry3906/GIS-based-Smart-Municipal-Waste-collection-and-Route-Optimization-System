/* ════════════════════════════════════════════════════════════════════════════
   Smart Municipal Waste Management — Main JavaScript
   ════════════════════════════════════════════════════════════════════════════ */

// ── Global Utilities ─────────────────────────────────────────────────────────
const WASTE_COLORS = {
    recyclable: '#3B82F6', organic: '#4CAF50', general: '#64748B',
    chemical: '#FFA000', hazardous: '#EF4444'
};
const WASTE_ICONS = {
    recyclable: 'fa-recycle', organic: 'fa-leaf', general: 'fa-trash',
    chemical: 'fa-flask', hazardous: 'fa-biohazard'
};
const TYPE_ICONS = {
    House: 'fa-house', Apartment: 'fa-building', Shop: 'fa-store',
    Restaurant: 'fa-utensils', Factory: 'fa-industry', Office: 'fa-briefcase',
    Hospital: 'fa-hospital'
};

function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatNum(n, decimals = 1) {
    return Number(n).toFixed(decimals).replace(/\.0$/, '');
}

// ── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span class="toast-text">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

// ── Modal ────────────────────────────────────────────────────────────────────
function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}
document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ── Sidebar Toggle ───────────────────────────────────────────────────────────
document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ── Fetch Helper ─────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
    try {
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
        if (res.redirected) { window.location.href = res.url; return null; }
        return await res.json();
    } catch (e) { console.error('API Error:', e); showToast('Network error', 'error'); return null; }
}

// ── Leaflet Map Factory ──────────────────────────────────────────────────────
function createMap(containerId, center = [12.928, 77.585], zoom = 13) {
    // Define a slightly larger bounding box so user can see outside the boundary
    const sw = L.latLng(12.87, 77.52);
    const ne = L.latLng(12.98, 77.64);
    const bounds = L.latLngBounds(sw, ne);

    const map = L.map(containerId, { 
        zoomControl: true,
        maxBounds: bounds,
        maxBoundsViscosity: 0.8,
        minZoom: 12
    }).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        bounds: bounds
    }).addTo(map);

    // Draw the noticeable, hand-drawn style municipality jurisdiction boundary (polygon)
    const jurisdictionPoints = [
        [12.96, 77.55], [12.965, 77.58], [12.95, 77.615], 
        [12.91, 77.62], [12.89, 77.60], [12.885, 77.56], 
        [12.91, 77.54], [12.94, 77.535]
    ];
    const municipalityBorder = L.polygon(
        jurisdictionPoints, 
        {color: "var(--accent-dark, #2E7D32)", weight: 4, fillOpacity: 0.02, dashArray: "12 8", interactive: false, lineCap: "round", lineJoin: "round"}
    );
    municipalityBorder.addTo(map);

    return map;
}

function makeMarkerIcon(color, size = 30) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

function makeIconMarker(color, icon, size = 34) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><i class="fas ${icon}" style="color:#fff;font-size:${size * 0.38}px;"></i></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

function makeSquareMarker(color, icon, size = 36) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:8px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><i class="fas ${icon}" style="color:#fff;font-size:${size * 0.38}px;"></i></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

function wastePopupHtml(source) {
    const total = Object.values(source.waste).reduce((a, b) => a + b, 0);
    let wasteHtml = '';
    for (const [cat, qty] of Object.entries(source.waste)) {
        if (qty > 0) {
            wasteHtml += `<div class="popup-waste-item"><span><i class="fas ${WASTE_ICONS[cat]}" style="color:${WASTE_COLORS[cat]};margin-right:6px;"></i>${cat}</span><strong>${qty} kg</strong></div>`;
        }
    }
    return `
        <h4>${source.name}</h4>
        <div class="popup-meta"><i class="fas ${TYPE_ICONS[source.type] || 'fa-map-pin'}" style="margin-right:4px;"></i> ${source.type} · ${source.area}</div>
        <div class="popup-meta">Total: <strong>${formatNum(total)} kg/day</strong></div>
        <div class="popup-meta">Last Collection: ${source.last_collection}</div>
        <div class="popup-waste">${wasteHtml}</div>
    `;
}

// ── Add All Map Markers ──────────────────────────────────────────────────────
async function addAllMapMarkers(map, options = {}) {
    const sources = await apiFetch('/api/waste-sources');
    const facData = await apiFetch('/api/facilities');
    if (!sources || !facData) return;

    const sourceMarkers = L.layerGroup();
    const facilityMarkers = L.layerGroup();
    const depotMarkers = L.layerGroup();

    // Source markers
    const typeColors = {
        House: '#00b894', Apartment: '#0984e3', Shop: '#fdcb6e',
        Restaurant: '#e17055', Factory: '#d63031', Office: '#6c5ce7', Hospital: '#fd79a8'
    };

    sources.forEach(s => {
        const color = typeColors[s.type] || '#636e72';
        const icon = TYPE_ICONS[s.type] || 'fa-map-pin';
        const marker = L.marker([s.lat, s.lng], { icon: makeIconMarker(color, icon, 30) });
        marker.bindPopup(wastePopupHtml(s), { maxWidth: 280 });
        sourceMarkers.addLayer(marker);
    });

    // Facility markers
    const facColors = {
        Recycling: '#00b894', Composting: '#fdcb6e', Landfill: '#74b9ff',
        'Chemical Treatment': '#e17055', 'Hazardous Waste': '#d63031'
    };
    const facIcons = {
        Recycling: 'fa-recycle', Composting: 'fa-seedling', Landfill: 'fa-dumpster',
        'Chemical Treatment': 'fa-flask', 'Hazardous Waste': 'fa-radiation'
    };

    facData.facilities.forEach(f => {
        const marker = L.marker([f.lat, f.lng], {
            icon: makeSquareMarker(facColors[f.type] || '#636e72', facIcons[f.type] || 'fa-industry', 36)
        });
        marker.bindPopup(`
            <h4>${f.name}</h4>
            <div class="popup-meta"><i class="fas ${facIcons[f.type]} " style="margin-right:4px;"></i> ${f.type}</div>
            <div class="popup-meta">Accepts: <strong>${f.accepted_waste}</strong></div>
            <div class="popup-meta">Capacity: <strong>${f.capacity_kg_per_day} kg/day</strong></div>
            <div class="popup-meta">Hours: ${f.operating_hours}</div>
        `, { maxWidth: 260 });
        facilityMarkers.addLayer(marker);
    });

    // Depot marker
    const depot = facData.depot;
    const depotMarker = L.marker([depot.lat, depot.lng], {
        icon: makeSquareMarker('#6c5ce7', 'fa-warehouse', 38)
    });
    depotMarker.bindPopup(`<h4>${depot.name}</h4><div class="popup-meta">Central Operations Hub</div>`, { maxWidth: 240 });
    depotMarkers.addLayer(depotMarker);

    sourceMarkers.addTo(map);
    facilityMarkers.addTo(map);
    depotMarkers.addTo(map);

    // Layer control
    const overlays = {
        '🏠 Waste Sources': sourceMarkers,
        '🏭 Facilities': facilityMarkers,
        '📦 Depot': depotMarkers
    };

    if (options.heatmap) {
        const heatData = await apiFetch('/api/heatmap-data');
        if (heatData) {
            const heat = L.heatLayer(heatData, {
                radius: 40, blur: 30, maxZoom: 17,
                gradient: { 0.2: '#00b894', 0.5: '#fdcb6e', 0.8: '#e17055', 1.0: '#d63031' }
            });
            overlays['🌡️ Waste Density Heatmap'] = heat;
        }
    }

    if (options.zones) {
        const zones = await apiFetch('/api/zones');
        if (zones) {
            const zoneLayer = L.layerGroup();
            zones.forEach(z => {
                const rect = L.rectangle(z.bounds, {
                    color: z.color, weight: 2, fillOpacity: 0.08, dashArray: '6 4'
                });
                rect.bindPopup(`<h4>${z.name}</h4><div class="popup-meta">${z.description}</div>`);
                zoneLayer.addLayer(rect);
            });
            overlays['📍 Collection Zones'] = zoneLayer;
        }
    }

    L.control.layers(null, overlays, { collapsed: false }).addTo(map);

    return { sourceMarkers, facilityMarkers, depotMarkers, sources, facData };
}

// ── Dashboard Init ───────────────────────────────────────────────────────────
async function initDashboard() {
    const stats = await apiFetch('/api/dashboard-stats');
    if (!stats) return;

    // Fill KPIs
    document.getElementById('kpiTotalWaste').textContent = `${formatNum(stats.total_waste_today_kg)} kg`;
    document.getElementById('kpiSources').textContent = stats.total_sources;
    document.getElementById('kpiTrucks').textContent = `${stats.active_trucks}/${stats.total_trucks}`;
    document.getElementById('kpiFacilities').textContent = stats.total_facilities;

    const comp = stats.comparison;
    document.getElementById('kpiNormalDist').textContent = `${formatNum(comp.normal.total_distance_km)} km`;
    document.getElementById('kpiOptDist').textContent = `${formatNum(comp.optimized.total_distance_km)} km`;
    
    document.getElementById('kpiDistSavedVal').textContent = `${formatNum(comp.savings.distance_km)} km`;
    document.getElementById('kpiDistSavedPct').innerHTML = `<i class="fas fa-arrow-down"></i> ${formatNum(comp.savings.distance_pct)}%`;
    
    document.getElementById('kpiFuelSavedVal').textContent = `${formatNum(comp.savings.fuel_litres)} L`;
    document.getElementById('kpiFuelSavedPct').innerHTML = `<i class="fas fa-arrow-down"></i> ${formatNum(comp.savings.fuel_pct)}%`;
    
    document.getElementById('kpiTimeSavedVal').textContent = `${formatTime(comp.savings.time_min)}`;
    document.getElementById('kpiTimeSavedPct').innerHTML = `<i class="fas fa-arrow-down"></i> ${formatNum(comp.savings.time_pct)}%`;
    
    document.getElementById('kpiCostSavedVal').textContent = `₹${formatNum(comp.savings.cost_inr, 0)}`;
    document.getElementById('kpiCostSavedPct').innerHTML = `<i class="fas fa-arrow-down"></i> ${formatNum(comp.savings.cost_pct)}%`;

    // Waste composition donut
    const cats = Object.keys(stats.waste_by_category);
    const vals = Object.values(stats.waste_by_category);
    new Chart(document.getElementById('wasteDonutChart'), {
        type: 'doughnut',
        data: {
            labels: cats.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{ data: vals, backgroundColor: cats.map(c => WASTE_COLORS[c]), borderWidth: 0, hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#475569', padding: 14, usePointStyle: true, pointStyleWidth: 10, font: { size: 12, family: 'Plus Jakarta Sans', weight: '600' } } }
            }
        }
    });

    // Dashboard Map
    const dashMap = createMap('dashboardMap', [12.928, 77.585], 13);
    await addAllMapMarkers(dashMap, { heatmap: true });
    setTimeout(() => dashMap.invalidateSize(), 300);

    showToast('Dashboard loaded successfully', 'success');
}

// ── Waste Sources Init ───────────────────────────────────────────────────────
async function initWasteSources() {
    const sources = await apiFetch('/api/waste-sources');
    if (!sources) return;

    const tbody = document.getElementById('wasteSourcesBody');
    sources.forEach(s => {
        const total = Object.values(s.waste).reduce((a, b) => a + b, 0);
        const typeClass = s.type.toLowerCase();
        const barSegments = Object.entries(s.waste)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `<div class="waste-bar-segment" style="width:${(v / total * 100)}%;background:${WASTE_COLORS[k]};" title="${k}: ${v} kg"></div>`)
            .join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.id}</strong></td>
            <td>${s.name}</td>
            <td><span class="type-badge ${typeClass}"><i class="fas ${TYPE_ICONS[s.type] || 'fa-map-pin'}"></i> ${s.type}</span></td>
            <td>${s.area}</td>
            <td><strong>${formatNum(total)} kg</strong></td>
            <td><div class="waste-bar">${barSegments}</div></td>
            <td>${s.last_collection}</td>
        `;
        tr.addEventListener('click', () => showSourceDetail(s));
        tbody.appendChild(tr);
    });
}

function showSourceDetail(s) {
    const total = Object.values(s.waste).reduce((a, b) => a + b, 0);
    let wasteHtml = '';
    for (const [cat, qty] of Object.entries(s.waste)) {
        wasteHtml += `
            <div class="info-item">
                <div class="info-label"><i class="fas ${WASTE_ICONS[cat]}" style="color:${WASTE_COLORS[cat]};"></i> ${cat}</div>
                <div class="info-value">${qty} kg/day</div>
            </div>`;
    }
    openModal(s.name, `
        <div class="info-grid">
            <div class="info-item"><div class="info-label">ID</div><div class="info-value">${s.id}</div></div>
            <div class="info-item"><div class="info-label">Type</div><div class="info-value">${s.type}</div></div>
            <div class="info-item"><div class="info-label">Area</div><div class="info-value">${s.area}</div></div>
            <div class="info-item"><div class="info-label">Zone</div><div class="info-value">Zone ${s.zone}</div></div>
            <div class="info-item"><div class="info-label">Coordinates</div><div class="info-value">${s.lat}, ${s.lng}</div></div>
            <div class="info-item"><div class="info-label">Total Waste</div><div class="info-value">${formatNum(total)} kg/day</div></div>
            <div class="info-item"><div class="info-label">Last Collection</div><div class="info-value">${s.last_collection}</div></div>
            <div class="info-item"><div class="info-label">Frequency</div><div class="info-value">${s.collection_frequency}</div></div>
        </div>
    <h4 style="margin:20px 0 12px; font-size:.9rem;">Segregated Waste Breakdown</h4>
    <div class="info-grid">${wasteHtml}</div>
`);
}

function showAddEntryModal() {
openModal('Add New Data Entry', `
    <div style="display:flex; flex-direction:column; gap:16px;">
        <p style="font-size:.85rem;color:var(--text-secondary);">Add a new location dynamically. The predictive model will automatically calculate its waste patterns based on historical data.</p>
        <input type="text" placeholder="Location Name (e.g. Greenfield Mall)" class="modal-input" style="padding:12px; border-radius:8px; border:1px solid var(--border);">
        <select class="modal-input" style="padding:12px; border-radius:8px; border:1px solid var(--border);">
            <option>Shop</option><option>House</option><option>Apartment</option><option>Factory</option><option>Office</option><option>Hospital</option>
        </select>
        <input type="number" placeholder="Estimated Baseline Daily Waste (kg)" class="modal-input" style="padding:12px; border-radius:8px; border:1px solid var(--border);">
        <button class="btn btn-primary" style="margin-top:10px; width:100%;" onclick="closeModal(); showToast('Entry successfully added and queued for next route cycle!', 'success'); setTimeout(() => window.location.reload(), 2000);">
            <i class="fas fa-check"></i> Submit Entry
        </button>
    </div>
`);
}

// ── GIS Map Init ─────────────────────────────────────────────────────────────
async function initGISMap() {
    const map = createMap('gisMapFull', [12.928, 77.585], 14);
    await addAllMapMarkers(map, { heatmap: true, zones: true });
    setTimeout(() => map.invalidateSize(), 300);
    showToast('GIS map loaded with all layers', 'info');
}

// ── Collection Planning Init ─────────────────────────────────────────────────
let planningMap = null;
let routeLayers = [];
let currentNormalPlan = null;
let currentOptimizedPlan = null;

async function initCollectionPlanning() {
    planningMap = createMap('planningMap', [12.928, 77.585], 13);
    await addAllMapMarkers(planningMap, {});
    setTimeout(() => planningMap.invalidateSize(), 300);
}

async function generateNormalPlan() {
    showToast('Generating traditional collection plan...', 'info');
    clearRoutes();

    const data = await apiFetch('/api/generate-normal-plan', { method: 'POST' });
    if (!data) return;
    currentNormalPlan = data;

    displayPlanRoutes(data, 'normalRouteDetails');
    displayPlanSummary(data.summary, 'normalSummary');
    drawRoutesOnMap(data.routes);

    document.getElementById('normalPlanSection').style.display = 'block';
    document.getElementById('optimizedPlanSection').style.display = 'none';
    document.getElementById('comparisonSection').style.display = 'none';

    showToast('Traditional collection plan generated successfully', 'success');
}

async function generateOptimizedPlan() {
    showToast('Running route optimization algorithm...', 'info');

    const data = await apiFetch('/api/generate-optimized-plan', { method: 'POST' });
    if (!data) return;
    currentOptimizedPlan = data.plan;
    currentNormalPlan = data.normal_plan;

    // Clear & redraw
    clearRoutes();

    displayPlanRoutes(data.normal_plan, 'normalRouteDetails');
    displayPlanSummary(data.normal_plan.summary, 'normalSummary');

    displayPlanRoutes(data.plan, 'optimizedRouteDetails');
    displayPlanSummary(data.plan.summary, 'optimizedSummary');

    displayComparison(data.comparison);

    drawRoutesOnMap(data.plan.routes);

    document.getElementById('normalPlanSection').style.display = 'block';
    document.getElementById('optimizedPlanSection').style.display = 'block';
    document.getElementById('comparisonSection').style.display = 'block';

    showToast('Optimization completed — routes improved!', 'success');
}

function clearRoutes() {
    routeLayers.forEach(l => planningMap.removeLayer(l));
    routeLayers = [];
}

function drawRoutesOnMap(routes) {
    clearRoutes();
    routes.forEach(route => {
        const coords = route.stops.map(s => [s.lat, s.lng]);
        const polyline = L.polyline(coords, {
            color: route.color, weight: 4, opacity: 0.8,
            dashArray: route.waste_types.includes('chemical') || route.waste_types.includes('hazardous') ? '10 6' : null
        });
        polyline.bindPopup(`<strong>${route.truck_name}</strong><br>Waste: ${route.waste_types.join(', ')}<br>Distance: ${route.distance_km} km`);
        polyline.addTo(planningMap);
        routeLayers.push(polyline);
    });

    if (routeLayers.length > 0) {
        const allCoords = routeLayers.flatMap(l => l.getLatLngs());
        if (allCoords.length > 0) planningMap.fitBounds(L.latLngBounds(allCoords).pad(0.1));
    }
}

function showNormalRoutes() {
    if (currentNormalPlan) drawRoutesOnMap(currentNormalPlan.routes);
}
function showOptimizedRoutes() {
    if (currentOptimizedPlan) drawRoutesOnMap(currentOptimizedPlan.routes);
}

function displayPlanRoutes(plan, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    plan.routes.forEach((route, idx) => {
        const utilColor = route.utilization_pct > 90 ? 'var(--accent-red)' : route.utilization_pct > 70 ? 'var(--accent-yellow)' : 'var(--accent-green)';
        const card = document.createElement('div');
        card.className = 'route-detail-card';
        card.innerHTML = `
            <div class="route-detail-header" onclick="this.nextElementSibling.classList.toggle('open')">
                <div class="route-color" style="background:${route.color};"></div>
                <div class="route-info">
                    <h4>${route.truck_name} (${route.truck_id})</h4>
                    <span>${route.waste_types.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' + ')} waste${route.zones ? ' · Zones ' + route.zones.join(', ') : ''}</span>
                </div>
                <div class="route-metrics">
                    <span><strong>${route.distance_km}</strong> km</span>
                    <span><strong>${route.fuel_litres}</strong> L</span>
                    <span><strong>${formatTime(route.total_time_min)}</strong></span>
                    <span><strong>₹${formatNum(route.fuel_cost_inr, 0)}</strong></span>
                </div>
            </div>
            <div class="route-detail-body">
                <div style="display:flex;gap:16px;margin-bottom:14px;flex-wrap:wrap;">
                    <div class="info-item"><div class="info-label">Load</div><div class="info-value">${formatNum(route.total_load_kg)} / ${route.truck_capacity_kg} kg</div></div>
                    <div class="info-item"><div class="info-label">Utilization</div><div class="info-value" style="color:${utilColor}">${route.utilization_pct}%</div></div>
                    <div class="info-item"><div class="info-label">Stops</div><div class="info-value">${route.num_stops}</div></div>
                </div>
                <div class="utilization-bar"><div class="utilization-fill" style="width:${Math.min(route.utilization_pct, 100)}%;background:${utilColor};"></div></div>
                <div style="margin-top:14px;">
                    ${route.stops.map(stop => `
                        <div class="route-stop">
                            <div class="stop-icon ${stop.type}"><i class="fas ${stop.type === 'depot' ? 'fa-warehouse' : stop.type === 'facility' ? 'fa-industry' : 'fa-map-pin'}"></i></div>
                            <div class="stop-info">
                                <div class="stop-name">${stop.name}</div>
                                <div class="stop-detail">${stop.type === 'source' ? `Collect ${stop.waste_collected_kg} kg · Load: ${stop.running_load_kg} kg` : stop.action || ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function displayPlanSummary(summary, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="info-grid">
            <div class="info-item"><div class="info-label">Total Distance</div><div class="info-value">${summary.total_distance_km} km</div></div>
            <div class="info-item"><div class="info-label">Fuel Consumed</div><div class="info-value">${summary.total_fuel_litres} L</div></div>
            <div class="info-item"><div class="info-label">Fuel Cost</div><div class="info-value">₹${formatNum(summary.total_fuel_cost_inr, 0)}</div></div>
            <div class="info-item"><div class="info-label">Total Time</div><div class="info-value">${formatTime(summary.total_time_min)}</div></div>
            <div class="info-item"><div class="info-label">Routes</div><div class="info-value">${summary.total_routes}</div></div>
            <div class="info-item"><div class="info-label">Total Waste</div><div class="info-value">${formatNum(summary.total_waste_kg)} kg</div></div>
        </div>
    `;
}

function displayComparison(comparison) {
    const s = comparison.savings;
    const n = comparison.normal;
    const o = comparison.optimized;

    document.getElementById('comparisonContent').innerHTML = `
        <div class="comparison-panel">
            <div class="comparison-side normal">
                <h4><i class="fas fa-exclamation-triangle"></i> Traditional Plan</h4>
                <div class="comparison-metric"><span class="cm-label">Distance</span><span class="cm-value">${n.total_distance_km} km</span></div>
                <div class="comparison-metric"><span class="cm-label">Fuel</span><span class="cm-value">${n.total_fuel_litres} L</span></div>
                <div class="comparison-metric"><span class="cm-label">Time</span><span class="cm-value">${formatTime(n.total_time_min)}</span></div>
                <div class="comparison-metric"><span class="cm-label">Fuel Cost</span><span class="cm-value">₹${formatNum(n.total_fuel_cost_inr, 0)}</span></div>
                <div class="comparison-metric"><span class="cm-label">Routes</span><span class="cm-value">${n.total_routes}</span></div>
            </div>
            <div class="comparison-vs"><span class="vs-text">VS</span></div>
            <div class="comparison-side optimized">
                <h4><i class="fas fa-check-circle"></i> Optimized Plan</h4>
                <div class="comparison-metric"><span class="cm-label">Distance</span><span class="cm-value" style="color:var(--accent-green);">${o.total_distance_km} km</span></div>
                <div class="comparison-metric"><span class="cm-label">Fuel</span><span class="cm-value" style="color:var(--accent-green);">${o.total_fuel_litres} L</span></div>
                <div class="comparison-metric"><span class="cm-label">Time</span><span class="cm-value" style="color:var(--accent-green);">${formatTime(o.total_time_min)}</span></div>
                <div class="comparison-metric"><span class="cm-label">Fuel Cost</span><span class="cm-value" style="color:var(--accent-green);">₹${formatNum(o.total_fuel_cost_inr, 0)}</span></div>
                <div class="comparison-metric"><span class="cm-label">Routes</span><span class="cm-value" style="color:var(--accent-green);">${o.total_routes}</span></div>
            </div>
        </div>
        <div class="savings-grid">
            <div class="savings-card">
                <div class="metric-label">Distance Saved</div>
                <div class="metric-before">${n.total_distance_km} km</div>
                <div class="metric-after">${o.total_distance_km} km</div>
                <div class="metric-saved"><i class="fas fa-arrow-down"></i> ${s.distance_km} km saved (${s.distance_pct}%)</div>
            </div>
            <div class="savings-card">
                <div class="metric-label">Fuel Saved</div>
                <div class="metric-before">${n.total_fuel_litres} L</div>
                <div class="metric-after">${o.total_fuel_litres} L</div>
                <div class="metric-saved"><i class="fas fa-arrow-down"></i> ${s.fuel_litres} L saved (${s.fuel_pct}%)</div>
            </div>
            <div class="savings-card">
                <div class="metric-label">Time Saved</div>
                <div class="metric-before">${formatTime(n.total_time_min)}</div>
                <div class="metric-after">${formatTime(o.total_time_min)}</div>
                <div class="metric-saved"><i class="fas fa-arrow-down"></i> ${formatTime(s.time_min)} saved (${s.time_pct}%)</div>
            </div>
            <div class="savings-card">
                <div class="metric-label">Cost Saved</div>
                <div class="metric-before">₹${formatNum(n.total_fuel_cost_inr, 0)}</div>
                <div class="metric-after">₹${formatNum(o.total_fuel_cost_inr, 0)}</div>
                <div class="metric-saved"><i class="fas fa-arrow-down"></i> ₹${formatNum(s.cost_inr, 0)} saved (${s.cost_pct}%)</div>
            </div>
        </div>
    `;
}

// ── Trucks Init ──────────────────────────────────────────────────────────────
async function initTrucks() {
    const trucks = await apiFetch('/api/trucks');
    if (!trucks) return;

    const grid = document.getElementById('truckGrid');
    const truckColors = { Standard: '#0984e3', 'Multi-Compartment': '#00cec9', Compactor: '#00b894', Specialized: '#d63031', 'Heavy-Duty': '#6c5ce7' };
    const truckIcons = { Standard: 'fa-truck', 'Multi-Compartment': 'fa-truck-loading', Compactor: 'fa-truck-moving', Specialized: 'fa-shield-alt', 'Heavy-Duty': 'fa-truck-monster' };

    trucks.forEach(t => {
        const color = truckColors[t.type] || '#636e72';
        const icon = truckIcons[t.type] || 'fa-truck';
        const card = document.createElement('div');
        card.className = 'truck-card';
        card.innerHTML = `
            <div class="truck-header">
                <div class="truck-icon" style="background:${color}20;color:${color};"><i class="fas ${icon}"></i></div>
                <div>
                    <h3>${t.name}</h3>
                    <span class="truck-id">${t.id} · ${t.type}</span>
                </div>
                <span class="status-badge available"><i class="fas fa-circle" style="font-size:6px;"></i> ${t.status}</span>
            </div>
            <div class="truck-specs">
                <div class="truck-spec"><div class="spec-label">Capacity</div><div class="spec-value">${t.capacity_kg.toLocaleString()} kg</div></div>
                <div class="truck-spec"><div class="spec-label">Fuel Type</div><div class="spec-value">${t.fuel_type}</div></div>
                <div class="truck-spec"><div class="spec-label">Fuel Efficiency</div><div class="spec-value">${t.fuel_efficiency_kmpl} km/L</div></div>
                <div class="truck-spec"><div class="spec-label">Current Load</div><div class="spec-value">${t.current_load_kg} kg</div></div>
            </div>
            <div style="margin-bottom:14px;">
                <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:6px;font-weight:700;">ALLOWED WASTE TYPES</div>
                <div class="truck-waste-tags">
                    ${t.allowed_waste.map(w => `<span class="waste-tag ${w}"><i class="fas ${WASTE_ICONS[w]}"></i> ${w}</span>`).join('')}
                </div>
            </div>
            <button class="btn btn-primary" style="width:100%;font-size:.85rem;padding:10px;" onclick="window.location.href='/truck-route/${t.id}'">
                <i class="fas fa-route"></i> View Optimized Route Assignment
            </button>
        `;
        grid.appendChild(card);
    });
}

// ── Facilities Init ──────────────────────────────────────────────────────────
async function initFacilities() {
    const data = await apiFetch('/api/facilities');
    if (!data) return;

    const grid = document.getElementById('facilityGrid');
    const facColors = { Recycling: '#00b894', Composting: '#fdcb6e', Landfill: '#74b9ff', 'Chemical Treatment': '#e17055', 'Hazardous Waste': '#d63031' };
    const facIcons = { Recycling: 'fa-recycle', Composting: 'fa-seedling', Landfill: 'fa-dumpster', 'Chemical Treatment': 'fa-flask', 'Hazardous Waste': 'fa-radiation' };

    data.facilities.forEach(f => {
        const color = facColors[f.type] || '#636e72';
        const icon = facIcons[f.type] || 'fa-industry';
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.innerHTML = `
            <div class="facility-icon" style="background:${color}18;color:${color};"><i class="fas ${icon}"></i></div>
            <h3>${f.name}</h3>
            <div class="facility-type"><span class="waste-tag ${f.accepted_waste}"><i class="fas ${WASTE_ICONS[f.accepted_waste]}"></i> ${f.accepted_waste}</span></div>
            <div class="facility-meta">Capacity: <span>${f.capacity_kg_per_day.toLocaleString()} kg/day</span></div>
            <div class="facility-meta">Hours: <span>${f.operating_hours}</span></div>
            <div class="facility-meta">Location: <span>${f.lat}, ${f.lng}</span></div>
            <p style="font-size:.78rem;color:var(--text-secondary);margin-top:10px;line-height:1.6;">${f.description}</p>
        `;
        grid.appendChild(card);
    });

    // Depot
    const depot = data.depot;
    const depotCard = document.createElement('div');
    depotCard.className = 'facility-card';
    depotCard.innerHTML = `
        <div class="facility-icon" style="background:rgba(108,92,231,0.12);color:#6c5ce7;"><i class="fas fa-warehouse"></i></div>
        <h3>${depot.name}</h3>
        <div class="facility-type" style="font-size:.82rem;color:var(--accent-purple);font-weight:600;">Operations Hub</div>
        <div class="facility-meta">Location: <span>${depot.lat}, ${depot.lng}</span></div>
        <p style="font-size:.78rem;color:var(--text-secondary);margin-top:10px;line-height:1.6;">${depot.description}</p>
    `;
    grid.appendChild(depotCard);
}

// ── Analytics Init ───────────────────────────────────────────────────────────
async function initAnalytics() {
    const data = await apiFetch('/api/analytics-data');
    if (!data) return;

    // Donut chart
    const cats = Object.keys(data.totals);
    new Chart(document.getElementById('analyticsDonut'), {
        type: 'doughnut',
        data: {
            labels: cats.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{ data: Object.values(data.totals), backgroundColor: cats.map(c => WASTE_COLORS[c]), borderWidth: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: { legend: { position: 'bottom', labels: { color: '#475569', padding: 16, usePointStyle: true, font: { size: 12, family: 'Plus Jakarta Sans', weight: '600' } } } }
        }
    });

    // Bar chart by zone
    const zoneLabels = data.zone_data.map(z => z.zone_name.replace('Zone ', '').replace(' —', ':'));
    const zoneDatasets = cats.map(cat => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        data: data.zone_data.map(z => z.breakdown[cat] || 0),
        backgroundColor: WASTE_COLORS[cat],
        borderRadius: 4
    }));
    new Chart(document.getElementById('zoneBarChart'), {
        type: 'bar',
        data: { labels: zoneLabels, datasets: zoneDatasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: '#64748B', font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' } } },
                y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748B', font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' } } }
            },
            plugins: { legend: { position: 'bottom', labels: { color: '#475569', padding: 12, usePointStyle: true, font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' } } } }
        }
    });

    // Daily trend line chart
    if (data.daily_trend.length > 0) {
        const trendLabels = data.daily_trend.map(d => d.date.substring(5));
        const trendDatasets = ['recyclable', 'organic', 'general'].map(cat => ({
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            data: data.daily_trend.map(d => d.data[cat] || 0),
            borderColor: WASTE_COLORS[cat],
            backgroundColor: WASTE_COLORS[cat] + '20',
            fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2
        }));
        new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: { labels: trendLabels, datasets: trendDatasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' } } },
                    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748B', font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' } } }
                },
                plugins: { legend: { position: 'bottom', labels: { color: '#475569', padding: 12, usePointStyle: true, font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' } } } }
            }
        });
    }

    // Source type bar chart
    const typeLabels = Object.keys(data.type_breakdown);
    const typeVals = Object.values(data.type_breakdown);
    const typeColors = typeLabels.map(t => {
        const c = { House: '#00b894', Apartment: '#0984e3', Shop: '#fdcb6e', Restaurant: '#e17055', Factory: '#d63031', Office: '#6c5ce7', Hospital: '#fd79a8' };
        return c[t] || '#636e72';
    });
    new Chart(document.getElementById('typeBarChart'), {
        type: 'bar',
        data: {
            labels: typeLabels,
            datasets: [{ data: typeVals, backgroundColor: typeColors, borderRadius: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: {
                x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748B', font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' } } },
                y: { grid: { display: false }, ticks: { color: '#1E293B', font: { size: 12, family: 'Plus Jakarta Sans', weight: '600' } } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Forecast
    const forecastGrid = document.getElementById('forecastGrid');
    data.forecast.forEach(f => {
        const total = Object.values(f.predicted).reduce((a, b) => a + b, 0);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="fc-date"><i class="fas fa-calendar-day"></i> ${f.date}</div>
            <div class="fc-total">${formatNum(total)} kg</div>
            <div class="fc-label">Estimated Total Waste</div>
        `;
        forecastGrid.appendChild(card);
    });

    // Totals
    document.getElementById('grandTotal').textContent = `${formatNum(data.grand_total)} kg`;
    for (const [cat, val] of Object.entries(data.totals)) {
        const el = document.getElementById(`total_${cat}`);
        if (el) el.textContent = `${formatNum(val)} kg`;
    }
}

// ── Collection History Init ──────────────────────────────────────────────────
async function initCollectionHistory() {
    const history = await apiFetch('/api/collection-history');
    if (!history) return;

    const tbody = document.getElementById('historyBody');
    history.sort((a, b) => b.date.localeCompare(a.date));

    history.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${h.date}</td>
            <td>${h.source_id}</td>
            <td>${h.source_name}</td>
            <td><span class="waste-tag ${h.waste_category}"><i class="fas ${WASTE_ICONS[h.waste_category]}"></i> ${h.waste_category}</span></td>
            <td><strong>${h.quantity_kg} kg</strong></td>
            <td>${h.truck_id}</td>
            <td>${h.facility}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Zones Init ───────────────────────────────────────────────────────────────
async function initZones() {
    const zones = await apiFetch('/api/zones');
    const analytics = await apiFetch('/api/analytics-data');
    if (!zones || !analytics) return;

    const grid = document.getElementById('zoneGrid');
    const zoneAnalytics = {};
    analytics.zone_data.forEach(z => { zoneAnalytics[z.zone_id] = z; });

    zones.forEach(z => {
        const zd = zoneAnalytics[z.id] || { total_waste_kg: 0, breakdown: {} };
        const card = document.createElement('div');
        card.className = 'zone-card';
        card.style.cssText = `border-top:4px solid ${z.color};`;
        card.innerHTML = `
            <div class="zone-name" style="color:${z.color};">${z.name}</div>
            <div class="zone-desc">${z.description}</div>
            <div class="info-grid" style="margin-bottom:12px;">
                <div class="info-item"><div class="info-label">Total Waste</div><div class="info-value">${formatNum(zd.total_waste_kg)} kg/day</div></div>
                <div class="info-item"><div class="info-label">Sources</div><div class="info-value">${z.sources.length} locations</div></div>
            </div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:6px;">WASTE BREAKDOWN</div>
            ${Object.entries(zd.breakdown || {}).filter(([,v]) => v > 0).map(([k,v]) =>
                `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.82rem;border-bottom:1px solid var(--border);">
                    <span><i class="fas ${WASTE_ICONS[k]}" style="color:${WASTE_COLORS[k]};margin-right:6px;"></i>${k}</span>
                    <strong>${formatNum(v)} kg</strong>
                </div>`
            ).join('')}
        `;
        grid.appendChild(card);
    });

    // Zone map
    const zoneMap = createMap('zoneMap', [12.928, 77.585], 13);
    await addAllMapMarkers(zoneMap, { zones: true });
    setTimeout(() => zoneMap.invalidateSize(), 300);
}
