import React, { useEffect, useRef, useState } from 'react';
import { Simulation, SimulationState } from './engine/Simulation';
import ShipCanvas from './components/ShipCanvas';
import Dashboard from './components/Dashboard';

const sim = new Simulation();

function App() {
  const [gameState, setGameState] = useState<SimulationState>(sim.state);
  const [isRunning, setIsRunning] = useState(false);
  const requestRef = useRef<number>();

  const loop = () => {
    if (isRunning) {
      sim.tick(1); // 1 day per frame for fast forwarding
      setGameState({ ...sim.state });
      requestRef.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(requestRef.current!);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isRunning]);

  const handleReset = () => {
    sim.reset();
    setGameState({ ...sim.state });
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white overflow-hidden">
      <header className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-cyan-400">Hull Fouling Simulator v0.1</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded font-bold transition-colors ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {isRunning ? 'PAUSE' : 'START SIMULATION'}
          </button>
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded transition-colors"
          >
            RESET
          </button>
        </div>
      </header>
      
      <main className="flex-1 relative">
        <ShipCanvas state={gameState} />
        
        <div className="absolute top-4 left-4 z-20 w-80">
            <Dashboard state={gameState} />
        </div>
      </main>
    </div>
  );
}

export default App;
