import { useState, useCallback, useMemo } from 'react';
import DroneMap from './DroneMap';
import SimulationPanel from './SimulationPanel';
import KPICards from './KPICards';
import AnalyticsCharts from './AnalyticsCharts';
import ReportView from './ReportView';
import DroneRoutePlanner from './DroneRoutePlanner';
import type { SimulationParams, DashboardTab } from '../../types/drone';
import { DEFAULT_PARAMS } from '../../data/droneData';
import { runSimulation } from '../../utils/droneSimulation';

const TABS: { id: DashboardTab; label: string; icon: string }[] = [
  { id: 'map',        label: 'Mappa & Rotte',   icon: '🗺️' },
  { id: 'simulation', label: 'Simulazione',      icon: '⚙️' },
  { id: 'analytics',  label: 'Analytics',        icon: '📊' },
  { id: 'report',     label: 'Report',           icon: '📋' },
  { id: 'planner',    label: 'Preventivo Rotta', icon: '📦' },
];

export default function DroneDashboard() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [activeTab, setActiveTab] = useState<DashboardTab>('map');
  const [animating, setAnimating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const result = useMemo(() => runSimulation(params), [params]);

  const handleParamChange = useCallback((partial: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setAnimating(false);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">

      {/* ── Top nav bar ───────────────────────────────────────────────────── */}
      <header className="flex items-center gap-0 bg-slate-900 border-b border-slate-700 shrink-0 z-20">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-r border-slate-700 shrink-0">
          <span className="text-xl">🚁</span>
          <div className="leading-none">
            <div className="text-xs font-bold text-white">Drone Logistics</div>
            <div className="text-[10px] text-slate-500">Smart Venues · Prov. Catania</div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center flex-1 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2
                ${activeTab === tab.id
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'}
              `}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Route summary badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 border-l border-slate-700 shrink-0">
          <div className="text-xs text-slate-500">Rotta attiva:</div>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-slate-300">{params.originHubId.replace('HUB-', '')}</span>
            <span className="text-slate-600 mx-0.5">→</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-300">{params.destinationHubId.replace('HUB-', '')}</span>
          </div>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <div className="text-xs">
            <span className="text-green-400 font-bold">{result.route.straightDistanceKm}km</span>
            <span className="text-slate-600 mx-1">·</span>
            <span className="text-cyan-400 font-bold">{result.route.droneFlightTimeMin}min</span>
          </div>
        </div>

        {/* Sidebar toggle */}
        {(activeTab === 'map' || activeTab === 'simulation') && activeTab !== 'planner' && (
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="px-3 py-3 text-slate-400 hover:text-white hover:bg-slate-800 border-l border-slate-700 text-sm transition-colors"
            title={sidebarOpen ? 'Chiudi pannello' : 'Apri pannello'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar (simulation params) — shown for map and simulation tabs */}
        {(activeTab === 'map' || activeTab === 'simulation') && activeTab !== 'planner' && sidebarOpen && (
          <div className="w-72 shrink-0 overflow-hidden">
            <SimulationPanel
              params={params}
              onChange={handleParamChange}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'map' && (
            <div className="flex-1 overflow-hidden">
              <DroneMap
                params={params}
                result={result}
                animating={animating}
                onAnimateToggle={() => setAnimating((a) => !a)}
              />
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
              <SimulationOverview result={result} params={params} onParamChange={handleParamChange} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="flex-1 overflow-hidden">
              <AnalyticsCharts result={result} />
            </div>
          )}

          {activeTab === 'report' && (
            <div className="flex-1 overflow-hidden">
              <ReportView result={result} />
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="flex-1 overflow-hidden">
              <DroneRoutePlanner />
            </div>
          )}

          {/* ── KPI bar (always visible on map/simulation/analytics tabs) ── */}
          {activeTab !== 'report' && activeTab !== 'planner' && (
            <KPICards result={result} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Simulation Overview Sub-view ─────────────────────────────────────────────

import { DRONE_MODELS, CATANIA_HUBS, VEHICLE_BENCHMARKS } from '../../data/droneData';
import { fmtEur, fmtTime } from '../../utils/droneSimulation';
import type { SimulationResult } from '../../types/drone';

interface OverviewProps {
  result: SimulationResult;
  params: SimulationParams;
  onParamChange: (p: Partial<SimulationParams>) => void;
}

function SimulationOverview({ result }: OverviewProps) {
  const { route, costs, environment, traffic, financial, social, operational } = result;
  const drone = DRONE_MODELS.find((d) => d.id === result.params.droneModelId)!;
  const origin = CATANIA_HUBS.find((h) => h.id === result.params.originHubId)!;
  const dest = CATANIA_HUBS.find((h) => h.id === result.params.destinationHubId)!;
  const vehicle = VEHICLE_BENCHMARKS[result.params.comparisonVehicle];

  const blocks = [
    {
      title: 'Rotta',
      icon: '📍',
      color: 'border-cyan-500/30 bg-cyan-500/5',
      items: [
        { label: 'Da → A', value: `${origin.shortName} → ${dest.shortName}` },
        { label: 'Distanza volo', value: `${route.straightDistanceKm} km` },
        { label: 'Distanza stradale equiv.', value: `${route.roadDistanceKm} km` },
        { label: 'Tempo drone', value: fmtTime(route.droneFlightTimeMin), highlight: true },
        { label: `Tempo ${vehicle.label}`, value: fmtTime(route.truckRoadTimeMin) },
        { label: 'Risparmio tempo', value: `−${route.timeSavingMin} min (${route.timeSavingPercent}%)`, green: true },
      ],
    },
    {
      title: 'Costi Logistici',
      icon: '💰',
      color: 'border-green-500/30 bg-green-500/5',
      items: [
        { label: 'Costo/consegna drone', value: fmtEur(costs.droneCostPerDelivery), highlight: true },
        { label: `Costo/consegna ${vehicle.label}`, value: fmtEur(costs.vehicleCostPerDelivery) },
        { label: 'Risparmio/consegna', value: fmtEur(costs.savingsPerDelivery), green: costs.savingsPerDelivery > 0 },
        { label: 'Risparmio %', value: `${costs.savingsPercent > 0 ? '+' : ''}${costs.savingsPercent}%`, green: costs.savingsPercent > 0 },
        { label: 'Risparmio annuale', value: fmtEur(costs.annualSavings), green: costs.annualSavings > 0 },
        { label: 'Energia/consegna', value: `${environment.droneEnergyKwhPerDelivery} kWh` },
      ],
    },
    {
      title: 'Impatto Ambientale',
      icon: '🌍',
      color: 'border-emerald-500/30 bg-emerald-500/5',
      items: [
        { label: 'CO₂ drone/consegna', value: `${(environment.droneCo2PerDeliveryKg * 1000).toFixed(0)}g`, highlight: true },
        { label: `CO₂ ${vehicle.label}/consegna`, value: `${(environment.vehicleCo2PerDeliveryKg * 1000).toFixed(0)}g` },
        { label: 'CO₂ risparmiata', value: `−${environment.co2SavingPercent}%`, green: true },
        { label: 'CO₂ risparmiata/anno', value: `${environment.annualCo2SavingTons.toFixed(2)} t`, green: true },
        { label: 'Riduzione rumore', value: `−${environment.noiseReductionDB} dB` },
        { label: 'Alberi equiv./anno', value: `🌳 ${environment.equivalentTreesPlanted}`, green: true },
      ],
    },
    {
      title: 'Riduzione Traffico',
      icon: '🚗',
      color: 'border-amber-500/30 bg-amber-500/5',
      items: [
        { label: 'Veicoli rimossi/giorno', value: `${traffic.vehiclesRemovedPerDay}`, highlight: true },
        { label: 'Veicoli rimossi/anno', value: traffic.vehiclesRemovedPerYear.toLocaleString(), green: true },
        { label: 'Riduzione congestione', value: `${traffic.congestionReductionPercent}%` },
        { label: 'Parcheggi liberati/anno', value: traffic.parkingSpacesSavedPerYear.toLocaleString() },
        { label: 'Riduz. rischio incidenti', value: `${traffic.accidentRiskReductionPercent}%` },
        { label: 'Score mobilità urbana', value: `+${traffic.urbanMobilityScoreImprovement}` },
      ],
    },
    {
      title: 'Analisi Finanziaria',
      icon: '📈',
      color: 'border-purple-500/30 bg-purple-500/5',
      items: [
        { label: 'Investimento iniziale', value: fmtEur(financial.initialInvestmentEur) },
        { label: 'Payback period', value: `${financial.paybackPeriodYears} anni`, highlight: true },
        { label: 'ROI 5 anni', value: `${financial.roi5Years > 0 ? '+' : ''}${financial.roi5Years}%`, green: financial.roi5Years > 0 },
        { label: 'NPV 10 anni', value: fmtEur(financial.npv10Years), green: financial.npv10Years > 0 },
        { label: 'IRR stimato', value: `${financial.irr.toFixed(1)}%` },
        { label: 'Crediti carbone/anno', value: fmtEur(financial.carbonCreditValueEur), green: true },
      ],
    },
    {
      title: 'Operativo & Sociale',
      icon: '⚙️',
      color: 'border-indigo-500/30 bg-indigo-500/5',
      items: [
        { label: 'Utilizzo flotta', value: `${operational.fleetUtilizationPercent}%`, highlight: true },
        { label: 'Cons./drone/giorno', value: `${operational.deliveriesPerDronePerDay}` },
        { label: 'Uptime', value: `${operational.uptimePercent}%` },
        { label: 'Posti lavoro creati', value: `${social.jobsCreatedDirect + social.jobsCreatedIndirect}`, green: true },
        { label: 'Inclusività territ.', value: `${social.territorialInclusivityScore}%` },
        { label: 'Smart Venues integraz.', value: `${social.smartVenuesIntegrationScore}%` },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="text-lg font-bold text-white">
          Risultati Simulazione — {drone.name}
        </div>
        <div className="flex gap-2">
          {[
            { label: `Sostenibilità: ${result.overallSustainabilityScore}/100`, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
            { label: `Efficienza: ${result.overallEfficiencyScore}/100`, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
          ].map(({ label, color }) => (
            <span key={label} className={`text-xs px-2.5 py-1 rounded-full border ${color}`}>{label}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {blocks.map((block) => (
          <div key={block.title} className={`rounded-xl border p-4 ${block.color}`}>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span>{block.icon}</span> {block.title}
            </h3>
            <div className="space-y-2">
              {block.items.map(({ label, value, highlight, green }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-semibold ${highlight ? 'text-white' : green ? 'text-green-400' : 'text-slate-200'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
