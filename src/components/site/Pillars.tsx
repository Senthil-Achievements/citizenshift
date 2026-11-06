"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

export interface PillarSlide {
  index: string;
  category: string;
  meta: string;
  title: string;
  copy: string;
  image: string;
  alt: string;
  href?: string;
  actionText?: string;
}

const PILLARS: PillarSlide[] = [
  {
    index: "01",
    category: "LEGISLATION",
    meta: "PLAIN-LANGUAGE SUMMARIES / LEGISCAN RECORD",
    title: "Understand Legislation",
    copy: "Legislation is complex, inaccessible, and time-consuming to follow. CitizenShift translates bills into a readable social-media style feed — plain-language summaries, policy areas, and status at a glance — so every American can follow what their government is actually doing.",
    image: "/photo/hearing.jpg",
    alt: "A Senate hearing room during a public legislative hearing",
    href: "#feed",
    actionText: "Explore Public Bills",
  },
  {
    index: "02",
    category: "GEOGRAPHY",
    meta: "PERSONALISED FEED / GEOGRAPHY + INTERESTS",
    title: "Discover What Matters",
    copy: "Thousands of bills are introduced every year. CitizenShift personalises them by geography and policy interest — federal, state, and municipal — so your feed is built around the places and issues that shape your life.",
    image: "/photo/crowd.jpg",
    alt: "Crowds gathered on the National Mall in Washington DC",
    href: "#feed",
    actionText: "Filter Your State Feed",
  },
  {
    index: "03",
    category: "ADVOCACY",
    meta: "CONTACT YOUR REPRESENTATIVE / ONE-TAP ADVOCACY",
    title: "Make Your Voice Heard",
    copy: "Most Americans don't have the time or tools to reach their elected officials. CitizenShift removes the barriers: find your senators and representative, then advocate on the bills you care about — in a few taps.",
    image: "/photo/dome.jpg",
    alt: "The United States Capitol rising above the skyline at dusk",
    href: "#stories",
    actionText: "Read Community Stories",
  },
  {
    index: "04",
    category: "TRANSPARENCY",
    meta: "INDEPENDENT NONPARTISAN PLATFORM",
    title: "Open Civic Record",
    copy: "Democracy requires honesty. Every bill text, vote count, and sponsor is sourced directly from official state legislatures and Congress with zero partisan commentary or hidden agendas.",
    image: "/photo/hero.jpg",
    alt: "The United States Capitol glowing under evening lights",
    href: "#feed",
    actionText: "Inspect Full Record",
  },
];

