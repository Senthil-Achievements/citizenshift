import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import RevealObserver from "@/components/motion/RevealObserver";

export const metadata: Metadata = {
  title: "Privacy Policy & Terms of Service — CitizenShift",
  description:
    "CitizenShift's Nonpartisan Civic Privacy Charter and Terms of Service. Strict voter data protection, no PAC data broker selling, and open Article I legislative records.",
};

export default function PrivacyTermsPage() {
  return (
    <>
      <RevealObserver />
      <Header />
      <main id="main" className="min-h-screen bg-[#060913] text-paper pt-20 sm:pt-28 pb-16">
        <div className="shell max-w-4xl mx-auto px-4 sm:px-6">
          {/* Top Breadcrumb & Heading */}
          <div className="border-b border-white/10 pb-8 sm:pb-12">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-icy/70 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                CitizenShift
              </Link>
              <span>/</span>
              <span className="text-berry font-bold">Legal & Civic Charter</span>
            </div>
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-tight tracking-tight text-white">
              Privacy Policy &amp; Terms of Service
            </h1>
            <p className="mt-4 text-sm sm:text-base text-white/70 max-w-2xl leading-relaxed">
              Effective Date: November 1, 2026 · Article I Nonpartisan Public Transparency Standard.
              CitizenShift is dedicated to placing legislative power directly in the hands of the American people
              while vigorously protecting constituent confidentiality.
            </p>

            {/* Quick jump anchor bar */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#privacy"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-white hover:text-navy transition-all"
              >
                ↓ Civic Privacy Policy
              </a>
              <a
                href="#terms"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-white hover:text-navy transition-all"
              >
                ↓ Terms of Service &amp; Data
              </a>
              <a
                href="#charter"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-white hover:text-navy transition-all"
              >
                ↓ Nonpartisan Guarantee
              </a>
            </div>
          </div>

          {/* Section 1: Nonpartisan Civic Privacy Policy */}
          <section id="privacy" className="scroll-mt-28 py-12 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-berry/15 border border-berry/30 font-mono text-[10px] uppercase tracking-widest text-berry mb-4">
              Part 1 · Constituent Confidentiality
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Civic Privacy Policy
            </h2>

            <div className="mt-6 space-y-6 text-sm sm:text-base leading-relaxed text-white/80">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-5 sm:p-7">
                <h3 className="font-mono text-xs uppercase tracking-wider text-icy font-semibold mb-2">
                  1. Zero Data Selling Guarantee
                </h3>
                <p>
                  <strong>CitizenShift will never sell, rent, monetize, or trade your personal data, reading history, or contact details to political campaigns, Political Action Committees (PACs), commercial data brokers, or advertising networks.</strong> We are a mission-driven, nonpartisan civic platform funded through public grassroots support, not by commodifying citizen interest in government.
                </p>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  2. Information We Collect
                </h3>
                <p>
                  We practice strict data minimization. Depending on your level of interaction, we may collect:
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1.5 text-white/75">
                  <li><strong>Account Credentials:</strong> Email address and optional name when requesting early feed access or saving tracked legislation.</li>
                  <li><strong>Civic Geography:</strong> Optional State and ZIP code provided solely to deliver bill feeds, committee schedules, and legislative representatives relevant to your district.</li>
                  <li><strong>Advocacy Communications:</strong> When you use our direct constituent contact tools, we transmit your message directly to your elected official’s official governmental inbox or portal.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  3. How We Use Information
                </h3>
                <p>
                  Information is used exclusively to:
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1.5 text-white/75">
                  <li>Generate plain-language, nonpartisan legislative briefings and bill alerts tailored to your community.</li>
                  <li>Verify that constituent correspondence originates from legitimate district voters.</li>
                  <li>Maintain platform security, prevent automated vote/advocacy manipulation, and ensure 99.9% uptime.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  4. Your Rights &amp; Data Deletion
                </h3>
                <p>
                  You retain full ownership of your data. At any time, you may request a complete export or permanent deletion of your profile, saved bill records, and newsletter subscriptions by emailing{" "}
                  <a
                    href="mailto:erin.chouinard@citizenshift.us?subject=Data%20Privacy%20Request"
                    className="text-icy underline underline-offset-4 hover:text-white"
                  >
                    erin.chouinard@citizenshift.us
                  </a>
                  . Requests are honored within 5 business days with zero retention copies.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Terms of Service & Article I Public Data */}
          <section id="terms" className="scroll-mt-28 py-12 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-icy/15 border border-icy/30 font-mono text-[10px] uppercase tracking-widest text-icy mb-4">
              Part 2 · Public Trust &amp; Usage
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Terms of Service &amp; Public Records
            </h2>

            <div className="mt-6 space-y-6 text-sm sm:text-base leading-relaxed text-white/80">
              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  1. Article I Public Domain Legislative Records
                </h3>
                <p>
                  Congressional and state legislative bill texts, roll call voting tallies, amendments, and sponsor rosters published on CitizenShift are public domain government works under Article I of the United States Constitution. CitizenShift aggregates and displays official government feeds without altered substance.
                </p>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  2. Plain-Language Summaries &amp; Civic Education Disclaimer
                </h3>
                <p>
                  CitizenShift provides AI-assisted, editorially reviewed plain-language summaries to demystify complex legislative jargon for everyday readers. While summaries are produced to the highest standards of neutrality and factual accuracy, they are provided for general civic education and public transparency, and do not constitute formal legal advice or statutory interpretation. Users are always encouraged to inspect the full original statutory text linked on every bill card.
                </p>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  3. Acceptable Use
                </h3>
                <p>
                  You agree to use CitizenShift in accordance with all applicable state and federal laws. You may not:
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1.5 text-white/75">
                  <li>Use automated bots or scripts to flood congressional offices with fraudulent constituent messages.</li>
                  <li>Attempt to compromise the integrity, security, or availability of our public bill index.</li>
                  <li>Misrepresent identity or congressional district residency when communicating with legislators.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  4. Grassroots Support &amp; ActBlue Donations
                </h3>
                <p>
                  Donations made to CitizenShift via ActBlue are voluntary contributions to support civic transparency software, open-source legislative tooling, and public accountability. Contributions are processed securely by ActBlue under their respective terms and privacy guidelines.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Nonpartisan Charter */}
          <section id="charter" className="scroll-mt-28 py-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-4">
              Part 3 · Core Commitment
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Declaration of Nonpartisanship
            </h2>

            <div className="mt-6 rounded-2xl border border-white/15 bg-slate-950/70 p-6 sm:p-9 shadow-lg space-y-4">
              <p className="font-display text-lg sm:text-xl font-medium text-white leading-relaxed">
                "CitizenShift does not support or oppose candidates for public office, and does not take a stand for or against any political party."
              </p>
              <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                Our interest is not in the outcome of any election. It is in an American public equipped to understand the laws written in its name — whatever a reader's politics may be.
              </p>
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-white/60">
                <span>CitizenShift Civic Platform · New York, NY</span>
                <a
                  href="mailto:erin.chouinard@citizenshift.us"
                  className="text-berry hover:text-white transition-colors"
                >
                  erin.chouinard@citizenshift.us
                </a>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-neutral-950 hover:bg-neutral-200 transition-all shadow-md"
              >
                ← Return to CitizenShift
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
