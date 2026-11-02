import Image from "next/image";

const PILLARS = [
  {
    index: "01",
    title: "Understand Legislation",
    copy: "Legislation is complex, inaccessible, and time-consuming to follow. CitizenShift translates bills into a readable social-media style feed — plain-language summaries, policy areas, and status at a glance — so every American can follow what their government is actually doing.",
    image: "/photo/hearing.jpg",
    alt: "A Senate hearing room during a public hearing",
    meta: "PLAIN-LANGUAGE SUMMARIES / LEGISCAN RECORD",
  },
  {
    index: "02",
    title: "Discover What Matters",
    copy: "Thousands of bills are introduced every year. CitizenShift personalises them by geography and policy interest — federal, state, and municipal — so your feed is built around the places and issues that shape your life.",
    image: "/photo/crowd.jpg",
    alt: "Crowds gathered on the National Mall",
    meta: "PERSONALISED FEED / GEOGRAPHY + INTERESTS",
    flip: true,
  },
  {
    index: "03",
    title: "Make Your Voice Heard",
    copy: "Most Americans don't have the time or tools to reach their elected officials. CitizenShift removes the barriers: find your senators and representative, then advocate on the bills you care about — in a few taps.",
    image: "/photo/dome.jpg",
    alt: "The United States Capitol rising above the skyline",
    meta: "CONTACT YOUR REPRESENTATIVE / ONE-TAP ADVOCACY",
  },
];

export default function Pillars() {
  return (
    <section className="relative bg-paper" aria-labelledby="pillars-heading">
      <div className="shell py-20 sm:py-28">
        {/* section heading */}
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-berry">01 — 03 / The Method</p>
            <h2 id="pillars-heading" className="mt-3 font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-navy">
              Civic participation,
              <br />
              engineered.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-navy/65">
            Three mechanisms, one loop: read the legislative record, find the laws
            that touch your life, and put your voice where it counts.
          </p>
        </div>

        {/* pillar rows */}
        <div className="grid gap-16 py-14 sm:gap-6">
          {PILLARS.map((p) => (
            <article
              key={p.index}
              data-reveal
              className={`grid items-center gap-8 md:grid-cols-12 md:gap-10 ${p.flip ? "" : ""}`}
            >
              {/* copy */}
              <div className={`md:col-span-5 ${p.flip ? "md:order-2 md:col-start-8" : ""}`}>
                <div className="flex items-baseline gap-5">
                  <span className="font-display text-5xl font-semibold text-icy sm:text-6xl [text-shadow:0_1px_0_rgba(23,59,87,0.12)]">
                    {p.index}
                  </span>
                  <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-tight text-navy">
                    {p.title}
                  </h3>
                </div>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-navy/75">{p.copy}</p>
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40">
                  {p.meta}
                </p>
              </div>

              {/* image */}
              <div
                className={`group relative overflow-hidden border hairline md:col-span-7 ${
                  p.flip ? "md:order-1 md:col-start-1" : ""
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 1240px) 640px, 90vw"
                    className="object-cover grayscale-[0.35] transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-[1.025]"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t hairline-light bg-gradient-to-t from-navy-900/70 to-transparent px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/85">
                  <span>Pillar {p.index}</span>
                  <span className="text-icy">CitizenShift</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
