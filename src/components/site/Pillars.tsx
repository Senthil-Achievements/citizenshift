"use client";

import { useRef, useState } from "react";
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
  const [activeIdx, setActiveIdx] = useState(0);

  // Link vertical scroll of the 400vh container to horizontal translation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Exactly translates from 0vw to -300vw across 4 full-screen slides
  const totalSlides = PILLARS.length;
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `-${(totalSlides - 1) * 100}vw`]);

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
      className="relative h-[400vh] bg-navy-950"
      aria-label="Civic participation mechanisms horizontal scroll"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* 1. TOP FLOATING NAVIGATION BAR */}
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b border-paper/10 bg-gradient-to-b from-navy-950/90 to-transparent px-6 py-5 md:px-12 backdrop-blur-sm">
          {/* Section Breadcrumbs & Category Tabs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-paper/60">
              <span className="text-berry font-bold">01 — 04</span>
              <span>/</span>
              <span className="text-paper">The Method</span>
            </div>

            {/* Clickable Slide Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {PILLARS.map((p, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={p.index}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    className={`relative flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] transition-all duration-300 ${
                      isActive
                        ? "bg-paper text-navy font-bold shadow-lg"
                        : "text-paper/60 hover:text-paper hover:bg-paper/10"
                    }`}
                  >
                    <span className={isActive ? "text-berry" : "text-paper/40"}>{p.index}</span>
                    <span>{p.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slide Counter (e.g. 01 / 04) */}
          <div className="flex items-center gap-4 font-mono text-xs tracking-[0.2em] text-paper">
            <div className="flex items-baseline">
              <span className="text-icy text-base font-bold">0{activeIdx + 1}</span>
              <span className="mx-1 text-paper/30">/</span>
              <span className="text-paper/50">0{totalSlides}</span>
            </div>

            {/* Scroll Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevSlide}
                disabled={activeIdx === 0}
                aria-label="Previous mechanism slide"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/20 bg-navy-950/60 text-paper transition-all hover:bg-paper hover:text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/20 bg-navy-950/60 text-paper transition-all hover:bg-paper hover:text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 2. HORIZONTAL SLIDING TRACK */}
        <motion.div
          style={{ x }}
          className="flex h-full w-[400vw] will-change-transform"
        >
          {PILLARS.map((p, idx) => (
            <article
              key={p.index}
              className="relative h-screen w-screen flex-shrink-0 flex items-end overflow-hidden"
              aria-label={`Mechanism ${p.index}: ${p.title}`}
            >
              {/* Fullscreen Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={p.image}
                  alt={p.alt}
                  fill
                  priority={idx < 2}
                  sizes="100vw"
                  className="object-cover brightness-[0.74] contrast-[1.08] select-none pointer-events-none"
                />
              </div>

              {/* Cinematic Vignette Gradients for Text Legibility */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/40 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-navy-950/20" />

              {/* Overlayed Text Content */}
              <div className="relative z-20 flex w-full flex-col justify-end p-8 sm:p-14 md:p-20 lg:p-24 pb-20 sm:pb-24 max-w-5xl">
                {/* Eyebrow & Meta */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.24em] text-berry font-bold px-3.5 py-1.5 rounded-full bg-navy-950/80 border border-berry/40 backdrop-blur-md shadow-sm">
                    Pillar {p.index}
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-icy/90 font-medium drop-shadow">
                    {p.meta}
                  </span>
                </div>

                {/* Big Display Title */}
                <h2 className="mt-4 font-display text-[clamp(2.5rem,5.5vw,5rem)] font-bold leading-[1.04] tracking-[-0.03em] text-paper drop-shadow-xl">
                  {p.title}
                </h2>

                {/* Descriptive Body Copy */}
                <p className="mt-5 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-paper/85 drop-shadow">
                  {p.copy}
                </p>

                {/* Optional Action Link / Scroll Down Hint */}
                <div className="mt-8 flex flex-wrap items-center gap-6">
                  {p.href && (
                    <a
                      href={p.href}
                      className="inline-flex items-center gap-3 rounded-full border border-paper/30 bg-paper/10 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper backdrop-blur-sm transition-all duration-300 hover:border-paper hover:bg-paper hover:text-navy"
                    >
                      <span>{p.actionText || "Learn More"}</span>
                      <span>→</span>
                    </a>
                  )}

                  {idx === 0 && (
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/50 animate-pulse">
                      <span>Scroll down to slide</span>
                      <span>↓</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </motion.div>

        {/* 3. BOTTOM LINEAR PROGRESS BAR */}
        <div className="absolute inset-x-0 bottom-0 z-30 h-[4px] bg-paper/15">
          <motion.div
            style={{
              scaleX: scrollYProgress,
              transformOrigin: "0% 50%",
            }}
            className="h-full bg-gradient-to-r from-berry via-icy to-paper will-change-transform"
          />
        </div>
      </div>
    </section>
  );
}
