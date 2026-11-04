"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface AuthDualCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function AuthDualCard({
  eyebrow = "CITIZENSHIFT · CIVIC ACCOUNT",
  title,
  subtitle,
  children,
  backHref = "/",
  className = "",
}: AuthDualCardProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#081324] text-navy flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-hidden font-sans">
      {/* Ambient background nebulae / glow matching CitizenShift's deep navy and berry tones */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/15 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-berry/15 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-navy-900/40 blur-[160px]"
        aria-hidden="true"
      />

      {/* Main Dual-Panel Card */}
      <div
        className={`relative z-10 w-full max-w-[1020px] overflow-hidden rounded-[24px] sm:rounded-[32px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col md:flex-row ${className}`}
      >
        {/* Left Column: Official US Capitol Dome & CitizenShift Mission */}
        <div className="relative w-full md:w-[46%] lg:w-[48%] min-h-[300px] sm:min-h-[360px] md:min-h-[640px] bg-[#0c1831] overflow-hidden flex flex-col justify-between p-6 sm:p-8">
          {/* Background US Capitol Photo */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/photo/dome.jpg"
              alt="United States Capitol Dome"
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              priority
              className="object-cover object-center select-none"
            />
            {/* Multi-stop cinematic civic gradient overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#081326] via-[#091833]/65 to-[#061021]/75"
              aria-hidden="true"
            />
            {/* Subtle grain */}
            <div className="grain pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          </div>

          {/* Top Bar with Interactive Back Button & Logo Mark */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              href={backHref}
              aria-label="Back to home"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 border border-white/15 hover:bg-black/70 hover:scale-105 active:scale-95 shadow-md group"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>

            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md border border-white/10">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/90 font-medium">
                50 States Live
              </span>
            </div>
          </div>

          {/* Bottom Mission Headline & Verified Civic Seal */}
          <div className="relative z-10 pt-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-berry/20 border border-berry/30 px-3 py-1 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-berry-200 font-semibold">
                Article I Record
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl lg:text-[32px] font-semibold text-white leading-tight tracking-[-0.02em]">
              Democracy in <span className="italic text-white">plain language</span>.
            </h3>

            <p className="mt-3 font-sans text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm">
              CitizenShift translates Congress and all 50 state legislatures so every American can understand legislation and advocate with confidence.
            </p>

            <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-white/60">
              <span>Nonpartisan</span>
              <span>·</span>
              <span>Zero Bias</span>
              <span>·</span>
              <span>Verified Public Data</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean White Form with CitizenShift Typography */}
        <div className="relative w-full md:w-[54%] lg:w-[52%] bg-white px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-12 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-berry font-semibold mb-2">
              {eyebrow}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl md:text-[32px] font-semibold tracking-[-0.02em] text-navy leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-navy/65">
                {subtitle}
              </p>
            )}
          </div>

          {/* Body / Form */}
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthDualCard;
