import type {
  SimulationParams,
  SimulationResult,
  RouteMetrics,
  CostMetrics,
  EnvironmentalMetrics,
  TrafficMetrics,
  OperationalMetrics,
  FinancialMetrics,
  SocialMetrics,
  YearlyProjection,
  RadarDimension,
} from '../types/drone';
import { DRONE_MODELS, CATANIA_HUBS, WEATHER_FACTORS, VEHICLE_BENCHMARKS } from '../data/droneData';

// ─── Constants ────────────────────────────────────────────────────────────────

const ELECTRICITY_PRICE_EUR_KWH = 0.22;
const ITALIAN_GRID_CO2_G_PER_KWH = 232;        // gCO2/kWh (2024 Italian grid)
const RENEWABLE_CO2_G_PER_KWH = 22;            // gCO2/kWh (solar/wind lifecycle)
const MIXED_CO2_G_PER_KWH = 120;               // gCO2/kWh (mixed 50% renewable)
const EU_CARBON_CREDIT_EUR_PER_TON = 65;        // EU ETS 2024
const ANNUAL_TREES_CO2_ABSORPTION_KG = 22;      // kg CO2/year per tree
const DISCOUNT_RATE = 0.05;                      // 5% NPV discount rate
const ROAD_DISTANCE_FACTOR = 1.35;              // straight-line to road distance multiplier
const AVG_ANNUAL_TRAFFIC_CT_PROVINCE = 45000;   // daily vehicle passages on main routes

// ─── Utility Functions ────────────────────────────────────────────────────────

