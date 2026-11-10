"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Dynamically import Originkit ProximityOrbit to ensure 100% SSR safety and hydration stability
const ProximityOrbit = dynamic(
  () => import("@/components/originkit/ui/proximityorbit"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full flex items-center justify-center">
        <div className="size-16 rounded-full border border-white/20 border-t-berry animate-spin" />
      </div>
    ),
  }
);

const CIVIC_ORBIT_IMAGES = [
  "/photo/townhall.jpg",
  "/photo/hearing.jpg",
  "/photo/crowd.jpg",
  "/photo/hero.jpg",
  "/team/erin-chouinard.jpg",
  "/team/sav-perera.jpg",
  "/team/ariana-warden.jpg",
  "/team/james-douglas.jpg",
];

export default function CivicOrbitSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle interactive parallax tilt tracking the cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <section
      id="orbit-tracker"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="scroll-mt-20 relative bg-[#060913] py-20 sm:py-28 overflow-hidden text-paper border-none select-none"
      aria-label="Civic Orbit Tracking System"
    >
      {/* Ambient Radial Depth Glows */}
      <div
        className="pointer-events-none absolute -top-32 left-1/3 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18)_0%,transparent_70%)] transform-gpu will-change-transform"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-1/3 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.18)_0%,transparent_70%)] transform-gpu will-change-transform"
        aria-hidden="true"
      />

      <div className="shell relative z-10 text-center mb-10 sm:mb-14">
        {/* Eyebrow with pulsing beacon */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-sm">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-berry opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-berry" />
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-white/90">
            03.5 / Civic Orbit Tracking · 50-State Pulse
          </span>
        </div>

        <h2 className="font-display text-[clamp(2rem,4.5vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
          Orbiting the Public Record.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-white/70">
          Real-time constituent assemblies, congressional hearings, and grassroots leaders tracking legislation across all 50 states in continuous civic orbit.
        </p>
      </div>

      {/* Orbit Visualization Canvas Container */}
      <div className="relative mx-auto max-w-5xl h-[520px] sm:h-[600px] flex items-center justify-center overflow-visible">
        {/* Background Keplerian Orbital Track Rings with Cursor-Reactive 3D Tilt */}
        <motion.div
          animate={{
            rotateX: mousePos.y * -20,
            rotateY: mousePos.x * 20,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          {/* Inner Orbit Track */}
          <div className="absolute size-[280px] sm:size-[340px] rounded-full border border-white/10" />

          {/* Middle Orbit Track with subtle dashes */}
          <div className="absolute size-[420px] sm:size-[500px] rounded-full border border-dashed border-white/15" />

          {/* Outer Orbit Track */}
          <div className="absolute size-[560px] sm:size-[680px] rounded-full border border-white/[0.07]" />

          {/* Floating Orbiting Satellite Markers */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
            className="absolute size-[420px] sm:size-[500px] rounded-full"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 size-2 rounded-full bg-berry shadow-[0_0_12px_#f43f5e]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
          </motion.div>

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 52, repeat: Infinity, ease: "linear" }}
            className="absolute size-[560px] sm:size-[680px] rounded-full"
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 size-2.5 rounded-full bg-amber-400 shadow-[0_0_14px_#fbbf24]" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
          </motion.div>
        </motion.div>

        {/* Central CitizenShift Core Badge */}
        <div className="relative z-20 pointer-events-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="group flex flex-col items-center justify-center p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-white/20 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_50px_rgba(244,63,94,0.25)] transition-all cursor-default text-center max-w-[200px] sm:max-w-[240px]"
          >
            {/* Core Logo / Brand Badge */}
            <div className="size-11 sm:size-12 rounded-full bg-gradient-to-tr from-berry via-purple-600 to-sky-400 p-[1.5px] shadow-md mb-3">
              <div className="size-full rounded-full bg-[#060913] flex items-center justify-center">
                <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-widest">
                  CS
                </span>
              </div>
            </div>

            <h3 className="font-display font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
              CITIZEN CORE
            </h3>
            <p className="mt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-icy/75">
              50-State Assembly
            </p>

            <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[9px] text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ORBIT SYNCHRONIZED</span>
            </div>
          </motion.div>
        </div>

        {/* Originkit Proximity Orbit Component */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
          <ProximityOrbit
            images={CIVIC_ORBIT_IMAGES}
            orbitRadius={9}
            imageScale={6.5}
            rounded={8}
            speed={3.2}
            direction="counterclockwise"
            hoverAnimation={{
              type: "speedUp",
              speedMultiplier: 3.5,
              scale: 6,
              opacity: 100,
            }}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </div>

      {/* Orbit Interaction Caption / Hint */}
      <div className="mt-4 text-center relative z-20">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-white/50">
          [ Hover or Drag across orbit to accelerate tracking speed ]
        </p>
      </div>
    </section>
  );
}

