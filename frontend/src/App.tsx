import { useState, useCallback } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import DroneDashboard from './components/drone/DroneDashboard';
import { useVenues, useStats, useRegions } from './hooks/useVenues';
import type { VenueFeature, Filters } from './types/venue';

type AppMode = 'venues' | 'drone';

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: '',
  region: '',
  minCapacity: 0,
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('venues');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedVenue, setSelectedVenue] = useState<VenueFeature | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { venues, loading } = useVenues(filters);
  const stats = useStats();
  const regions = useRegions();

  const handleFilterChange = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setSelectedVenue(null);
  }, []);

  const handleSelectVenue = useCallback((venue: VenueFeature | null) => {
    setSelectedVenue(venue);
    if (venue && !sidebarOpen) setSidebarOpen(true);
  }, [sidebarOpen]);

  if (mode === 'drone') {
    return (
      <div className="h-full flex flex-col">
        {/* Global mode switcher */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setMode('venues')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ← Smart Venues Portal
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
            🚁 Drone Logistics Dashboard
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <DroneDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Stats bar with mode switcher */}
      <div className="flex items-center shrink-0">
        <div className="flex-1">
          <StatsBar stats={stats} />
        </div>
        {/* Drone mode button */}
        <button
          onClick={() => setMode('drone')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-cyan-400 hover:bg-slate-800 transition-colors text-xs font-medium border-l border-gray-200 h-full shrink-0"
          title="Apri Dashboard Logistica Drone"
        >
          <span className="text-base">🚁</span>
          <span className="hidden sm:inline">Drone Logistics</span>
        </button>
      </div>

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
          />

          {/* Toggle sidebar button */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
            title={sidebarOpen ? 'Nascondi pannello' : 'Mostra pannello'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

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
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">
                  {emoji} {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