/** Haversine formula: straight-line distance between two lat/lng coords (km) */
export function haversineDistance(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get electricity CO2 intensity based on source */
function getElectricityCo2(source: SimulationParams['electricitySource']): number {
  switch (source) {
    case 'renewable': return RENEWABLE_CO2_G_PER_KWH;
    case 'grid': return ITALIAN_GRID_CO2_G_PER_KWH;
    default: return MIXED_CO2_G_PER_KWH;
  }
}

/** NPV calculation */
function calcNPV(annualCashFlow: number, years: number, rate: number): number {
  let npv = 0;
  for (let y = 1; y <= years; y++) {
    npv += annualCashFlow / (1 + rate) ** y;
  }
  return npv;
}

/** IRR approximation using bisection */
function calcIRR(initialInvestment: number, annualCashFlow: number, years: number): number {
  if (annualCashFlow <= 0) return 0;
  let lo = 0, hi = 5, mid = 0;
  for (let i = 0; i < 50; i++) {
    mid = (lo + hi) / 2;
    const npv = calcNPV(annualCashFlow, years, mid) - initialInvestment;
    if (Math.abs(npv) < 0.01) break;
    if (npv > 0) lo = mid;
    else hi = mid;
  }
  return mid * 100;
}

// ─── Main Simulation Function ─────────────────────────────────────────────────

export function runSimulation(params: SimulationParams): SimulationResult {
  const drone = DRONE_MODELS.find((d) => d.id === params.droneModelId)!;
  const origin = CATANIA_HUBS.find((h) => h.id === params.originHubId)!;
  const destination = CATANIA_HUBS.find((h) => h.id === params.destinationHubId)!;
  const weather = WEATHER_FACTORS[params.weatherCondition];
  const vehicle = VEHICLE_BENCHMARKS[params.comparisonVehicle];

  // ── Route Metrics ────────────────────────────────────────────────────────

  const straightDist = haversineDistance(origin.coords, destination.coords);
  const roadDist = straightDist * ROAD_DISTANCE_FACTOR;

  // Payload factor: heavier loads reduce speed slightly
  const payloadFactor = Math.min(params.payloadKg / drone.maxPayloadKg, 1.0);
  const payloadSpeedPenalty = 1 - payloadFactor * 0.15;

  // Effective drone speed
  const effectiveSpeedKmh =
    drone.cruiseSpeedKmh * weather.speedFactor * payloadSpeedPenalty;

  const flightTimeMin = (straightDist / effectiveSpeedKmh) * 60;
  const totalDroneTimeMin = flightTimeMin + 8 + 4;   // +8 loading, +4 unloading

  const trafficFactor = 1.35; // Catania traffic congestion multiplier
  const vehicleRoadTimeMin =
    (roadDist / vehicle.avgSpeedKmh) * 60 * trafficFactor;
  const totalVehicleTimeMin = vehicleRoadTimeMin + 10 + 6;  // +10 loading, +6 delivery

  const timeSavingMin = totalVehicleTimeMin - totalDroneTimeMin;
  const timeSavingPercent = (timeSavingMin / totalVehicleTimeMin) * 100;

  const route: RouteMetrics = {
    straightDistanceKm: Math.round(straightDist * 10) / 10,
    roadDistanceKm: Math.round(roadDist * 10) / 10,
    droneFlightTimeMin: Math.round(totalDroneTimeMin),
    truckRoadTimeMin: Math.round(totalVehicleTimeMin),
    timeSavingMin: Math.round(timeSavingMin),
    timeSavingPercent: Math.round(timeSavingPercent),
  };

  // ── Cost Metrics ─────────────────────────────────────────────────────────

  // Drone costs
  const energyCostPerDelivery = straightDist * drone.energyKwhPerKm * ELECTRICITY_PRICE_EUR_KWH;
  const droneMaintenancePerDelivery = straightDist * drone.maintenanceCostPerKm;
  const annualDeliveries = params.deliveriesPerDay * params.workingDaysPerYear;
  const deliveriesPerDronePerDay = params.deliveriesPerDay / params.numDrones;
  const amortizationPerDelivery =
    (drone.costPerUnitEur * params.numDrones) /
    (drone.lifespanYears * annualDeliveries);
  const operatorCostPerDelivery = 28000 / annualDeliveries; // 1 operator per 5 drones, ~28k€/yr
  const permitsPerDelivery = 0.30; // ENAC permit overhead

  const droneCostPerDelivery =
    energyCostPerDelivery +
    droneMaintenancePerDelivery +
    amortizationPerDelivery +
    operatorCostPerDelivery +
    permitsPerDelivery;

  // Vehicle costs
  const fuelCost = roadDist * vehicle.fuelCostPerKm;
  const driverCost = (totalVehicleTimeMin / 60) * vehicle.driverCostHourly;
  const vehicleMaintenanceCost = roadDist * vehicle.maintenancePerKm;
  const insurancePerDelivery = vehicle.insuranceAnnual / annualDeliveries;
  const parkingCost = vehicle.parkingCostPerDelivery;

  const vehicleCostPerDelivery =
    fuelCost + driverCost + vehicleMaintenanceCost + insurancePerDelivery + parkingCost;

  const savingsPerDelivery = vehicleCostPerDelivery - droneCostPerDelivery;
  const savingsPercent = (savingsPerDelivery / vehicleCostPerDelivery) * 100;

  const costs: CostMetrics = {
    droneCostPerDelivery: Math.round(droneCostPerDelivery * 100) / 100,
    vehicleCostPerDelivery: Math.round(vehicleCostPerDelivery * 100) / 100,
    savingsPerDelivery: Math.round(savingsPerDelivery * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
    annualDroneCost: Math.round(droneCostPerDelivery * annualDeliveries),
    annualVehicleCost: Math.round(vehicleCostPerDelivery * annualDeliveries),
    annualSavings: Math.round(savingsPerDelivery * annualDeliveries),
    droneBreakdown: {
      energy: Math.round(energyCostPerDelivery * 100) / 100,
      maintenance: Math.round(droneMaintenancePerDelivery * 100) / 100,
      amortization: Math.round(amortizationPerDelivery * 100) / 100,
      operator: Math.round(operatorCostPerDelivery * 100) / 100,
      permits: permitsPerDelivery,
    },
    vehicleBreakdown: {
      fuel: Math.round(fuelCost * 100) / 100,
      driver: Math.round(driverCost * 100) / 100,
      maintenance: Math.round(vehicleMaintenanceCost * 100) / 100,
      insurance: Math.round(insurancePerDelivery * 100) / 100,
      parking: parkingCost,
    },
  };

  // ── Environmental Metrics ────────────────────────────────────────────────

  const electricityCo2 = getElectricityCo2(params.electricitySource);
  const droneEnergyKwh = straightDist * drone.energyKwhPerKm;
  const droneCo2Kg = (droneEnergyKwh * electricityCo2) / 1000;
  const vehicleCo2Kg = (roadDist * vehicle.co2gPerKm) / 1000;
  const co2SavingKg = vehicleCo2Kg - droneCo2Kg;
  const co2SavingPercent = (co2SavingKg / vehicleCo2Kg) * 100;
  const annualCo2SavingTons = (co2SavingKg * annualDeliveries) / 1000;
  const noiseReductionDB = vehicle.noiseLevelDB - drone.noiseLevelDB;
  const noxSavingG = roadDist * vehicle.noxGPerKm - straightDist * 0.005;
  const pmSavingMg = roadDist * vehicle.pmMgPerKm - straightDist * 0.2;
  const airQualityImprov = Math.min((noxSavingG / (roadDist * vehicle.noxGPerKm)) * 100, 100);

  const environment: EnvironmentalMetrics = {
    droneCo2PerDeliveryKg: Math.round(droneCo2Kg * 1000) / 1000,
    vehicleCo2PerDeliveryKg: Math.round(vehicleCo2Kg * 1000) / 1000,
    co2SavingPerDeliveryKg: Math.round(co2SavingKg * 1000) / 1000,
    co2SavingPercent: Math.round(co2SavingPercent * 10) / 10,
    annualCo2SavingTons: Math.round(annualCo2SavingTons * 100) / 100,
    droneEnergyKwhPerDelivery: Math.round(droneEnergyKwh * 100) / 100,
    noiseReductionDB: Math.round(noiseReductionDB),
    airQualityImprovementPercent: Math.round(airQualityImprov),
    noxSavingGPerDelivery: Math.round(noxSavingG * 10) / 10,
    pmSavingMgPerDelivery: Math.round(pmSavingMg * 10) / 10,
    equivalentTreesPlanted: Math.round(
      (annualCo2SavingTons * 1000) / ANNUAL_TREES_CO2_ABSORPTION_KG
    ),
  };

  // ── Traffic Metrics ───────────────────────────────────────────────────────

  // A drone replaces 1 vehicle trip; heavy cargo replaces 1/packagesPerTruck
  const packagesPerVehicle = params.comparisonVehicle === 'truck' ? 8 : 1;
  const vehiclesRemovedPerDay = params.deliveriesPerDay / packagesPerVehicle;
  const vehiclesRemovedPerYear = vehiclesRemovedPerDay * params.workingDaysPerYear;
  const congestionReduction = Math.min(
    (vehiclesRemovedPerDay / AVG_ANNUAL_TRAFFIC_CT_PROVINCE) * 100 * 500,
    15
  );
  const parkingSpacesSaved = vehiclesRemovedPerDay * 0.8; // avg 0.8 parking stops per trip

  const traffic: TrafficMetrics = {
    vehiclesRemovedPerDay: Math.round(vehiclesRemovedPerDay),
    vehiclesRemovedPerYear: Math.round(vehiclesRemovedPerYear),
    congestionReductionPercent: Math.round(congestionReduction * 10) / 10,
    parkingSpacesSavedPerYear: Math.round(parkingSpacesSaved * params.workingDaysPerYear),
    accidentRiskReductionPercent: Math.round(congestionReduction * 0.7 * 10) / 10,
    urbanMobilityScoreImprovement: Math.min(Math.round(congestionReduction * 3), 25),
  };

  // ── Operational Metrics ───────────────────────────────────────────────────

  const fleetUtilization = Math.min(
    (deliveriesPerDronePerDay * (flightTimeMin + 15)) / (8 * 60) * 100,
    95
  );
  const batteryChargesPerDay = Math.ceil(
    (deliveriesPerDronePerDay * (flightTimeMin / 60)) / (drone.batteryCapacityKwh / drone.energyKwhPerKm / drone.cruiseSpeedKmh)
  );
  const energyPerDay = droneEnergyKwh * params.deliveriesPerDay;
  const maintenancePerMonth = (drone.maintenanceCostPerKm * straightDist * annualDeliveries) / 12;
  const weatherDowntime = params.workingDaysPerYear * (1 - weather.successRate) * 30;
  const coverageRadius = Math.min(drone.maxRangeKm, drone.batteryCapacityKwh / drone.energyKwhPerKm);

  const operational: OperationalMetrics = {
    fleetUtilizationPercent: Math.round(fleetUtilization),
    deliveriesPerDronePerDay: Math.round(deliveriesPerDronePerDay * 10) / 10,
    batteryChargesPerDay: Math.max(batteryChargesPerDay, 1),
    energyConsumptionKwhPerDay: Math.round(energyPerDay * 10) / 10,
    maintenanceCostPerMonth: Math.round(maintenancePerMonth),
    uptimePercent: Math.round(weather.successRate * 100),
    weatherDowntimeDaysPerYear: Math.round(weatherDowntime),
    coverageRadiusKm: Math.round(coverageRadius),
  };

  // ── Financial Metrics ─────────────────────────────────────────────────────

  const infraCostPerHub = 45000; // charging, comms, safety systems
  const numHubs = 2; // origin + destination
  const initialInvestment =
    drone.costPerUnitEur * params.numDrones + infraCostPerHub * numHubs + 15000; // setup, training
  const annualOpCost = costs.annualDroneCost;
  const annualSavingsFinancial = costs.annualSavings;
  const paybackPeriod = initialInvestment / Math.max(annualSavingsFinancial, 1);
  const roi5 = ((annualSavingsFinancial * 5 - initialInvestment) / initialInvestment) * 100;
  const roi10 = ((annualSavingsFinancial * 10 - initialInvestment) / initialInvestment) * 100;
  const npv10 = calcNPV(annualSavingsFinancial, 10, DISCOUNT_RATE) - initialInvestment;
  const irr = calcIRR(initialInvestment, annualSavingsFinancial, 10);
  const carbonCreditValue = annualCo2SavingTons * EU_CARBON_CREDIT_EUR_PER_TON;

  const cumulativeSavings: number[] = [];
  let cumulative = -initialInvestment;
  for (let y = 1; y <= params.yearsProjection; y++) {
    cumulative += annualSavingsFinancial + carbonCreditValue;
    cumulativeSavings.push(Math.round(cumulative));
  }

  const financial: FinancialMetrics = {
    initialInvestmentEur: Math.round(initialInvestment),
    annualOperationalCostEur: Math.round(annualOpCost),
    annualSavingsEur: Math.round(annualSavingsFinancial),
    paybackPeriodYears: Math.round(paybackPeriod * 10) / 10,
    roi5Years: Math.round(roi5 * 10) / 10,
    roi10Years: Math.round(roi10 * 10) / 10,
    npv10Years: Math.round(npv10),
    irr: Math.round(irr * 10) / 10,
    carbonCreditValueEur: Math.round(carbonCreditValue),
    cumulativeSavingsByYear: cumulativeSavings,
  };

  // ── Social Metrics ────────────────────────────────────────────────────────

  const directJobs = Math.max(Math.ceil(params.numDrones / 5), 1); // 1 operator per 5 drones
  const indirectJobs = Math.ceil(directJobs * 1.8);
  const coveredCities = CATANIA_HUBS.filter(
    (h) => haversineDistance(origin.coords, h.coords) <= coverageRadius
  ).length;
  const inclusivityScore = Math.min((coveredCities / CATANIA_HUBS.length) * 100, 100);
  const serviceQuality = Math.min(
    (weather.successRate * 40) +
    ((1 - Math.min(flightTimeMin / 120, 1)) * 30) +
    (Math.min(coverageRadius / 80, 1) * 30),
    100
  );
  const smartVenueHubs = CATANIA_HUBS.filter((h) => h.isSmartVenue);
  const coveredSmartVenues = smartVenueHubs.filter(
    (h) => haversineDistance(origin.coords, h.coords) <= coverageRadius
  ).length;
  const svIntegration = (coveredSmartVenues / smartVenueHubs.length) * 100;

  const social: SocialMetrics = {
    jobsCreatedDirect: directJobs,
    jobsCreatedIndirect: indirectJobs,
    territorialInclusivityScore: Math.round(inclusivityScore),
    serviceQualityScore: Math.round(serviceQuality),
    lastMileAccessibilityScore: Math.min(Math.round(100 - paybackPeriod * 5), 90),
    smartVenuesIntegrationScore: Math.round(svIntegration),
  };

  // ── Composite Scores ──────────────────────────────────────────────────────

  const sustainabilityScore = Math.min(
    (co2SavingPercent * 0.40) +
    (airQualityImprov * 0.30) +
    (noiseReductionDB / 40 * 100 * 0.20) +
    (inclusivityScore * 0.10),
    100
  );

  const efficiencyScore = Math.min(
    (timeSavingPercent * 0.30) +
    (Math.max(savingsPercent, 0) * 0.30) +
    (fleetUtilization * 0.20) +
    (serviceQuality * 0.20),
    100
  );

  return {
    params,
    route,
    costs,
    environment,
    traffic,
    operational,
    financial,
    social,
    overallSustainabilityScore: Math.round(sustainabilityScore),
    overallEfficiencyScore: Math.round(efficiencyScore),
    timestamp: new Date().toISOString(),
  };
}

// ─── Yearly Projection Builder ────────────────────────────────────────────────

export function buildYearlyProjections(result: SimulationResult): YearlyProjection[] {
  const { costs, environment, financial, params } = result;
  const carbonCredits = environment.annualCo2SavingTons * 65;
  const years: YearlyProjection[] = [];
  let cumulativeSavings = -financial.initialInvestmentEur;

  for (let y = 1; y <= params.yearsProjection; y++) {
    const droneCost = costs.annualDroneCost;
    const vehicleCost = costs.annualVehicleCost;
    const savings = vehicleCost - droneCost + carbonCredits;
    cumulativeSavings += savings;

    years.push({
      year: y,
      droneCost: Math.round(droneCost / 1000),   // thousands €
      vehicleCost: Math.round(vehicleCost / 1000),
      savings: Math.round(savings / 1000),
      cumulativeSavings: Math.round(cumulativeSavings / 1000),
      co2Saved: Math.round(environment.annualCo2SavingTons * y * 10) / 10,
      roiPercent: Math.round(
        ((cumulativeSavings + financial.initialInvestmentEur) / financial.initialInvestmentEur) * 100
      ),
    });
  }
  return years;
}

// ─── Radar Data Builder ────────────────────────────────────────────────────────

export function buildRadarData(result: SimulationResult): RadarDimension[] {
  const { route, costs, environment, operational, social } = result;
  return [
    {
      dimension: 'Velocità',
      droneScore: Math.min(100 - (route.droneFlightTimeMin / route.truckRoadTimeMin) * 100 + 100, 100),
      vehicleScore: 50,
      fullMark: 100,
    },
    {
      dimension: 'Costo',
      droneScore: Math.max(100 - (costs.droneCostPerDelivery / costs.vehicleCostPerDelivery) * 100 + 100, 10),
      vehicleScore: 50,
      fullMark: 100,
    },
    {
      dimension: 'Ambiente',
      droneScore: Math.min(environment.co2SavingPercent, 100),
      vehicleScore: 20,
      fullMark: 100,
    },
    {
      dimension: 'Affidabilità',
      droneScore: operational.uptimePercent,
      vehicleScore: 85,
      fullMark: 100,
    },
    {
      dimension: 'Rumore',
      droneScore: Math.min(100 - (result.params.droneModelId === 'dji-flycart30' ? 30 : 20), 100),
      vehicleScore: 35,
      fullMark: 100,
    },
    {
      dimension: 'Inclusività',
      droneScore: social.territorialInclusivityScore,
      vehicleScore: 70,
      fullMark: 100,
    },
  ];
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function fmtEur(val: number): string {
  if (Math.abs(val) >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 1000) return `€${(val / 1000).toFixed(1)}k`;
  return `€${val.toFixed(2)}`;
}

export function fmtTime(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

export function fmtCo2(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toFixed(1)} kg`;
}
