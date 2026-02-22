import React, { useEffect, useRef } from 'react';
import { SimulationState } from '../engine/Simulation';
import { VesselType } from '../engine/VesselTypes';

interface ShipCanvasProps {
    state: SimulationState;
}

// Helper to get hull characteristics based on vessel type
const getHullConfig = (vessel: VesselType) => {
    let hullWidthFactor = 1;
    let hullHeightFactor = 1;
    let bowShape: 'round' | 'pointed' | 'bulbous' | 'flat' = 'bulbous';
    let sternShape: 'angled' | 'flat' | 'rounded' = 'angled';
    let color = '#b91c1c'; // default red antifoul

    switch(vessel.id) {
        case 'yacht':
            hullWidthFactor = 0.6; hullHeightFactor = 0.5; bowShape = 'pointed'; sternShape = 'rounded'; color = '#1e3a8a'; // blue
            break;
        case 'coastal_freighter':
            hullWidthFactor = 0.7; hullHeightFactor = 0.6; bowShape = 'round'; sternShape = 'angled';
            break;
        case 'handysize_bulker':
            hullWidthFactor = 0.8; hullHeightFactor = 0.7; bowShape = 'bulbous'; sternShape = 'angled';
            break;
        case 'panamax_bulker':
            hullWidthFactor = 0.85; hullHeightFactor = 0.75; bowShape = 'bulbous'; sternShape = 'angled';
            break;
        case 'capesize_bulker':
            hullWidthFactor = 0.9; hullHeightFactor = 0.8; bowShape = 'bulbous'; sternShape = 'angled';
            break;
        case 'feeder_container':
            hullWidthFactor = 0.8; hullHeightFactor = 0.8; bowShape = 'flat'; sternShape = 'angled'; color = '#155e75'; // cyan-dark
            break;
        case 'post_panamax_container':
            hullWidthFactor = 0.9; hullHeightFactor = 0.9; bowShape = 'flat'; sternShape = 'angled'; color = '#164e63'; // cyan-darker
            break;
        case 'suezmax_tanker':
            hullWidthFactor = 0.95; hullHeightFactor = 0.85; bowShape = 'round'; sternShape = 'flat'; color = '#7c2d12'; // brown-red
            break;
        case 'vlcc':
            hullWidthFactor = 1; hullHeightFactor = 0.9; bowShape = 'round'; sternShape = 'flat'; color = '#991b1b'; // red-darker
            break;
    }
    return { hullWidthFactor, hullHeightFactor, bowShape, sternShape, color };
};


const ShipCanvas: React.FC<ShipCanvasProps> = ({ state }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const drawShip = (ctx: CanvasRenderingContext2D, width: number, height: number, vessel: VesselType, roughness: number) => {
        ctx.clearRect(0, 0, width, height);
        
        // Water
        ctx.fillStyle = '#0a192f'; // slate-900
        ctx.fillRect(0, 0, width, height);
        
        // Dynamic Water Line
        const waterLineY = height / 2 - 80;
        const gradient = ctx.createLinearGradient(0, waterLineY, 0, height);
        gradient.addColorStop(0, '#1e40af'); // blue-800
        gradient.addColorStop(1, '#0f172a'); // slate-900
        ctx.fillStyle = gradient;
        ctx.fillRect(0, waterLineY, width, height - waterLineY);

        const { hullWidthFactor, hullHeightFactor, bowShape, sternShape, color } = getHullConfig(vessel);
        
        // Ship Hull Base (Side Profile)
        const shipBaseX = width / 2 - (600 * hullWidthFactor) / 2;
        const shipBaseY = waterLineY - 100;
        const shipW = 600 * hullWidthFactor;
        const shipH = 200 * hullHeightFactor;

        ctx.save();
        
        // Hull Shape based on type
        ctx.beginPath();
        ctx.moveTo(shipBaseX, shipBaseY);
        ctx.lineTo(shipBaseX + shipW, shipBaseY); // Top deck

        // Stern
        if (sternShape === 'angled') {
            ctx.lineTo(shipBaseX + shipW - shipW * 0.1, shipBaseY + shipH);
        } else if (sternShape === 'rounded') {
            ctx.quadraticCurveTo(shipBaseX + shipW + 20, shipBaseY + shipH * 0.5, shipBaseX + shipW - shipW * 0.1, shipBaseY + shipH);
        } else { // flat
            ctx.lineTo(shipBaseX + shipW, shipBaseY + shipH);
        }
        
        // Bottom/Keel
        ctx.lineTo(shipBaseX + shipW * 0.15, shipBaseY + shipH); // Start of keel/bow transition
        
        // Bow
        if (bowShape === 'pointed') {
            ctx.lineTo(shipBaseX - shipW * 0.1, shipBaseY + shipH * 0.5);
        } else if (bowShape === 'bulbous') {
            ctx.quadraticCurveTo(shipBaseX - shipW*0.1, shipBaseY + shipH + 50, shipBaseX + shipW * 0.05, shipBaseY + shipH);
        } else if (bowShape === 'round') {
            ctx.quadraticCurveTo(shipBaseX - shipW*0.1, shipBaseY + shipH * 0.7, shipBaseX + shipW * 0.15, shipBaseY + shipH);
        } else { // flat
            ctx.lineTo(shipBaseX + shipW * 0.15, shipBaseY + shipH);
        }
        ctx.closePath();
        
        // Base Hull Color
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#3f3f3f'; // Dark grey outline
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fouling Layer!
        ctx.clip(); // Constrain drawing to the ship shape

        // Slime layer (Green tint)
        // Roughness to intensity mapping - very subjective, adjust as needed
        const maxRoughnessVisual = 1500; // Max roughness for visual scaling
        const intensity = Math.min(roughness / maxRoughnessVisual, 1);
        
        if (roughness > 150) { // Start showing slime after some initial fouling
            // Slime color with alpha based on roughness
            ctx.fillStyle = `rgba(34, 197, 94, ${0.3 * intensity})`; // green-500
            ctx.fillRect(shipBaseX - shipW * 0.1, shipBaseY, shipW * 1.2, shipH + shipH * 0.2);
        }

        // Barnacles / Hard fouling (Random dots)
        const barnacleCount = Math.floor(roughness * 1.5); // More barnacles as roughness increases
        
        if (barnacleCount > 0) {
            ctx.fillStyle = '#166534'; // green-800, for barnacles
            for (let i = 0; i < barnacleCount; i++) {
                // Random position within hull bounding box (clipping handles the shape)
                const rx = shipBaseX + Math.random() * shipW;
                const ry = shipBaseY + Math.random() * shipH * 1.1; // allow slightly below water line for visual effect
                const size = 1.5 + Math.random() * 3;
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
        const resizeCanvas = () => {
             canvas.width = window.innerWidth;
             canvas.height = window.innerHeight;
             drawShip(ctx!, canvas.width, canvas.height, state.config.vessel, state.roughness);
        };

        resizeCanvas(); // Initial draw
        window.addEventListener('resize', resizeCanvas);

        // Redraw on state change
        drawShip(ctx, canvas.width, canvas.height, state.config.vessel, state.roughness);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [state]); // Redraw when vessel type or roughness changes

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default ShipCanvas;