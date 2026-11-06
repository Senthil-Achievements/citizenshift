"use client";

import { VantaBirds } from "@/components/vanta/VantaBirds";

/**
 * Hero — cinematic editorial opening with Widening Dome Scroll Transition.
 * References exact geometry & timeline scrubbing from:
 * https://github.com/8bsite/florist-website-template
 * 
 * Top section stays sticky while the curved dome section rises up over it,
 * expanding smoothly from an architectural ellipse into full screen (clipPath: ellipse(...) -> 'none').
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
  const heroContentRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLParagraphElement>(null);
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

  // GSAP ScrollTrigger Widening Dome Arch + Hero Parallax + Pointer Drift
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    if (reduced) {
      if (nightRef.current) {
        nightRef.current.style.clipPath = "none";
      }
      return;
    }

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);

      const night = nightRef.current;
      const img = imageRef.current;
      const heroContent = heroContentRef.current;
      const statement = statementRef.current;

      if (!night) return;

      // Exact dome geometry calculation from florist reference
      const geometry = { rx: 0, ry: 0 };
      const measure = () => {
        if (!night) return;
        const w = night.clientWidth;
        const h = window.innerHeight;
        geometry.rx = w * (w < 760 ? 0.62 : 0.55);
        geometry.ry = h * 0.9;
      };

      const dome = (progress: number) => {
        if (!night) return;
        if (progress >= 0.999) {
          night.style.clipPath = "none";
          return;
        }
        const t = Math.max(0, progress - 0.55) / 0.45;
        const grow = 1 + 80 * t * t * t;
        const rx = geometry.rx * grow;
        const ry = geometry.ry * grow;
        night.style.clipPath = `ellipse(${rx.toFixed(1)}px ${ry.toFixed(1)}px at 50% ${ry.toFixed(1)}px)`;
      };

      measure();
      dome(0);

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "opening-dome",
          trigger: night,
          start: "top bottom",
          end: "top top",
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            measure();
            dome(self.progress);
          },
          onUpdate: (self) => dome(self.progress),
        },
      });

      // Background Capitol photo scales and dims slightly as dome rises
      if (img) {
        timeline.fromTo(
          img,
          { scale: 1, filter: "brightness(1) saturate(1)" },
          { scale: 1.14, filter: "brightness(0.55) saturate(1.15)", ease: "none", duration: 1 },
          0
        );
      }

      // Hero content fades and lifts slightly as the dome arches over it
      if (heroContent) {
        timeline.to(
          heroContent,
          { yPercent: -12, opacity: 0.35, ease: "none", duration: 0.85 },
          0
        );
      }

      // Statement slides into view smoothly
      if (statement) {
        timeline.fromTo(
          statement,
          { y: () => window.innerHeight * 0.16 },
          { y: 0, ease: "none", duration: 0.8 },
          0.2
        );
      }

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
        timeline.scrollTrigger?.kill();
        timeline.kill();
        if (night) night.style.clipPath = "";
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
    <div id="opening" className="relative bg-[#060913]">
      {/* 1. Sticky Hero Container (pinned at top while the curved dome section rises over it) */}
      <div className="op__hold sticky top-0 z-0 h-[100svh] min-h-[580px] w-full overflow-hidden">
        <section id="home" className="atmos grain relative isolate flex h-full min-h-[100svh] flex-col overflow-hidden bg-[#060913] text-paper">
          {/* Backdrop image of the Capitol dome + atmospheric vignette */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div
              ref={imageRef}
              className="absolute inset-[-6%] bg-cover bg-[center_38%] will-change-transform"
              style={{ backgroundImage: "url(/photo/hero.jpg)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy-900/75 via-navy-900/30 to-navy-900/85" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_10%,rgba(23,59,87,0.45),transparent_60%)]" />
          </div>

          {/* Vanta.js BIRDS animation — soaring gracefully across the sky above Capitol */}
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

          <div ref={heroContentRef} className="shell relative z-10 flex flex-1 flex-col justify-end pb-14 pt-36 sm:pb-20 will-change-transform">
            {/* eyebrow */}
            <div className="reveal-words" data-intro>
              <p className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-icy/70 sm:gap-5 sm:text-[11px]">
                <span className="word-mask">
                  <span className="flex items-center gap-3">
                    <span className="inline-block size-1.5 rounded-full bg-berry" />
                    Nonpartisan Civic Platform
                  </span>
                </span>
                <span className="hidden h-px w-12 bg-icy/30 sm:block" />
                <Word>New York, NY</Word>
                <span className="hidden h-px w-12 bg-icy/30 sm:block" />
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
              <a href="#civic-statement" className="group flex items-center gap-3" aria-label="Scroll to civic mission">
                <span className="grid size-9 place-items-center rounded-full border hairline-light transition-colors group-hover:border-icy">
                  <span className="scroll-dot block size-1 rounded-full bg-icy" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-icy/60 group-hover:text-icy">
                  Scroll — Widening dome below
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
        </section>
      </div>

      {/* 2. Widening Dome / Arch Section (rises up over Hero on scroll, matching florist repo) */}
      <section
        ref={nightRef}
        id="civic-statement"
        className="op__night relative z-10 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-paper px-6 py-24 text-center text-navy sm:px-12 sm:py-32"
        aria-label="Civic Mission"
      >
        {/* subtle civic geometric background grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(#173b57_1px,transparent_1px)] [background-size:24px_24px]"
        />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 sm:gap-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-3 rounded-full border hairline bg-navy/[0.03] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-berry sm:text-xs">
            <span className="size-1.5 rounded-full bg-berry" />
            <span>The Civic Mission · Article I Record</span>
            <span className="size-1.5 rounded-full bg-berry" />
          </div>

          {/* Statement — slides up into position as dome covers hero */}
          <p
            ref={statementRef}
            className="op__statement font-display text-[clamp(1.65rem,3.4vw,2.95rem)] font-normal leading-[1.25] tracking-[-0.015em] text-navy"
          >
            CitizenShift is a nonpartisan civic platform engineered to make democracy
            readable. We translate legislation from Congress and all 50 state
            legislatures into plain language, so the people hold the power.
          </p>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.22em] text-navy/60 sm:text-[11px]">
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-navy/40" />
              Zero editorial bias
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-navy/40" />
              50 states verified
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-navy/40" />
              Real-time LegiScan data
            </span>
          </div>

          {/* Action button */}
          <a
            href="#legislation"
            className="group mt-4 inline-flex items-center gap-3 rounded-full border border-navy/20 bg-navy/5 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] text-navy transition-all duration-300 hover:border-navy hover:bg-navy hover:text-paper"
          >
            <span>Explore Public Record</span>
            <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
          </a>
        </div>
      </section>

      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} intent="join" />
    </div>
  );
}
