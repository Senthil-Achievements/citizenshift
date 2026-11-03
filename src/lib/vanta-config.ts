/**
 * Configuration model and defaults for the Vanta.js BIRDS civic animation.
 * Initial parameters match the user's supplied Strikingly configuration,
 * adapted for modern React architecture and theme-aware contrast.
 */

export interface VantaBirdsConfig {
  enabled: boolean;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  minHeight: number;
  minWidth: number;
  scale: number;
  scaleMobile: number;
  birdSize: number;       // Supplied: 0.90
  wingSpan: number;       // Supplied: 11.00
  speedLimit: number;     // Supplied: 7.00
  separation: number;     // Supplied: 100.00
  alignment: number;      // Supplied: 84.00
  cohesion: number;       // Supplied: 92.00
  quantity: number;       // Density: 3.00
  color1: string;         // Primary bird color (Hex)
  color2: string;         // Secondary wing accent (Hex)
  backgroundColor: string;// Background canvas (Hex)
  backgroundAlpha: number;// 0.0 (transparent) to 1.0 (opaque)
}

export const DEFAULT_VANTA_BIRDS_CONFIG: VantaBirdsConfig = {
  enabled: true,
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200.0,
  minWidth: 200.0,
  scale: 1.0,
  scaleMobile: 1.0,
  birdSize: 0.9,
  wingSpan: 11.0,
  speedLimit: 7.0,
  separation: 100.0,
  alignment: 84.0,
  cohesion: 92.0,
  quantity: 3.0,
  color1: "#38bdf8",      // Ice/Sky blue accent (matches CitizenShift --color-icy)
  color2: "#e11d48",      // Berry red accent (matches CitizenShift --color-berry)
  backgroundColor: "#070d19", // Deep civic navy
  backgroundAlpha: 0.0,   // Transparent to blend seamlessly with underlying photo/gradients
};

/** Convert hex string (e.g. '#38bdf8') to number (0x38bdf8) for Three/Vanta */
export function hexToVantaColor(hex: string): number {
  const clean = hex.replace("#", "").trim();
  const num = parseInt(clean, 16);
  return Number.isNaN(num) ? 0x38bdf8 : num;
}

