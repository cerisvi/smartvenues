import { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  LayersControl,
} from 'react-leaflet';
import L, { type LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { renderToString } from 'react-dom/server';
import type { VenueFeature } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';
import VenuePopup from './VenuePopup';
import type { MapTool } from './MapToolbar';

// Fix default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASE_LAYERS = {
  'OpenStreetMap': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'CartoDB Light': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  'CartoDB Dark': 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  'ESRI Satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

function createMarkerIcon(category: string, selected: boolean): L.DivIcon {
  const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.conference;
  const size = selected ? 40 : 32;
  const border = selected ? '3px solid white' : '2px solid white';
  const shadow = selected
    ? '0 4px 16px rgba(0,0,0,0.5)'
    : '0 2px 8px rgba(0,0,0,0.3)';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${cfg.color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:${border};
        box-shadow:${shadow};
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:${selected ? 18 : 14}px;line-height:1">
          ${cfg.emoji}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// ── Markers layer ──────────────────────────────────────────────────────────────
interface MarkersLayerProps {
  venues: VenueFeature[];
  selectedId: number | null;
  onSelect: (venue: VenueFeature) => void;
  activeTool: MapTool;
}

function MarkersLayer({ venues, selectedId, onSelect, activeTool }: MarkersLayerProps) {
  const map = useMap();
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();
    markersRef.current.clear();

    venues.forEach((venue) => {
      const [lng, lat] = venue.geometry.coordinates;
      const selected = venue.properties.id === selectedId;
      const icon = createMarkerIcon(venue.properties.category, selected);

      const marker = L.marker([lat, lng], { icon });
      const popupContent = renderToString(
        <VenuePopup venue={venue} onSelect={() => {}} />
      );
      const popup = L.popup({ maxWidth: 300, minWidth: 280 }).setContent(popupContent);
      marker.bindPopup(popup);

      marker.on('click', () => {
        if (activeTool === 'none') onSelect(venue);
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.querySelector('.leaflet-popup-content button');
          if (btn) {
            btn.addEventListener('click', () => onSelect(venue));
          }
        }, 50);
      });

      group.addLayer(marker);
      markersRef.current.set(venue.properties.id, marker);
    });

    return () => { group.clearLayers(); };
  }, [venues, selectedId, map, onSelect, activeTool]);

  useEffect(() => {
    if (selectedId !== null) {
      const marker = markersRef.current.get(selectedId);
      if (marker) {
        const latlng = marker.getLatLng();
        map.flyTo(latlng, Math.max(map.getZoom(), 12), { duration: 0.8 });
        marker.openPopup();
      }
    }
  }, [selectedId, map]);

  return null;
}

// ── Heatmap layer ──────────────────────────────────────────────────────────────
interface HeatmapLayerProps {
  venues: VenueFeature[];
  visible: boolean;
}

function HeatmapLayer({ venues, visible }: HeatmapLayerProps) {
  const map = useMap();
  const heatRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }
    if (!visible || venues.length === 0) return;

    const points: [number, number, number][] = venues.map((v) => {
      const [lng, lat] = v.geometry.coordinates;
      const intensity = Math.min(v.properties.capacity / 10000, 1);
      return [lat, lng, intensity];
    });

    const heat = L.heatLayer(points, {
      radius: 40,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      gradient: { 0.2: '#3b82f6', 0.5: '#f59e0b', 0.8: '#ef4444' },
    });
    heat.addTo(map);
    heatRef.current = heat;

    return () => {
      if (heatRef.current) map.removeLayer(heatRef.current);
    };
  }, [venues, visible, map]);

  return null;
}

// ── Measure layer ──────────────────────────────────────────────────────────────
interface MeasureLayerProps {
  points: [number, number][];
}

