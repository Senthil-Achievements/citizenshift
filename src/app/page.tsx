import type { Metadata } from "next";
import SmoothScroll from "@/components/motion/SmoothScroll";
import RevealObserver from "@/components/motion/RevealObserver";
import Loader from "@/components/site/Loader";
import Header from "@/components/site/Header";
import ScrollProgress from "@/components/site/ScrollProgress";
import Hero from "@/components/site/Hero";
import Ticker from "@/components/site/Ticker";
import Pillars from "@/components/site/Pillars";
import LegislationExplorer from "@/components/site/legislation/LegislationExplorer";
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
        <About />
        <Team />
        <Donate />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
