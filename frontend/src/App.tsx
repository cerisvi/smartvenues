import { useState, useCallback } from 'react';
import TopNav, { type AppMode } from './components/TopNav';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import DroneDashboard from './components/drone/DroneDashboard';
import AddVenueForm from './components/AddVenueForm';
import HomePage from './components/HomePage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { useVenues, useStats, useRegions } from './hooks/useVenues';
import type { VenueFeature, Filters } from './types/venue';

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: '',
  region: '',
  minCapacity: 0,
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('home');
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

  const handleModeChange = useCallback((next: AppMode) => {
    setMode(next);
    setSelectedVenue(null);
  }, []);

  // add-venue is full-screen (own header via AddVenueForm)
  if (mode === 'add-venue') {
    return (
      <div className="h-full flex flex-col">
        <TopNav mode={mode} onModeChange={handleModeChange} />
        <div className="flex-1 overflow-hidden">
          <AddVenueForm onBack={() => handleModeChange('home')} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Global top navigation */}
      <TopNav mode={mode} onModeChange={handleModeChange} />

      {/* Page content */}
      <div className="flex-1 overflow-hidden">

        {mode === 'home' && (
          <HomePage stats={stats} onNavigate={handleModeChange} />
        )}

        {mode === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {mode === 'drone' && (
          <DroneDashboard />
        )}

        {mode === 'venues' && (
          <div className="flex h-full overflow-hidden relative bg-gray-100">
            {/* Sidebar */}
            <div
              className={`shrink-0 w-80 h-full z-10 transition-all duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute'
              }`}
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

            {/* Map */}
            <div className="flex-1 relative">
              <MapView
                venues={venues}
                selectedId={selectedVenue?.properties.id ?? null}
                onSelect={handleSelectVenue}
              />

              {/* Toggle sidebar */}
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
                  { emoji: '🏛️', label: 'Congressi',       color: '#3b82f6' },
                  { emoji: '🏪', label: 'Fiere',           color: '#10b981' },
                  { emoji: '🏟️', label: 'Sport',           color: '#f59e0b' },
                  { emoji: '🎭', label: 'Intrattenimento', color: '#ec4899' },
                ].map(({ emoji, label, color }) => (
                  <div key={label} className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600">{emoji} {label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
