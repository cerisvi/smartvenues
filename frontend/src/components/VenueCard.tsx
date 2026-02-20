import { MapPin, Users, Star, ChevronRight } from 'lucide-react';
import type { VenueFeature } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';

interface Props {
  venue: VenueFeature;
  selected: boolean;
  onClick: () => void;
}

export default function VenueCard({ venue, selected, onClick }: Props) {
  const p = venue.properties;
  const cfg = CATEGORY_CONFIG[p.category] ?? CATEGORY_CONFIG.conference;

  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer transition-all border-b border-gray-100 hover:bg-blue-50 ${
        selected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category emoji */}
        <div
          className={`shrink-0 w-9 h-9 rounded-lg ${cfg.bgClass} flex items-center justify-center text-lg`}
        >
          {cfg.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
              {p.name}
            </p>
            <ChevronRight size={14} className="shrink-0 text-gray-400 mt-0.5" />
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <MapPin size={11} />
            <span className="truncate">
              {p.city}, {p.region}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Users size={11} />
              {p.capacity.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <Star size={11} fill="currentColor" />
              {p.rating.toFixed(1)}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-white text-xs ${cfg.bgClass}`}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
