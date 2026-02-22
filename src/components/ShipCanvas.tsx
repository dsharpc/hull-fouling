import { useEffect, useRef } from 'react';
import { SimulationState } from '../engine/Simulation';

interface ShipCanvasProps {
    state: SimulationState;
}

const ShipCanvas: React.FC<ShipCanvasProps> = ({ state }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Procedural fouling generator
    // We'll generate random points based on the roughness
    const drawShip = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.clearRect(0, 0, width, height);
        
        // Water
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Dynamic Water Line
        const gradient = ctx.createLinearGradient(0, height/2, 0, height);
        gradient.addColorStop(0, '#1e40af'); // blue-800
        gradient.addColorStop(1, '#0f172a'); // slate-900
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height/2 + 50, width, height/2 - 50);

        // Ship Hull (Side Profile)
        const shipY = height / 2 - 100;
        const shipX = width / 2 - 300;
        const shipW = 600;
        const shipH = 200;

        ctx.save();
        
        // Hull Shape
        ctx.beginPath();
        ctx.moveTo(shipX, shipY);
        ctx.lineTo(shipX + shipW, shipY); // Top deck
        ctx.lineTo(shipX + shipW - 50, shipY + shipH); // Stern angle
        ctx.lineTo(shipX + 50, shipY + shipH); // Keel
        ctx.lineTo(shipX - 30, shipY + 50); // Bow bulb start
        ctx.quadraticCurveTo(shipX - 60, shipY + 150, shipX + 50, shipY + shipH); // Bulbous bow custom
        ctx.closePath();
        
        // Base Hull Color (Red antifoul)
        ctx.fillStyle = '#b91c1c'; // red-700
        ctx.fill();
        ctx.strokeStyle = '#7f1d1d';
        ctx.stroke();

        // Fouling Layer!
        // The heavier the fouling, the more green/brown "noise" we draw on the hull area.
        ctx.clip(); // Constrain drawing to the ship shape

        // const intensity = Math.min(state.roughness / 500, 1); // Normalize roughness for visual intensity
        
        // Slime layer (Green tint)
        if (state.roughness > 150) {
            ctx.fillStyle = `rgba(20, 83, 45, ${Math.min((state.roughness - 150) / 3000, 0.4)})`;
            ctx.fillRect(shipX - 100, shipY, shipW + 200, shipH + 100);
        }

        // Barnacles / Hard fouling (Random dots)
        // We use a defined seed based on 'day' effectively, but since canvas isn't retained 
        // we'll simulate it by drawing more random dots based on roughness count.
        // Optimization: In a real game, this would be a texture.
        const barnacleCount = Math.floor((state.roughness - 100) * 2); 
        
        if (barnacleCount > 0) {
            // Use a pseudo-random seed to keep barnacles in same place? 
            // For MVP, just random noise is fine, it will look like "shimmering" growth which is okay-ish,
            // but static is better. We'll use a simple deterministic approach if possible or just accept the noise.
            
            ctx.fillStyle = '#3f6212'; // lime-900
            for (let i = 0; i < barnacleCount; i++) {
                // Random position within bounding box (clipping handles the shape)
                const rx = shipX + Math.random() * shipW;
                const ry = shipY + Math.random() * shipH;
                const size = 2 + Math.random() * 4;
                ctx.beginPath();
                ctx.arc(rx, ry, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle resize
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        drawShip(ctx, canvas.width, canvas.height);
        
        const handleResize = () => {
             canvas.width = window.innerWidth;
             canvas.height = window.innerHeight;
             drawShip(ctx, canvas.width, canvas.height);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [state]); // Redraw on state change

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default ShipCanvas;
