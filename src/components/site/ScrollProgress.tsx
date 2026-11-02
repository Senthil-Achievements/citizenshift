"use client";

import { useEffect, useRef } from "react";

/** ScrollProgress — hairline reading indicator, springs at the top edge. */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p})`;
      bar.style.opacity = p > 0.005 ? "1" : "0";
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-berry opacity-0 transition-opacity"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
