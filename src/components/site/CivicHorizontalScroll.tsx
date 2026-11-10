"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

interface CivicVoice {
  id: string;
  name: string;
  role: string;
  state: string;
  stateCode: string;
  quote: string;
  metric: string;
  billRef: string;
  image: string;
  tag: string;
  color: string;
}

const CIVIC_VOICES: CivicVoice[] = [
  {
    id: "voice-oh",
    name: "Sarah Jenkins",
    role: "Public Civics Teacher",
    state: "Ohio",
    stateCode: "OH · DIST 3",
    quote: "CitizenShift alerted our local community to a water-rights bill before lobbyists could slip it through. That transparency is worth every single penny.",
    metric: "4,200+ Students Engaged",
    billRef: "H.R. 2841 / Clean Water Defense",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=80",
    tag: "Education & Water Rights",
    color: "#f43f5e",
  },
  {
    id: "voice-ca",
    name: "Robert MacIntyre",
    role: "County Fire Chief",
    state: "California",
    stateCode: "CA · REDDING",
    quote: "Tracked the Wildfire Emergency Act from committee introduction all the way to Senate markup. Crucial for rural first responders.",
    metric: "850+ First Responders Notified",
    billRef: "S. 1104 / Rural Fire Preparedness",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&h=240&q=80",
    tag: "Public Safety",
    color: "#38bdf8",
  },
  {
    id: "voice-ga",
    name: "Amara Washington",
    role: "Grassroots Organizer",
    state: "Georgia",
    stateCode: "GA · ATLANTA",
    quote: "Voters in our district finally know who sponsored which amendment and where federal grant funding actually flows.",
    metric: "12,000 Verified Constituents",
    billRef: "H.R. 892 / Civic Transparency Act",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&h=240&q=80",
    tag: "Grassroots Advocacy",
    color: "#34d399",
  },
  {
    id: "voice-fl",
    name: "Carlos Ray",
    role: "Policy Analyst",
    state: "Florida",
    stateCode: "FL · MIAMI",
    quote: "CitizenShift bridges the civic knowledge divide better than any institutional dashboard I have used in 15 years of state policy work.",
    metric: "50-State Cross-Analysis",
    billRef: "FL SB-44 / Coastal Infrastructure",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&h=240&q=80",
    tag: "Policy Research",
    color: "#fbbf24",
  },
  {
    id: "voice-pa",
    name: "David R. Campbell",
    role: "USMC Veteran & Volunteer",
    state: "Pennsylvania",
    stateCode: "PA · HARRISBURG",
    quote: "Special interest PACs spend millions to keep everyday citizens confused. Donating and tracking on CitizenShift is the most direct investment in honesty.",
    metric: "100% Nonpartisan Record",
    billRef: "H.R. 412 / Veterans Transition Aid",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80",
    tag: "Veterans & Accountability",
    color: "#a78bfa",
  },
  {
    id: "voice-tx",
    name: "Aisha Morales",
    role: "Senior Healthcare Coalition",
    state: "Texas",
    stateCode: "TX · SAN ANTONIO",
    quote: "Their plain-language summaries gave our senior coalition the power to demand straight answers on prescription drug pricing legislation.",
    metric: "2,400 Families Represented",
    billRef: "S. 719 / Generic Drug Access",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&h=240&q=80",
    tag: "Healthcare Access",
    color: "#f43f5e",
  },
];

export function CivicHorizontalScroll() {
  const targetRef = useRef<HTMLDivElement>(null);

  // Monitor vertical scroll within this pinned 220vh runway
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Translate horizontal rail from 0 to negative percentage
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-72%"]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["10%", "100%"]);

  return (
    <div
      ref={targetRef}
      className="relative h-[230vh] w-full select-none"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center bg-[#060913]">
        {/* Subtle Ambient Radial Lighting */}
        <div
          className="pointer-events-none absolute -top-24 left-1/4 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.18)_0%,transparent_70%)] transform-gpu will-change-transform"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-1/4 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.16)_0%,transparent_70%)] transform-gpu will-change-transform"
          aria-hidden="true"
        />

        {/* Section Header */}
        <div className="relative z-10 px-6 sm:px-12 md:px-16 max-w-7xl mx-auto w-full mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rose-400 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest mb-3">
              <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>50-State Civic Voices · Horizontal Scroll Stream</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Constituents in Motion.
            </h3>
          </div>

          {/* Horizontal Scroll Progress & Guide */}
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
              [ Scroll vertically to glide across states ]
            </span>
            <div className="w-44 sm:w-56 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                style={{ width: progressWidth }}
                className="h-full bg-gradient-to-r from-rose-500 via-purple-500 to-sky-400 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* The Kinematic Horizontal Scroll Track */}
        <div className="relative w-full overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex gap-5 sm:gap-7 items-stretch px-6 sm:px-12 md:px-16 will-change-transform transform-gpu"
          >
            {CIVIC_VOICES.map((voice) => (
              <div
                key={voice.id}
                className="relative w-[300px] sm:w-[360px] md:w-[410px] shrink-0 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0c121e]/90 backdrop-blur-xl p-5 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-white/30 transition-all duration-300"
              >
                {/* Top Badge Row */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[10px] font-semibold text-white/80">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: voice.color }}
                      />
                      <span>{voice.stateCode}</span>
                    </span>

                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                      {voice.tag}
                    </span>
                  </div>

                  {/* Impact Quote */}
                  <blockquote className="font-serif italic text-sm sm:text-base leading-relaxed text-white/90 line-clamp-4">
                    “{voice.quote}”
                  </blockquote>
                </div>

                {/* Bottom Author & Bill Pill */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 sm:size-11 rounded-full overflow-hidden border border-white/20 shrink-0">
                      <Image
                        src={voice.image}
                        alt={voice.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-sans font-bold text-xs sm:text-sm text-white truncate">
                        {voice.name}
                      </h4>
                      <p className="font-mono text-[10px] text-white/50 truncate">
                        {voice.role} · {voice.state}
                      </p>
                    </div>
                  </div>

                  {/* Legislative Reference Tag */}
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-white/45 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="truncate">{voice.billRef}</span>
                    <span className="text-emerald-400 font-semibold shrink-0 ml-2">
                      {voice.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default CivicHorizontalScroll;

