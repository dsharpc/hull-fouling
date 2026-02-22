# Hull Fouling Simulator

An interactive web application demonstrating the impact of biofouling on ship performance.

## Overview

This simulator models the progression of hull roughness over time and calculates the resulting penalties in:
- **Drag Force**
- **Fuel Consumption**
- **CO2 Emissions**

The visualizer shows a procedurally "fouling" ship hull as time progresses.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```

3.  Open your browser to the local URL provided (usually `http://localhost:5173`).

## Project Structure

- `src/engine/Simulation.ts`: Core physics logic (linear roughness growth, fuel/drag penalty calculations).
- `src/components/ShipCanvas.tsx`: HTML5 Canvas visualization of the hull accumulating biofouling.
- `src/components/Dashboard.tsx`: React UI component displaying real-time simulation metrics.
- `src/App.tsx`: Main application loop and layout.

## Tech Stack

- **React + TypeScript**: UI and Application logic.
- **Vite**: Build tool and dev server.
- **Tailwind CSS**: Styling.
- **HTML5 Canvas**: Performance visualization.

## Future Plans

- Add temperature-dependent growth rates.
- Implement specialized antifouling coating types (SPC vs. foul release).
- Add support for different vessel classes (Capesize, VLCC, Container).
