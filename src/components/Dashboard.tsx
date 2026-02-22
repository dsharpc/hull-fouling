import { SimulationState } from '../engine/Simulation';

interface DashboardProps {
  state: SimulationState;
}

function Stat({
  label,
  value,
  unit,
  color = 'text-white',
}: {
  label: string;
  value: string;
  unit: string;
  color?: string;
}) {
  return (
    <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>
        {value}
        <span className="text-xs text-slate-500 ml-1">{unit}</span>
      </div>
    </div>
  );
}

// Helper to format large numbers
const fmtK = (n: number) => (n > 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0));
const fmtM = (n: number) => (n > 1000000 ? `${(n / 1000000).toFixed(2)}M` : fmtK(n));

export default function Dashboard({ state }: DashboardProps) {
  const roughnessPct = Math.min((state.roughness / 1500) * 100, 100);
  const roughnessColor =
    state.roughness > 600
      ? 'text-red-400'
      : state.roughness > 300
      ? 'text-amber-400'
      : 'text-green-400';

  const penaltyColor = (pct: number) =>
    pct > 20 ? 'text-red-400' : pct > 10 ? 'text-amber-400' : 'text-orange-300';
    
  const totalCost = state.fuelCostClean + state.fuelCostPenalty; 
  // Note: simulation state tracks total cost. 
  const price = state.config.fuelPricePerTonne;

  return (
    <div className="bg-slate-800/90 backdrop-blur border border-slate-600 p-5 rounded-lg shadow-xl text-slate-200 w-80 space-y-4 max-h-[90vh] overflow-y-auto">
      <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wide border-b border-slate-700 pb-2">
        Vessel Metrics
      </h2>

      {/* Time */}
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-400">Time Elapsed</span>
        <span className="text-xl font-mono font-bold">
          {state.day < 365
            ? `${state.day.toFixed(0)} days`
            : `${(state.day / 365).toFixed(1)} yrs`}
        </span>
      </div>

      {/* Roughness bar */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs text-slate-400">Avg Hull Roughness</span>
          <span className={`font-mono font-bold ${roughnessColor}`}>
            {state.roughness.toFixed(0)} <span className="text-xs text-slate-500">µm</span>
          </span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              state.roughness > 600 ? 'bg-red-500' : state.roughness > 300 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${roughnessPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-0.5">
          <span>New ({state.config.vessel.baseRoughness})</span>
          <span>Fouled (1500)</span>
        </div>
      </div>

      {/* Penalties */}
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Drag Increase"
          value={`+${state.dragPenalty.toFixed(1)}`}
          unit="%"
          color={penaltyColor(state.dragPenalty)}
        />
        <Stat
          label="Fuel Penalty"
          value={`+${state.fuelPenalty.toFixed(1)}`}
          unit="%"
          color={penaltyColor(state.fuelPenalty)}
        />
      </div>
      
      {/* Daily Consumption */}
      <div className="border-t border-slate-700 pt-2">
        <div className="text-xs text-slate-400 uppercase mb-2">Daily Fuel Consumption</div>
        <div className="flex justify-between items-end mb-1">
             <span className="text-2xl font-bold font-mono text-white">{state.dailyFuelTonnes.toFixed(1)}</span>
             <span className="text-sm text-slate-500 mb-1">tonnes/day</span>
        </div>
        <div className="flex justify-between text-xs">
            <span className="text-blue-400">Base: {(state.dailyFuelTonnes / (1 + state.fuelPenalty/100)).toFixed(1)}t</span>
            <span className="text-red-400">Penalty: {(state.dailyFuelTonnes - (state.dailyFuelTonnes / (1 + state.fuelPenalty/100))).toFixed(1)}t</span>
        </div>
      </div>

      {/* Emissions Impact */}
      <div className="pt-2 border-t border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2 text-center">
          Cumulative CO₂ Impact
        </div>
        
        <div className="text-center mb-2">
          <span className="text-3xl font-bold font-mono text-white">
            {fmtK(state.emissions)}
          </span>
          <span className="text-xs ml-1 text-slate-400">tonnes</span>
        </div>

        {/* Breakdown Bar */}
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden flex mb-2">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(state.emissionsClean / (state.emissions || 1)) * 100}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${(state.emissionsPenalty / (state.emissions || 1)) * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-xs transition-colors">
          <div className="text-left">
            <div className="text-blue-400 font-bold">Standard</div>
            <div className="text-slate-400">{fmtK(state.emissionsClean)} t</div>
          </div>
          <div className="text-right">
            <div className="text-red-400 font-bold">Penalty</div>
            <div className="text-slate-400">{fmtK(state.emissionsPenalty)} t</div>
          </div>
        </div>
      </div>

      {/* Cost Impact */}
      <div className="pt-2 border-t border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2 text-center">
          Cumulative Fuel Cost
        </div>
        
        <div className="text-center mb-2">
          <span className="text-3xl font-bold font-mono text-green-400">
            ${fmtM(totalCost)}
          </span>
          <span className="text-xs ml-1 text-slate-400">USD</span>
        </div>

        {/* Breakdown Bar */}
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden flex mb-2">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(state.fuelCostClean / (totalCost || 1)) * 100}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${(state.fuelCostPenalty / (totalCost || 1)) * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-xs transition-colors">
          <div className="text-left">
            <div className="text-blue-400 font-bold">Base Cost</div>
            <div className="text-slate-400">${fmtM(state.fuelCostClean)}</div>
          </div>
          <div className="text-right">
            <div className="text-red-400 font-bold">Penalty Cost</div>
            <div className="text-slate-400">${fmtM(state.fuelCostPenalty)}</div>
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-500 mt-2">
            @ ${price}/tonne
        </div>
      </div>

    </div>
  );
}
