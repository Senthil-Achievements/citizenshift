"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

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

// Single Interactive Lanyard Badge (Scaled up for 4 members)
function LanyardBadgeItem({
  member,
  defaultFlipped = false,
}: {
  member: LanyardMember;
  defaultFlipped?: boolean;
}) {
  const [isFlipped, setIsFlipped] = useState(defaultFlipped);
  const tone = TONES[member.tone % TONES.length];

  // Pull-down spring cord physics
  const dragY = useMotionValue(0);
  const springY = useSpring(dragY, { stiffness: 450, damping: 24 });
  const strapStretch = useTransform(springY, [0, 90], [1, 1.4]);

  // Gentle pendulum sway on hover
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center select-none flex-shrink-0 group">
      {/* 1. Metallic Sliding Ring around Rail */}
      <div className="relative z-20 flex flex-col items-center">
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 border border-zinc-400 shadow-md flex items-center justify-center -mb-1">
          <div className="w-2 h-2 rounded-full bg-zinc-700/60" />
        </div>

        {/* 2. Braided Textured Lanyard Strap with Stretch Physics */}
        <motion.div
          style={{
            scaleY: strapStretch,
            transformOrigin: "top center",
          }}
          className="relative w-4 h-14 sm:h-16 shadow-md rounded-t-xs"
        >
          {/* Diagonal woven fabric pattern */}
          <div
            className="w-full h-full"
            style={{
              background: `repeating-linear-gradient(45deg, ${tone.primary}, ${tone.primary} 5px, ${tone.darker} 5px, ${tone.darker} 10px)`,
            }}
          />
        </motion.div>

        {/* 3. Retractable Circular Badge Reel */}
        <div className="relative z-10 -mt-1 flex flex-col items-center">
          {/* Metal Crimp Clamp */}
          <div className="w-4.5 h-2 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 rounded-xs border border-zinc-500/40" />

          {/* Chrome Reel Casing */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-500 border border-zinc-400 shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center my-0.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 border border-zinc-200/80 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            </div>
          </div>

          {/* Metal Carabiner Clip Hook */}
          <div className="w-3 h-4 bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-500 rounded-b-sm border border-zinc-500/50 -mt-0.5 shadow-xs" />
        </div>
      </div>

      {/* 4. The Tactile Badge Card with 3D Flip & Sway Physics */}
      <motion.div
        style={{ y: springY }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 70 }}
        dragElastic={0.12}
        onDragEnd={() => dragY.set(0)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          rotateZ: isHovered ? [0, -1.5, 1.5, -0.7, 0] : 0,
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        className="relative z-10 -mt-1 cursor-pointer perspective-[1200px]"
        onClick={() => setIsFlipped((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
        aria-label={`ID Badge for ${member.name}. Press to flip.`}
      >
        <div
          className="relative w-[240px] sm:w-[265px] md:w-[280px] h-[380px] sm:h-[410px] md:h-[430px] transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] [transform-style:preserve-3d] shadow-[0_20px_50px_rgba(0,0,0,0.65)] rounded-2xl"
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
              className="relative h-20 w-full flex items-start justify-center pt-3"
              style={{
                background: `repeating-linear-gradient(45deg, ${tone.primary}, ${tone.primary} 9px, ${tone.darker} 9px, ${tone.darker} 18px)`,
              }}
            >
              {/* Oval Badge Lanyard Slot Cutout */}
              <div className="w-8 h-2.5 rounded-full bg-[#0a0d10] border border-black/50 shadow-inner" />
            </div>

            {/* Circular Photo Window framed right below top band */}
            <div className="relative -mt-12 flex justify-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-white/90 shadow-[0_6px_20px_rgba(0,0,0,0.6)] bg-navy-900">
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
            <div className="px-4 text-center -mt-1 flex-1 flex flex-col justify-center">
              <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-tight">
                {member.name}
              </h3>
              <p className="mt-1 font-sans text-xs sm:text-sm text-white/80 font-semibold leading-tight">
                {member.role}
              </p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                {member.team}
              </p>

              {/* Flip hint pill */}
              <div className="mt-3 inline-flex items-center justify-center gap-1.5 self-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                <span>Click to read bio</span>
                <span className="text-white/80">↻</span>
              </div>
            </div>

            {/* Bottom Social Icons Row (Replacing the Barcode) */}
            <div className="p-3.5 bg-black/45 border-t border-white/10 flex items-center justify-center gap-3">
              {/* Instagram */}
              <a
                href={member.socials?.instagram || "#"}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on Instagram`}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-sm"
              >
                <InstagramIcon className="w-4 h-4 text-white/80 group-hover:text-white" />
              </a>

              {/* Twitter / X */}
              <a
                href={member.socials?.twitter || "#"}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on X / Twitter`}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-sm"
              >
                <TwitterXIcon className="w-4 h-4 text-white/80 group-hover:text-white" />
              </a>

              {/* LinkedIn */}
              <a
                href={member.socials?.linkedin || "#"}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-sm"
              >
                <LinkedInIcon className="w-4 h-4 text-white/80 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* ========================================================
              BACK OF BADGE (Flipped Face - Perfectly oriented, not mirrored)
             ======================================================== */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden bg-[#101418] border border-white/10 flex flex-col justify-between p-5 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Top Header with Accent Dot */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="font-display font-bold text-base text-white leading-tight">
                  {member.name}
                </h4>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                  {member.role}
                </p>
              </div>
              <div
                className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 shadow-sm"
                style={{ backgroundColor: tone.primary }}
              />
            </div>

            {/* Exact Bio Content */}
            <div className="my-auto py-2">
              <p className="text-xs sm:text-[13px] leading-relaxed text-white/85 font-sans">
                {member.bio}
              </p>
            </div>

            {/* Bottom Footer with Social Icons & Flip-Back Hint */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              {/* Social icons on back too for immediate click access */}
              <div className="flex items-center gap-2">
                <a
                  href={member.socials?.instagram || "#"}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on Instagram`}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 group"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
                </a>

                <a
                  href={member.socials?.twitter || "#"}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on X / Twitter`}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 group"
                >
                  <TwitterXIcon className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
                </a>

                <a
                  href={member.socials?.linkedin || "#"}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 group"
                >
                  <LinkedInIcon className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
                </a>
              </div>

              {/* Click to flip back */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-white/50 hover:text-white/80 transition-colors">
                <span>Flip</span>
                <span>↻</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Full Team Lanyard Rail Component (for 4 Leaders)
export default function TeamLanyardRail({
  members,
  title = "A team wall you can flip through, right on the page.",
  subtitle = "MEET THE TEAM · FOUR LEADERS",
  className = "",
}: TeamLanyardRailProps) {
  return (
    <section className={`relative w-full bg-[#080b0e] py-16 sm:py-24 overflow-hidden select-none ${className}`}>
      {/* Background Dot Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 sm:mb-20">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/50 mb-3">
            {subtitle}
          </p>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            {title}
          </h2>
        </div>

        {/* ========================================================
            THE METALLIC RAIL & SUSPENDED LANYARD BADGES
           ======================================================== */}
        <div className="relative w-full">
          {/* Scrollable container for mobile; centered for desktop */}
          <div className="w-full overflow-x-auto pb-10 pt-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
            <div className="relative min-w-[1040px] px-8 sm:px-12 flex flex-col items-center">
              {/* 1. Left Wall Mounting Flange Bracket */}
              <div className="absolute left-4 top-2 z-30 flex flex-col items-center">
                <div className="w-5 h-9 rounded-sm bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-600 border border-zinc-500 shadow-md flex flex-col justify-around py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                </div>
              </div>

              {/* 2. Brushed Aluminum Metal Pipe Rail */}
              <div className="relative w-full h-3 z-10 mx-6">
                {/* Rod shadow */}
                <div className="absolute -bottom-2 inset-x-0 h-3 bg-black/40 blur-xs rounded-full" />
                {/* Metallic gradient rod */}
                <div className="w-full h-full rounded-full bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 border-t border-b border-zinc-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.6)]" />
              </div>

              {/* 3. Right Wall Mounting Flange Bracket */}
              <div className="absolute right-4 top-2 z-30 flex flex-col items-center">
                <div className="w-5 h-9 rounded-sm bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border border-zinc-500 shadow-md flex flex-col justify-around py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mx-auto shadow-inner" />
                </div>
              </div>

              {/* 4. Suspended Badges: 4 Leaders with generous, comfortable spacing */}
              <div className="relative -mt-3.5 z-20 w-full flex items-start justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-14">
                {members.map((member) => (
                  <LanyardBadgeItem
                    key={member.id}
                    member={member}
                    defaultFlipped={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
