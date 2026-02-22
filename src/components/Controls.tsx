import { useState } from 'react';
import { VESSEL_TYPES, VESSEL_CATEGORIES, VesselType } from '../engine/VesselTypes';
import { SimulationState } from '../engine/Simulation';

const SIM_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 2.5, 3];
const MIN_SPEED_KNOTS = 4;
const MAX_SPEED_KNOTS = 30;
const SPEED_SNAP_POINTS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

interface ControlsProps {
  vessel: VesselType;
  speedKnots: number;
  simSpeed: number;
  isRunning: boolean;
  onVesselChange: (v: VesselType) => void;
  onSpeedChange: (knots: number) => void;
  onSimSpeedChange: (mult: number) => void;
  onToggleRun: () => void;
  onReset: () => void;
  state: SimulationState; // Passed down to determine current vessel data for hull drawing
}

export default function Controls({
  vessel,
  speedKnots,
  simSpeed,
  isRunning,
  onVesselChange,
  onSpeedChange,
  onSimSpeedChange,
  onToggleRun,
  onReset,
  state, // Receive state to pass to custom vessel hull drawing
}: ControlsProps) {
  const [showMs, setShowMs] = useState(false);

  const knotsToMs = (k: number) => (k * 0.514444).toFixed(1);

  const handleSpeedRelease = (raw: number) => {
    // Snap to nearest defined point on release
    const snapped = SPEED_SNAP_POINTS.reduce((prev, curr) =>
      Math.abs(curr - raw) < Math.abs(prev - curr) ? curr : prev,
    );
    onSpeedChange(snapped);
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur border border-slate-600 rounded-lg shadow-xl text-slate-200 p-4 space-y-5 w-72">
      {/* Run / Reset */}
      <div className="flex gap-2">
        <button
          onClick={onToggleRun}
          className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRunning ? '❚❚ PAUSE' : '▶ START'}
        </button>
        <button
          onClick={onReset}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
        >
          ↺ RESET
        </button>
      </div>

      {/* Vessel Type */}
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">
          Vessel Type
        </label>
        <select
          value={vessel.id}
          onChange={e => {
            const v = VESSEL_TYPES.find(t => t.id === e.target.value)!;
            onVesselChange(v);
          }}
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          {VESSEL_CATEGORIES.map(cat => (
            <optgroup key={cat} label={`── ${cat} ──`}>
              {VESSEL_TYPES.filter(v => v.category === cat).map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1 italic">{vessel.description}</p>
        <p className="text-xs text-slate-500">
          Ref. speed: <span className="text-slate-300">{vessel.referenceSpeed} kn</span>
          {' · '}Base fuel: <span className="text-slate-300">{vessel.baseFuelConsumption} t/day</span>
        </p>
      </div>

      {/* Vessel Speed */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-slate-400 uppercase tracking-wide">
            Vessel Speed
          </label>
          <button
            onClick={() => setShowMs(!showMs)}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            {showMs ? 'kn' : 'm/s'} →
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* For range input, use a controlled value linked to state */}
          <input
            type="range"
            min={MIN_SPEED_KNOTS}
            max={MAX_SPEED_KNOTS}
            step={1}
            value={speedKnots}
            onChange={e => onSpeedChange(Number(e.target.value))}
            onMouseUp={e => handleSpeedRelease(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={e => handleSpeedRelease(Number((e.target as HTMLInputElement).value))}
            className="flex-1 accent-cyan-400"
          />
          <span className="text-lg font-mono font-bold text-cyan-400 w-20 text-right">
            {showMs ? `${knotsToMs(speedKnots)} m/s` : `${speedKnots} kn`}
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-0.5">
          <span>{MIN_SPEED_KNOTS} kn</span>
          <span>{MAX_SPEED_KNOTS} kn</span>
        </div>
        {speedKnots > vessel.referenceSpeed * 1.2 && (
          <p className="text-xs text-amber-400 mt-1">
            ⚠ Above typical service speed for this vessel
          </p>
        )}
      </div>

      {/* Simulation Speed */}
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
          Simulation Speed
        </label>
        <div className="flex gap-1 flex-wrap">
          {SIM_SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSimSpeedChange(s)}
              className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
                simSpeed === s
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
