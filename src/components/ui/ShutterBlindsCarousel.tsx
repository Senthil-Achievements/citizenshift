"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

export interface ShutterSlide {
  id?: string;
  index: string; // e.g. "01"
  tag: string; // e.g. "PLAIN-LANGUAGE SUMMARIES / LEGISCAN RECORD"
  title: string; // e.g. "Understand Legislation"
  description: string; // e.g. "Legislation is complex..."
  image: string; // e.g. "/photo/hearing.jpg"
  alt?: string;
  category: string; // e.g. "LEGISLATION"
  linkHref?: string;
  linkLabel?: string;
}

export interface ShutterBlindsCarouselProps {
  slides?: ShutterSlide[];
  numSlats?: number;
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

const DEFAULT_SLIDES: ShutterSlide[] = [
  {
    index: "01",
    category: "LEGISLATION",
    tag: "PLAIN-LANGUAGE SUMMARIES / LEGISCAN RECORD",
    title: "Understand Legislation",
    description:
      "Legislation is complex, inaccessible, and time-consuming to follow. CitizenShift translates bills into a readable social-media style feed — plain-language summaries, policy areas, and status at a glance — so every American can follow what their government is actually doing.",
    image: "/photo/hearing.jpg",
    alt: "A Senate hearing room during a public legislative hearing",
    linkHref: "#feed",
    linkLabel: "Explore Bills",
  },
  {
    index: "02",
    category: "GEOGRAPHY",
    tag: "PERSONALISED FEED / GEOGRAPHY + INTERESTS",
    title: "Discover What Matters",
    description:
      "Thousands of bills are introduced every year. CitizenShift personalises them by geography and policy interest — federal, state, and municipal — so your feed is built around the places and issues that shape your life.",
    image: "/photo/crowd.jpg",
    alt: "Crowds gathered on the National Mall in Washington DC",
    linkHref: "#feed",
    linkLabel: "Filter Your State",
  },
  {
    index: "03",
    category: "ADVOCACY",
    tag: "CONTACT YOUR REPRESENTATIVE / ONE-TAP ADVOCACY",
    title: "Make Your Voice Heard",
    description:
      "Most Americans don't have the time or tools to reach their elected officials. CitizenShift removes the barriers: find your senators and representative, then advocate on the bills you care about — in a few taps.",
    image: "/photo/dome.jpg",
    alt: "The United States Capitol rising above the skyline at dusk",
    linkHref: "#stories",
    linkLabel: "Read Community Stories",
  },
];

export default function ShutterBlindsCarousel({
  slides = DEFAULT_SLIDES,
  numSlats = 8,
  autoPlay = false,
  interval = 7000,
  className = "",
}: ShutterBlindsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<1 | -1>(1);
  const [mouseTilt, setMouseTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const swapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const totalSlides = slides.length;

  const goToSlide = useCallback(
    (target: number, dir?: 1 | -1) => {
      if (isFlipping || target === currentIndex) return;
      const normalizedTarget = (target + totalSlides) % totalSlides;
      const effectiveDir = dir ?? (normalizedTarget > currentIndex ? 1 : -1);

      setFlipDirection(effectiveDir);
      setIsFlipping(true);

      // Halfway through slat rotation: swap the image slice to incoming slide
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
      swapTimeoutRef.current = setTimeout(() => {
        setDisplayIndex(normalizedTarget);
        setCurrentIndex(normalizedTarget);
      }, 340);

      // Complete transition
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = setTimeout(() => {
        setIsFlipping(false);
      }, 760);
    },
    [isFlipping, currentIndex, totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1, 1);
  }, [goToSlide, currentIndex]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1, -1);
  }, [goToSlide, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inViewport) return;

      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Auto-play timer (if enabled and not hovered)
  useEffect(() => {
    if (!autoPlay || isHovered) return;
    const timer = setInterval(() => {
      nextSlide();
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isHovered, interval, nextSlide]);

  // Mouse move 3D perspective tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setMouseTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const currentSlide = slides[displayIndex] || slides[0];

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) prevSlide();
      else nextSlide();
    }
    touchStartXRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`group relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl md:rounded-3xl border border-navy/15 bg-navy-950 text-paper shadow-2xl select-none ${className}`}
      style={{ perspective: "1200px" }}
      aria-roledescription="carousel"
      aria-label="Civic participation mechanisms shutter carousel"
    >
      {/* 1. TOP BAR / CATEGORY TABS */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-paper/10 bg-navy-950/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
          {slides.map((s, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={s.index}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`group/tab relative flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-[0.16em] uppercase transition-all duration-300 ${
                  isActive
                    ? "bg-paper text-navy font-semibold shadow-md"
                    : "text-paper/60 hover:text-paper hover:bg-paper/10"
                }`}
              >
                <span className={isActive ? "text-berry" : "text-paper/40"}>{s.index}</span>
                <span>{s.category}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-paper/40">
          <span>THE METHOD</span>
          <span>✦</span>
          <span>3D SHUTTER BLINDS</span>
        </div>
      </div>

      {/* 2. THE 3D SHUTTER BLINDS IMAGE STAGE */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] w-full overflow-hidden bg-navy-900">
        {Array.from({ length: numSlats }).map((_, i) => {
          // Stagger calculations
          const staggerIndex = flipDirection === 1 ? i : numSlats - 1 - i;
          const staggerDelay = isFlipping ? staggerIndex * 38 : 0;

          // Natural louver curvature based on mouse tilt + resting curvature
          const restingSlatTilt = (i - (numSlats - 1) / 2) * 1.6;
          const hoverTilt = isHovered ? mouseTilt.y * 12 : 0;
          const flipAngle = isFlipping ? (flipDirection === 1 ? 72 : -72) : 0;
          const totalRotationX = flipAngle + hoverTilt + restingSlatTilt;

          const slatHeightPercent = 100 / numSlats;
          const slatTopPercent = i * slatHeightPercent;

          return (
            <div
              key={i}
              className="absolute inset-x-0 overflow-hidden"
              style={{
                top: `${slatTopPercent}%`,
                height: `${slatHeightPercent + 0.3}%`, // 0.3% overlap prevents subpixel hairline gaps
                transformStyle: "preserve-3d",
              }}
            >
              {/* 3D Rotatable Slat Card */}
              <div
                className="relative w-full h-full"
                style={{
                  transformOrigin: "center center",
                  transform: `perspective(900px) rotateX(${totalRotationX}deg)`,
                  transition: isFlipping
                    ? `transform 360ms cubic-bezier(0.3, 1, 0.4, 1) ${staggerDelay}ms`
                    : "transform 220ms ease-out",
                  willChange: "transform",
                }}
              >
                {/* The reconstructed image slice */}
                <div
                  className="absolute inset-x-0 w-full"
                  style={{
                    height: `${numSlats * 100}%`,
                    top: `-${i * 100}%`,
                  }}
                >
                  <Image
                    src={currentSlide.image}
                    alt={currentSlide.alt || currentSlide.title}
                    fill
                    priority={i < 2}
                    sizes="(min-width: 1200px) 1152px, 100vw"
                    className="object-cover select-none pointer-events-none brightness-[0.92] contrast-[1.05]"
                  />
                </div>

                {/* Lighting gradient simulating angle of light across tilted blind slats */}
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
                    opacity: isFlipping ? 0.8 : Math.min(0.65, Math.abs(totalRotationX) * 0.04 + 0.18),
                  }}
                />

                {/* Top bevel highlight */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-white/20" />
                {/* Bottom shadow seam between slats */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-black/60" />
              </div>
            </div>
          );
        })}

        {/* Cinematic Vignette Overlays for Maximum Typography Contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/45 to-navy-950/20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950/80 via-transparent to-navy-950/60" />

        {/* 3. BOTTOM OVERLAY CONTENT */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end p-6 sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            {/* Title & Description */}
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-berry font-semibold drop-shadow-sm">
                PILLAR {currentSlide.index} ✦ {currentSlide.tag}
              </p>
              <h3 className="mt-2 font-display text-[clamp(1.85rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-paper drop-shadow-md">
                {currentSlide.title}
              </h3>
              <p className="mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-paper/85 drop-shadow">
                {currentSlide.description}
              </p>
            </div>

            {/* Pagination Counter & Navigation Buttons */}
            <div className="flex items-center gap-5 self-start md:self-end">
              {/* Monospace Counter e.g. "01 / 03" */}
              <div className="font-mono text-sm tracking-[0.2em] text-paper/90">
                <span className="font-bold text-icy text-base">{currentSlide.index}</span>
                <span className="mx-2 text-paper/30">/</span>
                <span className="text-paper/50">0{totalSlides}</span>
              </div>

              {/* Prev / Next Circular Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={isFlipping}
                  aria-label="Previous mechanism slide"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 bg-navy-950/70 text-paper transition-all duration-200 hover:scale-105 hover:border-paper hover:bg-paper hover:text-navy active:scale-95 disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={isFlipping}
                  aria-label="Next mechanism slide"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 bg-navy-950/70 text-paper transition-all duration-200 hover:scale-105 hover:border-paper hover:bg-paper hover:text-navy active:scale-95 disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM LINEAR PROGRESS INDICATOR */}
        <div className="absolute inset-x-0 bottom-0 z-30 h-[3px] bg-paper/15">
          <div
            className="h-full bg-gradient-to-r from-berry via-icy to-paper transition-all duration-500 ease-out"
            style={{
              width: `${((currentIndex + 1) / totalSlides) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
