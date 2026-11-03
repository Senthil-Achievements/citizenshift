"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DEFAULT_VANTA_BIRDS_CONFIG,
  hexToVantaColor,
  type VantaBirdsConfig,
} from "@/lib/vanta-config";
import { loadVantaBirdsScripts } from "@/lib/vanta-loader";
import type { VantaEffect } from "@/types/vanta";

interface VantaBirdsProps {
  config?: Partial<VantaBirdsConfig>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Check if the browser environment supports WebGL
 */
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export function VantaBirds({
  config: customConfig,
  className = "",
  style,
  children,
}: VantaBirdsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<VantaEffect | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Merge supplied parameters with defaults
  const cfg: VantaBirdsConfig = {
    ...DEFAULT_VANTA_BIRDS_CONFIG,
    ...customConfig,
  };

  useEffect(() => {
    // 1. Accessibility: Check for user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !cfg.enabled) {
      return;
    }

    // 2. Hardware: WebGL check
    if (!isWebGLAvailable()) {
      return;
    }

    let isDisposed = false;

    // 3. Load vendor scripts and initialize effect
    loadVantaBirdsScripts().then((loaded) => {
      if (isDisposed || !loaded || !containerRef.current || !window.VANTA?.BIRDS) {
        return;
      }

      // If an instance is already active, destroy before re-initializing
      if (vantaRef.current) {
        try {
          vantaRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
      }

      try {
        vantaRef.current = window.VANTA.BIRDS({
          el: containerRef.current,
          mouseControls: cfg.mouseControls,
          touchControls: cfg.touchControls,
          gyroControls: cfg.gyroControls,
          minHeight: cfg.minHeight,
          minWidth: cfg.minWidth,
          scale: cfg.scale,
          scaleMobile: cfg.scaleMobile,
          birdSize: cfg.birdSize,
          wingSpan: cfg.wingSpan,
          speedLimit: cfg.speedLimit,
          separation: cfg.separation,
          alignment: cfg.alignment,
          cohesion: cfg.cohesion,
          quantity: cfg.quantity,
          color1: hexToVantaColor(cfg.color1),
          color2: hexToVantaColor(cfg.color2),
          backgroundColor: hexToVantaColor(cfg.backgroundColor),
          backgroundAlpha: cfg.backgroundAlpha,
        });

        setIsReady(true);
      } catch (err) {
        console.warn("Vanta BIRDS initialization skipped:", err);
      }
    });

    // 4. Cleanup on component unmount
    return () => {
      isDisposed = true;
      if (vantaRef.current) {
        try {
          vantaRef.current.destroy();
        } catch {
          // Safe ignore
        }
        vantaRef.current = null;
      }
    };
  }, [
    cfg.enabled,
    cfg.birdSize,
    cfg.wingSpan,
    cfg.speedLimit,
    cfg.separation,
    cfg.alignment,
    cfg.cohesion,
    cfg.quantity,
    cfg.color1,
    cfg.color2,
    cfg.backgroundColor,
    cfg.backgroundAlpha,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* Fallback overlay before WebGL is ready */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isReady ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />
      {children}
    </div>
  );
}

