// ─── Drone Models ────────────────────────────────────────────────────────────

export interface DroneModel {
  id: string;
  name: string;
  manufacturer: string;
  maxPayloadKg: number;
  maxRangeKm: number;
  cruiseSpeedKmh: number;
  energyKwhPerKm: number;       // kWh consumed per km
  costPerUnitEur: number;        // purchase price €
  maintenanceCostPerKm: number;  // € per km
  noiseLevelDB: number;          // dB at 50m altitude
  batteryCapacityKwh: number;
  chargingTimeMin: number;
  lifespanYears: number;
  maxWindSpeedKmh: number;       // max operational wind speed
  operatingTempC: [number, number]; // [min, max]
  imageUrl: string;
}

// ─── Hubs / Logistics Nodes ──────────────────────────────────────────────────

export type HubType = 'primary' | 'secondary' | 'micro';

export interface DroneHub {
  id: string;
  name: string;
  shortName: string;
  type: HubType;
  address: string;
  city: string;
  coords: [number, number]; // [lat, lng]
  dailyCapacity: number;    // max deliveries/day
  droneCount: number;
  chargingBays: number;
  isSmartVenue: boolean;    // linked to Smart Venues ecosystem
}

// ─── Simulation Parameters ────────────────────────────────────────────────────

export type WeatherCondition = 'clear' | 'cloudy' | 'windy' | 'light_rain' | 'heavy_rain';
export type UrgencyLevel = 'standard' | 'express' | 'critical';
export type ElectricitySource = 'grid' | 'renewable' | 'mixed';
export type ComparisonVehicle = 'van' | 'truck' | 'moto_courier' | 'cargo_bike';

export interface SimulationParams {
  droneModelId: string;
  originHubId: string;
  destinationHubId: string;
  payloadKg: number;
  deliveriesPerDay: number;
  workingDaysPerYear: number;
  weatherCondition: WeatherCondition;
  urgencyLevel: UrgencyLevel;
  electricitySource: ElectricitySource;
  comparisonVehicle: ComparisonVehicle;
  numDrones: number;
  yearsProjection: number;
}

// ─── Simulation Results ───────────────────────────────────────────────────────

export interface RouteMetrics {
  straightDistanceKm: number;
  roadDistanceKm: number;       // estimated road equivalent
  droneFlightTimeMin: number;
  truckRoadTimeMin: number;
  timeSavingMin: number;
  timeSavingPercent: number;
}

export interface CostMetrics {
  droneCostPerDelivery: number;
  vehicleCostPerDelivery: number;
  savingsPerDelivery: number;
  savingsPercent: number;
  annualDroneCost: number;
  annualVehicleCost: number;
  annualSavings: number;
  droneBreakdown: {
    energy: number;
    maintenance: number;
    amortization: number;
    operator: number;
    permits: number;
  };
  vehicleBreakdown: {
    fuel: number;
    driver: number;
    maintenance: number;
    insurance: number;
    parking: number;
  };
}

export interface EnvironmentalMetrics {
  droneCo2PerDeliveryKg: number;
  vehicleCo2PerDeliveryKg: number;
  co2SavingPerDeliveryKg: number;
  co2SavingPercent: number;
  annualCo2SavingTons: number;
  droneEnergyKwhPerDelivery: number;
  noiseReductionDB: number;
  airQualityImprovementPercent: number;    // NOx / PM reduction
  noxSavingGPerDelivery: number;
  pmSavingMgPerDelivery: number;
  equivalentTreesPlanted: number;          // per year
}

export interface TrafficMetrics {
  vehiclesRemovedPerDay: number;
  vehiclesRemovedPerYear: number;
  congestionReductionPercent: number;
  parkingSpacesSavedPerYear: number;
  accidentRiskReductionPercent: number;
  urbanMobilityScoreImprovement: number;   // 0-100
}

