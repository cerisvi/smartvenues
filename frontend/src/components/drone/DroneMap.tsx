import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATANIA_HUBS, ETNA_SUMMIT } from '../../data/droneData';
import type { SimulationParams, SimulationResult, DroneHub } from '../../types/drone';
import { haversineDistance } from '../../utils/droneSimulation';

// ─── Icon Factories ───────────────────────────────────────────────────────────

function createHubIcon(type: string, isOrigin: boolean, isDest: boolean, isActive: boolean) {
  const colors: Record<string, string> = {
    primary: '#0ea5e9', secondary: '#6366f1', micro: '#8b5cf6',
  };
  const baseColor = isOrigin ? '#22c55e' : isDest ? '#f59e0b' : (colors[type] ?? '#6366f1');
  const size      = isOrigin || isDest ? 40 : 28;
  const pulse     = isActive && (isOrigin || isDest);
  const emoji     = isOrigin ? '🟢' : isDest ? '🟡' : type === 'primary' ? '🔵' : '🟣';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${baseColor};opacity:0.5;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
        <div style="width:${size}px;height:${size}px;background:${baseColor};border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:${size * 0.45}px;">${emoji}</div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function createDroneIcon(progress: number) {
  const rotation = progress > 0.5 ? 180 : 0;
  return L.divIcon({
    className: '',
    html: `<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));transform:rotate(${rotation}deg);transition:transform 0.3s;">🚁</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createEtnaIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🌋</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// ─── Map Logic Component ──────────────────────────────────────────────────────

interface MapLayersProps {
  params: SimulationParams;
  result: SimulationResult | null;
  animating: boolean;
  plannerHubs: DroneHub[] | null;
}

function MapLayers({ params, result, animating, plannerHubs }: MapLayersProps) {
  const map            = useMap();
  const layerRef       = useRef<L.LayerGroup | null>(null);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const animFrameRef   = useRef<number | null>(null);

  const origin      = CATANIA_HUBS.find((h) => h.id === params.originHubId)!;
  const destination = CATANIA_HUBS.find((h) => h.id === params.destinationHubId)!;

  // ── Static layers (hubs, routes) ────────────────────────────────────────
  useEffect(() => {
    if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
    const group = layerRef.current;
    group.clearLayers();

    // Etna
    L.marker(ETNA_SUMMIT.coords, { icon: createEtnaIcon() })
      .bindPopup(`<div style="font-family:sans-serif;padding:4px 8px"><strong>🌋 Monte Etna</strong><br/><span style="color:#6b7280;font-size:12px">Quota: ${ETNA_SUMMIT.elevation}m — Zona esclusione volo (5 km)</span></div>`)
      .addTo(group);

    L.circle(ETNA_SUMMIT.coords, {
      radius: 5000, color: '#ef4444', fillColor: '#ef444420',
      fillOpacity: 0.3, weight: 1, dashArray: '6 4',
    }).bindPopup('<div style="font-family:sans-serif;padding:4px 8px"><strong>⛔ Zona di esclusione</strong></div>').addTo(group);

    // Coverage web (simulation route)
    CATANIA_HUBS.forEach((hub) => {
      const dist = haversineDistance(origin.coords, hub.coords);
      if (hub.id !== origin.id && dist < 80) {
        L.polyline([origin.coords, hub.coords], { color: '#0ea5e9', weight: 1, opacity: 0.15, dashArray: '4 8' }).addTo(group);
      }
    });

    // Simulation active route (cyan)
    if (origin.id !== destination.id) {
      L.polyline([origin.coords, destination.coords], { color: '#22d3ee', weight: 6, opacity: 0.2 }).addTo(group);
      L.polyline([origin.coords, destination.coords], { color: '#06b6d4', weight: 2.5, opacity: 0.9, dashArray: '8 6' }).addTo(group);

      const midLat = (origin.coords[0] + destination.coords[0]) / 2;
      const midLng = (origin.coords[1] + destination.coords[1]) / 2;
      const dist   = haversineDistance(origin.coords, destination.coords);
      L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:#0f172a;color:#22d3ee;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;border:1px solid #22d3ee40;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-family:monospace;">✈ ${dist.toFixed(1)} km${result ? ` | ${result.route.droneFlightTimeMin} min` : ''}</div>`,
          iconAnchor: [40, 10],
        }),
      }).addTo(group);
    }

    // ── Planner route (violet) ─────────────────────────────────────────
    if (plannerHubs && plannerHubs.length >= 2) {
      for (let i = 0; i < plannerHubs.length - 1; i++) {
        const from = plannerHubs[i];
        const to   = plannerHubs[i + 1];

        // Glow
        L.polyline([from.coords, to.coords], { color: '#8b5cf6', weight: 8, opacity: 0.18 }).addTo(group);
        // Main dashed line
        L.polyline([from.coords, to.coords], { color: '#a855f7', weight: 2.5, opacity: 1, dashArray: '10 6' }).addTo(group);

        // Leg label
        const midLat = (from.coords[0] + to.coords[0]) / 2;
        const midLng = (from.coords[1] + to.coords[1]) / 2;
        const dist   = haversineDistance(from.coords, to.coords);
        L.marker([midLat, midLng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:#1e1b4b;color:#c4b5fd;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;border:1px solid #a855f740;white-space:nowrap;font-family:monospace;">📦 ${dist.toFixed(1)} km</div>`,
            iconAnchor: [38, 10],
          }),
        }).addTo(group);
      }

      // Highlight planner hubs with violet ring
      plannerHubs.forEach((hub) => {
        L.circleMarker(hub.coords, {
          radius: 18, color: '#a855f7', fillColor: 'transparent', weight: 2, opacity: 0.7,
        }).addTo(group);
      });

      // Fit map to planner route
      const bounds = L.latLngBounds(plannerHubs.map((h) => h.coords));
      map.fitBounds(bounds.pad(0.2), { maxZoom: 12 });
    } else {
      // All hubs + fit to simulation route
      const bounds = L.latLngBounds([origin.coords, destination.coords]);
      CATANIA_HUBS.forEach((h) => bounds.extend(h.coords));
      map.fitBounds(bounds.pad(0.15), { maxZoom: 12 });
    }

    // Hub markers
    CATANIA_HUBS.forEach((hub) => {
      const isOrigin = hub.id === params.originHubId;
      const isDest   = hub.id === params.destinationHubId;
      const marker   = L.marker(hub.coords, { icon: createHubIcon(hub.type, isOrigin, isDest, true) });
      const typeLabel = hub.type === 'primary' ? '🔵 Primario' : hub.type === 'secondary' ? '🟣 Secondario' : '⚪ Micro';
      const svBadge   = hub.isSmartVenue ? '<span style="background:#0ea5e9;color:white;padding:1px 6px;border-radius:8px;font-size:10px">Smart Venue</span>' : '';
      marker.bindPopup(`
        <div style="font-family:sans-serif;padding:6px 8px;min-width:180px">
          <strong style="color:#0f172a;font-size:13px">${hub.name}</strong><br/>
          <span style="color:#6b7280;font-size:11px">${hub.address}</span><br/>
          <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">
            <span style="background:#f1f5f9;color:#475569;padding:1px 6px;border-radius:8px;font-size:10px">${typeLabel}</span>
            ${svBadge}
          </div>
          <div style="margin-top:6px;font-size:11px;color:#374151">
            🚁 ${hub.droneCount} droni &nbsp;|&nbsp; 📦 ${hub.dailyCapacity} cons./giorno<br/>
            ⚡ ${hub.chargingBays} bays di ricarica
          </div>
          ${isOrigin ? '<div style="margin-top:4px;color:#22c55e;font-weight:600;font-size:11px">▶ ORIGINE</div>' : ''}
          ${isDest   ? '<div style="margin-top:4px;color:#f59e0b;font-weight:600;font-size:11px">▶ DESTINAZIONE</div>' : ''}
        </div>
      `);
      group.addLayer(marker);
    });

  }, [params.originHubId, params.destinationHubId, map, result, origin, destination, plannerHubs]);

  // ── Drone animation (handles both single-leg simulation and multi-leg planner) ──
  useEffect(() => {
    const cleanup = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (droneMarkerRef.current) { map.removeLayer(droneMarkerRef.current); droneMarkerRef.current = null; }
    };

    if (!animating) { cleanup(); return; }

    // Determine route: planner takes priority when set
    const routeHubs: DroneHub[] =
      plannerHubs && plannerHubs.length >= 2
        ? plannerHubs
        : (origin.id !== destination.id ? [origin, destination] : []);

    if (routeHubs.length < 2) { cleanup(); return; }

    // Build cumulative distances per leg
    const legDistances  = routeHubs.slice(0, -1).map((hub, i) =>
      haversineDistance(hub.coords, routeHubs[i + 1].coords),
    );
    const totalDist     = legDistances.reduce((s, d) => s + d, 0);
    const cumulative    = legDistances.reduce<number[]>((acc, d) => {
      acc.push((acc[acc.length - 1] ?? 0) + d);
      return acc;
    }, []);

    const startTime     = performance.now();
    const totalDuration = plannerHubs ? Math.max(8000, routeHubs.length * 3000) : 6000;

    const animate = (now: number) => {
      const progress    = ((now - startTime) % totalDuration) / totalDuration; // 0→1 looping
      const distCovered = progress * totalDist;

      let legIdx = cumulative.findIndex((c) => c >= distCovered);
      if (legIdx < 0) legIdx = cumulative.length - 1;

      const prevCumDist = legIdx === 0 ? 0 : cumulative[legIdx - 1];
      const legProgress = legDistances[legIdx] > 0
        ? (distCovered - prevCumDist) / legDistances[legIdx]
        : 0;

      const from = routeHubs[legIdx];
      const to   = routeHubs[legIdx + 1];
      const lat  = from.coords[0] + (to.coords[0] - from.coords[0]) * legProgress;
      const lng  = from.coords[1] + (to.coords[1] - from.coords[1]) * legProgress;
      const pos: [number, number] = [lat, lng];

      if (!droneMarkerRef.current) {
        droneMarkerRef.current = L.marker(pos, { icon: createDroneIcon(legProgress), zIndexOffset: 1000 }).addTo(map);
      } else {
        droneMarkerRef.current.setLatLng(pos);
        droneMarkerRef.current.setIcon(createDroneIcon(legProgress));
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return cleanup;
  }, [animating, origin, destination, map, plannerHubs]);

  return null;
}

