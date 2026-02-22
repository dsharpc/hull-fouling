import { VesselType, DEFAULT_VESSEL } from './VesselTypes';

export interface SimulationConfig {
  vessel: VesselType;
  speedKnots: number;       // actual vessel speed in knots
  simSpeed: number;         // simulation time multiplier (0.25, 0.5, 1, 1.5, 2, 2.5, 3)
  fuelPricePerTonne: number; // USD per tonne of fuel
}

export interface SimulationState {
  day: number;
  roughness: number;        // Average Hull Roughness in microns (AHR)
  dragPenalty: number;      // % increase in drag vs clean hull
  fuelPenalty: number;      // % increase in fuel consumption vs clean hull
  dailyFuelTonnes: number;  // actual fuel burned today (tonnes)
  emissions: number;        // cumulative CO2 emissions (tonnes)
  emissionsClean: number;   // cumulative CO2 from theoretical clean hull
  emissionsPenalty: number; // cumulative CO2 from fouling penalty
  coatingHealth: number;    // 0–100%
  config: SimulationConfig;
  // Fuel cost tracking
  fuelCostClean: number;    // cumulative cost of clean-hull fuel (USD)
  fuelCostPenalty: number;  // cumulative cost of fouling-penalty fuel (USD)
  fuelCostTotal: number;    // cumulative total fuel cost (USD)
}

// HFO CO2 emission factor (tonnes CO2 per tonne fuel)
const CO2_FACTOR = 3.114;

// Default fuel price (USD per tonne of HFO)
const DEFAULT_FUEL_PRICE = 500;

// Speed exponent for fuel/drag penalty scaling (cube law approximation)
const SPEED_EXPONENT = 3;

/**
 * Compute the drag / fuel penalty from hull roughness.
 *
 * Empirical power-law model:
 *   Penalty % = 0.5 * (deltaAHR)^0.67
 *
 * Base fuel scales with (speed / refSpeed)^3.
 */
function computePenalties(
  roughness: number,
  vessel: VesselType,
  speedKnots: number,
): { dragPenalty: number; fuelPenalty: number; cleanFuelTonnes: number } {
  const ahr0 = vessel.baseRoughness;
  const deltaAHR = Math.max(0, roughness - ahr0);

  const roughnessPenaltyPct = deltaAHR > 0
    ? 0.5 * Math.pow(deltaAHR, 0.67)
    : 0;

  const speedRatio = speedKnots / vessel.referenceSpeed;
  const cleanFuelTonnes = vessel.baseFuelConsumption * Math.pow(speedRatio, SPEED_EXPONENT);

  return {
    dragPenalty: Math.max(0, roughnessPenaltyPct),
    fuelPenalty: Math.max(0, roughnessPenaltyPct),
    cleanFuelTonnes,
  };
}

export class Simulation {
  public state: SimulationState;

  constructor(config?: Partial<SimulationConfig>) {
    const defaultConfig: SimulationConfig = {
      vessel: DEFAULT_VESSEL,
      speedKnots: DEFAULT_VESSEL.referenceSpeed,
      simSpeed: 1,
      fuelPricePerTonne: DEFAULT_FUEL_PRICE,
    };
    const mergedConfig = { ...defaultConfig, ...config };
    this.state = this.buildInitialState(mergedConfig);
  }

  private buildInitialState(config: SimulationConfig): SimulationState {
    const { dragPenalty, fuelPenalty, cleanFuelTonnes } = computePenalties(
      config.vessel.baseRoughness,
      config.vessel,
      config.speedKnots,
    );
    const dailyFuel = cleanFuelTonnes * (1 + fuelPenalty / 100);
    return {
      day: 0,
      roughness: config.vessel.baseRoughness,
      dragPenalty,
      fuelPenalty,
      dailyFuelTonnes: dailyFuel,
      emissions: 0,
      emissionsClean: 0,
      emissionsPenalty: 0,
      coatingHealth: 100,
      config,
      fuelCostClean: 0,
      fuelCostPenalty: 0,
      fuelCostTotal: 0,
    };
  }

  updateConfig(newConfig: Partial<SimulationConfig>) {
    const config = { ...this.state.config, ...newConfig };
    const { dragPenalty, fuelPenalty, cleanFuelTonnes } = computePenalties(
      this.state.roughness,
      config.vessel,
      config.speedKnots,
    );
    const dailyFuelTonnes = cleanFuelTonnes * (1 + fuelPenalty / 100);
    this.state = {
      ...this.state,
      config,
      dragPenalty,
      fuelPenalty,
      dailyFuelTonnes,
    };
  }

  reset() {
    this.state = this.buildInitialState(this.state.config);
  }

  /** Advance simulation by one animation frame. deltaTime is in real seconds. */
  tick(deltaSeconds: number) {
    const { config, roughness, coatingHealth } = this.state;
    const { vessel, speedKnots, simSpeed, fuelPricePerTonne } = config;

    // Sim days elapsed this frame
    const simDays = (deltaSeconds / 86400) * simSpeed * 86400;

    // Roughness grows linearly (faster at low coating health)
    const coatingFactor = 1 + (1 - coatingHealth / 100) * 0.5;
    const newRoughness = roughness + vessel.foulingRate * simDays * coatingFactor;

    // Coating health degrades slowly
    const newCoatingHealth = Math.max(0, coatingHealth - 0.05 * simDays);

    // Recompute penalties
    const { dragPenalty, fuelPenalty, cleanFuelTonnes } = computePenalties(
      newRoughness,
      vessel,
      speedKnots,
    );

    // Daily fuel
    const dailyFuelTonnes = cleanFuelTonnes * (1 + fuelPenalty / 100);
    const penaltyFuelTonnes = dailyFuelTonnes - cleanFuelTonnes;

    // Emissions breakdown
    const stepCleanEmissions = cleanFuelTonnes * CO2_FACTOR * simDays;
    const stepPenaltyEmissions = penaltyFuelTonnes * CO2_FACTOR * simDays;

    // Fuel cost breakdown
    const stepCleanCost = cleanFuelTonnes * fuelPricePerTonne * simDays;
    const stepPenaltyCost = penaltyFuelTonnes * fuelPricePerTonne * simDays;

    this.state = {
      ...this.state,
      day: this.state.day + simDays,
      roughness: newRoughness,
      coatingHealth: newCoatingHealth,
      dragPenalty,
      fuelPenalty,
      dailyFuelTonnes,
      emissions: this.state.emissions + stepCleanEmissions + stepPenaltyEmissions,
      emissionsClean: this.state.emissionsClean + stepCleanEmissions,
      emissionsPenalty: this.state.emissionsPenalty + stepPenaltyEmissions,
      fuelCostClean: this.state.fuelCostClean + stepCleanCost,
      fuelCostPenalty: this.state.fuelCostPenalty + stepPenaltyCost,
      fuelCostTotal: this.state.fuelCostTotal + stepCleanCost + stepPenaltyCost,
    };
  }
}
