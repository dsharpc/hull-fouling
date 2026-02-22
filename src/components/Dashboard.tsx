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

  return (
    <div className="bg-slate-800/90 backdrop-blur border border-slate-600 p-5 rounded-lg shadow-xl text-slate-200 w-72 space-y-4">
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
          <span className="text-xs text-slate-400">Avg Hull Roughness (AHR)</span>
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
          <span>New ({state.config.vessel.baseRoughness} µm)</span>
          <span>Heavily fouled (1500 µm)</span>
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
        <Stat
          label="Daily Fuel"
          value={state.dailyFuelTonnes.toFixed(1)}
          unit="t/day"
        />
        <Stat
          label="Coating Health"
          value={state.coatingHealth.toFixed(0)}
          unit="%"
          color={state.coatingHealth < 30 ? 'text-red-400' : 'text-green-400'}
        />
      </div>

      {/* Emissions */}
      <div className="pt-2 border-t border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2 text-center">
          Cumulative CO₂ Impact
        </div>
        
        <div className="text-center mb-3">
          <span className="text-3xl font-bold font-mono text-white">
            {state.emissions > 1000
              ? `${(state.emissions / 1000).toFixed(2)}k`
              : state.emissions.toFixed(0)}
          </span>
          <span className="text-xs ml-1 text-slate-400">tonnes Total</span>
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
            <div className="text-slate-400">
              {state.emissionsClean > 1000 
                ? `${(state.emissionsClean/1000).toFixed(1)}k` 
                : state.emissionsClean.toFixed(0)} t
            </div>
          </div>
          <div className="text-right">
            <div className="text-red-400 font-bold">Fouling Penalty</div>
            <div className="text-slate-400">
              {state.emissionsPenalty > 1000 
                ? `${(state.emissionsPenalty/1000).toFixed(1)}k` 
                : state.emissionsPenalty.toFixed(0)} t
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
