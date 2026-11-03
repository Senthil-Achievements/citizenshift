"use client";

/**
 * Loader — cinematic curtain sequence (wordmark + progress + curtain lift).
 * Plays once per session; reduced-motion users skip it entirely.
 */

import { useEffect, useState } from "react";

export default function Loader() {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit" | "done">("enter");
  const [count, setCount] = useState(0);

  useEffect(() => {
    // If user arrived with a specific anchor hash (e.g. #legislation), skip curtain
    if (typeof window !== "undefined" && window.location.hash) {
      setPhase("done");
      document.body.style.overflow = "";
      return;
    }

    const seen = sessionStorage.getItem("citizenshift:loaded");
    if (seen) {
      setPhase("done");
      document.body.style.overflow = "";
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";
    const timers: ReturnType<typeof setTimeout>[] = [];
    const start = performance.now();
    const DURATION = reduced ? 800 : 1400;

    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      // ease-out quad for the counter
      setCount(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase("hold");
        timers.push(setTimeout(() => setPhase("exit"), 250));
        timers.push(
          setTimeout(() => {
            setPhase("done");
            document.body.style.overflow = "";
            sessionStorage.setItem("citizenshift:loaded", "1");
          }, 1350),
        );
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  // signal the hero so its word reveal can start as the curtain lifts
  useEffect(() => {
    if (phase === "exit") {
      window.dispatchEvent(new Event("citizenshift:loaderdone"));
    }
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] overflow-hidden"
    >
      <div className={`curtain flex h-full w-full flex-col ${phase === "exit" ? "curtain-up" : ""}`}>
        <div className="grain relative flex h-full w-full flex-col justify-between bg-navy-900 p-8 sm:p-12">
          <div className="eyebrow text-icy/60">
            CitizenShift
            <span className="mx-2 text-berry">/</span>
            Est. New York
          </div>

          <div className="flex items-center justify-center">
            <div
              className={`transition-all duration-700 ${
                phase !== "enter"
                  ? "translate-y-0 opacity-100 blur-0"
                  : "translate-y-4 opacity-0 blur-md"
              }`}
            >
              <p className="text-center font-display text-[clamp(2rem,6vw,4.25rem)] font-semibold leading-none tracking-[-0.02em] text-paper">
                Bringing power
              </p>
              <p className="text-center font-display text-[clamp(2rem,6vw,4.25rem)] font-semibold leading-none tracking-[-0.02em] text-paper">
                to the <span className="italic text-berry">people</span>.
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between font-mono text-xs text-icy/70">
            <span>LOADING THE RECORD / CONGRESS ⋅ 50 STATES</span>
            <span className="text-2xl tabular-nums text-paper sm:text-4xl">
              {String(count).padStart(3, "0")}
            </span>
          </div>

          {/* progress hairline */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-icy/15">
            <div
              className="h-full bg-berry transition-[width] duration-150"
              style={{ width: `${count}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
