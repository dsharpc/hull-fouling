import { useCallback, useEffect, useRef, useState } from 'react';
import { Simulation, SimulationState } from './engine/Simulation';
import { DEFAULT_VESSEL, VesselType } from './engine/VesselTypes';
import ShipCanvas from './components/ShipCanvas';
import Dashboard from './components/Dashboard';
import Controls from './components/Controls';

const sim = new Simulation();

export default function App() {
  const [gameState, setGameState] = useState<SimulationState>({ ...sim.state });
  const [isRunning, setIsRunning] = useState(false);
  const [vessel, setVessel] = useState<VesselType>(DEFAULT_VESSEL);
  const [speedKnots, setSpeedKnots] = useState(DEFAULT_VESSEL.referenceSpeed);
  const [simSpeed, setSimSpeed] = useState(1);

  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const loop = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaSeconds = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      sim.tick(deltaSeconds * simSpeed);
      setGameState({ ...sim.state });

      rafRef.current = requestAnimationFrame(loop);
    },
    [simSpeed],
  );

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, loop]);

  const handleVesselChange = (v: VesselType) => {
    setVessel(v);
    setSpeedKnots(v.referenceSpeed);
    sim.updateConfig({ vessel: v, speedKnots: v.referenceSpeed });
    setGameState({ ...sim.state });
  };

  const handleSpeedChange = (knots: number) => {
    setSpeedKnots(knots);
    sim.updateConfig({ speedKnots: knots });
    setGameState({ ...sim.state });
  };

  const handleSimSpeedChange = (mult: number) => {
    setSimSpeed(mult);
    sim.updateConfig({ simSpeed: mult });
  };

  const handleReset = () => {
    sim.reset();
    setGameState({ ...sim.state });
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between z-10 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-cyan-400">Hull Fouling Simulator</h1>
          <p className="text-xs text-slate-500">
            Visualise biofouling impact on drag, fuel, and emissions
          </p>
        </div>
        <span className="text-xs text-slate-500 hidden md:block">
          v0.2 · dsharpc/hull-fouling
        </span>
      </header>

      {/* Main canvas area */}
      <main className="flex-1 relative overflow-hidden">
        <ShipCanvas state={gameState} />

        {/* Left: Controls */}
        <div className="absolute top-4 left-4 z-20">
          <Controls
            vessel={vessel}
            speedKnots={speedKnots}
            simSpeed={simSpeed}
            isRunning={isRunning}
            onVesselChange={handleVesselChange}
            onSpeedChange={handleSpeedChange}
            onSimSpeedChange={handleSimSpeedChange}
            onToggleRun={() => setIsRunning(r => !r)}
            onReset={handleReset}
          />
        </div>

        {/* Right: Dashboard */}
        <div className="absolute top-4 right-4 z-20">
          <Dashboard state={gameState} />
        </div>
      </main>
    </div>
  );
}
