import { Home, Map, BarChart2, Plane, Plus, ClipboardList } from 'lucide-react';

export type AppMode =
  | 'home'
  | 'venues'
  | 'analytics'
  | 'drone'
  | 'add-venue'
  | 'my-requests'
  | 'edit-venue'; // internal, not shown in nav

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  requestCount?: number;
}

const NAV_ITEMS: { id: AppMode; label: string; icon: React.ReactNode }[] = [
  { id: 'home',         label: 'Home',             icon: <Home size={14} /> },
  { id: 'venues',       label: 'Mappa Venue',       icon: <Map size={14} /> },
  { id: 'analytics',    label: 'Analytics',         icon: <BarChart2 size={14} /> },
  { id: 'drone',        label: 'Drone Logistics',   icon: <Plane size={14} /> },
  { id: 'add-venue',    label: 'Aggiungi Venue',    icon: <Plus size={14} /> },
  { id: 'my-requests',  label: 'Le mie richieste',  icon: <ClipboardList size={14} /> },
];

export default function TopNav({ mode, onModeChange, requestCount = 0 }: Props) {
  return (
    <nav className="shrink-0 flex items-center gap-0 px-4 bg-slate-950 border-b border-slate-800 h-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-6">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-900/40">
          <span className="text-white font-black text-sm leading-none">F</span>
        </div>
        <div className="leading-tight">
          <span className="text-white font-bold text-sm">Fulcrum</span>
          <span className="text-blue-400 font-semibold text-sm"> Smart Venues</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700 mr-4" />

      {/* Nav items */}
      <div className="flex items-center gap-0.5 flex-1">
        {NAV_ITEMS.map(({ id, label, icon }) => {
          const active = mode === id;
          const showBadge = id === 'my-requests' && requestCount > 0;
          return (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
              {showBadge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {requestCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live badge */}
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-slate-400">Live</span>
      </div>
    </nav>
  );
}
