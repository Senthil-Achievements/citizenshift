"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface AuthDualCardProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function AuthDualCard({
  title,
  subtitle,
  children,
  backHref = "/",
  className = "",
}: AuthDualCardProps) {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full bg-[#0a1226] text-navy flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-hidden font-sans">
      {/* Ambient background nebulae / glow matching the cyan and warm rings */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/15 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-indigo-900/20 blur-[160px]"
        aria-hidden="true"
      />

      {/* Main Dual-Panel Card */}
      <div
        className={`relative z-10 w-full max-w-[980px] overflow-hidden rounded-[24px] sm:rounded-[32px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.55)] border border-white/10 flex flex-col md:flex-row ${className}`}
      >
        {/* Left Column: VR Cyber Illustration */}
        <div className="relative w-full md:w-[46%] lg:w-[48%] min-h-[220px] sm:min-h-[300px] md:min-h-[620px] bg-[#0c1631] overflow-hidden flex items-stretch">
          <img
            src="/images/auth/vr-cyber-illustration.png"
            alt="CitizenShift Vision"
            className="h-full w-full object-cover object-center select-none"
            draggable={false}
          />

          {/* Semi-transparent dark vignette for depth */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1226]/60 via-transparent to-black/20"
            aria-hidden="true"
          />

          {/* Interactive Back Button matching the circle at top-left */}
          <Link
            href={backHref}
            aria-label="Back to home"
            className="absolute top-5 left-5 sm:top-6 sm:left-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-all duration-200 border border-white/15 hover:bg-black/75 hover:scale-105 active:scale-95 shadow-md group"
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
        </div>

        {/* Right Column: Clean White Form */}
        <div className="relative w-full md:w-[54%] lg:w-[52%] bg-white px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-12 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-500">
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
