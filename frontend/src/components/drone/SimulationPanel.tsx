import type { SimulationParams } from '../../types/drone';
import { DRONE_MODELS, CATANIA_HUBS, WEATHER_FACTORS, PRESET_SCENARIOS } from '../../data/droneData';

interface Props {
  params: SimulationParams;
  onChange: (partial: Partial<SimulationParams>) => void;
  onReset: () => void;
}

const labelClass = 'block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide';
const selectClass =
  'w-full bg-slate-700/60 border border-slate-600 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors';

export default function SimulationPanel({ params, onChange, onReset }: Props) {
  const droneMeta = DRONE_MODELS.find((d) => d.id === params.droneModelId);

  return (
    <div className="h-full overflow-y-auto bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-wide">Parametri Simulazione</h2>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          title="Reset parametri"
        >
          Reset
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">

        {/* Preset Scenarios */}
        <div>
          <label className={labelClass}>Scenari Preset</label>
          <div className="grid grid-cols-1 gap-1.5">
            {PRESET_SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => onChange(s.params)}
                className="text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-500 transition-all group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">{s.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{s.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-700" />

        {/* Drone Model */}
        <div>
          <label className={labelClass}>Modello Drone</label>
          <select
            className={selectClass}
            value={params.droneModelId}
            onChange={(e) => onChange({ droneModelId: e.target.value })}
          >
            {DRONE_MODELS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.maxPayloadKg}kg, {d.maxRangeKm}km)
              </option>
            ))}
          </select>
          {droneMeta && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {[
                { label: 'Velocità', value: `${droneMeta.cruiseSpeedKmh} km/h` },
                { label: 'Portata', value: `${droneMeta.maxPayloadKg} kg` },
                { label: 'Autonomia', value: `${droneMeta.maxRangeKm} km` },
                { label: 'Rumore', value: `${droneMeta.noiseLevelDB} dB` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800 rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-slate-500">{label}</div>
                  <div className="text-xs font-semibold text-cyan-400">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Route */}
        <div>
          <label className={labelClass}>Rotta</label>
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-400">ORIGINE</span>
              </div>
              <select
                className={selectClass}
                value={params.originHubId}
                onChange={(e) => onChange({ originHubId: e.target.value })}
              >
                {CATANIA_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.shortName} ({h.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[10px] text-slate-400">DESTINAZIONE</span>
              </div>
              <select
                className={selectClass}
                value={params.destinationHubId}
                onChange={(e) => onChange({ destinationHubId: e.target.value })}
              >
                {CATANIA_HUBS.map((h) => (
                  <option key={h.id} value={h.id} disabled={h.id === params.originHubId}>
                    {h.shortName} ({h.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payload */}
        <div>
          <div className="flex justify-between">
            <label className={labelClass}>Carico</label>
            <span className="text-xs font-bold text-cyan-400">{params.payloadKg} kg</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={droneMeta?.maxPayloadKg ?? 30}
            step={0.1}
            value={params.payloadKg}
            onChange={(e) => onChange({ payloadKg: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>0.1 kg</span>
            <span>{droneMeta?.maxPayloadKg ?? 30} kg max</span>
          </div>
        </div>

        {/* Deliveries per day */}
        <div>
          <div className="flex justify-between">
            <label className={labelClass}>Consegne/giorno</label>
            <span className="text-xs font-bold text-cyan-400">{params.deliveriesPerDay}</span>
          </div>
          <input
            type="range"
            min={1}
            max={300}
            step={1}
            value={params.deliveriesPerDay}
            onChange={(e) => onChange({ deliveriesPerDay: parseInt(e.target.value) })}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>1/giorno</span>
            <span>300/giorno</span>
          </div>
        </div>

        {/* Number of drones */}
        <div>
          <div className="flex justify-between">
            <label className={labelClass}>N° Droni</label>
            <span className="text-xs font-bold text-cyan-400">{params.numDrones}</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={params.numDrones}
            onChange={(e) => onChange({ numDrones: parseInt(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Working days */}
        <div>
          <div className="flex justify-between">
            <label className={labelClass}>Giorni Lavorativi/Anno</label>
            <span className="text-xs font-bold text-cyan-400">{params.workingDaysPerYear}</span>
          </div>
          <input
            type="range"
            min={100}
            max={365}
            step={5}
            value={params.workingDaysPerYear}
            onChange={(e) => onChange({ workingDaysPerYear: parseInt(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Years Projection */}
        <div>
          <div className="flex justify-between">
            <label className={labelClass}>Proiezione (anni)</label>
            <span className="text-xs font-bold text-cyan-400">{params.yearsProjection} anni</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={params.yearsProjection}
            onChange={(e) => onChange({ yearsProjection: parseInt(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Weather */}
        <div>
          <label className={labelClass}>Condizioni Meteo</label>
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(WEATHER_FACTORS).map(([key, wf]) => (
              <label
                key={key}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all text-sm
                  ${params.weatherCondition === key
                    ? 'bg-slate-700 border-cyan-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}
                `}
              >
                <input
                  type="radio"
                  name="weather"
                  value={key}
                  checked={params.weatherCondition === key}
                  onChange={() => onChange({ weatherCondition: key as SimulationParams['weatherCondition'] })}
                  className="sr-only"
                />
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: wf.color }} />
                <span>{wf.label}</span>
                <span className="ml-auto text-[10px] text-slate-500">{Math.round(wf.successRate * 100)}% up</span>
              </label>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className={labelClass}>Urgenza Consegna</label>
          <select
            className={selectClass}
            value={params.urgencyLevel}
            onChange={(e) => onChange({ urgencyLevel: e.target.value as SimulationParams['urgencyLevel'] })}
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="critical">Critico (medico/emergenza)</option>
          </select>
        </div>

        {/* Electricity source */}
        <div>
          <label className={labelClass}>Fonte Elettricità</label>
          <select
            className={selectClass}
            value={params.electricitySource}
            onChange={(e) => onChange({ electricitySource: e.target.value as SimulationParams['electricitySource'] })}
          >
            <option value="grid">Rete Nazionale (232 gCO₂/kWh)</option>
            <option value="mixed">Misto 50% Rinnovabile (120 g)</option>
            <option value="renewable">100% Rinnovabile (22 g)</option>
          </select>
        </div>

        {/* Comparison vehicle */}
        <div>
          <label className={labelClass}>Veicolo di Confronto</label>
          <select
            className={selectClass}
            value={params.comparisonVehicle}
            onChange={(e) => onChange({ comparisonVehicle: e.target.value as SimulationParams['comparisonVehicle'] })}
          >
            <option value="van">Furgone (&lt; 3.5t)</option>
            <option value="truck">Camion (&gt; 3.5t)</option>
            <option value="moto_courier">Corriere Motociclo</option>
            <option value="cargo_bike">Cargo Bike Elettrica</option>
          </select>
        </div>

      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-slate-700 text-[10px] text-slate-500 bg-slate-800/30">
        I calcoli si aggiornano in tempo reale. Dati basati su benchmark industriali 2024/25.
      </div>
    </div>
  );
}
