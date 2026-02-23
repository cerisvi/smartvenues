import { X, Pencil, MapPin, Users, Star, Phone, Mail, Globe, Wifi, Car, Utensils, Tv } from 'lucide-react';
import type { VenueFeature } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';

interface Props {
  venue: VenueFeature;
  onClose: () => void;
  onEdit?: (venue: VenueFeature) => void;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={14} />,
  'Parcheggio': <Car size={14} />,
  'Catering': <Utensils size={14} />,
  'A/V': <Tv size={14} />,
};

export default function VenueDetail({ venue, onClose, onEdit }: Props) {
  const p = venue.properties;
  const cfg = CATEGORY_CONFIG[p.category] ?? CATEGORY_CONFIG.conference;
  const isLocal = p.id > 1000;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Image header */}
      <div className="relative shrink-0">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-40 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className={`w-full h-40 ${cfg.bgClass} flex items-center justify-center text-5xl`}>
            {cfg.emoji}
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {isLocal && onEdit && (
            <button
              onClick={() => onEdit(venue)}
              className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
              title="Modifica venue"
            >
              <Pencil size={14} className="text-blue-600" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>
        <span
          className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white ${cfg.bgClass}`}
        >
          {cfg.emoji} {cfg.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{p.name}</h2>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin size={13} />
            <span>
              {p.address}, {p.city} ({p.region})
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-700 font-bold text-lg">
              <Users size={18} />
              {p.capacity.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-0.5">Capacità</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-lg">
              <Star size={18} fill="currentColor" />
              {p.rating.toFixed(1)}
            </div>
            <p className="text-xs text-amber-600 mt-0.5">Valutazione</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Descrizione</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
        </div>

        {/* Amenities */}
        {p.amenities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Servizi disponibili</h3>
            <div className="flex flex-wrap gap-2">
              {p.amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                >
                  {AMENITY_ICONS[a] ?? null}
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Contatti</h3>
          <div className="space-y-2">
            {p.phone && (
              <a
                href={`tel:${p.phone}`}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Phone size={14} className="text-gray-400" />
                {p.phone}
              </a>
            )}
            {p.email && (
              <a
                href={`mailto:${p.email}`}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Mail size={14} className="text-gray-400" />
                {p.email}
              </a>
            )}
            {p.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Globe size={14} className="text-gray-400" />
                Visita il sito web
              </a>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <button className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm ${cfg.bgClass} hover:opacity-90 transition-opacity`}>
            Richiedi disponibilità
          </button>
        </div>
      </div>
    </div>
  );
}
