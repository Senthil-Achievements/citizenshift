"use client";

/**
 * Donate — destination preserved from research: the organisation's verified
 * official donation page. Opens in the same tab on mobile, new tab on desktop.
 */

export default function Donate() {
  return (
    <section id="donate" className="relative overflow-hidden bg-berry text-paper" aria-labelledby="donate-heading">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-32 -top-40 size-[520px] rounded-full bg-icy/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="shell relative grid gap-12 py-20 sm:py-28 md:grid-cols-12">
        <div className="md:col-span-7" data-reveal>
          <p className="eyebrow text-icy/80">Support the Mission</p>
          <h2 id="donate-heading" className="mt-3 max-w-[16ch] font-display text-[clamp(2.1rem,5.5vw,4.25rem)] font-semibold leading-[1.0] tracking-[-0.02em]">
            Help us strengthen <span className="italic">democracy</span>.
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-paper/85 sm:text-base">
            CitizenShift aims to make legislation more accessible, understandable, and
            actionable for every American. One small donation goes a long way in
            supporting our mission.
          </p>
        </div>

        <div className="md:col-span-5" data-reveal>
          <div className="border hairline-light bg-navy-900/35 p-7 backdrop-blur-sm sm:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-icy/70">
              100% To The Mission
            </p>
            <ul className="mt-5 space-y-3 text-sm text-paper/90">
              {[
                "Bill tracking across federal, state and municipal record",
                "Plain-language summaries, updated as bills move",
                "Free at the point of use — no paywall on civic knowledge",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-icy" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            <a
              href="https://secure.actblue.com/donate/citizenshift-1"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-paper px-6 py-4 text-sm font-bold text-berry transition-all duration-300 hover:bg-icy hover:text-navy"
            >
              Donate now
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </a>
            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-paper/50">
              Secure checkout via ActBlue · opens CitizenShift's official page
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
