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
import About from "@/components/site/About";
import Team from "@/components/site/Team";
import Donate from "@/components/site/Donate";
import ContactSection from "@/components/site/ContactSection";
import Footer from "@/components/site/Footer";

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

      <main id="main">
        <Hero />
        <Ticker />
        <Pillars />
        <LegislationExplorer />

        {/* 3D Testimonials Marquee Section */}
        <section id="stories" className="relative border-t hairline bg-paper py-20 sm:py-28 overflow-hidden">
          <div className="shell mb-12 text-center">
            <p className="eyebrow text-berry">03 / Civic Feedback · 50 States</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-navy">
              Democracy in motion,
              <br />
              voiced by the people.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-navy/70">
              Constituents, educators, union organizers, and researchers across the nation who rely on
              CitizenShift for open legislative tracking and one-tap advocacy.
            </p>
          </div>

          <Testimonials3D />

          <div className="mt-10 text-center">
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-3 rounded-full border border-navy/20 bg-navy/5 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-navy transition-all duration-300 hover:border-navy hover:bg-navy hover:text-paper"
            >
              <span>Explore All Community Stories</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

        <About />
        <Team />
        <Donate />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
