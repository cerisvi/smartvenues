import { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  useMap,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import type { VenueFeature } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';
import VenuePopup from './VenuePopup';

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

interface MarkersLayerProps {
  venues: VenueFeature[];
  selectedId: number | null;
  onSelect: (venue: VenueFeature) => void;
}

function MarkersLayer({ venues, selectedId, onSelect }: MarkersLayerProps) {
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

      // After popup opens, attach real click handler to button
      marker.on('popupopen', (e: L.PopupEvent) => {
        const btn = e.popup.getElement()?.querySelector<HTMLButtonElement>(
          `[data-venue-id="${venue.properties.id}"]`
        );
        if (btn) {
          btn.addEventListener('click', () => onSelect(venue), { once: true });
        }
      });

      group.addLayer(marker);
      markersRef.current.set(venue.properties.id, marker);
    });

    return () => {
      group.clearLayers();
    };
  }, [venues, selectedId, map, onSelect]);

  // Pan to selected
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

interface Props {
  venues: VenueFeature[];
  selectedId: number | null;
  onSelect: (venue: VenueFeature) => void;
}

export default function MapView({ venues, selectedId, onSelect }: Props) {
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

      <MarkersLayer venues={venues} selectedId={selectedId} onSelect={onSelect} />
    </MapContainer>
  );
}