export interface OperationalMetrics {
  fleetUtilizationPercent: number;
  deliveriesPerDronePerDay: number;
  batteryChargesPerDay: number;
  energyConsumptionKwhPerDay: number;
  maintenanceCostPerMonth: number;
  uptimePercent: number;
  weatherDowntimeDaysPerYear: number;
  coverageRadiusKm: number;
}

export interface FinancialMetrics {
  initialInvestmentEur: number;
  annualOperationalCostEur: number;
  annualSavingsEur: number;
  paybackPeriodYears: number;
  roi5Years: number;
  roi10Years: number;
  npv10Years: number;                    // Net Present Value
  irr: number;                           // Internal Rate of Return %
  carbonCreditValueEur: number;          // annual
  cumulativeSavingsByYear: number[];     // array of cumulative savings per year
}

export interface SocialMetrics {
  jobsCreatedDirect: number;            // drone operators, maintenance
  jobsCreatedIndirect: number;          // support services
  territorialInclusivityScore: number;  // % of province covered with <30 min delivery
  serviceQualityScore: number;          // composite 0-100
  lastMileAccessibilityScore: number;
  smartVenuesIntegrationScore: number;  // how well it serves Smart Venues ecosystem
}

export interface SimulationResult {
  params: SimulationParams;
  route: RouteMetrics;
  costs: CostMetrics;
  environment: EnvironmentalMetrics;
  traffic: TrafficMetrics;
  operational: OperationalMetrics;
  financial: FinancialMetrics;
  social: SocialMetrics;
  overallSustainabilityScore: number;   // composite 0-100
  overallEfficiencyScore: number;       // composite 0-100
  timestamp: string;
}

// ─── Chart / Reporting Types ──────────────────────────────────────────────────

export interface YearlyProjection {
  year: number;
  droneCost: number;
  vehicleCost: number;
  savings: number;
  cumulativeSavings: number;
  co2Saved: number;
  roiPercent: number;
}

export interface RadarDimension {
  dimension: string;
  droneScore: number;
  vehicleScore: number;
  fullMark: number;
}

export type DashboardTab = 'map' | 'simulation' | 'analytics' | 'report' | 'planner' | 'history';

// ─── Saved Flight Plans ───────────────────────────────────────────────────────

export interface SavedFlightPlan {
  id: string;
  savedAt: string;   // ISO timestamp
  label: string;     // e.g. "CT-01→ACI-04 · express · 24/02 09:14"
  form: PlannerForm;
  result: PlannerResult;
}

// ─── Route Planner ────────────────────────────────────────────────────────────

export type DeliveryType =
  | 'standard'
  | 'express'
  | 'medical'
  | 'fragile'
  | 'cold_chain'
  | 'documents'
  | 'event_supplies';

export interface RouteStop {
  id: string;
  hubId: string;
  note: string;
}

export interface PlannerForm {
  originHubId: string;
  waypoints: RouteStop[];
  destinationHubId: string;
  deliveryType: DeliveryType;
  payloadKg: number;
  droneModelId: string | 'auto';
  weatherCondition: WeatherCondition;
  urgencyLevel: UrgencyLevel;
  preferredTimeWindow: string; // e.g. '08:00-12:00'
  specialNotes: string;
}

export interface RouteLeg {
  fromHub: DroneHub;
  toHub: DroneHub;
  distanceKm: number;
  flightTimeMin: number;
  energyCost: number;
  maintenanceCost: number;
  batteryStopsNeeded: number;
}

export interface PlannerResult {
  legs: RouteLeg[];
  recommendedDroneId: string;
  totalDistanceKm: number;
  totalFlightTimeMin: number;
  totalCostEur: number;
  costBreakdown: { energy: number; maintenance: number; operator: number; permits: number };
  successProbability: number;
  co2SavedKg: number;
  co2VsVan: number;
  batteryStopsTotal: number;
  feasible: boolean;
  feasibilityWarnings: string[];
}
