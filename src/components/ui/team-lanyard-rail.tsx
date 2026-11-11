"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export interface LanyardMember {
  id: string;
  name: string;
  role: string;
  team: string;
  tone: number; // 0 to 7
  image: string;
  bio: string;
  tags?: string[];
  idNumber?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface TeamLanyardRailProps {
  members: LanyardMember[];
  title?: string;
  subtitle?: string;
  className?: string;
}

// 8 Vibrant Tone Palettes matching the design
const TONES = [
  {
    name: "Crimson Berry",
    primary: "#e11d48",
    darker: "#be123c",
    light: "#fb7185",
    bgPattern: "from-rose-500 to-rose-600",
  },
  {
    name: "Royal Blue",
    primary: "#2563eb",
    darker: "#1d4ed8",
    light: "#60a5fa",
    bgPattern: "from-blue-600 to-blue-700",
  },
  {
    name: "Emerald Mint",
    primary: "#10b981",
    darker: "#059669",
    light: "#34d399",
    bgPattern: "from-emerald-500 to-emerald-600",
  },
  {
    name: "Amber Gold",
    primary: "#f59e0b",
    darker: "#d97706",
    light: "#fbbf24",
    bgPattern: "from-amber-500 to-amber-600",
  },
  {
    name: "Violet Purple",
    primary: "#8b5cf6",
    darker: "#7c3aed",
    light: "#a78bfa",
    bgPattern: "from-purple-500 to-purple-600",
  },
  {
    name: "Teal Mint",
    primary: "#0d9488",
    darker: "#0f766e",
    light: "#2dd4bf",
    bgPattern: "from-teal-500 to-teal-600",
  },
  {
    name: "Cobalt Blue",
    primary: "#0284c7",
    darker: "#0369a1",
    light: "#38bdf8",
    bgPattern: "from-sky-500 to-sky-600",
  },
  {
    name: "Deep Orange",
    primary: "#ea580c",
    darker: "#c2410c",
    light: "#fb923c",
    bgPattern: "from-orange-500 to-orange-600",
  },
];

// Clean Social SVG Icons
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterXIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.21a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
    </svg>
  );
}

