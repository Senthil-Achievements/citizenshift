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
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
          canvas.getContext("experimental-webgl")),
    );
  } catch {
    return true;
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
    if (!cfg.enabled) {
      return;
    }

    if (!isWebGLAvailable()) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
        const effectiveScaleMobile = isMobile ? Math.max(cfg.scaleMobile, 2.0) : cfg.scaleMobile;
        const effectiveQuantity = prefersReducedMotion
          ? 2.0
          : isMobile
            ? Math.min(cfg.quantity, 3.0)
            : cfg.quantity;
        const effectiveSpeed = prefersReducedMotion ? Math.min(cfg.speedLimit, 2.5) : cfg.speedLimit;
        const effectiveWingSpan = isMobile ? Math.min(cfg.wingSpan, 13.0) : cfg.wingSpan;

        vantaRef.current = window.VANTA.BIRDS({
          el: containerRef.current,
          mouseControls: cfg.mouseControls,
          touchControls: isMobile ? false : cfg.touchControls,
          gyroControls: cfg.gyroControls,
          minHeight: cfg.minHeight,
          minWidth: cfg.minWidth,
          scale: cfg.scale,
          scaleMobile: effectiveScaleMobile,
          birdSize: cfg.birdSize,
          wingSpan: effectiveWingSpan,
          speedLimit: effectiveSpeed,
          separation: cfg.separation,
          alignment: cfg.alignment,
          cohesion: cfg.cohesion,
          quantity: effectiveQuantity,
          color1: hexToVantaColor(cfg.color1),
          color2: hexToVantaColor(cfg.color2),
          backgroundColor: hexToVantaColor(cfg.backgroundColor),
          backgroundAlpha: cfg.backgroundAlpha,
        });

        if (vantaRef.current && typeof vantaRef.current.resize === "function") {
          vantaRef.current.resize();
        }

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

  // Pause WebGL rendering when hero is scrolled out of view for 60+ FPS scroll performance
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let isVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        if (visible !== isVisible) {
          isVisible = visible;
          const canvas = el.querySelector("canvas");
          if (canvas) {
            canvas.style.display = isVisible ? "block" : "none";
          }
        }
      },
      { threshold: 0.01, rootMargin: "120px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isReady]);

  return (
    <div
      ref={containerRef}
      data-vanta-birds="true"
      className={`relative overflow-hidden ${className}`}
      style={style}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

