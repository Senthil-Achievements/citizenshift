import Image from "next/image";

/**
 * About — content transcribed from the existing CitizenShift properties.
 * Nothing invented: the problem, mission, mechanism, and nonpartisan
 * declaration are the client's own published language.
 */
export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-navy-900 text-paper" aria-labelledby="about-heading">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="shell relative py-20 sm:py-28">
        <div className="flex flex-col gap-6 border-b hairline-light pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-icy/60">About CitizenShift</p>
            <h2 id="about-heading" className="mt-3 max-w-[18ch] font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
              A record the <span className="italic text-icy">people</span> can read.
            </h2>
          </div>
          <p className="eyebrow max-w-xs text-icy/50">
            Nonpartisan 501(c)(4)-style platform 2
            <span className="mx-1 text-berry">/</span>
            New York, NY
          </p>
        </div>

        {/* pull quote */}
        <blockquote data-reveal className="border-l-2 border-berry py-12 pl-6 sm:pl-10 md:py-16 md:pl-16">
          <p className="max-w-4xl font-display text-[clamp(1.35rem,3.4vw,2.4rem)] font-medium leading-[1.25] tracking-[-0.01em] text-paper">
            Corporations, governments, and technology are becoming more powerful
            than ever.{" "}
            <span className="text-icy">
              It's imperative that the voice of the people does the same.
            </span>
          </p>
        </blockquote>

        {/* three-column editorial grid */}
        <div className="grid gap-px overflow-hidden border hairline-light bg-icy/10 md:grid-cols-3" data-reveal>
          {[
            {
              k: "The Problem",
              t: "Legislation is out of reach",
              c: "Legislation is complex, inaccessible, and time-consuming to understand. While thousands of bills are introduced each year, most Americans do not have the time, tools, or context to track how laws affect their lives — or to effectively communicate with their elected officials. This information gap weakens civic participation and accountability.",
            },
            {
              k: "The Mission",
              t: "Make legislation accessible",
              c: "CitizenShift's mission is to increase civic engagement by making legislation more accessible, understandable, and actionable for every American.",
            },
            {
              k: "The Mechanism",
              t: "Bills, built like a social feed",
              c: "We bring bills into a social-media like format personalised to every American based on geography and policy interests. And we reduce barriers between legislators and constituents by making it possible to contact legislators and advocate for policies with the push of a button.",
            },
          ].map((col) => (
            <article key={col.k} className="bg-navy-900 p-7 sm:p-9">
              <p className="eyebrow text-berry">{col.k}</p>
              <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-paper sm:text-2xl">
                {col.t}
              </h3>
              <p className="mt-4 block text-sm leading-relaxed text-icy/75">{col.c}</p>
            </article>
          ))}
        </div>

        {/* nonpartisan + image row */}
        <div className="mt-14 grid gap-10 md:grid-cols-12 md:items-center">
          <div className="relative aspect-[16/11] overflow-hidden border hairline-light md:col-span-5">
            <Image
              src="/photo/townhall.jpg"
              alt="Constituents gathered in discussion during a civic townhall"
              fill
              sizes="(min-width: 1240px) 480px, 90vw"
              className="object-cover grayscale-[0.25]"
            />
            <span className="absolute left-4 top-4 border hairline-light bg-navy-900/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-icy backdrop-blur-sm">
              Town Hall / Civic Practice
            </span>
          </div>
          <div className="md:col-span-7">
            <div data-reveal className="border hairline-light bg-paper/5 p-7 sm:p-9">
              <p className="eyebrow text-berry">Declaration of Nonpartisanship</p>
              <p className="mt-4 text-lg leading-relaxed text-paper sm:text-xl">
                CitizenShift does not support or oppose candidates for public office,
                and does not take a stand for or against any political party.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-icy/60">
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
