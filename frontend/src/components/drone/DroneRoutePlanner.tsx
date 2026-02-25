import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, AlertTriangle, CheckCircle, Map } from 'lucide-react';
import type {
  PlannerForm,
  PlannerResult,
  RouteLeg,
  DeliveryType,
  DroneHub,
} from '../../types/drone';
import { CATANIA_HUBS, DRONE_MODELS, WEATHER_FACTORS } from '../../data/droneData';
import { haversineDistance, fmtEur, fmtTime } from '../../utils/droneSimulation';
import { savePlan, loadPlans } from '../../lib/flightPlanStorage';

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_TYPES: { id: DeliveryType; label: string; icon: string; maxKg: number; urgencyMultiplier: number }[] = [
  { id: 'standard',      label: 'Standard',          icon: '📦', maxKg: 30, urgencyMultiplier: 1.0 },
  { id: 'express',       label: 'Express',            icon: '⚡', maxKg: 30, urgencyMultiplier: 1.3 },
  { id: 'medical',       label: 'Medicale',           icon: '🏥', maxKg: 10, urgencyMultiplier: 1.5 },
  { id: 'fragile',       label: 'Fragile',            icon: '🔮', maxKg: 15, urgencyMultiplier: 1.2 },
  { id: 'cold_chain',    label: 'Catena del Freddo',  icon: '❄️', maxKg: 20, urgencyMultiplier: 1.4 },
  { id: 'documents',     label: 'Documenti',          icon: '📄', maxKg: 2,  urgencyMultiplier: 1.1 },
  { id: 'event_supplies',label: 'Forniture Evento',   icon: '🎭', maxKg: 30, urgencyMultiplier: 1.1 },
];

const TIME_WINDOWS = [
  '06:00–09:00', '09:00–12:00', '12:00–15:00',
  '15:00–18:00', '18:00–21:00', 'Urgente (prima disponibile)',
];

const DEFAULT_FORM: PlannerForm = {
  originHubId:        'HUB-CT-01',
  waypoints:          [],
  destinationHubId:   'HUB-ACI-04',
  deliveryType:       'standard',
  payloadKg:          5,
  droneModelId:       'auto',
  weatherCondition:   'clear',
  urgencyLevel:       'standard',
  preferredTimeWindow:'09:00–12:00',
  specialNotes:       '',
};

// ─── Planner Engine ──────────────────────────────────────────────────────────

