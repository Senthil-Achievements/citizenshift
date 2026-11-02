"use client";

/**
 * SmoothScroll — Lenis + GSAP ScrollTrigger wiring, biased anchor navigation.
 * Disabled entirely for prefers-reduced-motion users.
 */

import { useEffect } from "react";

declare global {
  interface Window {
    __lenis?: import("lenis").default | null;
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: import("lenis").default | null = null;
    let onAnchor: ((e: MouseEvent) => void) | null = null;
    let cleanupGsap: (() => void) | null = null;

    if (!reduced) {
      let rafId = 0;
      let disposed = false;

      (async () => {
        const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (disposed) return;

        gsap.registerPlugin(ScrollTrigger);

        lenis = new Lenis({
          duration: 1.05,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.4,
        });
        window.__lenis = lenis;

        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        cleanupGsap = () => {
          cancelAnimationFrame(rafId);
          lenis?.destroy();
          window.__lenis = null;
        };

        // Bias anchor navigation through Lenis when available.
        onAnchor = (e: MouseEvent) => {
          const link = (e.target as HTMLElement).closest?.('a[href^="#"]');
          if (!link) return;
          const id = link.getAttribute("href")!;
          if (id.length < 2) return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          history.replaceState(null, "", id);
          if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -10, duration: 1.2 });
          else target.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        document.addEventListener("click", onAnchor);
      })();
    }

    return () => {
      if (onAnchor) document.removeEventListener("click", onAnchor);
      cleanupGsap?.();
      window.__lenis = null;
    };
  }, []);

  return null;
}
