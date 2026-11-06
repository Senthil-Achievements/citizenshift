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
 * Raised wave baseline with generous top/bottom clearance preventing any clipping.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden bg-paper py-3 sm:py-4 select-none border-none"
      aria-label="Civic Highlights Loop"
    >
      {/* Soft cinematic vignette fades at screen edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-paper via-paper/90 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-paper via-paper/90 to-transparent z-10" />

      {/* Elevated wave ribbon with balanced optical centering */}
      <div className="relative w-full max-w-full overflow-hidden h-20 sm:h-24 flex items-center justify-center">
        <TextLoop
          items={CIVIC_HIGHLIGHTS}
          shape="wave"
          curviness={5}
          speed={48}
          direction="forward"
          tilt={0}
          fontSize={14}
          fontWeight={600}
          letterSpacing={2.2}
          fontFamily="var(--font-mono), monospace"
          uppercase={true}
          ribbon={true}
          ribbonColor="#081c30"
          ribbonWidth={42}
          color="#f1f8fd"
          edgeFade={0}
          draggable={true}
          scrollBoost={0.35}
          pauseOnHover={true}
          viewBox="0 213 1200 96"
          className="w-full h-full [&_.text-loop-svg]:h-full [&_.text-loop-svg]:w-full"
        />
      </div>
    </section>
  );
}