function computeRoute(form: PlannerForm): PlannerResult {
  const weather      = WEATHER_FACTORS[form.weatherCondition];
  const deliveryType = DELIVERY_TYPES.find((d) => d.id === form.deliveryType)!;

  const hubIds = [form.originHubId, ...form.waypoints.map((w) => w.hubId), form.destinationHubId];
  const hubs   = hubIds.map((id) => CATANIA_HUBS.find((h) => h.id === id)!).filter(Boolean);

  const warnings: string[] = [];
  if (form.payloadKg > deliveryType.maxKg) {
    warnings.push(`Il peso (${form.payloadKg} kg) supera il limite per "${deliveryType.label}" (max ${deliveryType.maxKg} kg).`);
  }

  const eligibleDrones = DRONE_MODELS.filter((d) => d.maxPayloadKg >= form.payloadKg);
  if (eligibleDrones.length === 0) warnings.push('Nessun drone disponibile per questo peso. Riduci il payload.');

  let drone =
    form.droneModelId === 'auto'
      ? eligibleDrones.sort((a, b) => a.costPerUnitEur - b.costPerUnitEur)[0]
      : DRONE_MODELS.find((d) => d.id === form.droneModelId) ?? eligibleDrones[0];

  if (!drone) drone = DRONE_MODELS[0];

  if (drone.maxPayloadKg < form.payloadKg) {
    warnings.push(`Il drone selezionato (${drone.name}) non supporta il payload di ${form.payloadKg} kg.`);
  }

  const legs: RouteLeg[] = [];
  for (let i = 0; i < hubs.length - 1; i++) {
    const from = hubs[i];
    const to   = hubs[i + 1];
    const distKm          = parseFloat(haversineDistance(from.coords, to.coords).toFixed(2));
    const effectiveSpeed  = drone.cruiseSpeedKmh * weather.speedFactor;
    const flightTimeMin   = parseFloat(((distKm / effectiveSpeed) * 60).toFixed(1));
    const energyCost      = parseFloat((distKm * drone.energyKwhPerKm * 0.22).toFixed(2));
    const maintenanceCost = parseFloat((distKm * drone.maintenanceCostPerKm).toFixed(2));
    const batteryStopsNeeded = Math.max(0, Math.floor(distKm / drone.maxRangeKm));

    if (distKm > drone.maxRangeKm) {
      warnings.push(`Tratta ${from.shortName}→${to.shortName}: distanza ${distKm} km supera la portata del drone (${drone.maxRangeKm} km).`);
    }

    legs.push({ fromHub: from, toHub: to, distanceKm: distKm, flightTimeMin, energyCost, maintenanceCost, batteryStopsNeeded });
  }

  const totalDistanceKm  = parseFloat(legs.reduce((s, l) => s + l.distanceKm, 0).toFixed(2));
  const totalFlightTimeMin = parseFloat(legs.reduce((s, l) => s + l.flightTimeMin, 0).toFixed(1));
  const batteryStopsTotal  = legs.reduce((s, l) => s + l.batteryStopsNeeded, 0);

  const energyCost     = parseFloat(legs.reduce((s, l) => s + l.energyCost, 0).toFixed(2));
  const maintenanceCost = parseFloat(legs.reduce((s, l) => s + l.maintenanceCost, 0).toFixed(2));
  const operatorCost   = parseFloat(((totalFlightTimeMin / 60) * 22).toFixed(2));
  const permitsCost    = form.deliveryType === 'medical' ? 8 : form.deliveryType === 'cold_chain' ? 5 : 3;
  const urgencyMult    = form.urgencyLevel === 'critical' ? 1.4 : form.urgencyLevel === 'express' ? 1.2 : 1.0;
  const typeMultiplier = deliveryType.urgencyMultiplier;
  const baseCost       = energyCost + maintenanceCost + operatorCost + permitsCost;
  const totalCostEur   = parseFloat((baseCost * urgencyMult * typeMultiplier).toFixed(2));

  const droneEnergyKwh = totalDistanceKm * drone.energyKwhPerKm;
  const droneCo2Kg     = droneEnergyKwh * 0.233;
  const vanCo2Kg       = (totalDistanceKm * 1.3 * 185) / 1000;
  const co2SavedKg     = parseFloat((vanCo2Kg - droneCo2Kg).toFixed(3));

  const successProbability = Math.round(weather.successRate * (form.urgencyLevel === 'critical' ? 0.97 : 1.0) * 100);
  const feasible = warnings.filter((w) => w.includes('supera il limite') || w.includes('non supporta')).length === 0;

  return {
    legs,
    recommendedDroneId: drone.id,
    totalDistanceKm,
    totalFlightTimeMin,
    totalCostEur,
    costBreakdown: { energy: energyCost, maintenance: maintenanceCost, operator: operatorCost, permits: permitsCost },
    successProbability,
    co2SavedKg,
    co2VsVan: parseFloat(vanCo2Kg.toFixed(3)),
    batteryStopsTotal,
    feasible,
    feasibilityWarnings: warnings,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{children}</h3>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const selectCls = 'w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onShowOnMap: (hubs: DroneHub[]) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DroneRoutePlanner({ onShowOnMap }: Props) {
  const [form, setForm]           = useState<PlannerForm>(DEFAULT_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [savedCount, setSavedCount] = useState(() => loadPlans().length);

  const result = useMemo<PlannerResult | null>(() => {
    if (!submitted) return null;
    return computeRoute(form);
  }, [form, submitted]);

  // Auto-save when a new result is computed
  useEffect(() => {
    if (!submitted || !result) return;
    savePlan(form, result);
    setSavedCount(loadPlans().length);
    setSavedToast(true);
    const t = setTimeout(() => setSavedToast(false), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, result]);

  const setField = useCallback(<K extends keyof PlannerForm>(key: K, val: PlannerForm[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setSubmitted(false);
  }, []);

  const addWaypoint = useCallback(() => {
    const used = new Set([form.originHubId, ...form.waypoints.map((w) => w.hubId), form.destinationHubId]);
    const next = CATANIA_HUBS.find((h) => !used.has(h.id));
    if (!next) return;
    setField('waypoints', [...form.waypoints, { id: crypto.randomUUID(), hubId: next.id, note: '' }]);
  }, [form, setField]);

  const updateWaypoint = useCallback((id: string, hubId: string) => {
    setForm((f) => ({ ...f, waypoints: f.waypoints.map((w) => (w.id === id ? { ...w, hubId } : w)) }));
    setSubmitted(false);
  }, []);

  const removeWaypoint = useCallback((id: string) => {
    setForm((f) => ({ ...f, waypoints: f.waypoints.filter((w) => w.id !== id) }));
    setSubmitted(false);
  }, []);

  function handleShowOnMap() {
    const ids  = [form.originHubId, ...form.waypoints.map((w) => w.hubId), form.destinationHubId];
    const hubs = ids.map((id) => CATANIA_HUBS.find((h) => h.id === id)!).filter(Boolean);
    onShowOnMap(hubs);
  }

  const selectedDrone = DRONE_MODELS.find((d) => d.id === form.droneModelId);
  const recDrone      = result ? DRONE_MODELS.find((d) => d.id === result.recommendedDroneId) : null;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Form Panel ──────────────────────────────────────────────────── */}
      <div className="w-80 shrink-0 bg-slate-900 border-r border-slate-700 overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-700 shrink-0 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">Pannello Volo</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Parametri della missione</div>
          </div>
          {savedCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
              {savedCount} salvati
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* Delivery type */}
          <div>
            <SectionTitle>Tipo di consegna</SectionTitle>
            <div className="grid grid-cols-2 gap-1.5">
              {DELIVERY_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setField('deliveryType', dt.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                    form.deliveryType === dt.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm">{dt.icon}</span>
                  <span className="leading-tight">{dt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route */}
          <div>
            <SectionTitle>Itinerario</SectionTitle>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-500 shrink-0 flex items-center justify-center text-[9px] font-bold text-white">A</span>
                <select value={form.originHubId} onChange={(e) => setField('originHubId', e.target.value)} className={selectCls}>
                  {CATANIA_HUBS.map((h) => <option key={h.id} value={h.id}>{h.shortName} — {h.type}</option>)}
                </select>
              </div>

              {form.waypoints.map((wp, idx) => (
                <div key={wp.id} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-500 shrink-0 flex items-center justify-center text-[9px] font-bold text-white">{idx + 1}</span>
                  <select value={wp.hubId} onChange={(e) => updateWaypoint(wp.id, e.target.value)} className={selectCls}>
                    {CATANIA_HUBS.map((h) => <option key={h.id} value={h.id}>{h.shortName}</option>)}
                  </select>
                  <button
                    onClick={() => removeWaypoint(wp.id)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 hover:bg-rose-900/50 border border-slate-700 hover:border-rose-500/50 transition-colors"
                  >
                    <Trash2 size={11} className="text-slate-500" />
                  </button>
                </div>
              ))}

              {form.waypoints.length < 5 && (
                <button onClick={addWaypoint} className="flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-300 transition-colors ml-6">
                  <Plus size={12} /> Aggiungi tappa intermedia
                </button>
              )}

              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500 shrink-0 flex items-center justify-center text-[9px] font-bold text-white">B</span>
                <select value={form.destinationHubId} onChange={(e) => setField('destinationHubId', e.target.value)} className={selectCls}>
                  {CATANIA_HUBS.map((h) => <option key={h.id} value={h.id}>{h.shortName} — {h.type}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Payload */}
          <div>
            <SectionTitle>Carico</SectionTitle>
            <Field label={`Peso spedizione: ${form.payloadKg} kg`}>
              <input
                type="range" min={0.1} max={30} step={0.1}
                value={form.payloadKg}
                onChange={(e) => setField('payloadKg', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600"><span>0.1 kg</span><span>30 kg</span></div>
            </Field>
          </div>

          {/* Drone */}
          <div>
            <SectionTitle>Drone</SectionTitle>
            <Field label="Modello drone">
              <select value={form.droneModelId} onChange={(e) => setField('droneModelId', e.target.value)} className={selectCls}>
                <option value="auto">🤖 Automatico (consigliato)</option>
                {DRONE_MODELS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — max {d.maxPayloadKg}kg / {d.maxRangeKm}km</option>
                ))}
              </select>
            </Field>
            {selectedDrone && form.droneModelId !== 'auto' && (
              <div className="mt-2 flex gap-3 text-[10px] text-slate-500">
                <span>Max payload: <b className="text-slate-300">{selectedDrone.maxPayloadKg} kg</b></span>
                <span>Range: <b className="text-slate-300">{selectedDrone.maxRangeKm} km</b></span>
                <span>Velocità: <b className="text-slate-300">{selectedDrone.cruiseSpeedKmh} km/h</b></span>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div>
            <SectionTitle>Condizioni operative</SectionTitle>
            <div className="space-y-2">
              <Field label="Meteo">
                <select value={form.weatherCondition} onChange={(e) => setField('weatherCondition', e.target.value as PlannerForm['weatherCondition'])} className={selectCls}>
                  <option value="clear">☀️ Sereno (99%)</option>
                  <option value="cloudy">☁️ Nuvoloso (97%)</option>
                  <option value="windy">💨 Ventoso (90%)</option>
                  <option value="light_rain">🌧️ Pioggia lieve (85%)</option>
                  <option value="heavy_rain">⛈️ Pioggia forte (60%)</option>
                </select>
              </Field>
              <Field label="Urgenza">
                <select value={form.urgencyLevel} onChange={(e) => setField('urgencyLevel', e.target.value as PlannerForm['urgencyLevel'])} className={selectCls}>
                  <option value="standard">📋 Standard</option>
                  <option value="express">⚡ Express (+20%)</option>
                  <option value="critical">🚨 Critico / Urgente (+40%)</option>
                </select>
              </Field>
              <Field label="Fascia oraria preferita">
                <select value={form.preferredTimeWindow} onChange={(e) => setField('preferredTimeWindow', e.target.value)} className={selectCls}>
                  {TIME_WINDOWS.map((tw) => <option key={tw} value={tw}>{tw}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Notes */}
          <div>
            <SectionTitle>Note speciali</SectionTitle>
            <textarea
              value={form.specialNotes}
              onChange={(e) => setField('specialNotes', e.target.value)}
              placeholder="Istruzioni particolari, requisiti specifici..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 resize-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 py-3 border-t border-slate-700 shrink-0 space-y-1.5">
          <button
            onClick={() => setSubmitted(true)}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            🚁 Pianifica Volo
          </button>
          <button
            onClick={() => { setForm(DEFAULT_FORM); setSubmitted(false); }}
            className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Reimposta
          </button>
        </div>
      </div>

      {/* ── Result Panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
        {!submitted && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-50">
            <div className="text-5xl">🗺️</div>
            <div className="text-slate-400 text-sm">
              Configura la missione nel pannello a sinistra<br />
              e premi <b className="text-slate-200">Pianifica Volo</b>
            </div>
          </div>
        )}

        {submitted && result && (
          <div className="max-w-3xl mx-auto space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-bold text-white">Piano di Volo</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                result.feasible
                  ? 'bg-green-500/20 border-green-500/40 text-green-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}>
                {result.feasible ? '✓ Fattibile' : '✗ Non fattibile'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-300">
                {DELIVERY_TYPES.find((d) => d.id === form.deliveryType)?.icon}{' '}
                {DELIVERY_TYPES.find((d) => d.id === form.deliveryType)?.label}
              </span>

              {/* Saved toast */}
              <span className={`text-xs text-green-400 flex items-center gap-1 transition-opacity duration-500 ${savedToast ? 'opacity-100' : 'opacity-0'}`}>
                <CheckCircle size={12} /> Piano salvato
              </span>

              {/* View on map */}
              <button
                onClick={handleShowOnMap}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors"
              >
                <Map size={13} />
                Vedi su Mappa
              </button>
            </div>

            {/* Warnings */}
            {result.feasibilityWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
                {result.feasibilityWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-300">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
                  </div>
                ))}
              </div>
            )}

            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Costo totale',          value: fmtEur(result.totalCostEur),                color: 'text-green-400',  sub: 'IVA esclusa' },
                { label: 'Tempo di volo',          value: fmtTime(result.totalFlightTimeMin),         color: 'text-cyan-400',   sub: `${result.totalDistanceKm} km totali` },
                { label: 'Probabilità successo',   value: `${result.successProbability}%`,            color: result.successProbability >= 90 ? 'text-green-400' : result.successProbability >= 75 ? 'text-amber-400' : 'text-rose-400', sub: WEATHER_FACTORS[form.weatherCondition].label },
                { label: 'CO₂ risparmiata',        value: `${(result.co2SavedKg * 1000).toFixed(0)} g`, color: 'text-emerald-400', sub: `vs furgone (${(result.co2VsVan * 1000).toFixed(0)} g)` },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="bg-slate-900 rounded-xl border border-slate-700 p-3">
                  <div className="text-[10px] text-slate-500 mb-1">{label}</div>
                  <div className={`text-lg font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>

            {/* Recommended drone */}
            <div className="bg-slate-900 rounded-xl border border-cyan-500/30 p-4 flex items-center gap-4">
              <div className="text-2xl shrink-0">🚁</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-500 mb-0.5">
                  {form.droneModelId === 'auto' ? 'Drone consigliato automaticamente' : 'Drone selezionato'}
                </div>
                <div className="text-sm font-bold text-white">{recDrone?.name ?? '—'}</div>
                <div className="flex gap-3 text-[10px] text-slate-400 mt-1 flex-wrap">
                  <span>Max {recDrone?.maxPayloadKg} kg</span>
                  <span>Range {recDrone?.maxRangeKm} km</span>
                  <span>{recDrone?.cruiseSpeedKmh} km/h</span>
                  <span>{recDrone?.noiseLevelDB} dB</span>
                </div>
              </div>
              {result.batteryStopsTotal > 0 ? (
                <div className="text-xs bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2.5 py-1.5 rounded-lg text-center shrink-0">
                  <div className="font-bold">{result.batteryStopsTotal}</div>
                  <div className="text-[10px]">ricarica{result.batteryStopsTotal > 1 ? 'e' : ''}</div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-400 shrink-0">
                  <CheckCircle size={13} /> Senza ricariche
                </div>
              )}
            </div>

            {/* Itinerary */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Itinerario dettagliato</h3>
              <div className="space-y-2">
                {result.legs.map((leg, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl border border-slate-700 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${i === 0 ? 'bg-green-500 text-white' : 'bg-sky-500 text-white'}`}>
                        {i === 0 ? 'A' : i}
                      </span>
                      <span className="text-xs font-semibold text-white">{leg.fromHub.shortName}</span>
                      <ChevronRight size={12} className="text-slate-600" />
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${i === result.legs.length - 1 ? 'bg-amber-500 text-white' : 'bg-sky-500 text-white'}`}>
                        {i === result.legs.length - 1 ? 'B' : i + 1}
                      </span>
                      <span className="text-xs font-semibold text-white">{leg.toHub.shortName}</span>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${leg.toHub.type === 'primary' ? 'bg-purple-500/20 text-purple-300' : leg.toHub.type === 'secondary' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                        {leg.toHub.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[10px]">
                      <div><span className="text-slate-500">Distanza</span><br /><b className="text-slate-200">{leg.distanceKm} km</b></div>
                      <div><span className="text-slate-500">Tempo volo</span><br /><b className="text-cyan-300">{fmtTime(leg.flightTimeMin)}</b></div>
                      <div><span className="text-slate-500">Costo leg</span><br /><b className="text-green-300">{fmtEur(leg.energyCost + leg.maintenanceCost)}</b></div>
                      <div><span className="text-slate-500">Ricariche</span><br /><b className={leg.batteryStopsNeeded > 0 ? 'text-amber-300' : 'text-slate-400'}>{leg.batteryStopsNeeded > 0 ? `${leg.batteryStopsNeeded} sosta` : '—'}</b></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dettaglio costi</h3>
              <div className="space-y-2">
                {[
                  { label: 'Energia (batteria)',      value: result.costBreakdown.energy,      icon: '⚡' },
                  { label: 'Manutenzione',             value: result.costBreakdown.maintenance, icon: '🔧' },
                  { label: 'Operatore drone',          value: result.costBreakdown.operator,    icon: '👨‍✈️' },
                  { label: 'Permessi & assicurazione', value: result.costBreakdown.permits,     icon: '📋' },
                ].map(({ label, value, icon }) => {
                  const base = result.costBreakdown.energy + result.costBreakdown.maintenance + result.costBreakdown.operator + result.costBreakdown.permits;
                  const pct  = base > 0 ? Math.round((value / base) * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-sm w-5 text-center">{icon}</span>
                      <span className="text-xs text-slate-400 flex-1">{label}</span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-200 font-semibold w-16 text-right">{fmtEur(value)}</span>
                    </div>
                  );
                })}
                <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Totale (inc. urgenza {form.urgencyLevel !== 'standard' ? `+${form.urgencyLevel === 'critical' ? '40' : '20'}%` : '0%'} · tipo {DELIVERY_TYPES.find((d) => d.id === form.deliveryType)?.urgencyMultiplier}x)
                  </span>
                  <span className="text-sm font-bold text-green-400">{fmtEur(result.totalCostEur)}</span>
                </div>
              </div>
            </div>

            {form.specialNotes && (
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Note: </span>{form.specialNotes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
