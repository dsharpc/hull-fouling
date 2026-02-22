import React from 'react';
import { SimulationState } from '../engine/Simulation';

interface DashboardProps {
    state: SimulationState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
    return (
        <div className="bg-slate-800/90 backdrop-blur border border-slate-600 p-6 rounded-lg shadow-xl text-slate-200">
            <h2 className="text-lg font-bold mb-4 text-cyan-400 border-b border-slate-700 pb-2">Vessel Metrics</h2>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-400">Time Elapsed</span>
                    <span className="text-xl font-mono font-bold text-white">{state.day.toFixed(0)} <span className="text-xs text-slate-500">DAYS</span></span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-400">Avg. Roughness (AHR)</span>
                    <span className={`text-xl font-mono font-bold ${state.roughness > 300 ? 'text-red-400' : 'text-green-400'}`}>
                        {state.roughness.toFixed(1)} <span className="text-xs text-slate-500">µm</span>
                    </span>
                </div>

                <div className="w-full bg-slate-700 h-2 rounded mt-1 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${state.roughness > 500 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min((state.roughness / 1000) * 100, 100)}%` }}
                    />
                </div>

                <hr className="border-slate-700 my-2" />

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Fuel Penalty</div>
                        <div className="text-2xl font-bold text-orange-400">+{state.fuelPenalty.toFixed(1)}%</div>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
                         <div className="text-xs text-slate-400 mb-1">Total Drag Increase</div>
                         <div className="text-2xl font-bold text-orange-400">+{state.dragPenalty.toFixed(1)}%</div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="text-xs text-slate-400 text-center uppercase tracking-wide mb-2">Environmental Impact</div>
                    <div className="text-center">
                        <span className="text-3xl font-bold text-white">{state.emissions.toFixed(0)}</span>
                        <span className="text-xs ml-2 text-slate-400">TONNES CO2 (cumulative)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
