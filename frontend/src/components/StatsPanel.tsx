import { X, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VenueFeature } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';

interface Props {
  venues: VenueFeature[];
  onClose: () => void;
}

const CAT_COLORS: Record<string, string> = {
  conference: '#3b82f6',
  exhibition: '#10b981',
  sports: '#f59e0b',
  entertainment: '#ec4899',
};

export default function StatsPanel({ venues, onClose }: Props) {
  // --- per category count ---
  const byCategory = Object.entries(
    venues.reduce<Record<string, number>>((acc, v) => {
      const cat = v.properties.category;
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([cat, count]) => ({
    name: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label ?? cat,
    count,
    color: CAT_COLORS[cat] ?? '#6366f1',
  }));

  // --- capacity by region (top 10) ---
  const byRegion = Object.entries(
    venues.reduce<Record<string, number>>((acc, v) => {
      const r = v.properties.region;
      acc[r] = (acc[r] ?? 0) + v.properties.capacity;
      return acc;
    }, {})
  )
    .map(([region, capacity]) => ({ region, capacity }))
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 10);

  // --- avg rating by category ---
  const ratingByCat = Object.entries(
    venues.reduce<Record<string, number[]>>((acc, v) => {
      const cat = v.properties.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(v.properties.rating);
      return acc;
    }, {})
  ).map(([cat, ratings]) => ({
    name: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label ?? cat,
    avg: parseFloat((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2)),
    color: CAT_COLORS[cat] ?? '#6366f1',
  }));

  // --- pie data ---
  const pieData = byCategory.map((d) => ({ name: d.name, value: d.count, color: d.color }));

  return (
    <div className="absolute inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-30 flex flex-col border-l border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} />
          <div>
            <h2 className="font-bold text-sm leading-tight">Statistiche & Grafici</h2>
            <p className="text-xs opacity-80">{venues.length} venue nel filtro corrente</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <span className="text-4xl">📊</span>
            <p className="text-sm">Nessun dato disponibile</p>
          </div>
        ) : (
          <>
            {/* Pie: distribution by category */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribuzione per categoria</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v ?? 0} venue`, 'Conteggio']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </section>

            {/* Bar: count by category */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Venue per categoria</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={byCategory} margin={{ top: 0, right: 8, bottom: 0, left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${v ?? 0}`, 'Venue']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {byCategory.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Bar: capacity by region */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Capacità totale per regione (top 10)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={byRegion}
                  layout="vertical"
                  margin={{ top: 0, right: 30, bottom: 0, left: 70 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={68} />
                  <Tooltip formatter={(v) => [Number(v ?? 0).toLocaleString(), 'Posti totali']} />
                  <Bar dataKey="capacity" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Bar: avg rating by category */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Valutazione media per categoria</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={ratingByCat} margin={{ top: 0, right: 8, bottom: 0, left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v ?? 0} ★`, 'Media']} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {ratingByCat.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
