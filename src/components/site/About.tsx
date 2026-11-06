"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

const MoonlitPetals = dynamic(
  () => import("@/components/originkit/ui/moonlit-petals"),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#060913]" />,
  }
);

/**
 * About — content transcribed from the existing CitizenShift properties.
 * Nothing invented: the problem, mission, mechanism, and nonpartisan
 * declaration are the client's own published language.
 *
 * Rendered over the atmospheric Originkit "Moonlit Petals" backdrop with
 * glassy, frosted-morphism editorial containers and high contrast readability.
 */
export default function About() {
  return (
    <section
      id="about"
      className="relative isolate overflow-hidden bg-[#060913] text-paper min-h-[900px]"
      aria-labelledby="about-heading"
    >
      {/* Cinematic Moonlit Petals Live Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <MoonlitPetals
          background="#050811"
          blossomColor="#e3c2ff"
          speed={85}
          petals={75}
          wind={32}
          scale={105}
          glow={65}
          direction="left"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
          }}
        />
        {/* Specular glassy vignette & ambient depth overlays (Seamless transition top & bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060913] via-[#060913]/30 to-[#060913]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/75" />
        <div className="grain pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      </div>

      <div className="shell relative z-10 py-20 sm:py-28">
        {/* Top heading row */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-icy/70 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-berry inline-block animate-pulse" />
              About CitizenShift
            </p>
            <h2
              id="about-heading"
              className="mt-3 max-w-[18ch] font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-white"
            >
              A record the{" "}
              <span className="italic text-icy drop-shadow-[0_0_16px_rgba(207,160,255,0.45)]">
                people
              </span>{" "}
              can read.
            </h2>
          </div>
          <div className="rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md px-4 py-1.5 shadow-xs">
            <p className="eyebrow text-icy/80 font-mono text-[10px] uppercase tracking-[0.18em]">
              Nonpartisan 501(c)(4)-style platform 2
              <span className="mx-1.5 text-berry">/</span>
              New York, NY
            </p>
          </div>
        </div>

        {/* Pull quote — Glassy Frosted Billboard */}
        <blockquote
          data-reveal
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl p-7 sm:p-11 md:p-14 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] my-10 sm:my-14 transition-all duration-300 hover:border-white/20"
        >
          {/* Glass specular accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-berry via-purple-400 to-berry" />
          <p className="max-w-4xl pl-3 sm:pl-5 font-display text-[clamp(1.35rem,3.4vw,2.35rem)] font-medium leading-[1.28] tracking-[-0.01em] text-paper">
            Corporations, governments, and technology are becoming more powerful
            than ever.{" "}
            <span className="text-icy font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              It's imperative that the voice of the people does the same.
            </span>
          </p>
        </blockquote>

        {/* Three-column editorial grid — Glassy Cards */}
        <div className="grid gap-6 md:grid-cols-3" data-reveal>
          {[
            {
              k: "The Problem",
              badge: "THE PROBLEM",
              t: "Legislation is out of reach",
              c: "Legislation is complex, inaccessible, and time-consuming to understand. While thousands of bills are introduced each year, most Americans do not have the time, tools, or context to track how laws affect their lives — or to effectively communicate with their elected officials. This information gap weakens civic participation and accountability.",
            },
            {
              k: "The Mission",
              badge: "THE MISSION",
              t: "Make legislation accessible",
              c: "CitizenShift's mission is to increase civic engagement by making legislation more accessible, understandable, and actionable for every American.",
            },
            {
              k: "The Mechanism",
              badge: "THE MECHANISM",
              t: "Bills, built like a social feed",
              c: "We bring bills into a social-media like format personalised to every American based on geography and policy interests. And we reduce barriers between legislators and constituents by making it possible to contact legislators and advocate for policies with the push of a button.",
            },
          ].map((col) => (
            <article
              key={col.k}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 backdrop-blur-xl p-7 sm:p-9 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-white/25 hover:bg-slate-950/60 hover:-translate-y-1 hover:shadow-[0_16px_40px_0_rgba(0,0,0,0.6)]"
            >
              {/* Specular top sheen */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <p className="eyebrow text-berry font-bold tracking-[0.18em]">{col.badge}</p>
              <h3 className="mt-4 font-display text-xl font-bold leading-snug text-paper sm:text-2xl drop-shadow-sm">
                {col.t}
              </h3>
              <p className="mt-4 block text-sm leading-relaxed text-slate-200/85 font-normal">
                {col.c}
              </p>
            </article>
          ))}
        </div>

        {/* Nonpartisan declaration + image row */}
        <div className="mt-14 grid gap-8 md:grid-cols-12 md:items-center">
          <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-white/15 bg-slate-950/40 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] md:col-span-5 group">
            <Image
              src="/photo/townhall.jpg"
              alt="Constituents gathered in discussion during a civic townhall"
              fill
              sizes="(min-width: 1240px) 480px, 90vw"
              className="object-cover grayscale-[0.15] contrast-[1.05] brightness-90 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/70 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-icy backdrop-blur-md shadow-xs">
              Town Hall / Civic Practice
            </span>
          </div>

          <div className="md:col-span-7">
            <div
              data-reveal
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 backdrop-blur-xl p-7 sm:p-9 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:bg-slate-950/60"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <p className="eyebrow text-berry font-bold tracking-[0.18em]">
                Declaration of Nonpartisanship
              </p>
              <p className="mt-4 text-lg leading-relaxed text-paper sm:text-xl font-medium drop-shadow-sm">
                CitizenShift does not support or oppose candidates for public office,
                and does not take a stand for or against any political party.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-300/80">
                Our interest is not in the outcome of any election. It is in an
                American public equipped to understand the laws written in its name —
                whatever a reader's politics may be.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
