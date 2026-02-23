import type { SimulationResult } from '../../types/drone';
import { fmtEur, fmtTime, fmtCo2 } from '../../utils/droneSimulation';

interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: 'green' | 'cyan' | 'amber' | 'purple' | 'rose' | 'indigo';
  trend?: 'up' | 'down' | 'neutral';
}

const colorMap = {
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-300' },
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-400',   badge: 'bg-cyan-500/20 text-cyan-300' },
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400',   badge: 'bg-rose-500/20 text-rose-300' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
};

function KPICard({ icon, label, value, sub, color, trend }: KPICardProps) {
  const c = colorMap[color];
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : '';
  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-3 flex flex-col gap-1 min-w-0`}>
      <div className="flex items-center gap-1.5">
        <span className="text-lg leading-none">{icon}</span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide truncate">{label}</span>
      </div>
      <div className={`text-xl font-bold ${c.text} leading-tight truncate`}>
        {value}
        {trendIcon && <span className={`ml-1 text-sm ${trendColor}`}>{trendIcon}</span>}
      </div>
      <div className="text-[10px] text-slate-500 truncate">{sub}</div>
    </div>
  );
}

interface ScoreGaugeProps {
  label: string;
  value: number;
  color: string;
}

function ScoreGauge({ label, value, color }: ScoreGaugeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${value * 0.879} 87.9`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 text-center">{label}</span>
    </div>
  );
}

interface Props {
  result: SimulationResult;
}

export default function KPICards({ result }: Props) {
  const { route, costs, environment, traffic, operational, financial, social } = result;

  return (
    <div className="bg-slate-900 border-t border-slate-700 p-3">
      {/* Main KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-3">
        <KPICard
          icon="💰"
          label="Risparmio/consegna"
          value={fmtEur(costs.savingsPerDelivery)}
          sub={`${costs.savingsPercent > 0 ? '+' : ''}${costs.savingsPercent}% vs veicolo`}
          color="green"
          trend={costs.savingsPerDelivery > 0 ? 'down' : 'up'}
        />
        <KPICard
          icon="🌍"
          label="CO₂ risparmiata"
          value={fmtCo2(environment.co2SavingPerDeliveryKg)}
          sub={`−${environment.co2SavingPercent}% per consegna`}
          color="green"
          trend="down"
        />
        <KPICard
          icon="⏱️"
          label="Tempo risparmiato"
          value={`${route.timeSavingMin} min`}
          sub={`Drone: ${fmtTime(route.droneFlightTimeMin)}`}
          color="cyan"
          trend="down"
        />
        <KPICard
          icon="🚗"
          label="Veicoli rimossi"
          value={`${traffic.vehiclesRemovedPerDay}/giorno`}
          sub={`${traffic.congestionReductionPercent}% meno traffico`}
          color="amber"
          trend="down"
        />
        <KPICard
          icon="📊"
          label="ROI 5 anni"
          value={`${financial.roi5Years > 0 ? '+' : ''}${financial.roi5Years}%`}
          sub={`Payback: ${financial.paybackPeriodYears} anni`}
          color={financial.roi5Years > 0 ? 'green' : 'rose'}
        />
        <KPICard
          icon="🔊"
          label="Riduzione Rumore"
          value={`−${environment.noiseReductionDB} dB`}
          sub={`Drone: ${result.params.droneModelId === 'dji-flycart30' ? '68' : '55-65'} dB`}
          color="purple"
          trend="down"
        />
        <KPICard
          icon="🌱"
          label="Alberi equiv./anno"
          value={`${environment.equivalentTreesPlanted}`}
          sub={`${environment.annualCo2SavingTons.toFixed(1)} t CO₂/anno`}
          color="green"
        />
        <KPICard
          icon="💼"
          label="Posti di lavoro"
          value={`${social.jobsCreatedDirect + social.jobsCreatedIndirect}`}
          sub={`${social.jobsCreatedDirect} diretti, ${social.jobsCreatedIndirect} indiretti`}
          color="indigo"
        />
      </div>

      {/* Secondary metrics + scores */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Additional metrics pills */}
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { label: 'Distanza volo', value: `${route.straightDistanceKm} km` },
            { label: 'Autonomia flotta', value: `${operational.fleetUtilizationPercent}%` },
            { label: 'Consegne/drone/giorno', value: `${operational.deliveriesPerDronePerDay}` },
            { label: 'Energia/giorno', value: `${operational.energyConsumptionKwhPerDay} kWh` },
            { label: 'Uptime', value: `${operational.uptimePercent}%` },
            { label: 'Copertura', value: `${operational.coverageRadiusKm} km raggio` },
            { label: 'NOx risparmiato', value: `${environment.noxSavingGPerDelivery}g/cons.` },
            { label: 'Crediti carbone', value: fmtEur(financial.carbonCreditValueEur) + '/anno' },
            { label: 'Parcheggi liberati', value: `${traffic.parkingSpacesSavedPerYear.toLocaleString()}/anno` },
            { label: 'NPV 10 anni', value: fmtEur(financial.npv10Years) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500">{label}: </span>
              <span className="text-slate-200 font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Score gauges */}
        <div className="flex gap-4 flex-shrink-0">
          <ScoreGauge label="Sostenibilità" value={result.overallSustainabilityScore} color="#22c55e" />
          <ScoreGauge label="Efficienza" value={result.overallEfficiencyScore} color="#06b6d4" />
          <ScoreGauge label="Inclusività" value={social.territorialInclusivityScore} color="#a855f7" />
          <ScoreGauge label="Smart Venues" value={social.smartVenuesIntegrationScore} color="#f59e0b" />
        </div>
      </div>
    </div>
  );
}
