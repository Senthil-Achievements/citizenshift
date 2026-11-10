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
      let disposed = false;

      (async () => {
        const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (disposed) return;

        gsap.registerPlugin(ScrollTrigger);

        // 60+ FPS Pure Smooth Scroll configuration tuned for low-spec laptops & battery saver
        lenis = new Lenis({
          lerp: 0.1, // Snappy response with zero input lag
          wheelMultiplier: 1.0,
          touchMultiplier: 1.0,
          smoothWheel: true,
          syncTouch: false, // Let native touch run at hardware 120Hz
          autoRaf: false, // Driven synchronously via GSAP ticker
        });
        window.__lenis = lenis;

        // Synchronize Lenis and GSAP ScrollTrigger in the exact same render cycle
        lenis.on("scroll", ScrollTrigger.update);

        const ticker = (time: number) => {
          lenis?.raf(time * 1000);
        };
        gsap.ticker.add(ticker);
        gsap.ticker.lagSmoothing(500, 33); // Absorbs frame rate fluctuations smoothly without stutter

        cleanupGsap = () => {
          gsap.ticker.remove(ticker);
          lenis?.destroy();
          window.__lenis = null;
        };

        // Bias anchor navigation smoothly through Lenis when available (both #id and /#id on home).
        onAnchor = (e: MouseEvent) => {
          const link = (e.target as HTMLElement).closest?.('a[href^="#"], a[href^="/#"]');
          if (!link) return;
          const href = link.getAttribute("href")!;
          const id = href.startsWith("/#") ? href.slice(1) : href;
          if (id.length < 2) return;

          // If on homepage, intercept and scroll smoothly
          if (window.location.pathname === "/" || !href.startsWith("/#")) {
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            history.replaceState(null, "", id);
            if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -24, duration: 1.0 });
            else target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        };
        document.addEventListener("click", onAnchor);

        // Scroll to hash on initial page mount if present
        if (window.location.hash) {
          setTimeout(() => {
            try {
              const target = document.querySelector(window.location.hash);
              if (target) {
                if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -24, duration: 1.0 });
                else target.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            } catch {
              /* ignore invalid selector */
            }
          }, 350);
        }
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
