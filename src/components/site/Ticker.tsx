"use client";

import TextLoop, { TextLoopItem } from "@/components/ui/TextLoop";

const CIVIC_HIGHLIGHTS: TextLoopItem[] = [
  { text: "Understand Legislation", icon: "✦", color: "#f43f5e" },
  { text: "Track What Matters", icon: "✳", color: "#38bdf8" },
  { text: "50 States", icon: "★", color: "#f59e0b" },
  { text: "Congress", icon: "✦", color: "#a855f7" },
  { text: "Plain Language", icon: "✳", color: "#38bdf8" },
  { text: "One-Tap Advocacy", icon: "★", color: "#f43f5e" },
  { text: "Nonpartisan", icon: "✦", color: "#10b981" },
];

/**
 * Ticker — premium, playful civic highlights ribbon.
 * Features a gentle undulating wave, colorful glowing stars,
 * perfectly centered typography, and responsive interactive drag physics.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden border-y border-white/[0.08] bg-navy-950 py-1.5 select-none before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-icy/30 before:to-transparent after:absolute after:inset-x-0 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-berry/25 after:to-transparent shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      aria-label="Civic Highlights Loop"
    >
      {/* Soft cinematic vignette fades at screen edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-navy-950 via-navy-950/90 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-navy-950 via-navy-950/90 to-transparent z-10" />

      {/* Playful, compact wave ribbon with perfectly centered text */}
      <div className="relative w-full max-w-full overflow-hidden h-16 sm:h-20 flex items-center justify-center">
        <TextLoop
          items={CIVIC_HIGHLIGHTS}
          shape="wave"
          curviness={13}
          speed={50}
          direction="forward"
          tilt={0}
          fontSize={14.5}
          fontWeight={600}
          letterSpacing={2.4}
          fontFamily="var(--font-mono), monospace"
          uppercase={true}
          ribbon={true}
          ribbonColor="#081c30"
          ribbonWidth={44}
          color="#f1f8fd"
          edgeFade={0}
          draggable={true}
          scrollBoost={0.35}
          pauseOnHover={true}
          viewBox="0 208 1200 104"
          className="w-full h-full [&_.text-loop-svg]:h-full [&_.text-loop-svg]:w-full"
        />
      </div>
    </section>
  );
}


