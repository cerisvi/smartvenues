import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_CONFIG } from '../data/categoryConfig';
import type { Filters } from '../types/venue';

interface Props {
  filters: Filters;
  regions: string[];
  totalResults: number;
  onChange: (f: Partial<Filters>) => void;
}

export default function SearchPanel({ filters, regions, totalResults, onChange }: Props) {
  const hasActiveFilters =
    filters.search || filters.category || filters.region || filters.minCapacity > 0;

  const reset = () =>
    onChange({ search: '', category: '', region: '', minCapacity: 0 });

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca venue, città, regione..."
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => onChange({ category: '' })}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
            !filters.category
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
          }`}
        >
          Tutte
        </button>
        {CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const active = filters.category === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange({ category: active ? '' : cat })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                active
                  ? `${cfg.bgClass} text-white border-transparent`
                  : `bg-white ${cfg.textClass} ${cfg.borderClass} hover:opacity-80`
              }`}
            >
              {cfg.emoji} {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Region + Capacity */}
      <div className="flex gap-2">
        <select
          value={filters.region}
          onChange={(e) => onChange({ region: e.target.value })}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tutte le regioni</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filters.minCapacity}
          onChange={(e) => onChange({ minCapacity: Number(e.target.value) })}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0}>Qualsiasi capienza</option>
          <option value={500}>500+ posti</option>
          <option value={1000}>1.000+ posti</option>
          <option value={3000}>3.000+ posti</option>
          <option value={5000}>5.000+ posti</option>
          <option value={10000}>10.000+ posti</option>
        </select>
      </div>

      {/* Results & reset */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <SlidersHorizontal size={12} />
          {totalResults} venue trovate
        </span>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <X size={12} /> Reset filtri
          </button>
        )}
      </div>
    </div>
  );
}
