export interface VesselType {
  id: string;
  name: string;
  category: string;
  referenceSpeed: number;   // knots
  baseFuelConsumption: number; // tonnes/day at reference speed
  hullLength: number;       // metres (used in Townsin formula)
  baseRoughness: number;    // initial AHR in microns
  foulingRate: number;      // microns/day baseline
  description: string;
}

export const VESSEL_TYPES: VesselType[] = [
  {
    id: 'yacht',
    name: 'Yacht',
    category: 'Recreational',
    referenceSpeed: 10,
    baseFuelConsumption: 0.5,
    hullLength: 20,
    baseRoughness: 75,
    foulingRate: 0.4,
    description: 'Small recreational motor/sailing yacht',
  },
  {
    id: 'coastal_freighter',
    name: 'Coastal Freighter',
    category: 'General Cargo',
    referenceSpeed: 11,
    baseFuelConsumption: 15,
    hullLength: 100,
    baseRoughness: 100,
    foulingRate: 0.8,
    description: 'Small coastal general cargo vessel (~5,000 DWT)',
  },
  {
    id: 'handysize_bulker',
    name: 'Handysize Bulker',
    category: 'Bulk Carrier',
    referenceSpeed: 13,
    baseFuelConsumption: 25,
    hullLength: 180,
    baseRoughness: 100,
    foulingRate: 1.0,
    description: 'Small bulk carrier (~30,000 DWT)',
  },
  {
    id: 'panamax_bulker',
    name: 'Panamax Bulker',
    category: 'Bulk Carrier',
    referenceSpeed: 13.5,
    baseFuelConsumption: 35,
    hullLength: 225,
    baseRoughness: 100,
    foulingRate: 1.1,
    description: 'Panamax bulk carrier (~75,000 DWT)',
  },
  {
    id: 'capesize_bulker',
    name: 'Capesize Bulker',
    category: 'Bulk Carrier',
    referenceSpeed: 14.5,
    baseFuelConsumption: 55,
    hullLength: 300,
    baseRoughness: 120,
    foulingRate: 1.2,
    description: 'Capesize bulk carrier (~180,000 DWT)',
  },
  {
    id: 'feeder_container',
    name: 'Feeder Container',
    category: 'Container',
    referenceSpeed: 18,
    baseFuelConsumption: 40,
    hullLength: 160,
    baseRoughness: 100,
    foulingRate: 1.3,
    description: 'Small feeder container ship (~1,000 TEU)',
  },
  {
    id: 'post_panamax_container',
    name: 'Post-Panamax Container',
    category: 'Container',
    referenceSpeed: 22,
    baseFuelConsumption: 150,
    hullLength: 370,
    baseRoughness: 120,
    foulingRate: 1.5,
    description: 'Large container ship (~15,000 TEU)',
  },
  {
    id: 'suezmax_tanker',
    name: 'Suezmax Tanker',
    category: 'Tanker',
    referenceSpeed: 14,
    baseFuelConsumption: 60,
    hullLength: 275,
    baseRoughness: 120,
    foulingRate: 1.2,
    description: 'Suezmax crude oil tanker (~130,000 DWT)',
  },
  {
    id: 'vlcc',
    name: 'VLCC',
    category: 'Tanker',
    referenceSpeed: 15,
    baseFuelConsumption: 100,
    hullLength: 330,
    baseRoughness: 125,
    foulingRate: 1.3,
    description: 'Very Large Crude Carrier (~300,000 DWT)',
  },
];

// Group by category for the UI dropdown
export const VESSEL_CATEGORIES = [...new Set(VESSEL_TYPES.map(v => v.category))];

export const DEFAULT_VESSEL = VESSEL_TYPES.find(v => v.id === 'panamax_bulker')!;
