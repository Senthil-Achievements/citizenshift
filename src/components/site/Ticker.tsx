"use client";

import TextLoop from "@/components/ui/TextLoop";

/**
 * Ticker — animated civic ribbon powered by React Bits <TextLoop />.
 * GSAP ticker physics, scrollBoost acceleration, drag-to-scrub, and edge-to-edge alignment.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden border-y border-icy/20 bg-navy-900 py-1.5 select-none"
      aria-label="Civic Highlights Loop"
    >
      <div className="relative w-full max-w-full overflow-hidden">
        <TextLoop
          text="Understand Legislation ✦ Track What Matters ✦ 50 States ✦ Congress ✦ Plain Language ✦ One-Tap Advocacy ✦ Nonpartisan"
          separator="✦"
          shape="line"
          speed={70}
          direction="forward"
          tilt={0}
          fontSize={28}
          fontWeight={800}
          letterSpacing={2.5}
          uppercase={true}
          ribbon={true}
          ribbonColor="#081724"
          ribbonWidth={54}
          color="#e3f3fc"
          edgeFade={0.12}
          draggable={true}
          scrollBoost={0.45}
          pauseOnHover={true}
          viewBox="0 230 1200 60"
          className="w-full max-w-full"
        />
      </div>
    </section>
  );
}
