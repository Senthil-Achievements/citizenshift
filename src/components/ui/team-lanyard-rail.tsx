"use client";

import React, { useState, useRef } from "react";
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
  tags: string[];
  idNumber?: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
}

export interface TeamLanyardRailProps {
  members: LanyardMember[];
  title?: string;
  subtitle?: string;
  className?: string;
}

// 8 Vibrant Tone Palettes matching the reference component
const TONES = [
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
    name: "Crimson Rose",
    primary: "#e11d48",
    darker: "#be123c",
    light: "#fb7185",
    bgPattern: "from-rose-500 to-rose-600",
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

// SVG Barcode Generator
function BadgeBarcode({ code }: { code: string }) {
  // Deterministic bar widths from code string
  const bars = Array.from({ length: 32 }, (_, i) => {
    const charCode = code.charCodeAt(i % code.length) || 48;
    const isThick = (charCode * (i + 1)) % 3 === 0;
    const isMedium = (charCode * (i + 3)) % 2 === 0;
    const width = isThick ? 3 : isMedium ? 2 : 1;
    return width;
  });

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <svg className="w-full h-7 opacity-85" viewBox="0 0 100 28" preserveAspectRatio="none">
        {bars.map((w, idx) => {
          const x = (idx / bars.length) * 98 + 1;
          return <rect key={idx} x={x} y="0" width={w * 0.75} height="28" fill="#ffffff" />;
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-[0.28em] text-white/50 uppercase select-none">
        {code}
      </span>
    </div>
  );
}

// Authentic SVG QR Code
function BadgeQRCode() {
  return (
    <svg className="w-9 h-9 p-0.5 rounded bg-white text-navy flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      {/* Position Detection Squares */}
      <rect x="2" y="2" width="6" height="6" rx="1" fill="#081724" />
      <rect x="3.5" y="3.5" width="3" height="3" fill="#ffffff" />
      <rect x="16" y="2" width="6" height="6" rx="1" fill="#081724" />
      <rect x="17.5" y="3.5" width="3" height="3" fill="#ffffff" />
      <rect x="2" y="16" width="6" height="6" rx="1" fill="#081724" />
      <rect x="3.5" y="17.5" width="3" height="3" fill="#ffffff" />
      {/* Matrix data bits */}
      <rect x="10" y="3" width="2" height="2" fill="#081724" />
      <rect x="13" y="5" width="2" height="2" fill="#081724" />
      <rect x="10" y="7" width="2" height="3" fill="#081724" />
      <rect x="5" y="10" width="3" height="2" fill="#081724" />
      <rect x="10" y="12" width="2" height="2" fill="#081724" />
      <rect x="13" y="11" width="2" height="3" fill="#081724" />
      <rect x="17" y="10" width="3" height="2" fill="#081724" />
      <rect x="10" y="16" width="2" height="2" fill="#081724" />
      <rect x="13" y="18" width="3" height="2" fill="#081724" />
      <rect x="18" y="15" width="2" height="3" fill="#081724" />
      <rect x="17" y="19" width="3" height="2" fill="#081724" />
    </svg>
  );
}

// Single Interactive Lanyard Badge
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
  const springY = useSpring(dragY, { stiffness: 450, damping: 22 });
  const strapStretch = useTransform(springY, [0, 80], [1, 1.45]);

  // Gentle pendulum sway on hover
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center select-none flex-shrink-0 group">
      {/* 1. Metallic Sliding Ring around Rail */}
      <div className="relative z-20 flex flex-col items-center">
        <div className="w-4 h-4 rounded-full bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 border border-zinc-400 shadow-sm flex items-center justify-center -mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700/60" />
        </div>

        {/* 2. Braided Textured Lanyard Strap with Stretch Physics */}
        <motion.div
          style={{
            scaleY: strapStretch,
            transformOrigin: "top center",
          }}
          className="relative w-3 h-12 sm:h-14 shadow-md rounded-t-xs"
        >
          {/* Diagonal woven fabric pattern */}
          <div
            className="w-full h-full"
            style={{
              background: `repeating-linear-gradient(45deg, ${tone.primary}, ${tone.primary} 4px, ${tone.darker} 4px, ${tone.darker} 8px)`,
            }}
          />
        </motion.div>

        {/* 3. Retractable Circular Badge Reel */}
        <div className="relative z-10 -mt-1 flex flex-col items-center">
          {/* Metal Crimp Clamp */}
          <div className="w-3.5 h-1.5 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 rounded-xs border border-zinc-500/40" />

          {/* Chrome Reel Casing */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-500 border border-zinc-400 shadow-[0_3px_8px_rgba(0,0,0,0.45)] flex items-center justify-center my-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 border border-zinc-200/80 shadow-inner flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
            </div>
          </div>

          {/* Metal Carabiner Clip Hook */}
          <div className="w-2.5 h-3.5 bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-500 rounded-b-sm border border-zinc-500/50 -mt-0.5 shadow-xs" />
        </div>
      </div>

      {/* 4. The Tactile Badge Card with 3D Flip & Sway Physics */}
      <motion.div
        style={{ y: springY }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 60 }}
        dragElastic={0.12}
        onDragEnd={() => dragY.set(0)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          rotateZ: isHovered ? [0, -1.8, 1.8, -0.9, 0] : 0,
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        className="relative z-10 -mt-1 cursor-pointer perspective-[1000px]"
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
          className="relative w-[180px] sm:w-[195px] h-[285px] sm:h-[300px] transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform-style-3d shadow-[0_16px_36px_rgba(0,0,0,0.5)] rounded-2xl"
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ========================================================
              FRONT OF BADGE (Default Face)
             ======================================================== */}
          <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden bg-[#101418] border border-white/10 flex flex-col justify-between">
            {/* Top Colored Band with Punch Slot */}
            <div
              className="relative h-14 w-full flex items-start justify-center pt-2.5"
              style={{
                background: `repeating-linear-gradient(45deg, ${tone.primary}, ${tone.primary} 7px, ${tone.darker} 7px, ${tone.darker} 14px)`,
              }}
            >
              {/* Oval Badge Lanyard Slot Cutout */}
              <div className="w-6 h-2 rounded-full bg-[#0a0d10] border border-black/50 shadow-inner" />
            </div>

            {/* Circular Photo Window framed right below top band */}
            <div className="relative -mt-9 flex justify-center">
              <div className="relative w-18 h-18 sm:w-19 sm:h-19 rounded-full overflow-hidden border-[2.5px] border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.55)] bg-navy-900">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Member Details */}
            <div className="px-3 text-center -mt-1">
              <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight">
                {member.name}
              </h3>
              <p className="mt-0.5 font-sans text-[11px] text-white/70 font-medium leading-tight">
                {member.role}
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
                {member.team}
              </p>
            </div>

            {/* Bottom Barcode & ID Number */}
            <div className="p-3 pb-3.5 bg-black/30 border-t border-white/5">
              <BadgeBarcode code={member.idNumber || `27633${member.tone}587`} />
            </div>
          </div>

          {/* ========================================================
              BACK OF BADGE (Flipped Face - as shown in reference)
             ======================================================== */}
          <div
            className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden bg-[#101418] border border-white/10 flex flex-col justify-between p-3.5"
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* Top Header & Slot */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <h4 className="font-display font-bold text-sm text-white leading-tight">
                  {member.name}
                </h4>
                <p className="font-mono text-[10px] text-white/60">{member.role}</p>
              </div>
              <div
                className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                style={{ backgroundColor: tone.primary }}
              />
            </div>

            {/* Bio paragraph */}
            <p className="text-[11px] leading-relaxed text-white/75 my-auto line-clamp-4">
              {member.bio}
            </p>

            {/* Skill / Civic Tags */}
            <div className="flex flex-wrap gap-1.5 my-1">
              {member.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider bg-white/10 text-white/90 border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Contact Links & Scannable QR Code */}
            <div className="flex items-end justify-between pt-2 border-t border-white/10">
              <div className="flex flex-col gap-1 text-[10px] font-mono text-white/70">
                {member.links ? (
                  member.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span>›</span>
                      <span>{link.label}</span>
                    </a>
                  ))
                ) : (
                  <>
                    <span className="flex items-center gap-1">✉ Email</span>
                    <span className="flex items-center gap-1">› Calendar</span>
                  </>
                )}
              </div>

              {/* QR Code */}
              <BadgeQRCode />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Full Team Lanyard Rail Component
export default function TeamLanyardRail({
  members,
  title = "A team wall you can flip through, right on the page.",
  subtitle = "MEET THE TEAM · EIGHT PEOPLE",
  className = "",
}: TeamLanyardRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      className={`relative w-full bg-[#0a0d11] text-white py-20 sm:py-24 overflow-hidden select-none ${className}`}
      aria-label="Team Lanyard Rail"
    >
      {/* Background Dot Grid Matrix Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.28em] text-white/60 font-semibold">
            {subtitle}
          </p>
          <h2 className="mt-3 font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow">
            {title}
          </h2>
        </div>

        {/* Metallic Rail & Badges Container */}
        <div className="relative w-full">
          {/* ========================================================
              THE BRUSHED METALLIC RAIL WITH MOUNTING BRACKETS
             ======================================================== */}
          <div className="relative w-full flex items-center my-2">
            {/* Left Wall Mounting Bracket with Screws */}
            <div className="absolute -left-1 sm:-left-3 z-30 flex flex-col justify-around items-center w-4 h-9 rounded-r-md bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-500 border border-zinc-600 shadow-xl py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-400 shadow-inner" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-400 shadow-inner" />
            </div>

            {/* Cylindrical Polished Chrome Rod spanning edge-to-edge */}
            <div className="relative w-full h-3 sm:h-3.5 rounded-full bg-gradient-to-b from-zinc-200 via-white to-zinc-400 shadow-[0_4px_16px_rgba(0,0,0,0.7)] border-t border-white/70" />

            {/* Right Wall Mounting Bracket with Screws */}
            <div className="absolute -right-1 sm:-right-3 z-30 flex flex-col justify-around items-center w-4 h-9 rounded-l-md bg-gradient-to-l from-zinc-700 via-zinc-400 to-zinc-500 border border-zinc-600 shadow-xl py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-400 shadow-inner" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-400 shadow-inner" />
            </div>
          </div>

          {/* ========================================================
              SCROLLABLE / SLIDING BADGES ROW
             ======================================================== */}
          <div
            ref={scrollContainerRef}
            className="flex items-start justify-start lg:justify-between gap-5 sm:gap-6 overflow-x-auto no-scrollbar pt-0 pb-8 px-4 sm:px-6 cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {members.map((member, index) => (
              <LanyardBadgeItem
                key={member.id}
                member={member}
                defaultFlipped={index === 1} // Second badge flipped as shown in reference image!
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

