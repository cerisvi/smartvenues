import { useState, useEffect } from 'react';
import { Trash2, GitCompare, Map } from 'lucide-react';
import type { SavedFlightPlan, DroneHub } from '../../types/drone';
import { loadPlans, deletePlan, clearPlans } from '../../lib/flightPlanStorage';
import { CATANIA_HUBS, DRONE_MODELS } from '../../data/droneData';
import { fmtEur, fmtTime } from '../../utils/droneSimulation';

interface Props {
  onShowOnMap: (hubs: DroneHub[]) => void;
}

export default function FlightHistory({ onShowOnMap }: Props) {
  const [plans, setPlans]     = useState<SavedFlightPlan[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { setPlans(loadPlans()); }, []);

  const refresh = () => setPlans(loadPlans());

  function handleDelete(id: string) {
    deletePlan(id);
    setSelected((s) => s.filter((x) => x !== id));
    refresh();
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 2)  return [s[1], id];
      return [...s, id];
    });
  }

  function handleShowOnMap(plan: SavedFlightPlan) {
    const ids  = [plan.form.originHubId, ...plan.form.waypoints.map((w) => w.hubId), plan.form.destinationHubId];
    const hubs = ids.map((id) => CATANIA_HUBS.find((h) => h.id === id)!).filter(Boolean);
    onShowOnMap(hubs);
  }

  const planA = plans.find((p) => p.id === selected[0]);
  const planB = plans.find((p) => p.id === selected[1]);

  return (
    <div className="flex h-full overflow-hidden bg-slate-950">

      {/* ── Sidebar: lista piani ──────────────────────────────────────────── */}
      <div className="w-80 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-700 shrink-0 flex items-start justify-between">
          <div>
            <div className="text-sm font-bold text-white">Storico Voli</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {plans.length} {plans.length === 1 ? 'piano salvato' : 'piani salvati'} · seleziona 2 per confronto
            </div>
          </div>
          {plans.length > 0 && (
            <button
              onClick={() => { clearPlans(); setSelected([]); refresh(); }}
              className="text-[10px] text-rose-500 hover:text-rose-400 transition-colors mt-0.5"
            >
              Elimina tutto
            </button>
          )}
        </div>

        {/* Plan list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {plans.length === 0 && (
            <div className="p-8 text-center text-slate-600 text-xs">
              <div className="text-3xl mb-2">📋</div>
              Nessun piano salvato.<br />Pianifica un volo nel Pannello Volo.
            </div>
          )}

          {plans.map((plan) => {
            const isSel  = selected.includes(plan.id);
            const selIdx = selected.indexOf(plan.id);
            const drone  = DRONE_MODELS.find((d) => d.id === plan.result.recommendedDroneId);

            return (
              <div
                key={plan.id}
                onClick={() => toggleSelect(plan.id)}
                className={`p-3 cursor-pointer transition-colors select-none ${
                  isSel ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Selection badge */}
                  <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center text-[10px] font-bold mt-0.5 transition-all ${
                    isSel
                      ? selIdx === 0
                        ? 'bg-cyan-500 border-cyan-500 text-white'
                        : 'bg-violet-500 border-violet-500 text-white'
                      : 'border-slate-600'
                  }`}>
                    {isSel ? (selIdx === 0 ? 'A' : 'B') : null}
                  </div>

                  {/* Plan info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{plan.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {drone?.name ?? '—'} · {plan.result.totalDistanceKm} km
                      {plan.form.waypoints.length > 0 && ` · ${plan.form.waypoints.length} tappa${plan.form.waypoints.length > 1 ? 'e' : ''}`}
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[10px]">
                      <span className="text-green-400 font-semibold">{fmtEur(plan.result.totalCostEur)}</span>
                      <span className="text-cyan-400">{fmtTime(plan.result.totalFlightTimeMin)}</span>
                      <span className={plan.result.feasible ? 'text-green-400' : 'text-rose-400'}>
                        {plan.result.feasible ? '✓' : '✗'} {plan.result.successProbability}%
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      title="Visualizza su mappa"
                      onClick={(e) => { e.stopPropagation(); handleShowOnMap(plan); }}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 hover:bg-cyan-900/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                    >
                      <Map size={11} className="text-cyan-400" />
                    </button>
                    <button
                      title="Elimina piano"
                      onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 hover:bg-rose-900/50 border border-slate-700 hover:border-rose-500/50 transition-colors"
                    >
                      <Trash2 size={11} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Comparison panel ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected.length < 2 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
            <GitCompare size={52} className="text-slate-500" />
            <div className="text-slate-400 text-sm leading-relaxed">
              {selected.length === 0
                ? <>Seleziona <b className="text-slate-200">2 piani</b> dalla lista<br />per confrontarli fianco a fianco</>
                : <>Seleziona un <b className="text-slate-200">secondo piano</b> per il confronto</>}
            </div>
          </div>
        ) : planA && planB ? (
          <ComparisonView planA={planA} planB={planB} />
        ) : null}
      </div>
    </div>
  );
}

// ─── ComparisonView ───────────────────────────────────────────────────────────

function ComparisonView({ planA, planB }: { planA: SavedFlightPlan; planB: SavedFlightPlan }) {
  const droneA = DRONE_MODELS.find((d) => d.id === planA.result.recommendedDroneId);
  const droneB = DRONE_MODELS.find((d) => d.id === planB.result.recommendedDroneId);

  type Winner = 'a' | 'b' | 'tie' | null;

  const rows: { label: string; icon: string; a: string; b: string; winner: Winner }[] = [
    {
      label: 'Rotta',
      icon: '📍',
      a: planA.label.split(' · ')[0],
      b: planB.label.split(' · ')[0],
      winner: null,
    },
    {
      label: 'Tipo consegna',
      icon: '📦',
      a: planA.form.deliveryType,
      b: planB.form.deliveryType,
      winner: null,
    },
    {
      label: 'Drone',
      icon: '🚁',
      a: droneA?.name ?? '—',
      b: droneB?.name ?? '—',
      winner: null,
    },
    {
      label: 'Distanza totale',
      icon: '📏',
      a: `${planA.result.totalDistanceKm} km`,
      b: `${planB.result.totalDistanceKm} km`,
      winner: planA.result.totalDistanceKm < planB.result.totalDistanceKm ? 'a'
            : planA.result.totalDistanceKm > planB.result.totalDistanceKm ? 'b' : 'tie',
    },
    {
      label: 'Tempo di volo',
      icon: '⏱',
      a: fmtTime(planA.result.totalFlightTimeMin),
      b: fmtTime(planB.result.totalFlightTimeMin),
      winner: planA.result.totalFlightTimeMin < planB.result.totalFlightTimeMin ? 'a'
            : planA.result.totalFlightTimeMin > planB.result.totalFlightTimeMin ? 'b' : 'tie',
    },
    {
      label: 'Costo totale',
      icon: '💰',
      a: fmtEur(planA.result.totalCostEur),
      b: fmtEur(planB.result.totalCostEur),
      winner: planA.result.totalCostEur < planB.result.totalCostEur ? 'a'
            : planA.result.totalCostEur > planB.result.totalCostEur ? 'b' : 'tie',
    },
    {
      label: 'Costo energia',
      icon: '⚡',
      a: fmtEur(planA.result.costBreakdown.energy),
      b: fmtEur(planB.result.costBreakdown.energy),
      winner: planA.result.costBreakdown.energy < planB.result.costBreakdown.energy ? 'a'
            : planA.result.costBreakdown.energy > planB.result.costBreakdown.energy ? 'b' : 'tie',
    },
    {
      label: 'Probabilità successo',
      icon: '✅',
      a: `${planA.result.successProbability}%`,
      b: `${planB.result.successProbability}%`,
      winner: planA.result.successProbability > planB.result.successProbability ? 'a'
            : planA.result.successProbability < planB.result.successProbability ? 'b' : 'tie',
    },
    {
      label: 'CO₂ risparmiata',
      icon: '🌍',
      a: `${(planA.result.co2SavedKg * 1000).toFixed(0)} g`,
      b: `${(planB.result.co2SavedKg * 1000).toFixed(0)} g`,
      winner: planA.result.co2SavedKg > planB.result.co2SavedKg ? 'a'
            : planA.result.co2SavedKg < planB.result.co2SavedKg ? 'b' : 'tie',
    },
    {
      label: 'Soste ricarica',
      icon: '🔋',
      a: `${planA.result.batteryStopsTotal}`,
      b: `${planB.result.batteryStopsTotal}`,
      winner: planA.result.batteryStopsTotal < planB.result.batteryStopsTotal ? 'a'
            : planA.result.batteryStopsTotal > planB.result.batteryStopsTotal ? 'b' : 'tie',
    },
    {
      label: 'Fattibilità',
      icon: '🔎',
      a: planA.result.feasible ? '✓ Fattibile' : '✗ Non fattibile',
      b: planB.result.feasible ? '✓ Fattibile' : '✗ Non fattibile',
      winner: planA.result.feasible && !planB.result.feasible ? 'a'
            : !planA.result.feasible && planB.result.feasible ? 'b' : 'tie',
    },
    {
      label: 'Tappe intermedie',
      icon: '📌',
      a: `${planA.form.waypoints.length}`,
      b: `${planB.form.waypoints.length}`,
      winner: null,
    },
  ];

  // Count wins
  const winsA = rows.filter((r) => r.winner === 'a').length;
  const winsB = rows.filter((r) => r.winner === 'b').length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5 flex items-center gap-3">
        <GitCompare size={18} className="text-cyan-400" />
        <h2 className="text-base font-bold text-white">Confronto Piani di Volo</h2>
        <div className="ml-auto flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold">
            A: {winsA} vittorie
          </span>
          <span className="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 font-semibold">
            B: {winsB} vittorie
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_3fr_3fr] bg-slate-800 border-b border-slate-700">
          <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metrica</div>
          <div className="px-4 py-3 border-l border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">A</span>
              <span className="text-xs font-semibold text-white truncate">{planA.label}</span>
            </div>
          </div>
          <div className="px-4 py-3 border-l border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">B</span>
              <span className="text-xs font-semibold text-white truncate">{planB.label}</span>
            </div>
          </div>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[2fr_3fr_3fr] border-b border-slate-800 last:border-0 ${
              i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900/20'
            }`}
          >
            <div className="px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
              <span>{row.icon}</span>
              {row.label}
            </div>
            <div className={`px-4 py-3 border-l border-slate-800 text-xs font-semibold flex items-center gap-1.5 ${
              row.winner === 'a' ? 'text-green-400' : row.winner === 'tie' ? 'text-slate-300' : 'text-slate-400'
            }`}>
              {row.a}
              {row.winner === 'a' && <span className="text-[10px] text-green-500">▲</span>}
            </div>
            <div className={`px-4 py-3 border-l border-slate-800 text-xs font-semibold flex items-center gap-1.5 ${
              row.winner === 'b' ? 'text-green-400' : row.winner === 'tie' ? 'text-slate-300' : 'text-slate-400'
            }`}>
              {row.b}
              {row.winner === 'b' && <span className="text-[10px] text-green-500">▲</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
