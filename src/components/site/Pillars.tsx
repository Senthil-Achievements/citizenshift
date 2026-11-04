"use client";

import ShutterBlindsCarousel, { ShutterSlide } from "@/components/ui/ShutterBlindsCarousel";

const SHUTTER_SLIDES: ShutterSlide[] = [
  {
    index: "01",
    category: "LEGISLATION",
    tag: "PLAIN-LANGUAGE SUMMARIES / LEGISCAN RECORD",
    title: "Understand Legislation",
    description:
      "Legislation is complex, inaccessible, and time-consuming to follow. CitizenShift translates bills into a readable social-media style feed — plain-language summaries, policy areas, and status at a glance — so every American can follow what their government is actually doing.",
    image: "/photo/hearing.jpg",
    alt: "A Senate hearing room during a public legislative hearing",
    linkHref: "#feed",
    linkLabel: "Explore Bills",
  },
  {
    index: "02",
    category: "GEOGRAPHY",
    tag: "PERSONALISED FEED / GEOGRAPHY + INTERESTS",
    title: "Discover What Matters",
    description:
      "Thousands of bills are introduced every year. CitizenShift personalises them by geography and policy interest — federal, state, and municipal — so your feed is built around the places and issues that shape your life.",
    image: "/photo/crowd.jpg",
    alt: "Crowds gathered on the National Mall in Washington DC",
    linkHref: "#feed",
    linkLabel: "Filter Your State",
  },
  {
    index: "03",
    category: "ADVOCACY",
    tag: "CONTACT YOUR REPRESENTATIVE / ONE-TAP ADVOCACY",
    title: "Make Your Voice Heard",
    description:
      "Most Americans don't have the time or tools to reach their elected officials. CitizenShift removes the barriers: find your senators and representative, then advocate on the bills you care about — in a few taps.",
    image: "/photo/dome.jpg",
    alt: "The United States Capitol rising above the skyline at dusk",
    linkHref: "#stories",
    linkLabel: "Read Community Stories",
  },
  {
    index: "04",
    category: "COMMUNITY",
    tag: "LOCAL ACTION / 50 STATES RECORD",
    title: "Grassroots Town Halls",
    description:
      "Connect legislation to real people in your neighborhood. Discover local hearings, join community petitions, and see how laws directly affect education, healthcare, and infrastructure near you.",
    image: "/photo/townhall.jpg",
    alt: "A community town hall meeting with local constituents",
    linkHref: "#stories",
    linkLabel: "View Stories",
  },
  {
    index: "05",
    category: "TRANSPARENCY",
    tag: "INDEPENDENT NONPARTISAN PLATFORM",
    title: "Open Civic Record",
    description:
      "Democracy requires honesty. Every bill text, vote count, and sponsor is sourced directly from official state legislatures and Congress with zero partisan commentary or hidden agendas.",
    image: "/photo/hero.jpg",
    alt: "The United States Capitol glowing under evening lights",
    linkHref: "#feed",
    linkLabel: "Inspect Public Record",
  },
];

export default function Pillars() {
  return (
    <section className="relative bg-paper py-20 sm:py-28 overflow-hidden" aria-labelledby="pillars-heading">
      <div className="shell">
        {/* Section Heading */}
        <div className="mb-12 flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-berry">01 — 05 / The Method</p>
            <h2 id="pillars-heading" className="mt-3 font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-navy">
              Civic participation,
              <br />
              engineered.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-navy/65">
            Five mechanisms, one loop: read the legislative record, find the laws
            that touch your life, and put your voice where it counts.
          </p>
        </div>

        {/* 3D Shutter Blinds Carousel */}
        <div data-reveal className="relative mt-8">
          <ShutterBlindsCarousel slides={SHUTTER_SLIDES} numSlats={8} autoPlay={false} />
        </div>
      </div>
    </section>
  );
}
