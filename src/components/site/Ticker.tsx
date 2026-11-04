"use client";

import TextLoop from "@/components/ui/TextLoop";

/**
 * Ticker — sleek, ultra-compact civic highlights ribbon.
 * Uses React Bits <TextLoop /> with GSAP ticker physics, scrollBoost acceleration,
 * drag-to-scrub, and edge-to-edge alignment.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden border-y border-icy/20 bg-navy-950 select-none"
      aria-label="Civic Highlights Loop"
    >
      {/* Edge fade gradients for screen-edge fade across all viewports */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-navy-950 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-navy-950 to-transparent z-10" />

      <div className="relative w-full max-w-full overflow-hidden h-7 sm:h-8 flex items-center">
        <TextLoop
          text="Understand Legislation ✦ Track What Matters ✦ 50 States ✦ Congress ✦ Plain Language ✦ One-Tap Advocacy ✦ Nonpartisan"
          separator="✦"
          shape="line"
          speed={55}
          direction="forward"
          tilt={0}
          fontSize={12}
          fontWeight={700}
          letterSpacing={1.8}
          uppercase={true}
          ribbon={true}
          ribbonColor="#081724"
          ribbonWidth={26}
          color="#e3f3fc"
          edgeFade={0}
          draggable={true}
          scrollBoost={0.35}
          pauseOnHover={true}
          viewBox="0 247 1200 26"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full [&_.text-loop-svg]:h-full [&_.text-loop-svg]:w-full"
        />
      </div>
    </section>
  );
}