function MeasureLayer({ points }: MeasureLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const group = layerRef.current;
    group.clearLayers();

    if (points.length === 0) return;

    // Draw line
    if (points.length > 1) {
      L.polyline(points, {
        color: '#7c3aed',
        weight: 2.5,
        dashArray: '6 4',
        opacity: 0.9,
      }).addTo(group);
    }

    // Draw point markers + segment labels
    points.forEach((pt, i) => {
      L.circleMarker(pt, {
        radius: 5,
        fillColor: '#7c3aed',
        color: 'white',
        weight: 2,
        fillOpacity: 1,
      }).addTo(group);

      if (i > 0) {
        const prev = points[i - 1];
        const segDist = L.latLng(prev).distanceTo(L.latLng(pt));
        const mid: [number, number] = [
          (prev[0] + pt[0]) / 2,
          (prev[1] + pt[1]) / 2,
        ];
        const label = segDist < 1000
          ? `${Math.round(segDist)} m`
          : `${(segDist / 1000).toFixed(1)} km`;

        L.marker(mid, {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:rgba(124,58,237,0.9);color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:8px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3)">${label}</div>`,
            iconAnchor: [20, 10],
          }),
        }).addTo(group);
      }
    });

    return () => { group.clearLayers(); };
  }, [points, map]);

  return null;
}

// ── Proximity layer ────────────────────────────────────────────────────────────
interface ProximityLayerProps {
  center: [number, number] | null;
  radiusKm: number;
}

function ProximityLayer({ center, radiusKm }: ProximityLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const group = layerRef.current;
    group.clearLayers();

    if (!center) return;

    // Outer circle
    L.circle(center, {
      radius: radiusKm * 1000,
      color: '#0d9488',
      weight: 2,
      fillColor: '#0d9488',
      fillOpacity: 0.08,
      dashArray: '8 4',
    }).addTo(group);

    // Center marker
    L.circleMarker(center, {
      radius: 6,
      fillColor: '#0d9488',
      color: 'white',
      weight: 2,
      fillOpacity: 1,
    }).addTo(group);

    return () => { group.clearLayers(); };
  }, [center, radiusKm, map]);

  return null;
}

// ── Map event handler (tool clicks) ──────────────────────────────────────────
interface MapEventHandlerProps {
  activeTool: MapTool;
  onMapClick: (latlng: [number, number]) => void;
}

function MapEventHandler({ activeTool, onMapClick }: MapEventHandlerProps) {
  const map = useMap();

  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (activeTool !== 'none') {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  // Change cursor when a tool is active
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = activeTool !== 'none' ? 'crosshair' : '';
  }, [activeTool, map]);

  return null;
}

// ── Main MapView ───────────────────────────────────────────────────────────────
interface Props {
  venues: VenueFeature[];
  selectedId: number | null;
  onSelect: (venue: VenueFeature) => void;
  showHeatmap: boolean;
  activeTool: MapTool;
  measurePoints: [number, number][];
  proximityCenter: [number, number] | null;
  proximityRadiusKm: number;
  onMapClick: (latlng: [number, number]) => void;
}

export default function MapView({
  venues,
  selectedId,
  onSelect,
  showHeatmap,
  activeTool,
  measurePoints,
  proximityCenter,
  proximityRadiusKm,
  onMapClick,
}: Props) {
  return (
    <MapContainer
      center={[42.5, 12.5]}
      zoom={6}
      className="w-full h-full"
      zoomControl={false}
    >
      <LayersControl position="topright">
        {Object.entries(BASE_LAYERS).map(([name, url], idx) => (
          <LayersControl.BaseLayer key={name} checked={idx === 1} name={name}>
            <TileLayer
              url={url}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
          </LayersControl.BaseLayer>
        ))}
      </LayersControl>

      <MarkersLayer
        venues={venues}
        selectedId={selectedId}
        onSelect={onSelect}
        activeTool={activeTool}
      />
      <HeatmapLayer venues={venues} visible={showHeatmap} />
      <MeasureLayer points={measurePoints} />
      <ProximityLayer center={proximityCenter} radiusKm={proximityRadiusKm} />
      <MapEventHandler activeTool={activeTool} onMapClick={onMapClick} />
    </MapContainer>
  );
}
