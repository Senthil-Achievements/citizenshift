"use client";

import TextLoop from "@/components/ui/TextLoop";

/**
 * Ticker — animated civic ribbon powered by React Bits <TextLoop />.
 * GSAP ticker physics, scrollBoost acceleration, drag-to-scrub, and edge-to-edge alignment.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden border-y border-icy/20 bg-navy-900 py-2 select-none"
      aria-label="Civic Highlights Loop"
    >
      <div className="relative w-full max-w-full overflow-hidden">
        <TextLoop
          text="Understand Legislation ✦ Track What Matters ✦ 50 States ✦ Congress ✦ Plain Language ✦ One-Tap Advocacy ✦ Nonpartisan"
          separator="✦"
          shape="wave"
          curviness={30}
          speed={65}
          direction="forward"
          tilt={0}
          fontSize={14}
          fontWeight={700}
          letterSpacing={2}
          uppercase={true}
          ribbon={true}
          ribbonColor="#081724"
          ribbonWidth={28}
          color="#e3f3fc"
          edgeFade={0.08}
          draggable={true}
          scrollBoost={0.4}
          pauseOnHover={true}
          viewBox="0 172 1200 176"
          className="w-full max-w-full"
        />
      </div>
    </section>
  );
}
