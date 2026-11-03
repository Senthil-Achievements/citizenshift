"use client";

import { VantaBirds } from "@/components/vanta/VantaBirds";

/**
 * Hero — cinematic editorial opening.
 * GSAP ScrollTrigger parallax + pointer-reactive drift + word-by-word reveal.
 * Reduced motion: static composition, CSS handles accessibility.
 */

import { useEffect, useRef, useState } from "react";
import JoinModal from "@/components/site/JoinModal";

function Word({ children }: { children: React.ReactNode }) {
  return (
    <span className="word-mask mr-[0.22em] last:mr-0">
      <span>{children}</span>
    </span>
  );
}

export default function Hero() {
  const imageRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const [joinOpen, setJoinOpen] = useState(false);

  // word reveal waits for the loader curtain
  useEffect(() => {
    const seen = sessionStorage.getItem("citizenshift:loaded");
    const delay = seen ? 250 : 2050;
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".reveal-words").forEach((el) => el.classList.add("is-in"));
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  // parallax (ScrollTrigger, scrub) + subtle pointer drift
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed || !imageRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const tween = gsap.to(imageRef.current, {
        yPercent: 16,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: "#home",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // drift the meta row subtly on scroll too
      const metaTween = metaRef.current
        ? gsap.to(metaRef.current, {
            yPercent: -30,
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: "#home", start: "top top", end: "55% top", scrub: true },
          })
        : null;

      // pointer drift (lerped, very subtle)
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      const onPointer = (e: PointerEvent) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 14;
        ty = (e.clientY / window.innerHeight - 0.5) * 8;
      };
      const loop = () => {
        cx += (tx - cx) * 0.045;
        cy += (ty - cy) * 0.045;
        if (imageRef.current) {
          imageRef.current.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
        }
        raf = requestAnimationFrame(loop);
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        metaTween?.kill();
        metaTween?.scrollTrigger?.kill();
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section id="home" className="atmos grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-navy-900 text-paper">
      {/* 1. Backdrop image of the Capitol dome + atmospheric vignette */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          ref={imageRef}
          className="absolute inset-[-6%] bg-cover bg-[center_38%] will-change-transform"
          style={{ backgroundImage: "url(/photo/hero.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/75 via-navy-900/30 to-navy-900/85" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_10%,rgba(23,59,87,0.45),transparent_60%)]" />
      </div>

      {/* 2. Vanta.js BIRDS animation — soaring gracefully across the sky above Capitol */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <VantaBirds
          className="w-full h-full"
          config={{
            backgroundAlpha: 0.0,
            birdSize: 0.8,
            wingSpan: 11.0,
            speedLimit: 6.0,
            separation: 85.0,
            alignment: 80.0,
            cohesion: 85.0,
            quantity: 4.0,
            color1: "#38bdf8",
            color2: "#f43f5e",
          }}
        />
      </div>

      {/* vertical index rail */}
      <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rotate-90 xl:block z-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-icy/40">
          50 STATES — ONE RECORD — ZERO PARTISANSHIP
        </span>
      </div>

      <div className="shell relative z-10 flex flex-1 flex-col justify-end pb-14 pt-36 sm:pb-20">
        {/* eyebrow */}
        <div className="reveal-words" data-intro>
          <p className={`mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-icy/70 sm:gap-5 sm:text-[11px]`}>
            <span className="word-mask"><span className="flex items-center gap-3">
              <span className="inline-block size-1.5 rounded-full bg-berry" />
              Nonpartisan Civic Platform
            </span></span>
            <span className="hidden h-px w-12 bg-icy/30 sm:block" />
            <Word>New York, NY</Word>
            <span className={`hidden h-px w-12 bg-icy/30 sm:block`} />
            <Word>Citizenshift.us</Word>
          </p>
        </div>

        {/* headline */}
        <h1 className="reveal-words max-w-[15ch] font-display text-[clamp(2.35rem,8vw,7.25rem)] font-semibold leading-[0.98] tracking-[-0.025em]">
          <Word>Bringing</Word>
          <Word>power</Word>
          <Word>to</Word>
          <Word>the</Word>
          <Word>
            <span className="italic text-icy">people</span>
            <span className="text-berry">.</span>
          </Word>
        </h1>

        {/* supporting line + CTAs */}
        <div className="reveal-words mt-8 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-[15px] leading-relaxed text-icy sm:text-base">
            <Word>Understand</Word>
            <Word>legislation.</Word>
            <Word>Stay</Word>
            <Word>informed.</Word>
            <Word>Make</Word>
            <Word>your</Word>
            <Word>voice</Word>
            <Word>heard.</Word>
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#legislation"
              className="group relative overflow-hidden rounded-full bg-icy px-7 py-4 text-center text-sm font-bold text-navy transition-colors duration-300 hover:bg-paper"
            >
              <span className="relative z-10">Explore Legislation</span>
              <span className="absolute inset-0 translate-y-full bg-berry transition-transform duration-300 group-hover:translate-y-0" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="rounded-full border border-paper/30 bg-navy-900/40 backdrop-blur-sm px-7 py-4 text-center text-sm font-semibold text-paper transition-all duration-300 hover:border-icy hover:bg-paper/10"
            >
              Join the Movement
            </button>
          </div>
        </div>

        {/* scroll indicator + live metadata */}
        <div ref={metaRef} className="mt-14 flex items-center justify-between border-t hairline-light pt-5">
          <a href="#legislation" className="group flex items-center gap-3" aria-label="Scroll to legislation">
            <span className="grid size-9 place-items-center rounded-full border hairline-light transition-colors group-hover:border-icy">
              <span className="scroll-dot block size-1 rounded-full bg-icy" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-icy/60 group-hover:text-icy">
              Scroll — Live feed below
            </span>
          </a>
          <div className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-icy/60 sm:flex">
            <span>{today}</span>
            <span className="flex items-center gap-2">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-berry" />
              Feed live
            </span>
          </div>
        </div>
      </div>

      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} intent="join" />
    </section>
  );
}
