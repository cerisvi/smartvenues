import type { VenueFeature } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';

interface Props {
  venue: VenueFeature;
  onSelect: (venue: VenueFeature) => void;
}

export default function VenuePopup({ venue, onSelect }: Props) {
  const p = venue.properties;
  const cfg = CATEGORY_CONFIG[p.category] ?? CATEGORY_CONFIG.conference;

  return (
    <div className="w-70 font-sans overflow-hidden">
      {p.image && (
        <img
          src={p.image}
          alt={p.name}
          className="w-full h-32 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-sm text-gray-900 leading-tight">{p.name}</h3>
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full text-white ${cfg.bgClass}`}
          >
            {cfg.emoji} {cfg.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          📍 {p.city}, {p.region}
        </p>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">
          {p.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span>👥 {p.capacity.toLocaleString()} posti</span>
          <span className="flex items-center gap-1">
            ⭐ {p.rating.toFixed(1)}
          </span>
        </div>
        <button
          onClick={() => onSelect(venue)}
          className="w-full py-1.5 px-3 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Vedi dettagli →
        </button>
      </div>
    </div>
  );
}
