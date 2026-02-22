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
+
+// Currency helper (inline) for fuel costs
+const fmtUSD = (n:number) => '$' + n.toFixed(2);
@@
-      {/* Emissions */}
+      {/* Emissions */}
       <div className="pt-2 border-t border-slate-700 text-center">
         <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
           Cumulative CO₂ Emissions
         </div>
         <span className="text-3xl font-bold font-mono">
           {state.emissions > 1000
             ? `${(state.emissions / 1000).toFixed(2)}k`
             : state.emissions.toFixed(0)}
         </span>
         <span className="text-xs ml-1 text-slate-400">tonnes CO₂</span>
       </div>
+      {/* Fuel Cost Breakdown */}
+      <div className="pt-2 border-t border-slate-700 text-center">
+        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Fuel Cost breakdown</div>
+        <div className="grid grid-cols-2 gap-2 justify-center items-stretch max-w-md mx-auto">
+          <div className="p-2 bg-slate-900/50 rounded border border-slate-700">Base fuel</div>
+          <div className="p-2 bg-slate-900/50 rounded border border-slate-700 text-right">{state.dailyFuelCost.toFixed(2)} USD</div>
+          <div className="p-2 bg-slate-900/50 rounded border border-slate-700">Penalty fuel</div>
+          <div className="p-2 bg-slate-900/50 rounded border border-slate-700 text-right">{state.dailyFuelCostPenalty.toFixed(2)} USD</div>
+          <div className="p-2 bg-slate-900/50 rounded border border-slate-700">Total fuel</div>
+          <div className="p-2 bg-slate-900/50 rounded border border-slate-700 text-right">{state.dailyFuelCostTotal.toFixed(2)} USD</div>
+        </div>
+        <div className="mt-2"/>
+      </div>
*** End Patch