// ─── DroneMap Component ───────────────────────────────────────────────────────

interface DroneMapProps {
  params: SimulationParams;
  result: SimulationResult | null;
  animating: boolean;
  onAnimateToggle: () => void;
  plannerHubs: DroneHub[] | null;
  onClearPlannerRoute: () => void;
}

export default function DroneMap({ params, result, animating, onAnimateToggle, plannerHubs, onClearPlannerRoute }: DroneMapProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer center={[37.52, 14.9]} zoom={9} className="w-full h-full" zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
        />
        <MapLayers params={params} result={result} animating={animating} plannerHubs={plannerHubs} />
      </MapContainer>

      {/* Controls overlay */}
      <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={onAnimateToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-lg border transition-all ${
            animating
              ? 'bg-cyan-500 text-white border-cyan-400 hover:bg-cyan-400'
              : 'bg-slate-800/90 text-cyan-400 border-slate-600 hover:bg-slate-700'
          }`}
        >
          {animating ? '⏹ Stop Simulazione' : '▶ Simula Volo'}
        </button>

        {plannerHubs && (
          <button
            onClick={onClearPlannerRoute}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium shadow-lg border bg-violet-900/80 text-violet-300 border-violet-700 hover:bg-violet-800 transition-all"
          >
            ✕ Nascondi rotta pianificata
          </button>
        )}
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-6 right-4 z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700 text-xs text-slate-300">
        <p className="font-semibold text-white mb-2">Legenda</p>
        {[
          { dot: 'bg-green-500',  label: 'Hub Origine' },
          { dot: 'bg-amber-500',  label: 'Hub Destinazione' },
          { dot: 'bg-sky-500',    label: 'Hub Primario' },
          { dot: 'bg-indigo-500', label: 'Hub Secondario' },
          { dot: 'bg-violet-500', label: 'Hub Micro' },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-2 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <span>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-8 h-0" style={{ borderTop: '2px dashed #22d3ee' }} />
          <span>Rotta simulazione</span>
        </div>
        {plannerHubs && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-0" style={{ borderTop: '2px dashed #a855f7' }} />
            <span className="text-violet-300">Rotta pianificata</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-red-400">- -</span>
          <span>Zona esclusione Etna</span>
        </div>
      </div>

      {/* Hub count badge */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-700 text-xs text-slate-300">
        <span className="text-cyan-400 font-bold">{CATANIA_HUBS.length}</span> Hub attivi &nbsp;|&nbsp;
        <span className="text-cyan-400 font-bold">{CATANIA_HUBS.reduce((s, h) => s + h.droneCount, 0)}</span> Droni
        {plannerHubs && (
          <span className="ml-2 text-violet-400 font-semibold">· Piano volo attivo</span>
        )}
      </div>
    </div>
  );
}
