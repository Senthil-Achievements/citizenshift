"use client";

/**
 * Contact — verified contact destinations only: the organisation's published
 * inbox and LinkedIn presence. No invented addresses, no fake forms.
 */

import { useState } from "react";

const EMAIL = "erin.chouinard@citizenshift.us";
const LINKEDIN = "https://www.linkedin.com/company/citizenshift/posts/?feedView=all";

export default function ContactSection() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <section id="contact" className="relative bg-paper" aria-labelledby="contact-heading">
      <div className="shell py-20 sm:py-28">
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-berry">Contact</p>
            <h2 id="contact-heading" className="mt-3 font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-navy">
              Talk to the team.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-navy/65">
            Questions, press, partnership — the project answers from its verified
            inbox.
          </p>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-12" data-reveal>
          {/* address card */}
          <div className="border hairline bg-icy-50 md:col-span-6">
            <div className="border-b hairline p-6">
              <p className="eyebrow text-navy/50">Email</p>
              <a
                href={`mailto:${EMAIL}?subject=${encodeURIComponent("Hello CitizenShift")}`}
                className="mt-2 font-mono text-base font-medium break-all text-berry underline decoration-berry/25 underline-offset-4 hover:decoration-berry sm:text-lg"
              >
                {EMAIL}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-px bg-icy/10">
              <div className="p-6">
                <p className="eyebrow text-navy/50">Location</p>
                <p className="mt-2 text-sm font-medium text-navy">New York, NY</p>
              </div>
              <div className="p-6">
                <p className="eyebrow text-navy/50">LinkedIn</p>
                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-sm font-medium text-navy underline decoration-navy/20 underline-offset-4 hover:decoration-navy"
                >
                 /company/citizenshift
                </a>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-col gap-3 md:col-span-6 md:pl-6">
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent("Hello CitizenShift")}`}
              className="group flex items-center justify-between border hairline bg-navy px-6 py-5 text-paper transition-colors hover:bg-navy-600"
            >
              <span>
                <span className="block font-display text-lg font-semibold">Write to us</span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-icy/60">
                  Opens your email client
                </span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M1 8h13M9 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="group flex items-center justify-between border hairline px-6 py-5 text-left transition-colors hover:bg-icy-100"
            >
              <span>
                <span className="block font-display text-lg font-semibold text-navy">
                  {copied ? "Copied ✓" : "Copy address"}
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-navy/50">
                  Clipboard fallback — no submission forms
                </span>
              </span>
              <span className="font-mono text-2xl text-berry" aria-hidden="true">
                {copied ? "✓" : "⧉"}
              </span>
            </button>
            <a
              href={LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between border hairline px-6 py-5 text-left transition-colors hover:bg-icy-100"
            >
              <span>
                <span className="block font-display text-lg font-semibold text-navy">Follow along</span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-navy/50">
                  Updates via LinkedIn
                </span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-navy transition-transform duration-300 group-hover:-translate-y-1">
                <path d="M8 14V2m0 0L2 8m6-6l6 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
