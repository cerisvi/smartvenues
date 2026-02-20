import { useState, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import MapToolbar from './components/MapToolbar';
import StatsPanel from './components/StatsPanel';
import { useVenues, useStats, useRegions } from './hooks/useVenues';
import type { VenueFeature, Filters } from './types/venue';
import type { MapTool } from './components/MapToolbar';
import { exportToCSV, exportToGeoJSON } from './utils/exportVenues';
import L from 'leaflet';

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: '',
  region: '',
  minCapacity: 0,
};

/** Haversine distance in meters between two [lat,lng] points */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return L.latLng(lat1, lng1).distanceTo(L.latLng(lat2, lng2));
}

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedVenue, setSelectedVenue] = useState<VenueFeature | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- new tool state ---
  const [activeTool, setActiveTool] = useState<MapTool>('none');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [proximityCenter, setProximityCenter] = useState<[number, number] | null>(null);
  const [proximityRadiusKm, setProximityRadiusKm] = useState(50);

  const { venues: rawVenues, loading } = useVenues(filters);
  const stats = useStats();
  const regions = useRegions();

  // Filter by proximity when proximity tool has a center
  const venues = useMemo(() => {
    if (!proximityCenter) return rawVenues;
    return rawVenues.filter((v) => {
      const [lng, lat] = v.geometry.coordinates;
      return haversineM(proximityCenter[0], proximityCenter[1], lat, lng) <= proximityRadiusKm * 1000;
    });
  }, [rawVenues, proximityCenter, proximityRadiusKm]);

  // Measure: total path distance
  const measureDistanceM = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      total += haversineM(measurePoints[i - 1][0], measurePoints[i - 1][1], measurePoints[i][0], measurePoints[i][1]);
    }
    return total;
  }, [measurePoints]);

  const handleFilterChange = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setSelectedVenue(null);
  }, []);

  const handleSelectVenue = useCallback((venue: VenueFeature | null) => {
    setSelectedVenue(venue);
    if (venue && !sidebarOpen) setSidebarOpen(true);
  }, [sidebarOpen]);

  const handleMapClick = useCallback((latlng: [number, number]) => {
    if (activeTool === 'measure') {
      setMeasurePoints((pts) => [...pts, latlng]);
    } else if (activeTool === 'proximity') {
      setProximityCenter(latlng);
    }
  }, [activeTool]);

  const handleToolChange = useCallback((tool: MapTool) => {
    setActiveTool(tool);
    if (tool !== 'proximity') {
      setProximityCenter(null);
    }
    if (tool !== 'measure') {
      setMeasurePoints([]);
    }
  }, []);

  const handleClearTool = useCallback(() => {
    setActiveTool('none');
    setMeasurePoints([]);
    setProximityCenter(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <StatsBar stats={stats} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`
            shrink-0 w-80 h-full z-10 transition-all duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute'}
          `}
        >
          <Sidebar
            venues={venues}
            selectedVenue={selectedVenue}
            filters={filters}
            regions={regions}
            loading={loading}
            onSelectVenue={handleSelectVenue}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Map container */}
        <div className="flex-1 relative">
          <MapView
            venues={venues}
            selectedId={selectedVenue?.properties.id ?? null}
            onSelect={handleSelectVenue}
            showHeatmap={showHeatmap}
            activeTool={activeTool}
            measurePoints={measurePoints}
            proximityCenter={proximityCenter}
            proximityRadiusKm={proximityRadiusKm}
            onMapClick={handleMapClick}
          />

          {/* Toggle sidebar button */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
            title={sidebarOpen ? 'Nascondi pannello' : 'Mostra pannello'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {/* Map Toolbar */}
          <div className="absolute top-4 left-16 z-20">
            <MapToolbar
              activeTool={activeTool}
              showHeatmap={showHeatmap}
              showStats={showStats}
              proximityRadiusKm={proximityRadiusKm}
              measureDistanceM={measureDistanceM}
              measurePoints={measurePoints.length}
              proximityCenter={proximityCenter}
              onToolChange={handleToolChange}
              onHeatmapToggle={() => setShowHeatmap((v) => !v)}
              onStatsToggle={() => setShowStats((v) => !v)}
              onProximityRadiusChange={setProximityRadiusKm}
              onClearTool={handleClearTool}
              onExportCSV={() => exportToCSV(venues)}
              onExportGeoJSON={() => exportToGeoJSON(venues)}
            />
          </div>

          {/* Proximity filter active badge */}
          {proximityCenter && activeTool !== 'proximity' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <span>Filtro prossimità attivo — {proximityRadiusKm} km</span>
              <button
                onClick={handleClearTool}
                className="hover:text-teal-200 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Map legend */}
          <div className="absolute bottom-6 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Legenda</p>
            {[
              { emoji: '🏛️', label: 'Congressi', color: '#3b82f6' },
              { emoji: '🏪', label: 'Fiere', color: '#10b981' },
              { emoji: '🏟️', label: 'Sport', color: '#f59e0b' },
              { emoji: '🎭', label: 'Intrattenimento', color: '#ec4899' },
            ].map(({ emoji, label, color }) => (
              <div key={label} className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600">{emoji} {label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats panel (right slide-in) */}
        {showStats && (
          <StatsPanel venues={venues} onClose={() => setShowStats(false)} />
        )}
      </div>
    </div>
  );
}
