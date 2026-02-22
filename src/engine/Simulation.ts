export interface SimulationState {
    day: number;
    roughness: number; // in microns (AHR)
    dragPenalty: number; // percentage increase in drag
    fuelPenalty: number; // percentage increase in fuel consumption
    emissions: number; // total accumulated CO2 in tonnes
    coatingHealth: number; // 0-100%
}

export class Simulation {
    public state: SimulationState;
    private baseFuelConsumption: number; // tonnes per day
    private baseDrag: number; // arbitrary units or Newtons
    
    // Linear fouling rate: microns per day increase
    // Real world: 0.5 - 5 microns/day depending on activity/location
    private foulingRate: number = 1.2; 

    constructor() {
        this.baseFuelConsumption = 50; // default 50 tonnes/day for a Panamax-ish vessel
        this.baseDrag = 1000; 
        
        this.state = {
            day: 0,
            roughness: 100, // Initial new-building roughness (approx 75-125 microns)
            dragPenalty: 0,
            fuelPenalty: 0,
            emissions: 0,
            coatingHealth: 100
        };
    }

    reset() {
        this.state = {
            day: 0,
            roughness: 120,
            dragPenalty: 0,
            fuelPenalty: 0,
            emissions: 0,
            coatingHealth: 100
        };
    }

    // Tick the simulation forward by 1 day
    tick(deltaTime: number = 1) {
        this.state.day += deltaTime;

        // Simple linear degradation model
        // As coating health drops, fouling accelerates slightly? 
        // For MVP: purely linear roughness growth
        this.state.roughness += this.foulingRate * deltaTime;
        this.state.coatingHealth = Math.max(0, this.state.coatingHealth - (0.05 * deltaTime));

        // Physics Approximation (Townsin's formula simplified)
        // Delta C_f = 0.044 * [ (k_2/L)^(1/3) - (k_1/L)^(1/3) ]
        // Simplified roughly: Power penalty ~ proportional to roughness^1/3 
        // A common rule of thumb: 10 micron increase ~ 1% power penalty (very rough)
        
        // Let's use a simplified power law for the visual feedback loop
        // Baseline roughness ~100.
        const roughnessDelta = Math.max(0, this.state.roughness - 100);
        
        // Relationship: Power penalty % ~= 0.5 * (Roughness increase)^(2/3)
        // This is a "videogame physics" approximation to get satisfying curves
        this.state.fuelPenalty = 0.1 * roughnessDelta; 
        
        // Drag penalty tracks fuel penalty at constant speed
        this.state.dragPenalty = this.state.fuelPenalty;

        // Emissions Calculation
        // Fuel * 3.114 (approx CO2 factor for HFO)
        const dailyFuel = this.baseFuelConsumption * (1 + (this.state.fuelPenalty / 100));
        this.state.emissions += dailyFuel * 3.114 * deltaTime;
    }
}
