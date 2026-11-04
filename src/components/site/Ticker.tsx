"use client";

import CurvedLoop from "@/components/ui/CurvedLoop";

/**
 * Ticker — animated civic ribbon powered by React Bits <CurvedLoop />.
 * Sweeping arc marquee with interactive drag, fling physics, and SVG textPath flow.
 */
export default function Ticker() {
  return (
    <section
      className="relative w-full max-w-full overflow-hidden border-y border-icy/20 bg-navy-900 text-icy select-none"
      aria-label="Curved Loop Marquee"
    >
      <CurvedLoop
        marqueeText="Be ✦ Creative ✦ With ✦ React ✦ Bits ✦"
        shape="arc"
        speed={2}
        curveAmount={400}
        direction="left"
        fontSize={96}
        fontWeight={700}
        letterSpacing={0}
        separator=""
        outline={false}
        scrollBoost={0}
        edgeFade={0}
        interactive={true}
        pauseOnHover={false}
        separatorColor={null}
        color={null}
      />
    </section>
  );
}
