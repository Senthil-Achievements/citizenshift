/**
 * Types for Three.js and Vanta.js BIRDS integration
 */

export interface VantaBirdsOptions {
  el: HTMLElement | string;
  mouseControls?: boolean;
  touchControls?: boolean;
  gyroControls?: boolean;
  minHeight?: number;
  minWidth?: number;
  scale?: number;
  scaleMobile?: number;
  birdSize?: number;
  wingSpan?: number;
  speedLimit?: number;
  separation?: number;
  alignment?: number;
  cohesion?: number;
  quantity?: number;
  color1?: number | string;
  color2?: number | string;
  colorMode?: "lerp" | "variance" | "lerpGradient";
  backgroundColor?: number | string;
  backgroundAlpha?: number;
  THREE?: unknown;
}

export interface VantaEffect {
  destroy: () => void;
  resize: () => void;
  setOptions: (options: Partial<VantaBirdsOptions>) => void;
}

declare global {
  interface Window {
    THREE?: any;
    VANTA?: {
      BIRDS?: (options: VantaBirdsOptions) => VantaEffect;
      [key: string]: any;
    };
  }
}