export default function Pillars() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  const totalSlides = PILLARS.length;

  // Link vertical scroll of the container to horizontal translation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate dynamic pixel distance so the last card comfortably finishes in view
  useEffect(() => {
    const updateScroll = () => {
      if (!trackRef.current) return;
      const scrollWidth = trackRef.current.scrollWidth;
      const clientWidth = window.innerWidth;
      const distance = Math.max(0, scrollWidth - clientWidth + 32);
      setMaxScroll(distance);
    };

    updateScroll();
    window.addEventListener("resize", updateScroll);
    return () => window.removeEventListener("resize", updateScroll);
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], [0, -maxScroll]);

  // Keep track of currently visible slide for counter and tabs
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const raw = latest * (totalSlides - 1);
    const index = Math.min(totalSlides - 1, Math.max(0, Math.round(raw)));
    setActiveIdx(index);
  });

  // Smooth click navigation to any slide
  const scrollToSlide = (idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top;
    const scrollableDistance = containerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = scrollTop + (idx / (totalSlides - 1)) * scrollableDistance;
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  const nextSlide = () => {
    scrollToSlide(Math.min(totalSlides - 1, activeIdx + 1));
  };

  const prevSlide = () => {
    scrollToSlide(Math.max(0, activeIdx - 1));
  };

  return (
    <section
      ref={containerRef}
      id="method"
      className="relative h-[360vh] bg-[#060913] text-paper border-none"
      aria-label="Civic participation mechanisms horizontal scroll"
    >
      {/* Seamless Ambient Lighting Orbs (Ultra-fast radial gradients) */}
      <div className="pointer-events-none absolute top-1/4 -left-32 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.16)_0%,transparent_70%)] transform-gpu will-change-transform" aria-hidden="true" />
      <div className="pointer-events-none absolute top-3/4 -right-32 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.14)_0%,transparent_70%)] transform-gpu will-change-transform" aria-hidden="true" />

      {/* Pinned Viewport Container with breathing room top and bottom */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden py-4 sm:py-6 md:py-8 select-none">
        
        {/* 1. TOP EDITORIAL HEADER & TABS */}
        <div className="z-30 w-full px-6 sm:px-10 md:px-14 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-berry font-bold">
              <span>01 — 04</span>
              <span className="text-paper/40">/</span>
              <span className="text-paper/70">The Method</span>
            </div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-paper">
              Civic participation, engineered.
            </h2>
          </div>

          {/* Navigation Controls: Category Pills & Arrow Buttons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Clickable Slide Category Pills */}
            <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-navy-900/80 border border-paper/10 backdrop-blur-md">
              {PILLARS.map((p, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={p.index}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-300 ${
                      isActive
                        ? "bg-paper text-navy font-bold shadow-md"
                        : "text-paper/60 hover:text-paper hover:bg-paper/10"
                    }`}
                  >
                    <span className={isActive ? "text-berry" : "text-paper/40"}>{p.index}</span>
                    <span>{p.category}</span>
                  </button>
                );
              })}
            </div>

            {/* Slide Counter (01 / 04) & Arrows */}
            <div className="flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-paper">
              <div className="flex items-baseline">
                <span className="text-icy text-base font-bold">0{activeIdx + 1}</span>
                <span className="mx-1 text-paper/30">/</span>
                <span className="text-paper/50">0{totalSlides}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={activeIdx === 0}
                  aria-label="Previous mechanism slide"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/20 bg-navy-900/80 text-paper transition-all hover:bg-paper hover:text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={activeIdx === totalSlides - 1}
                  aria-label="Next mechanism slide"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/20 bg-navy-900/80 text-paper transition-all hover:bg-paper hover:text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. HORIZONTAL SLIDING CARDS TRACK (Framed, floating cards that do not fill the screen) */}
        <div className="relative w-full overflow-visible my-auto">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex items-center gap-6 sm:gap-8 md:gap-10 pl-6 sm:pl-10 md:pl-14 pr-16 sm:pr-24 will-change-transform"
          >
            {PILLARS.map((p, idx) => {
              const isActive = idx === activeIdx;
              return (
                <article
                  key={p.index}
                  className={`group relative flex-shrink-0 flex flex-col justify-end overflow-hidden rounded-2xl sm:rounded-3xl border border-paper/15 bg-navy-900 transition-all duration-500 w-[84vw] sm:w-[76vw] md:w-[68vw] lg:w-[60vw] max-w-4xl h-[56vh] sm:h-[62vh] md:h-[66vh] max-h-[620px] min-h-[440px] shadow-2xl ${
                    isActive ? "ring-1 ring-paper/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)]" : "opacity-90"
                  }`}
                  aria-label={`Mechanism ${p.index}: ${p.title}`}
                >
                  {/* Background Image with Subtle Depth Zoom */}
                  <div className="absolute inset-0">
                    <Image
                      src={p.image}
                      alt={p.alt}
                      fill
                      priority={idx < 2}
                      sizes="(max-width: 768px) 85vw, 65vw"
                      className="object-cover brightness-[0.7] contrast-[1.08] select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Cinematic Vignettes */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950/80 via-navy-950/30 to-transparent" />

                  {/* Top Floating Pillar Badge */}
                  <div className="absolute top-5 left-6 sm:top-6 sm:left-8 z-20 flex items-center gap-2.5">
                    <span className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold bg-navy-950/85 border border-paper/20 text-paper backdrop-blur-md shadow-sm">
                      <span className="text-berry font-bold">{p.index}</span>
                      <span>{p.category}</span>
                    </span>
                    <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.18em] text-paper/70 drop-shadow">
                      {p.meta}
                    </span>
                  </div>

                  {/* Overlayed Text Content */}
                  <div className="relative z-20 p-6 sm:p-10 md:p-12 pb-7 sm:pb-9 max-w-3xl">
                    <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-berry font-bold drop-shadow">
                      PILLAR {p.index} • {p.category}
                    </div>

                    <h3 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.08] tracking-[-0.02em] text-paper drop-shadow-xl">
                      {p.title}
                    </h3>

                    <p className="mt-3.5 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-paper/85 drop-shadow line-clamp-3 sm:line-clamp-none">
                      {p.copy}
                    </p>

                    <div className="mt-6 flex items-center gap-4">
                      {p.href && (
                        <a
                          href={p.href}
                          className="inline-flex items-center gap-2.5 rounded-full border border-paper/30 bg-paper/15 px-5 py-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-paper backdrop-blur-md transition-all duration-300 hover:border-paper hover:bg-paper hover:text-navy active:scale-95"
                        >
                          <span>{p.actionText || "Learn More"}</span>
                          <span>→</span>
                        </a>
                      )}

                      {idx === 0 && (
                        <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
                          <span>Scroll to explore</span>
                          <span>→</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Accent Highlight Strip */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-berry via-paper/40 to-transparent opacity-80" />
                </article>
              );
            })}
          </motion.div>
        </div>

        {/* 3. BOTTOM PROGRESS BAR & HELPER */}
        <div className="z-30 w-full px-6 sm:px-10 md:px-14 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md h-[3px] rounded-full bg-paper/15 overflow-hidden">
            <motion.div
              style={{
                scaleX: scrollYProgress,
                transformOrigin: "0% 50%",
              }}
              className="h-full bg-gradient-to-r from-berry via-icy to-paper will-change-transform"
            />
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/50">
            Mechanism {activeIdx + 1} of {totalSlides}
          </div>
        </div>

      </div>
    </section>
  );
}

