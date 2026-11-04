"use client";

import CurvedLoop from "@/components/ui/CurvedLoop";

/**
 * Ticker — animated civic highlights ribbon.
 * Sleek, compact typography with interactive drag, fling momentum, and SVG textPath flow.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden border-y border-icy/20 bg-navy-900 py-1 text-icy select-none"
      aria-label="Civic Highlights Loop"
    >
      <CurvedLoop
        marqueeText="Understand Legislation ✦ Track What Matters ✦ 50 States ✦ Congress ✦ Plain Language ✦ One-Tap Advocacy ✦ Nonpartisan ✦"
        shape="arc"
        speed={1.8}
        curveAmount={25}
        direction="left"
        fontSize={14}
        fontWeight={700}
        letterSpacing={2}
        separator=""
        outline={false}
        scrollBoost={0}
        edgeFade={0.08}
        interactive={true}
        pauseOnHover={false}
        separatorColor={null}
        color="#e3f3fc"
      />
    </section>
  );
}
