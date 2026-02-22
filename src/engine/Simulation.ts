import { VesselType, DEFAULT_VESSEL } from './VesselTypes';

export interface SimulationConfig {
  vessel: VesselType;
  speedKnots: number;       // actual vessel speed in knots
  simSpeed: number;         // simulation time multiplier (0.25, 0.5, 1, 1.5, 2, 2.5, 3)
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
}

// HFO CO2 emission factor (tonnes CO2 per tonne fuel)
const CO2_FACTOR = 3.114;

// Speed exponent for fuel/drag penalty scaling (cube law approximation)
const SPEED_EXPONENT = 3;

/**
 * Compute the drag / fuel penalty from hull roughness using a simplified
 * form of the Townsin (1984) formula.
 *
 * Delta_Cf ≈ 0.044 * [ (AHR/L)^(1/3) - (AHR_0/L)^(1/3) ]
 * Fuel penalty ≈ Delta_Cf * 100 * speedFactor
 *
 * AHR in microns, L in metres.
 */
function computePenalties(
  roughness: number,
  vessel: VesselType,
  speedKnots: number,
): { dragPenalty: number; fuelPenalty: number; cleanFuelTonnes: number } {
  const ahr0 = vessel.baseRoughness; // clean-hull reference roughness
  const deltaAHR = Math.max(0, roughness - ahr0);

  // Empirical power penalty model:
  // roughly 1% penalty per 10-20 microns, diminishing returns?
  // Using a power law: Penalty % = 0.5 * (increase_microns)^0.67
  // e.g. +100um -> ~11%, +10um -> ~2.3%
  // This is a robust "videogame visualization" approximation of ITTC/Townsin power penalties.
  const roughnessPenaltyPct = deltaAHR > 0 
    ? 0.5 * Math.pow(deltaAHR, 0.67) 
    : 0;

  // Base fuel consumption scales with speed cubed (approx)
  // fuel = base * (speed / ref)^3
  const speedRatio = speedKnots / vessel.referenceSpeed;
  const cleanFuelTonnes = vessel.baseFuelConsumption * Math.pow(speedRatio, SPEED_EXPONENT);

  // Drag penalty % is comparable to power/fuel penalty %
  const dragPenalty = roughnessPenaltyPct;
  
  // Fuel penalty % (due to fouling)
  const fuelPenalty = roughnessPenaltyPct;

  return {
    dragPenalty: Math.max(0, dragPenalty),
    fuelPenalty: Math.max(0, fuelPenalty),
    cleanFuelTonnes
  };
}

export class Simulation {
  public state: SimulationState;

  constructor(config?: Partial<SimulationConfig>) {
    const defaultConfig: SimulationConfig = {
      vessel: DEFAULT_VESSEL,
      speedKnots: DEFAULT_VESSEL.referenceSpeed,
      simSpeed: 1,
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
    };
  }

  updateConfig(newConfig: Partial<SimulationConfig>) {
    const config = { ...this.state.config, ...newConfig };
    // Recompute penalties but preserve accumulated state
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
    const { vessel, speedKnots, simSpeed } = config;

    // Sim days elapsed this frame
    const simDays = (deltaSeconds / 86400) * simSpeed * 86400; // each real second = simSpeed days

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

    // Daily fuel and emissions
    const dailyFuelTonnes = cleanFuelTonnes * (1 + fuelPenalty / 100);
    
    // Emissions breakdown
    const stepCleanEmissions = cleanFuelTonnes * CO2_FACTOR * simDays;
    const stepPenaltyEmissions = (dailyFuelTonnes - cleanFuelTonnes) * CO2_FACTOR * simDays;
    
    const newEmissions = this.state.emissions + (stepCleanEmissions + stepPenaltyEmissions);
    const newEmissionsClean = this.state.emissionsClean + stepCleanEmissions;
    const newEmissionsPenalty = this.state.emissionsPenalty + stepPenaltyEmissions;

    this.state = {
      ...this.state,
      day: this.state.day + simDays,
      roughness: newRoughness,
      coatingHealth: newCoatingHealth,
      dragPenalty,
      fuelPenalty,
      dailyFuelTonnes,
      emissions: newEmissions,
      emissionsClean: newEmissionsClean,
      emissionsPenalty: newEmissionsPenalty,
    };
  }
}
