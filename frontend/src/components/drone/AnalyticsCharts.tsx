import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
} from 'recharts';
import type { SimulationResult } from '../../types/drone';
import { buildYearlyProjections, buildRadarData, fmtEur } from '../../utils/droneSimulation';

const COLORS = {
  drone: '#06b6d4',
  vehicle: '#f59e0b',
  savings: '#22c55e',
  co2: '#10b981',
  loss: '#ef4444',
  purple: '#a855f7',
};

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

const axisStyle = { fill: '#64748b', fontSize: 11 };

// Recharts formatter accepts value: number | undefined
type TooltipFormatter = (v: number | undefined) => [string, string];

const euroFmt: TooltipFormatter = (v) => [`€${(v ?? 0).toFixed(2)}`, ''];
const timeFmt: TooltipFormatter = (v) => [`${v ?? 0} min`, 'Tempo'];
const co2Fmt: TooltipFormatter = (v) => [`${(v ?? 0).toFixed(1)}g CO₂`, 'Emissioni'];
const savingsFmt: TooltipFormatter = (v) => [`${(v ?? 0).toFixed(1)} t CO₂`, 'Risparmiata'];
const pctFmt: TooltipFormatter = (v) => [`${v ?? 0}%`, 'Score'];
const kFmt: TooltipFormatter = (v) => [`€${v ?? 0}k`, ''];

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
}

function ChartCard({ title, subtitle, children, height = 240 }: ChartCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}

interface Props {
  result: SimulationResult;
}

