import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Building2, Users, BarChart2, TrendingUp } from 'lucide-react';
import type { VenueFeature, Stats } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

interface RegionStat {
  region: string;
  count: number;
  capacity: number;
}

interface CategoryStat {
  name: string;
  count: number;
  capacity: number;
  color: string;
}

export default function AnalyticsDashboard() {
  const [venues, setVenues] = useState<VenueFeature[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get<{ type: string; features: VenueFeature[] }>('/api/venues'),
      axios.get<Stats>('/api/stats'),
    ])
      .then(([venuesRes, statsRes]) => {
        setVenues(venuesRes.data.features);
        setStats(statsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Caricamento analytics…</p>
        </div>
      </div>
    );
  }

  // Build category stats
  const categoryStats: CategoryStat[] = Object.entries(stats?.by_category ?? {}).map(([key, count]) => {
    const cfg = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];
    const totalCap = venues
      .filter((v) => v.properties.category === key)
      .reduce((s, v) => s + v.properties.capacity, 0);
    return {
      name: cfg?.label ?? key,
      count,
      capacity: totalCap,
      color: cfg?.color ?? '#6366f1',
    };
  });

  // Build region stats
  const regionMap: Record<string, RegionStat> = {};
  venues.forEach((v) => {
    const r = v.properties.region;
    if (!regionMap[r]) regionMap[r] = { region: r, count: 0, capacity: 0 };
    regionMap[r].count += 1;
    regionMap[r].capacity += v.properties.capacity;
  });
  const regionStats = Object.values(regionMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Rating distribution
  const ratingBuckets = [
    { label: '4.5–5.0', min: 4.5, max: 5.0 },
    { label: '4.0–4.5', min: 4.0, max: 4.5 },
    { label: '3.5–4.0', min: 3.5, max: 4.0 },
    { label: '< 3.5',   min: 0,   max: 3.5 },
  ].map((b) => ({
    label: b.label,
    count: venues.filter((v) => v.properties.rating >= b.min && v.properties.rating < b.max).length,
  }));

  const avgRating = venues.length
    ? (venues.reduce((s, v) => s + v.properties.rating, 0) / venues.length).toFixed(2)
    : '—';

  return (
    <div className="h-full overflow-y-auto bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="flex items-center gap-2 mb-0.5">
          <BarChart2 size={18} className="text-violet-400" />
          <h1 className="text-base font-bold text-white">Analytics Dashboard</h1>
        </div>
        <p className="text-xs text-slate-400">
          Panoramica statistica delle venue registrate nel sistema Fulcrum Smart Venues
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            icon={<Building2 size={18} className="text-blue-400" />}
            label="Venue totali"
            value={stats?.total ?? 0}
            color="border-blue-500/30 bg-blue-500/5"
          />
          <KpiCard
            icon={<Users size={18} className="text-emerald-400" />}
            label="Capienza totale"
            value={(stats?.total_capacity ?? 0).toLocaleString('it-IT')}
            color="border-emerald-500/30 bg-emerald-500/5"
          />
          <KpiCard
            icon={<TrendingUp size={18} className="text-amber-400" />}
            label="Rating medio"
            value={avgRating}
            color="border-amber-500/30 bg-amber-500/5"
          />
          <KpiCard
            icon={<BarChart2 size={18} className="text-violet-400" />}
            label="Regioni coperte"
            value={regionStats.length}
            color="border-violet-500/30 bg-violet-500/5"
          />
        </div>

        {/* Row: Category pie + bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie chart – category count */}
          <ChartCard title="Venue per categoria" subtitle="Distribuzione percentuale">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {categoryStats.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bar chart – category capacity */}
          <ChartCard title="Capienza per categoria" subtitle="Numero totale di posti">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryStats} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number | string) => {
                    const n = Number(v);
                    return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
                  }}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                  formatter={(v: number | string | undefined) => Number(v ?? 0).toLocaleString('it-IT')}
                />
                <Bar dataKey="capacity" name="Capienza" radius={[6, 6, 0, 0]}>
                  {categoryStats.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row: Region bar chart */}
        <ChartCard title="Top 10 regioni per numero di venue" subtitle="Venue registrate per regione">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regionStats} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="region"
                width={110}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="count" name="Venue" radius={[0, 6, 6, 0]}>
                {regionStats.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row: Rating distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Distribuzione rating" subtitle="Numero di venue per fascia di valutazione">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingBuckets} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="count" name="Venue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top venue by capacity table */}
          <ChartCard title="Top 5 venue per capienza" subtitle="Venue con maggiore capienza">
            <div className="space-y-2 mt-2">
              {[...venues]
                .sort((a, b) => b.properties.capacity - a.properties.capacity)
                .slice(0, 5)
                .map((v, i) => {
                  const cfg = CATEGORY_CONFIG[v.properties.category];
                  return (
                    <div key={v.properties.id} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-4 shrink-0">{i + 1}</span>
                      <span className="text-base shrink-0">{cfg?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{v.properties.name}</div>
                        <div className="text-[10px] text-slate-500">{v.properties.city}</div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400 shrink-0">
                        {v.properties.capacity.toLocaleString('it-IT')}
                      </span>
                    </div>
                  );
                })}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="mb-2">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({
  title, subtitle, children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
