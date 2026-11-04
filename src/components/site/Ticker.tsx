"use client";

import TextLoop from "@/components/ui/TextLoop";

/**
 * Ticker — elegant, high-craft civic highlights ribbon.
 * Features balanced vertical breathing room, authentic IBM Plex Mono typography,
 * luminous icy tracking, and smooth physics-driven motion.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden border-y border-white/[0.08] bg-navy-950 select-none before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-icy/25 before:to-transparent after:absolute after:inset-x-0 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-berry/20 after:to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
      aria-label="Civic Highlights Loop"
    >
      {/* Soft cinematic vignette fades at screen edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-navy-950 via-navy-950/90 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-navy-950 via-navy-950/90 to-transparent z-10" />

      {/* Balanced, airy height container (40px on mobile, 44px on desktop) */}
      <div className="relative w-full max-w-full overflow-hidden h-10 sm:h-11 flex items-center">
        <TextLoop
          text="Understand Legislation ✦ Track What Matters ✦ 50 States ✦ Congress ✦ Plain Language ✦ One-Tap Advocacy ✦ Nonpartisan"
          separator="✦"
          shape="line"
          speed={48}
          direction="forward"
          tilt={0}
          fontSize={11}
          fontWeight={600}
          letterSpacing={2.8}
          fontFamily="var(--font-mono), monospace"
          uppercase={true}
          ribbon={true}
          ribbonColor="#081624"
          ribbonWidth={44}
          color="#e8f4fc"
          edgeFade={0}
          draggable={true}
          scrollBoost={0.25}
          pauseOnHover={true}
          viewBox="0 238 1200 44"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full [&_.text-loop-svg]:h-full [&_.text-loop-svg]:w-full"
        />
      </div>
    </section>
  );
}