// Single Interactive Lanyard Badge with React Bits Physics-Based Dragging & Swinging
function LanyardBadgeItem({
  member,
  defaultFlipped = false,
  index = 0,
}: {
  member: LanyardMember;
  defaultFlipped?: boolean;
  index?: number;
}) {
  const [isFlipped, setIsFlipped] = useState(defaultFlipped);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const tone = TONES[member.tone % TONES.length];

  // DOM element references for high-speed RAF physics transforms
  const cardRef = useRef<HTMLDivElement | null>(null);
  const strapRef = useRef<HTMLDivElement | null>(null);
  const cordRef = useRef<HTMLDivElement | null>(null);

  // Physics simulation state (extracted directly from React Bits Lanyard mechanics)
  // Natural pendulum length from rail anchor to badge center
  const REST_LENGTH = 150;

  const physicsRef = useRef({
    // Displacement from resting position (px)
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,

    // 3D rotations in degrees
    rotX: 0, // pitch (tilt up/down)
    rotY: 0, // yaw (tilt left/right)
    rotZ: 0, // roll / pendulum sway
    vRotX: 0,
    vRotY: 0,
    vRotZ: 0,

    // Drag interaction tracking
    isDragging: false,
    hasMovedSignificantly: false,
    pointerId: -1,
    startPointerX: 0,
    startPointerY: 0,
    currentPointerX: 0,
    currentPointerY: 0,
    grabOffsetX: 0,
    grabOffsetY: 0,
    startTime: 0,

    // Pointer velocity sampling for throw physics
    lastPointerX: 0,
    lastPointerY: 0,
    lastPointerTime: 0,
    pointerVx: 0,
    pointerVy: 0,

    // Organic noise phase offset for gentle idle breeze
    seed: (index + 1) * 1.618,
  });

  // Main 60-120fps physics loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      const p = physicsRef.current;

      if (p.isDragging) {
        // -------------------------------------------------------------
        // DRAGGING STATE: Follow pointer with elastic spring & 3D tilt
        // -------------------------------------------------------------
        const rawTargetX = p.currentPointerX - p.startPointerX;
        const rawTargetY = p.currentPointerY - p.startPointerY;

        // Soft elastic limits
        const targetX = Math.max(-240, Math.min(240, rawTargetX));
        const targetY = Math.max(-90, Math.min(300, rawTargetY));

        // Smooth spring responsiveness to pointer
        const followSpeed = 22;
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        p.vx = dx * followSpeed;
        p.vy = dy * followSpeed;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Dynamic 3D tilt while dragging:
        // Angle to anchor
        const strapAngle = Math.atan2(p.x, p.y + REST_LENGTH) * (180 / Math.PI);
        const targetRotZ = strapAngle * 0.85 + (p.grabOffsetX / 120) * 8 + p.vx * 0.015;
        const targetRotX = Math.max(-24, Math.min(24, -p.y * 0.08 - p.vy * 0.015));
        const targetRotY = Math.max(-28, Math.min(28, p.vx * 0.025 + (p.grabOffsetX / 120) * 14));

        p.rotZ += (targetRotZ - p.rotZ) * Math.min(1, dt * 18);
        p.rotX += (targetRotX - p.rotX) * Math.min(1, dt * 14);
        p.rotY += (targetRotY - p.rotY) * Math.min(1, dt * 14);
      } else {
        // -------------------------------------------------------------
        // FREE HANGING / THROWN STATE: Pendulum, Elasticity, Damping & Breeze
        // -------------------------------------------------------------
        const hangY = p.y + REST_LENGTH;
        const hangX = p.x;
        const hangDist = Math.hypot(hangX, hangY);
        const angleRad = Math.atan2(hangX, hangY);

        // React Bits Lanyard Physics Props:
        // Elasticity (spring restore), Gravity (pendulum restore), Damping (friction), Breeze (subtle wind)
        const kElastic = 48;  // spring restore
        const kGravity = 960; // pendulum gravity restore
        const damping = 3.6;  // friction damping
        const breeze = 0.5;   // ambient air current

        const stretch = hangDist - REST_LENGTH;
        const radialForce = -kElastic * stretch;
        const tangentForce = -kGravity * Math.sin(angleRad);

        const sinA = Math.sin(angleRad);
        const cosA = Math.cos(angleRad);
        let fx = radialForce * sinA + tangentForce * cosA;
        let fy = radialForce * cosA - tangentForce * sinA;

        // Downward gravity assist if pushed upward above rail
        if (p.y < 0) {
          fy += 1100 * Math.abs(p.y / REST_LENGTH);
        }

        // Apply velocity damping
        fx -= damping * p.vx;
        fy -= damping * p.vy;

        // Idle gentle breeze (organic continuous sway)
        const timeSec = now / 1000;
        const windX = breeze * (Math.sin(timeSec * 0.9 + p.seed) * 16 + Math.sin(timeSec * 2.1 + p.seed * 2) * 7);
        fx += windX;

        // Integrate translation
        p.vx += fx * dt;
        p.vy += fy * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Angular oscillation for RotZ (pendulum sway)
        const targetRotZ = (angleRad * (180 / Math.PI)) + Math.sin(timeSec * 0.9 + p.seed) * 1.2 * breeze;
        const rotSpring = 52;
        const rotDamping = 4.4;
        const fRotZ = -rotSpring * (p.rotZ - targetRotZ) - rotDamping * p.vRotZ;
        p.vRotZ += fRotZ * dt;
        p.rotZ += p.vRotZ * dt;

        // Angular restoration for pitch (RotX) and yaw (RotY)
        const fRotX = -55 * p.rotX - 5.0 * p.vRotX;
        p.vRotX += fRotX * dt;
        p.rotX += p.vRotX * dt;

        const fRotY = -55 * p.rotY - 5.0 * p.vRotY;
        p.vRotY += fRotY * dt;
        p.rotY += p.vRotY * dt;
      }

      // -------------------------------------------------------------
      // RENDER: Apply exact transformations to DOM elements
      // -------------------------------------------------------------
      const strapAngle = Math.atan2(p.x, p.y + REST_LENGTH) * (180 / Math.PI);
      const hangDist = Math.hypot(p.x, p.y + REST_LENGTH);
      const strapStretch = Math.max(0.95, Math.min(1.3, hangDist / REST_LENGTH));
      const cordLen = Math.max(0, p.y * 0.85);

      if (strapRef.current) {
        strapRef.current.style.transform = `rotate(${strapAngle.toFixed(2)}deg) scaleY(${strapStretch.toFixed(3)})`;
      }

      if (cordRef.current) {
        cordRef.current.style.height = `${cordLen.toFixed(1)}px`;
        cordRef.current.style.transform = `rotate(${strapAngle.toFixed(2)}deg)`;
      }

      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0px) rotateX(${p.rotX.toFixed(2)}deg) rotateY(${p.rotY.toFixed(2)}deg) rotateZ(${p.rotZ.toFixed(2)}deg)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [REST_LENGTH]);

  // Pointer interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary mouse button or touch
    if (e.button > 0) return;

    const p = physicsRef.current;
    p.pointerId = e.pointerId;
    p.isDragging = true;
    p.hasMovedSignificantly = false;
    p.startTime = performance.now();

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    p.grabOffsetX = e.clientX - centerX;
    p.grabOffsetY = e.clientY - centerY;

    p.startPointerX = e.clientX - p.x;
    p.startPointerY = e.clientY - p.y;
    p.currentPointerX = e.clientX;
    p.currentPointerY = e.clientY;

    p.lastPointerX = e.clientX;
    p.lastPointerY = e.clientY;
    p.lastPointerTime = performance.now();
    p.pointerVx = 0;
    p.pointerVy = 0;

    setIsGrabbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    if (!p.isDragging || p.pointerId !== e.pointerId) return;

    p.currentPointerX = e.clientX;
    p.currentPointerY = e.clientY;

    const movedDist = Math.hypot(e.clientX - (p.startPointerX + p.x), e.clientY - (p.startPointerY + p.y));
    if (movedDist > 6) {
      p.hasMovedSignificantly = true;
    }

    // Velocity sampling for throw physics
    const now = performance.now();
    const dt = Math.max(0.005, (now - p.lastPointerTime) / 1000);
    p.pointerVx = (e.clientX - p.lastPointerX) / dt;
    p.pointerVy = (e.clientY - p.lastPointerY) / dt;

    p.lastPointerX = e.clientX;
    p.lastPointerY = e.clientY;
    p.lastPointerTime = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    if (!p.isDragging || p.pointerId !== e.pointerId) return;

    const duration = performance.now() - p.startTime;

    // Distinguish between a click to flip and a physical drag/throw
    if (!p.hasMovedSignificantly && duration < 380) {
      // Tap / Quick click: flip the badge!
      setIsFlipped((prev) => !prev);
    } else {
      // Throw physics: inject sampled pointer velocity into badge momentum
      p.vx = Math.max(-1200, Math.min(1200, p.pointerVx * 0.45));
      p.vy = Math.max(-1200, Math.min(1200, p.pointerVy * 0.45));
    }

    p.isDragging = false;
    p.pointerId = -1;
    setIsGrabbing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    p.isDragging = false;
    p.pointerId = -1;
    setIsGrabbing(false);
  };

  return (
    <div className="relative flex flex-col items-center select-none flex-shrink-0 group">
      {/* 1. Metallic Sliding Ring around Rail */}
      <div className="relative z-20 flex flex-col items-center">
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 border border-zinc-400 shadow-md flex items-center justify-center -mb-1">
          <div className="w-2 h-2 rounded-full bg-zinc-700/60" />
        </div>

        {/* 2. Braided Textured Lanyard Strap with Stretch & Swivel Physics */}
        <div
          ref={strapRef}
          style={{
            transformOrigin: "top center",
            willChange: "transform",
          }}
          className="relative flex flex-col items-center"
        >
          <div className="relative w-3.5 sm:w-4 h-12 sm:h-14 shadow-md rounded-t-xs">
            {/* Diagonal woven fabric pattern */}
            <div
              className="w-full h-full"
              style={{
                background: `repeating-linear-gradient(45deg, ${tone.primary}, ${tone.primary} 4px, ${tone.darker} 4px, ${tone.darker} 8px)`,
              }}
            />
          </div>

          {/* 3. Retractable Circular Badge Reel (Anchored to strap) */}
          <div className="relative z-10 -mt-1 flex flex-col items-center">
            {/* Metal Crimp Clamp */}
            <div className="w-4 h-1.5 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 rounded-xs border border-zinc-500/40" />

            {/* Chrome Reel Casing */}
            <div className="w-6 sm:w-6.5 h-6 sm:h-6.5 rounded-full bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-500 border border-zinc-400 shadow-[0_3px_8px_rgba(0,0,0,0.45)] flex items-center justify-center my-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 border border-zinc-200/80 shadow-inner flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Visible Retractable Elastic Cord (Lengthens and angles toward card) */}
      <div
        ref={cordRef}
        style={{
          height: 0,
          width: 2,
          transformOrigin: "top center",
          willChange: "height, transform",
        }}
        className="relative z-10 bg-gradient-to-b from-zinc-500 via-zinc-300 to-zinc-600 shadow-[0_0_2px_rgba(255,255,255,0.6)]"
      />

      {/* 5. The Tactile Badge Card with React Bits Lanyard Physics Dragging & 3D Flip */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        tabIndex={0}
        role="button"
        aria-label={`ID Badge for ${member.name}. Drag or throw to swing, or click to flip.`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
        style={{
          touchAction: "none",
          willChange: "transform",
        }}
        className={`relative z-10 -mt-1 select-none perspective-[1200px] transition-[filter] duration-200 ${
          isGrabbing ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div
          className="relative w-[215px] sm:w-[235px] md:w-[250px] lg:w-[260px] h-[360px] sm:h-[385px] md:h-[405px] transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] [transform-style:preserve-3d] shadow-[0_18px_45px_rgba(0,0,0,0.65)] rounded-2xl"
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ========================================================
              FRONT OF BADGE (Default Face)
             ======================================================== */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden bg-[#101418] border border-white/10 flex flex-col justify-between [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {/* Top Colored Band with Punch Slot */}
            <div
              className="relative h-18 w-full flex items-start justify-center pt-2.5"
              style={{
                background: `repeating-linear-gradient(45deg, ${tone.primary}, ${tone.primary} 8px, ${tone.darker} 8px, ${tone.darker} 16px)`,
              }}
            >
              {/* Oval Badge Lanyard Slot Cutout */}
              <div className="w-7 h-2.5 rounded-full bg-[#0a0d10] border border-black/50 shadow-inner" />
            </div>

            {/* Circular Photo Window framed right below top band */}
            <div className="relative -mt-11 flex justify-center">
              <div className="relative w-22 h-22 sm:w-24 sm:h-24 md:w-26 md:h-26 rounded-full overflow-hidden border-[3px] border-white/90 shadow-[0_5px_18px_rgba(0,0,0,0.6)] bg-navy-900 pointer-events-none">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Member Details */}
            <div className="px-4 text-center -mt-1 flex-1 flex flex-col justify-center pointer-events-none">
              <h3 className="font-display font-bold text-base sm:text-lg md:text-xl text-white leading-tight">
                {member.name}
              </h3>
              <p className="mt-1 font-sans text-xs sm:text-[13px] text-white/85 font-semibold leading-tight">
                {member.role}
              </p>
              <p className="mt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-white/45">
                {member.team}
              </p>

              {/* Flip hint pill */}
              <div className="mt-2.5 inline-flex items-center justify-center gap-1.5 self-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] sm:text-[10px] font-mono text-white/60">
                <span>Click to read bio</span>
                <span className="text-white/80">↻</span>
              </div>
            </div>

            {/* Bottom Social Icons Row */}
            <div className="p-3 bg-black/45 border-t border-white/10 flex items-center justify-center gap-2.5">
              {/* Instagram */}
              <a
                href={member.socials?.instagram || "#"}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on Instagram`}
                className="w-8.5 h-8.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-sm"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
              </a>

              {/* Twitter / X */}
              <a
                href={member.socials?.twitter || "#"}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on X / Twitter`}
                className="w-8.5 h-8.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-sm"
              >
                <TwitterXIcon className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
              </a>

              {/* LinkedIn */}
              <a
                href={member.socials?.linkedin || "#"}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="w-8.5 h-8.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-sm"
              >
                <LinkedInIcon className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* ========================================================
              BACK OF BADGE (Flipped Face - Forward oriented)
             ======================================================== */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden bg-[#101418] border border-white/10 flex flex-col justify-between p-4 sm:p-5 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Top Header with Accent Dot */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 pointer-events-none">
              <div>
                <h4 className="font-display font-bold text-sm sm:text-base text-white leading-tight">
                  {member.name}
                </h4>
                <p className="mt-0.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                  {member.role}
                </p>
              </div>
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0 shadow-sm"
                style={{ backgroundColor: tone.primary }}
              />
            </div>

            {/* Exact Bio Content */}
            <div className="my-auto py-2 pointer-events-none">
              <p className="text-[11px] sm:text-xs md:text-[12.5px] leading-relaxed text-white/85 font-sans">
                {member.bio}
              </p>
            </div>

            {/* Bottom Footer with Social Icons & Flip-Back Hint */}
            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
              {/* Social icons on back */}
              <div className="flex items-center gap-2">
                <a
                  href={member.socials?.instagram || "#"}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on Instagram`}
                  className="w-7.5 h-7.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 group"
                >
                  <InstagramIcon className="w-3 h-3 text-white/80 group-hover:text-white" />
                </a>

                <a
                  href={member.socials?.twitter || "#"}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on X / Twitter`}
                  className="w-7.5 h-7.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 group"
                >
                  <TwitterXIcon className="w-3 h-3 text-white/80 group-hover:text-white" />
                </a>

                <a
                  href={member.socials?.linkedin || "#"}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="w-7.5 h-7.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 group"
                >
                  <LinkedInIcon className="w-3 h-3 text-white/80 group-hover:text-white" />
                </a>
              </div>

              {/* Click to flip back */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-white/50 hover:text-white/80 transition-colors pointer-events-none">
                <span>Flip</span>
                <span>↻</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Team Lanyard Rail Component with Free, Uncropped Edges
export default function TeamLanyardRail({
  members,
  title = "A team wall you can flip through, right on the page.",
  subtitle = "MEET THE TEAM · FOUR LEADERS",
  className = "",
}: TeamLanyardRailProps) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Pinned Horizontal Scroll driven by vertical scroll progress
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  // Calculate horizontal translation: on desktop, badges span the rail evenly. On mobile/tablet, glides across.
  const xMobile = useTransform(scrollYProgress, [0, 1], ["0%", "-42%"]);
  const x = isDesktop ? "0%" : xMobile;
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["25%", "100%"]);

  return (
    <div ref={runwayRef} className={`relative h-[150vh] lg:h-auto lg:py-16 w-full select-none ${className}`}>
      {/* Stage: Sticky on mobile/tablet runway, natural centered stage on desktop */}
      <section className="sticky lg:relative top-0 min-h-screen lg:min-h-0 w-full bg-[#060913] flex flex-col justify-center overflow-hidden border-none py-12 sm:py-16">
        {/* Floating Ambient Aurora Glow Bridging About & Team (Ultra-fast radial gradients) */}
        <div className="pointer-events-none absolute -top-28 left-1/3 size-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.18)_0%,transparent_70%)] transform-gpu will-change-transform" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 size-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.16)_0%,transparent_70%)] transform-gpu will-change-transform" aria-hidden="true" />

        {/* Background Dot Grid with Feathered Vertical Fade */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 w-full">
          {/* Section Header with Horizontal Track Pill */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest mb-3">
                <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span>Leadership Rail · Interactive Team Experience</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                {title}
              </h2>
            </div>

            {/* Scroll Indicator & Progress (shown on mobile/tablet or when scrolling) */}
            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 lg:hidden">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                [ 4 Leaders · Scroll to glide across rail ]
              </span>
              <div className="w-40 sm:w-48 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  style={{ width: progressWidth }}
                  className="h-full bg-gradient-to-r from-sky-400 via-rose-500 to-amber-400 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              THE METALLIC RAIL & SUSPENDED LANYARD BADGES
             ======================================================== */}
          <div className="relative w-full overflow-hidden">
            <motion.div
              style={{ x }}
              className="relative w-full min-w-[1100px] lg:min-w-0 pb-10 pt-2 flex flex-col items-start will-change-transform transform-gpu"
            >
              {/* 1. Left Wall Mounting Flange Bracket */}
              <div className="absolute left-1 sm:left-2 top-2 z-30 flex flex-col items-center pointer-events-none">
                <div className="w-5 h-9 rounded-sm bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-600 border border-zinc-500 shadow-md flex flex-col justify-around py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                </div>
              </div>

              {/* 2. Brushed Aluminum Metal Pipe Rail */}
              <div className="relative w-full h-3 z-10 mx-2 pointer-events-none">
                <div className="absolute -bottom-2 inset-x-0 h-3 bg-black/40 blur-xs rounded-full" />
                <div className="w-full h-full rounded-full bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 border-t border-b border-zinc-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.6)]" />
              </div>

              {/* 3. Right Wall Mounting Flange Bracket */}
              <div className="absolute right-1 sm:right-2 top-2 z-30 flex flex-col items-center pointer-events-none">
                <div className="w-5 h-9 rounded-sm bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border border-zinc-500 shadow-md flex flex-col justify-around py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                </div>
              </div>

              {/* 4. Suspended Badges: 4 Leaders Balanced Evenly Across the Rail */}
              <div className="relative -mt-3.5 z-20 w-full flex items-start justify-between px-6 sm:px-10 lg:px-14">
                {members.map((member, idx) => (
                  <LanyardBadgeItem
                    key={member.id}
                    member={member}
                    defaultFlipped={false}
                    index={idx}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
