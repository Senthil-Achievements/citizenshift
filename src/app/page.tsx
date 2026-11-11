import type { Metadata } from "next";
import Link from "next/link";
import SmoothScroll from "@/components/motion/SmoothScroll";
import RevealObserver from "@/components/motion/RevealObserver";
import Loader from "@/components/site/Loader";
import Header from "@/components/site/Header";
import ScrollProgress from "@/components/site/ScrollProgress";
import Hero from "@/components/site/Hero";
import Ticker from "@/components/site/Ticker";
import Pillars from "@/components/site/Pillars";
import LegislationExplorer from "@/components/site/legislation/LegislationExplorer";
import Testimonials3D from "@/components/site/Testimonials3D";
import CivicHorizontalScroll from "@/components/site/CivicHorizontalScroll";
import About from "@/components/site/About";
import Team from "@/components/site/Team";
import Donate from "@/components/site/Donate";
import ContactSection from "@/components/site/ContactSection";
import Footer from "@/components/site/Footer";
import { ScrollStackSection } from "@/components/motion/ScrollStackSection";

export const metadata: Metadata = {
  title: "CitizenShift — Bringing Power to the People",
};

export default function Page() {
  return (
    <>
      <Loader />
      <SmoothScroll />
      <RevealObserver />
      <ScrollProgress />
      <Header />

      <main id="main" className="bg-[#060913]">
        <Hero />
        <Ticker />
        <Pillars />
        <LegislationExplorer />

        {/* 3D Testimonials Marquee & 50-State Civic Voices Horizontal Stream */}
        <section
          id="stories"
          tabIndex={-1}
          className="scroll-mt-20 relative bg-[#060913] pt-20 sm:pt-28 pb-10 overflow-hidden text-paper border-none select-none focus:outline-none"
        >
          {/* Ambient Lighting Orbs (Ultra-fast radial gradients) */}
          <div
            className="pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.2)_0%,transparent_70%)] transform-gpu will-change-transform"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 right-1/4 size-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.2)_0%,transparent_70%)] transform-gpu will-change-transform"
            aria-hidden="true"
          />

          <div className="shell mb-12 text-center relative z-10">
            <p className="eyebrow text-berry">03 / Civic Feedback · 50 States</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
              Democracy in motion,
              <br />
              voiced by the people.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70">
              Constituents, educators, union organizers, and researchers across the nation who rely on
              CitizenShift for open legislative tracking and one-tap advocacy.
            </p>
          </div>

          <Testimonials3D />

          <div className="mt-8 text-center relative z-10">
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-navy shadow-sm"
            >
              <span>Explore All Community Stories</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

        {/* 50-State Civic Voices Horizontal Stream (Zero dead space) */}
        <CivicHorizontalScroll />

        {/* 3D Scroll Stack Animation: Applied directly to CitizenShift's own sections */}
        <ScrollStackSection index={0}>
          <About />
        </ScrollStackSection>

        <ScrollStackSection index={1}>
          <Team />
        </ScrollStackSection>

        <ScrollStackSection index={2}>
          <Donate />
        </ScrollStackSection>

        <ScrollStackSection index={3}>
          <ContactSection />
        </ScrollStackSection>
      </main>
      <Footer />
    </>
  );
}
