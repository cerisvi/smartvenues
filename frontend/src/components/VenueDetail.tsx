import { useState, useRef } from 'react';
import { X, MapPin, Users, Star, Phone, Mail, Globe, Wifi, Car, Utensils, Tv, Sparkles } from 'lucide-react';
import type { VenueFeature } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';

interface Props {
  venue: VenueFeature;
  onClose: () => void;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={14} />,
  'Parcheggio': <Car size={14} />,
  'Catering': <Utensils size={14} />,
  'A/V': <Tv size={14} />,
};

/** Render markdown-like bold (**text**) within a line */
function renderLine(line: string, key: number) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  );
}

function AiInsight({ text, loading }: { text: string; loading: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm text-gray-700 leading-relaxed space-y-1">
      {lines.map((line, i) => (
        <p key={i} className={line.startsWith('•') ? 'pl-2' : ''}>
          {renderLine(line, i)}
        </p>
      ))}
      {loading && (
        <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse rounded-sm align-middle ml-0.5" />
      )}
    </div>
  );
}

export default function VenueDetail({ venue, onClose }: Props) {
  const p = venue.properties;
  const cfg = CATEGORY_CONFIG[p.category] ?? CATEGORY_CONFIG.conference;

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleDimmiSu() {
    if (aiLoading) return;
    setAiText('');
    setAiDone(false);
    setAiLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/venues/${p.id}/dimmi-su`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setAiText('Errore nel recupero delle informazioni.');
        setAiDone(true);
        setAiLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            setAiDone(true);
            setAiLoading(false);
            return;
          }
          try {
            const { text } = JSON.parse(payload) as { text: string };
            setAiText((prev) => prev + text);
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setAiText('Errore di connessione. Riprova più tardi.');
        setAiDone(true);
      }
    } finally {
      setAiLoading(false);
    }
  }

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
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <X size={16} className="text-gray-700" />
        </button>
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

        {/* AI – Dimmi su */}
        <div className="rounded-xl border border-violet-100 bg-violet-50 overflow-hidden">
          <button
            onClick={handleDimmiSu}
            disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles size={15} className={aiLoading ? 'animate-spin' : ''} />
            {aiLoading ? 'Analisi in corso…' : aiDone ? 'Aggiorna analisi AI' : 'Dimmi su questa venue'}
          </button>

          {(aiText || aiLoading) && (
            <div className="px-4 pb-4 pt-1 border-t border-violet-100">
              {aiText
                ? <AiInsight text={aiText} loading={aiLoading} />
                : <p className="text-xs text-violet-400 animate-pulse">Claude sta analizzando la venue…</p>
              }
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-1">
          <button className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm ${cfg.bgClass} hover:opacity-90 transition-opacity`}>
            Richiedi disponibilità
          </button>
        </div>
      </div>
    </div>
  );
}
