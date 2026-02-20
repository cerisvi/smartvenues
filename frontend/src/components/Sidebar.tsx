import { useRef, useEffect } from 'react';
import type { VenueFeature, Filters } from '../types/venue';
import SearchPanel from './SearchPanel';
import VenueCard from './VenueCard';
import VenueDetail from './VenueDetail';

interface Props {
  venues: VenueFeature[];
  selectedVenue: VenueFeature | null;
  filters: Filters;
  regions: string[];
  loading: boolean;
  onSelectVenue: (v: VenueFeature | null) => void;
  onFilterChange: (f: Partial<Filters>) => void;
}

export default function Sidebar({
  venues,
  selectedVenue,
  filters,
  regions,
  loading,
  onSelectVenue,
  onFilterChange,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const venueList: VenueFeature[] = venues;
  const selectedId = selectedVenue?.properties.id ?? -1;

  // Scroll selected card into view
  useEffect(() => {
    if (selectedVenue && listRef.current) {
      const el = listRef.current.querySelector('[data-selected="true"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedVenue]);

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          <div>
            <h1 className="font-bold text-base leading-tight">SmartVenues</h1>
            <p className="text-xs opacity-80">Portale WebGIS delle venue italiane</p>
          </div>
        </div>
      </div>

      {selectedVenue ? (
        <div className="flex-1 overflow-hidden">
          <VenueDetail venue={selectedVenue} onClose={() => onSelectVenue(null)} />
        </div>
      ) : (
        <>
          <SearchPanel
            filters={filters}
            regions={regions}
            totalResults={venues.length}
            onChange={onFilterChange}
          />

          <div ref={listRef} className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Caricamento venue...</p>
              </div>
            )}
            {!loading && venueList.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                <span className="text-4xl">🔍</span>
                <p className="text-sm">Nessuna venue trovata</p>
                <p className="text-xs">Prova a modificare i filtri</p>
              </div>
            )}
            {!loading && venueList.map((v) => {
              const isSelected = v.properties.id === selectedId;
              return (
                <div
                  key={v.properties.id}
                  data-selected={isSelected ? 'true' : undefined}
                >
                  <VenueCard
                    venue={v}
                    selected={isSelected}
                    onClick={() => onSelectVenue(v)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
