import type { SimulationResult } from '../../types/drone';
import { DRONE_MODELS, CATANIA_HUBS, VEHICLE_BENCHMARKS, WEATHER_FACTORS } from '../../data/droneData';
import { fmtEur, fmtTime, fmtCo2, buildYearlyProjections } from '../../utils/droneSimulation';

interface Props {
  result: SimulationResult;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-700" />
        {title}
        <div className="h-px flex-1 bg-slate-700" />
      </h3>
      {children}
    </div>
  );
}

function MetricRow({ label, drone, vehicle, unit = '', highlight = false }: {
  label: string;
  drone: string | number;
  vehicle: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-cyan-500/5' : ''}>
      <td className="py-2 px-3 text-xs text-slate-400">{label}</td>
      <td className="py-2 px-3 text-xs text-center font-semibold text-cyan-400">{drone}{unit}</td>
      <td className="py-2 px-3 text-xs text-center font-semibold text-amber-400">{vehicle}{unit}</td>
    </tr>
  );
}

export default function ReportView({ result }: Props) {
  const { params, route, costs, environment, traffic, operational, financial, social } = result;
  const drone = DRONE_MODELS.find((d) => d.id === params.droneModelId)!;
  const origin = CATANIA_HUBS.find((h) => h.id === params.originHubId)!;
  const dest = CATANIA_HUBS.find((h) => h.id === params.destinationHubId)!;
  const vehicle = VEHICLE_BENCHMARKS[params.comparisonVehicle];
  const weather = WEATHER_FACTORS[params.weatherCondition];
  const yearly = buildYearlyProjections(result);
  const annualDeliveries = params.deliveriesPerDay * params.workingDaysPerYear;

  const handlePrint = () => window.print();
  const date = new Date(result.timestamp).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-900">
      {/* Print button */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">Rapporto generato il {date}</span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          🖨️ Stampa / Esporta PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 print:p-0 print:max-w-none" id="drone-report">

        {/* Header */}
        <div className="text-center mb-8 print:mb-6">
          <div className="inline-flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-2xl px-6 py-4 mb-4">
            <span className="text-4xl">🚁</span>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">Report Logistica Drone</h1>
              <p className="text-sm text-slate-400">Smart Venues · Provincia di Catania</p>
            </div>
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { label: 'Sostenibilità', value: result.overallSustainabilityScore, color: '#22c55e' },
              { label: 'Efficienza', value: result.overallEfficiencyScore, color: '#06b6d4' },
              { label: 'Inclusività', value: social.territorialInclusivityScore, color: '#a855f7' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold" style={{ color }}>{value}/100</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 1. Scenario Configuration */}
        <Section title="1. Configurazione Scenario">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { label: 'Modello Drone', value: drone.name },
              { label: 'Produttore', value: drone.manufacturer },
              { label: 'Hub Origine', value: origin.name },
              { label: 'Hub Destinazione', value: dest.name },
              { label: 'Carico', value: `${params.payloadKg} kg` },
              { label: 'Consegne/giorno', value: params.deliveriesPerDay.toString() },
              { label: 'N° Droni', value: params.numDrones.toString() },
              { label: 'Giorni/anno', value: params.workingDaysPerYear.toString() },
              { label: 'Meteo', value: weather.label },
              { label: 'Fonte elettricità', value: params.electricitySource === 'renewable' ? '100% Rinnovabile' : params.electricitySource === 'grid' ? 'Rete Naz.' : 'Misto' },
              { label: 'Veicolo confronto', value: vehicle.label },
              { label: 'Consegne/anno totali', value: annualDeliveries.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 rounded-lg px-3 py-2">
                <div className="text-slate-500 text-[10px] mb-0.5">{label}</div>
                <div className="text-slate-200 font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 2. Route Analysis */}
        <Section title="2. Analisi Rotta">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="py-2 px-3 text-xs text-left text-slate-400">Metrica</th>
                  <th className="py-2 px-3 text-xs text-center text-cyan-400">🚁 Drone</th>
                  <th className="py-2 px-3 text-xs text-center text-amber-400">🚚 {vehicle.label}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                <MetricRow label="Distanza" drone={`${route.straightDistanceKm} km`} vehicle={`${route.roadDistanceKm} km`} />
                <MetricRow label="Velocità media" drone={`${Math.round(drone.cruiseSpeedKmh * 0.95)} km/h`} vehicle={`${vehicle.avgSpeedKmh} km/h`} />
                <MetricRow label="Tempo totale consegna" drone={fmtTime(route.droneFlightTimeMin)} vehicle={fmtTime(route.truckRoadTimeMin)} highlight />
                <MetricRow label="Risparmio tempo" drone={`−${route.timeSavingMin} min`} vehicle="—" />
                <MetricRow label="% miglioramento tempo" drone={`${route.timeSavingPercent}%`} vehicle="Base" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* 3. Cost Analysis */}
        <Section title="3. Analisi Economica">
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="py-2 px-3 text-xs text-left text-slate-400">Costo</th>
                  <th className="py-2 px-3 text-xs text-center text-cyan-400">🚁 Drone</th>
                  <th className="py-2 px-3 text-xs text-center text-amber-400">🚚 Veicolo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                <MetricRow label="Energia / Carburante" drone={fmtEur(costs.droneBreakdown.energy)} vehicle={fmtEur(costs.vehicleBreakdown.fuel)} />
                <MetricRow label="Manutenzione" drone={fmtEur(costs.droneBreakdown.maintenance)} vehicle={fmtEur(costs.vehicleBreakdown.maintenance)} />
                <MetricRow label="Operatore / Autista" drone={fmtEur(costs.droneBreakdown.operator)} vehicle={fmtEur(costs.vehicleBreakdown.driver)} />
                <MetricRow label="Ammortamento / Assicurazione" drone={fmtEur(costs.droneBreakdown.amortization)} vehicle={fmtEur(costs.vehicleBreakdown.insurance)} />
                <MetricRow label="Permessi / Parcheggio" drone={fmtEur(costs.droneBreakdown.permits)} vehicle={fmtEur(costs.vehicleBreakdown.parking)} />
                <MetricRow label="TOTALE per consegna" drone={fmtEur(costs.droneCostPerDelivery)} vehicle={fmtEur(costs.vehicleCostPerDelivery)} highlight />
                <MetricRow label="Risparmio per consegna" drone={fmtEur(costs.savingsPerDelivery)} vehicle="—" />
                <MetricRow label="Risparmio % per consegna" drone={`${costs.savingsPercent > 0 ? '+' : ''}${costs.savingsPercent}%`} vehicle="—" />
                <MetricRow label="Costo annuale totale" drone={fmtEur(costs.annualDroneCost)} vehicle={fmtEur(costs.annualVehicleCost)} />
                <MetricRow label="Risparmio annuale" drone={fmtEur(costs.annualSavings)} vehicle="—" highlight />
              </tbody>
            </table>
          </div>

          {/* Financial summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Investimento iniziale', value: fmtEur(financial.initialInvestmentEur), color: 'text-rose-400' },
              { label: 'Payback period', value: `${financial.paybackPeriodYears} anni`, color: 'text-amber-400' },
              { label: 'ROI 5 anni', value: `${financial.roi5Years > 0 ? '+' : ''}${financial.roi5Years}%`, color: financial.roi5Years > 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'NPV 10 anni', value: fmtEur(financial.npv10Years), color: financial.npv10Years > 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'IRR stimato', value: `${financial.irr.toFixed(1)}%`, color: 'text-purple-400' },
              { label: 'Crediti carbone/anno', value: fmtEur(financial.carbonCreditValueEur), color: 'text-green-400' },
              { label: 'Risparmio 5 anni', value: fmtEur((yearly[4]?.cumulativeSavings ?? 0) * 1000), color: 'text-cyan-400' },
              { label: 'Risparmio 10 anni', value: fmtEur(financial.annualSavingsEur * 10 - financial.initialInvestmentEur), color: 'text-cyan-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800 rounded-lg px-3 py-2">
                <div className="text-slate-500 text-[10px] mb-0.5">{label}</div>
                <div className={`font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. Environmental Impact */}
        <Section title="4. Impatto Ambientale">
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="py-2 px-3 text-xs text-left text-slate-400">Indicatore</th>
                  <th className="py-2 px-3 text-xs text-center text-cyan-400">🚁 Drone</th>
                  <th className="py-2 px-3 text-xs text-center text-amber-400">🚚 Veicolo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                <MetricRow
                  label="CO₂ per consegna"
                  drone={fmtCo2(environment.droneCo2PerDeliveryKg)}
                  vehicle={fmtCo2(environment.vehicleCo2PerDeliveryKg)}
                  highlight
                />
                <MetricRow
                  label="Risparmio CO₂ per consegna"
                  drone={`−${environment.co2SavingPercent}%`}
                  vehicle="Base"
                />
                <MetricRow
                  label="CO₂ risparmiata all'anno"
                  drone={`${environment.annualCo2SavingTons.toFixed(2)} t`}
                  vehicle="—"
                />
                <MetricRow
                  label="Energia per consegna"
                  drone={`${environment.droneEnergyKwhPerDelivery} kWh`}
                  vehicle={`~${(route.roadDistanceKm * 0.08).toFixed(2)} L diesel`}
                />
                <MetricRow
                  label="Livello rumore @50m"
                  drone={`${drone.noiseLevelDB} dB`}
                  vehicle={`${vehicle.noiseLevelDB} dB`}
                />
                <MetricRow
                  label="Riduzione rumore"
                  drone={`−${environment.noiseReductionDB} dB`}
                  vehicle="—"
                />
                <MetricRow
                  label="NOx risparmiato"
                  drone={`−${environment.noxSavingGPerDelivery}g/cons.`}
                  vehicle="—"
                />
                <MetricRow
                  label="Miglioramento qualità aria"
                  drone={`−${environment.airQualityImprovementPercent}%`}
                  vehicle="—"
                />
                <MetricRow
                  label="Equivalenza alberi piantati/anno"
                  drone={`${environment.equivalentTreesPlanted} alberi`}
                  vehicle="—"
                  highlight
                />
              </tbody>
            </table>
          </div>
        </Section>

        {/* 5. Traffic & Urban Mobility */}
        <Section title="5. Mobilità Urbana e Traffico">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { label: 'Veicoli rimossi/giorno', value: traffic.vehiclesRemovedPerDay.toString(), color: 'text-green-400' },
              { label: 'Veicoli rimossi/anno', value: traffic.vehiclesRemovedPerYear.toLocaleString(), color: 'text-green-400' },
              { label: 'Riduzione congestione', value: `${traffic.congestionReductionPercent}%`, color: 'text-cyan-400' },
              { label: 'Parcheggi liberati/anno', value: traffic.parkingSpacesSavedPerYear.toLocaleString(), color: 'text-amber-400' },
              { label: 'Riduzione rischio incidenti', value: `${traffic.accidentRiskReductionPercent}%`, color: 'text-purple-400' },
              { label: 'Score mobilità urbana (+)', value: `+${traffic.urbanMobilityScoreImprovement}`, color: 'text-indigo-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800 rounded-lg px-3 py-2">
                <div className="text-slate-500 text-[10px] mb-0.5">{label}</div>
                <div className={`font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Operational */}
        <Section title="6. Parametri Operativi">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Utilizzo flotta', value: `${operational.fleetUtilizationPercent}%` },
              { label: 'Cons./drone/giorno', value: operational.deliveriesPerDronePerDay.toString() },
              { label: 'Ricariche/giorno', value: operational.batteryChargesPerDay.toString() },
              { label: 'Energia/giorno', value: `${operational.energyConsumptionKwhPerDay} kWh` },
              { label: 'Manutenzione/mese', value: fmtEur(operational.maintenanceCostPerMonth) },
              { label: 'Uptime', value: `${operational.uptimePercent}%` },
              { label: 'Downtime meteo/anno', value: `${operational.weatherDowntimeDaysPerYear} giorni` },
              { label: 'Raggio copertura', value: `${operational.coverageRadiusKm} km` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 rounded-lg px-3 py-2">
                <div className="text-slate-500 text-[10px] mb-0.5">{label}</div>
                <div className="text-slate-200 font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. Social Impact */}
        <Section title="7. Impatto Sociale e Territoriale">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-4">
            {[
              { label: 'Posti lavoro diretti', value: `${social.jobsCreatedDirect}`, color: 'text-indigo-400' },
              { label: 'Posti lavoro indiretti', value: `${social.jobsCreatedIndirect}`, color: 'text-indigo-400' },
              { label: 'Inclusività territoriale', value: `${social.territorialInclusivityScore}%`, color: 'text-purple-400' },
              { label: 'Qualità servizio', value: `${social.serviceQualityScore}/100`, color: 'text-cyan-400' },
              { label: 'Accessibilità last-mile', value: `${social.lastMileAccessibilityScore}/100`, color: 'text-amber-400' },
              { label: 'Integr. Smart Venues', value: `${social.smartVenuesIntegrationScore}%`, color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800 rounded-lg px-3 py-2">
                <div className="text-slate-500 text-[10px] mb-0.5">{label}</div>
                <div className={`font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 8. Yearly projection table */}
        <Section title="8. Proiezione Pluriennale">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800">
                  <th className="py-2 px-3 text-left text-slate-400">Anno</th>
                  <th className="py-2 px-3 text-center text-cyan-400">Costo Drone (k€)</th>
                  <th className="py-2 px-3 text-center text-amber-400">Costo Veicolo (k€)</th>
                  <th className="py-2 px-3 text-center text-green-400">Risparmio (k€)</th>
                  <th className="py-2 px-3 text-center text-white">Cumul. (k€)</th>
                  <th className="py-2 px-3 text-center text-emerald-400">CO₂ risparmiata (t)</th>
                  <th className="py-2 px-3 text-center text-purple-400">ROI %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {yearly.map((y) => (
                  <tr key={y.year} className={y.cumulativeSavings >= 0 ? 'bg-green-500/5' : ''}>
                    <td className="py-2 px-3 text-slate-300 font-medium">Anno {y.year}</td>
                    <td className="py-2 px-3 text-center text-cyan-400">{y.droneCost}</td>
                    <td className="py-2 px-3 text-center text-amber-400">{y.vehicleCost}</td>
                    <td className="py-2 px-3 text-center text-green-400">+{y.savings}</td>
                    <td className={`py-2 px-3 text-center font-bold ${y.cumulativeSavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {y.cumulativeSavings >= 0 ? '+' : ''}{y.cumulativeSavings}
                    </td>
                    <td className="py-2 px-3 text-center text-emerald-400">{y.co2Saved}</td>
                    <td className={`py-2 px-3 text-center font-bold ${y.roiPercent >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                      {y.roiPercent >= 0 ? '+' : ''}{y.roiPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-[10px] text-slate-500">
          <p className="font-semibold text-slate-400 mb-1">Note metodologiche</p>
          I dati sono calcolati sulla base di benchmark industriali 2024/25, dati ENAC per le normative drone italiane, intensità CO₂ rete elettrica italiana (ISPRA 2024),
          e stime di costi operativi da report settoriali (McKinsey, Roland Berger, EASA). I risultati sono a scopo simulativo e pianificatorio.
          La Provincia di Catania presenta condizioni meteo favorevoli con oltre 280 giorni sereni/anno, ottimali per operazioni drone.
          L'integrazione con il sistema Smart Venues permette la valorizzazione di {CATANIA_HUBS.filter(h => h.isSmartVenue).length} hub già connessi all'ecosistema.
        </div>
      </div>
    </div>
  );
}