export default function AnalyticsCharts({ result }: Props) {
  const { costs, environment, traffic, financial } = result;
  const yearly = buildYearlyProjections(result);
  const radarData = buildRadarData(result);

  // ── Cost comparison data ────────────────────────────────────────────────
  const costBreakdownData = [
    { name: 'Drone', ...costs.droneBreakdown },
    {
      name: result.params.comparisonVehicle === 'van' ? 'Furgone' :
            result.params.comparisonVehicle === 'truck' ? 'Camion' :
            result.params.comparisonVehicle === 'moto_courier' ? 'Moto' : 'Cargo Bike',
      energy: costs.vehicleBreakdown.fuel,
      maintenance: costs.vehicleBreakdown.maintenance,
      operator: costs.vehicleBreakdown.driver,
      amortization: costs.vehicleBreakdown.insurance,
      permits: costs.vehicleBreakdown.parking,
    },
  ];

  // ── CO2 comparison data ─────────────────────────────────────────────────
  const co2Data = [
    { label: 'Drone', value: Math.round(environment.droneCo2PerDeliveryKg * 1000) },
    { label: 'Veicolo', value: Math.round(environment.vehicleCo2PerDeliveryKg * 1000) },
  ];

  // ── Delivery time comparison ─────────────────────────────────────────────
  const timeData = [
    { name: 'Drone', min: result.route.droneFlightTimeMin, fill: COLORS.drone },
    { name: 'Veicolo', min: result.route.truckRoadTimeMin, fill: COLORS.vehicle },
  ];

  // ── Environmental multi-metrics ─────────────────────────────────────────
  const envData = [
    { name: 'CO₂ (g)', drone: Math.round(environment.droneCo2PerDeliveryKg * 1000), vehicle: Math.round(environment.vehicleCo2PerDeliveryKg * 1000) },
    { name: 'NOx (mg)', drone: 5, vehicle: Math.round(environment.noxSavingGPerDelivery * 100 + 5) },
    { name: 'Rumore (dB)', drone: result.params.droneModelId === 'dji-flycart30' ? 68 : 58, vehicle: 75 },
    { name: 'Energia (Wh)', drone: Math.round(result.operational.energyConsumptionKwhPerDay / result.params.deliveriesPerDay * 1000), vehicle: Math.round(environment.vehicleCo2PerDeliveryKg * 3.5 * 1000 / 185) },
  ];

  // ── Operational efficiency data ─────────────────────────────────────────
  const operData = [
    { name: 'Utilizzo flotta', value: result.operational.fleetUtilizationPercent },
    { name: 'Uptime', value: result.operational.uptimePercent },
    { name: 'Qualità servizio', value: result.social.serviceQualityScore },
    { name: 'Inclusività terr.', value: result.social.territorialInclusivityScore },
    { name: 'Integr. SmartVenues', value: result.social.smartVenuesIntegrationScore },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-900 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* 1. Cost breakdown comparison */}
        <ChartCard
          title="Analisi Costi per Consegna"
          subtitle="Confronto drone vs veicolo con breakdown componenti (€)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costBreakdownData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `€${(v as number).toFixed(1)}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={euroFmt} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="energy" stackId="a" name="Energia/Carburante" fill="#06b6d4" />
              <Bar dataKey="maintenance" stackId="a" name="Manutenzione" fill="#0284c7" />
              <Bar dataKey="amortization" stackId="a" name="Ammort./Assicur." fill="#0369a1" />
              <Bar dataKey="operator" stackId="a" name="Operatore/Autista" fill="#1d4ed8" />
              <Bar dataKey="permits" stackId="a" name="Permessi/Parcheggio" fill="#4338ca" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. CO2 comparison bar */}
        <ChartCard
          title="Impatto Ambientale CO₂"
          subtitle="Emissioni per consegna (grammi) — confronto diretto"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={co2Data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={axisStyle} tickFormatter={(v) => `${v}g`} />
              <YAxis type="category" dataKey="label" tick={axisStyle} width={60} />
              <Tooltip contentStyle={tooltipStyle} formatter={co2Fmt} />
              <Bar dataKey="value">
                {co2Data.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? COLORS.co2 : COLORS.vehicle} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Time comparison */}
        <ChartCard
          title="Tempo di Consegna"
          subtitle="Confronto tempi totali (min) incluso carico/scarico"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `${v}m`} />
              <Tooltip contentStyle={tooltipStyle} formatter={timeFmt} />
              <Bar dataKey="min" name="Minuti">
                {timeData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. ROI projection (cumulative savings) */}
        <ChartCard
          title="Proiezione ROI e Risparmi Cumulativi"
          subtitle={`Proiezione ${result.params.yearsProjection} anni (€ migliaia) — inclusi crediti carbone`}
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yearly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" tick={axisStyle} tickFormatter={(v) => `Anno ${v}`} />
              <YAxis yAxisId="left" tick={axisStyle} tickFormatter={(v) => `€${v}k`} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number | undefined, name: string | undefined) =>
                  (name ?? '') === 'ROI %' ? [`${v ?? 0}%`, name ?? ''] : [`€${v ?? 0}k`, name ?? '']
                }
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar yAxisId="left" dataKey="savings" name="Risparmio annuo (k€)" fill={COLORS.savings} opacity={0.7} />
              <Line yAxisId="left" type="monotone" dataKey="cumulativeSavings" name="Cumul. (k€)" stroke={COLORS.drone} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="roiPercent" name="ROI %" stroke={COLORS.purple} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Environmental multi-metrics */}
        <ChartCard
          title="Confronto Impatti Ambientali"
          subtitle="CO₂, NOx, Rumore, Energia — drone vs veicolo (normalizzati)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={envData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ ...axisStyle, fontSize: 10 }} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="drone" name="Drone" fill={COLORS.drone} />
              <Bar dataKey="vehicle" name="Veicolo" fill={COLORS.vehicle} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Radar performance comparison */}
        <ChartCard
          title="Performance Radar"
          subtitle="Confronto multidimensionale drone vs veicolo (0-100)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="dimension" tick={{ ...axisStyle, fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={axisStyle} tickCount={3} />
              <Radar name="Drone" dataKey="droneScore" stroke={COLORS.drone} fill={COLORS.drone} fillOpacity={0.3} />
              <Radar name="Veicolo" dataKey="vehicleScore" stroke={COLORS.vehicle} fill={COLORS.vehicle} fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. Operational KPIs bar */}
        <ChartCard
          title="Indicatori Operativi"
          subtitle="Performance operativa e sociale (0-100%)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={operData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={axisStyle} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontSize: 10 }} width={110} />
              <Tooltip contentStyle={tooltipStyle} formatter={pctFmt} />
              <Bar dataKey="value">
                {operData.map((_, i) => {
                  const fills = [COLORS.drone, COLORS.co2, COLORS.savings, COLORS.purple, COLORS.vehicle];
                  return <Cell key={i} fill={fills[i % fills.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 8. CO2 cumulative savings over years */}
        <ChartCard
          title="Riduzione CO₂ Cumulativa"
          subtitle="Tonnellate di CO₂ risparmiate nel periodo di proiezione"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.co2} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.co2} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" tick={axisStyle} tickFormatter={(v) => `Anno ${v}`} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `${v}t`} />
              <Tooltip contentStyle={tooltipStyle} formatter={savingsFmt} />
              <Area type="monotone" dataKey="co2Saved" name="CO₂ risparmiata" stroke={COLORS.co2} fill="url(#co2Gradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 9. Annual cost comparison */}
        <ChartCard
          title="Costi Annuali Totali"
          subtitle="Costo flotta drone vs flotta veicolare per anno (€ migliaia)"
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" tick={axisStyle} tickFormatter={(v) => `A${v}`} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `€${v}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={kFmt} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="droneCost" name="Costo Drone" fill={COLORS.drone} />
              <Bar dataKey="vehicleCost" name="Costo Veicolo" fill={COLORS.vehicle} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 10. Traffic impact */}
        <ChartCard
          title="Impatto sul Traffico Urbano"
          subtitle="Veicoli rimossi dalla circolazione per anno (provincia di Catania)"
        >
          <div className="h-full flex flex-col justify-center gap-4">
            {[
              { label: 'Veicoli rimossi/giorno', value: traffic.vehiclesRemovedPerDay, max: 200, color: COLORS.savings },
              { label: 'Riduzione congestione', value: traffic.congestionReductionPercent, max: 20, color: COLORS.drone, suffix: '%' },
              { label: 'Parcheggi liberati/giorno', value: traffic.parkingSpacesSavedPerYear / (result.params.workingDaysPerYear || 1), max: 200, color: COLORS.purple },
              { label: 'Rischio incidenti ridotto', value: traffic.accidentRiskReductionPercent, max: 15, color: COLORS.vehicle, suffix: '%' },
            ].map(({ label, value, max, color, suffix = '' }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{label}</span>
                  <span className="font-semibold" style={{ color }}>{value.toFixed(1)}{suffix}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-2 p-3 bg-slate-700/50 rounded-lg text-xs text-slate-400">
              <span className="text-white font-semibold">{traffic.vehiclesRemovedPerYear.toLocaleString()}</span> veicoli rimossi/anno &nbsp;|&nbsp;
              <span className="text-white font-semibold">{traffic.parkingSpacesSavedPerYear.toLocaleString()}</span> soste risparmiate/anno
            </div>
          </div>
        </ChartCard>

        {/* 11. Financial summary */}
        <ChartCard
          title="Analisi Finanziaria"
          subtitle="Investimento iniziale, payback e proiezione NPV (€)"
        >
          <div className="h-full flex flex-col justify-center gap-3">
            {[
              { label: 'Investimento iniziale', value: fmtEur(financial.initialInvestmentEur), color: COLORS.loss },
              { label: 'Risparmio annuo', value: fmtEur(financial.annualSavingsEur), color: COLORS.savings },
              { label: 'Payback period', value: `${financial.paybackPeriodYears} anni`, color: COLORS.drone },
              { label: 'ROI 5 anni', value: `${financial.roi5Years > 0 ? '+' : ''}${financial.roi5Years}%`, color: financial.roi5Years > 0 ? COLORS.savings : COLORS.loss },
              { label: 'NPV 10 anni', value: fmtEur(financial.npv10Years), color: financial.npv10Years > 0 ? COLORS.savings : COLORS.loss },
              { label: 'IRR stimato', value: `${financial.irr.toFixed(1)}%`, color: COLORS.purple },
              { label: 'Crediti carbone/anno', value: fmtEur(financial.carbonCreditValueEur), color: COLORS.co2 },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-slate-400 text-xs">{label}</span>
                <span className="font-bold" style={{ color }}>{value}</span>
              </div>
            ))}
            <div className="mt-1 h-px bg-slate-700" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300 font-semibold text-xs">Posti lavoro creati</span>
              <span className="font-bold text-indigo-400">
                {result.social.jobsCreatedDirect} diretti + {result.social.jobsCreatedIndirect} indiretti
              </span>
            </div>
          </div>
        </ChartCard>

        {/* 12. Pie - delivery time breakdown */}
        <ChartCard
          title="Composizione Tempo Consegna Drone"
          subtitle="Suddivisione fasi operative (minuti)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Carico', value: 8 },
                  { name: 'Volo', value: Math.max(result.route.droneFlightTimeMin - 12, 1) },
                  { name: 'Scarico', value: 4 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}m`}
                labelLine={false}
              >
                <Cell fill={COLORS.drone} />
                <Cell fill="#0284c7" />
                <Cell fill="#0369a1" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={timeFmt} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}
