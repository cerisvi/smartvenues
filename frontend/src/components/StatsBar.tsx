import { Building2, Users, TrendingUp } from 'lucide-react';
import type { Stats } from '../types/venue';
import { CATEGORY_CONFIG } from '../data/categoryConfig';

interface Props {
  stats: Stats | null;
}

export default function StatsBar({ stats }: Props) {
  if (!stats) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2">
      <div className="flex items-center gap-6 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <Building2 size={14} className="opacity-80" />
          <span className="font-semibold">{stats.total}</span>
          <span className="opacity-80">venue</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Users size={14} className="opacity-80" />
          <span className="font-semibold">{stats.total_capacity.toLocaleString()}</span>
          <span className="opacity-80">posti totali</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendingUp size={14} className="opacity-80" />
          {Object.entries(stats.by_category).map(([cat, count]) => {
            const cfg = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
            return cfg ? (
              <span key={cat} className="opacity-90">
                {cfg.emoji} {count}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
