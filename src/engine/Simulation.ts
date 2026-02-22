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
): { dragPenalty: number; fuelPenalty: number } {
  const L = vessel.hullLength;
  const ahr0 = vessel.baseRoughness; // clean-hull reference roughness

  // Townsin simplified delta friction coefficient (×100 gives %)
  const deltaAHR = Math.max(0, roughness - ahr0);
  const townsinDelta =
    0.044 *
    (Math.pow((ahr0 + deltaAHR) / (L * 1e6), 1 / 3) -
      Math.pow(ahr0 / (L * 1e6), 1 / 3)) *
    100;

  // Speed factor: penalties scale with (v / v_ref)^3
  const speedFactor = Math.pow(speedKnots / vessel.referenceSpeed, SPEED_EXPONENT);

  const dragPenalty = townsinDelta * speedFactor;

  // Fuel penalty slightly lower than drag penalty (propulsive efficiency losses)
  const fuelPenalty = dragPenalty * 0.9;

  return {
    dragPenalty: Math.max(0, dragPenalty),
    fuelPenalty: Math.max(0, fuelPenalty),
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
    const { dragPenalty, fuelPenalty } = computePenalties(
      config.vessel.baseRoughness,
      config.vessel,
      config.speedKnots,
    );
    return {
      day: 0,
      roughness: config.vessel.baseRoughness,
      dragPenalty,
      fuelPenalty,
      dailyFuelTonnes: config.vessel.baseFuelConsumption,
      emissions: 0,
      coatingHealth: 100,
      config,
    };
  }

  updateConfig(newConfig: Partial<SimulationConfig>) {
    const config = { ...this.state.config, ...newConfig };
    // Recompute penalties but preserve accumulated state
    const { dragPenalty, fuelPenalty } = computePenalties(
      this.state.roughness,
      config.vessel,
      config.speedKnots,
    );
    const dailyFuelTonnes =
      config.vessel.baseFuelConsumption * (1 + fuelPenalty / 100);
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
    const { dragPenalty, fuelPenalty } = computePenalties(
      newRoughness,
      vessel,
      speedKnots,
    );

    // Daily fuel and emissions
    const dailyFuelTonnes =
      vessel.baseFuelConsumption * (1 + fuelPenalty / 100);
    const newEmissions =
      this.state.emissions + dailyFuelTonnes * CO2_FACTOR * simDays;

    this.state = {
      ...this.state,
      day: this.state.day + simDays,
      roughness: newRoughness,
      coatingHealth: newCoatingHealth,
      dragPenalty,
      fuelPenalty,
      dailyFuelTonnes,
      emissions: newEmissions,
    };
  }
}
