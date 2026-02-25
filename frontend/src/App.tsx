import { useState, useCallback } from 'react';
import TopNav, { type AppMode } from './components/TopNav';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import DroneDashboard from './components/drone/DroneDashboard';
import AddVenueForm from './components/AddVenueForm';
import HomePage from './components/HomePage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import MyRequests from './components/MyRequests';
import { useVenues, useStats, useRegions } from './hooks/useVenues';
import type { VenueFeature, Filters } from './types/venue';
import { loadRequests } from './lib/requestStorage';

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
  const [venueToEdit, setVenueToEdit] = useState<VenueFeature | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [venueRefreshKey, setVenueRefreshKey] = useState(0);

  const { venues, loading } = useVenues(filters, venueRefreshKey);
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

  const handleEditVenue = useCallback((venue: VenueFeature) => {
    setVenueToEdit(venue);
    setMode('edit-venue');
  }, []);

  const handleDeleteVenue = useCallback(() => {
    setSelectedVenue(null);
    setVenueRefreshKey((k) => k + 1);
  }, []);

  const handleVenueImageUpdated = useCallback((updated: VenueFeature) => {
    setVenueRefreshKey((k) => k + 1);
    setSelectedVenue(updated);
  }, []);

  const requestCount = loadRequests().length;

  // edit-venue is an internal mode (no TopNav render needed, AddVenueForm has its own header)
  if (mode === 'edit-venue' && venueToEdit) {
    return (
      <AddVenueForm
        initialVenue={venueToEdit}
        onBack={() => { setVenueToEdit(null); setMode('venues'); }}
        onVenueUpdated={() => {
          setVenueRefreshKey((k) => k + 1);
          setSelectedVenue(null);
          setVenueToEdit(null);
          setMode('venues');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <TopNav mode={mode} onModeChange={handleModeChange} requestCount={requestCount} />

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

        {mode === 'my-requests' && (
          <MyRequests onBack={() => handleModeChange('venues')} />
        )}

        {mode === 'add-venue' && (
          <AddVenueForm
            onBack={() => handleModeChange('home')}
            onVenueAdded={() => {
              setVenueRefreshKey((k) => k + 1);
              handleModeChange('venues');
            }}
          />
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
                onEditVenue={handleEditVenue}
                onDeleteVenue={handleDeleteVenue}
                onVenueImageUpdated={handleVenueImageUpdated}
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
