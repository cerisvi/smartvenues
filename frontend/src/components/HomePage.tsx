import { Map, BarChart2, Plane, Plus, Building2, Users, Star, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import type { Stats } from '../types/venue';
import type { AppMode } from './TopNav';

interface Props {
  stats: Stats | null;
  onNavigate: (mode: AppMode) => void;
}

interface ModuleCard {
  id: AppMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
}

const MODULES: ModuleCard[] = [
  {
    id: 'venues',
    title: 'Mappa Venue',
    description: 'Esplora e cerca venue italiane su mappa interattiva. Filtra per categoria, regione e capienza.',
    icon: <Map size={28} />,
    gradient: 'from-blue-600 to-indigo-700',
    badge: 'WebGIS',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Dashboard con statistiche e grafici: distribuzione per categoria, regione e capienza.',
    icon: <BarChart2 size={28} />,
    gradient: 'from-violet-600 to-purple-700',
    badge: 'BI',
  },
  {
    id: 'drone',
    title: 'Drone Logistics',
    description: 'Rete di hub logistici con droni per la Provincia di Catania. Simulatore di rotte e costi.',
    icon: <Plane size={28} />,
    gradient: 'from-cyan-600 to-teal-700',
    badge: 'Smart Mobility',
  },
  {
    id: 'add-venue',
    title: 'Aggiungi Venue',
    description: 'Registra una nuova venue nel sistema: informazioni, posizione, servizi e contatti.',
    icon: <Plus size={28} />,
    gradient: 'from-emerald-600 to-green-700',
    badge: 'Gestione',
  },
];

export default function HomePage({ stats, onNavigate }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <span className="text-white font-black text-base leading-none">F</span>
            </div>
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Fulcrum Smart Venues</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            Gestisci e valorizza<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">le venue italiane</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl leading-relaxed mb-8">
            Piattaforma integrata per la scoperta, analisi e gestione di venue congressuali, fieristiche, sportive e di intrattenimento in tutta Italia.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('venues')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/40"
            >
              <Map size={16} />
              Apri mappa
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <BarChart2 size={16} />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={<Building2 size={20} className="text-blue-400" />}
              label="Venue totali"
              value={stats.total}
              bg="bg-blue-500/10 border-blue-500/20"
            />
            <StatCard
              icon={<Users size={20} className="text-emerald-400" />}
              label="Posti totali"
              value={stats.total_capacity.toLocaleString('it-IT')}
              bg="bg-emerald-500/10 border-emerald-500/20"
            />
            <StatCard
              icon={<Star size={20} className="text-amber-400" />}
              label="Categorie"
              value={Object.keys(stats.by_category).length}
              bg="bg-amber-500/10 border-amber-500/20"
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-violet-400" />}
              label="Media per venue"
              value={Math.round(stats.total_capacity / Math.max(stats.total, 1)).toLocaleString('it-IT')}
              bg="bg-violet-500/10 border-violet-500/20"
            />
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Moduli piattaforma</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className="group text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 transition-all hover:bg-slate-800/60 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                  {mod.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{mod.title}</h3>
                    {mod.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-400">
                        {mod.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer brand */}
      <div className="border-t border-slate-800 py-5 px-6 text-center">
        <p className="text-xs text-slate-600">
          Fulcrum Smart Venues · Portale WebGIS per la valorizzazione delle venue italiane
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
