import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getOriginalBill } from "@/lib/original-bills-store";
import {
  OriginalBillActionBar,
  OriginalBillSummaryActions,
} from "@/components/site/original-bills/BillPageActions";

type Props = { params: Promise<{ id: string }> };

/**
 * /bills/[id] — verbatim reproduction of an original CitizenShift bill page.
 *
 * Fidelity contract (docs/content-fidelity-policy.md):
 *  - All TEXT comes from the protected store (content/original/) through a
 *    lossless parser proven by scripts/test-original-roundtrip.mjs (50/50
 *    round-trip). Nothing is paraphrased, summarised, normalised or generated.
 *  - The DOM structure mirrors the original page's box tree (badges as flex
 *    items, block siblings, inline-flex control runs) so this engine's
 *    innerText reproduces the original's line breaks exactly.
 *  - The AI-summary control is disabled — no AI text may alter this page.
 *  - Only INTERNAL navigation is adapted ("Back to Feed" -> /explore).
 *    Every external link passes through unchanged.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bill = getOriginalBill(id);
  if (!bill) return { title: "Bill not found" };
  // verbatim official title
  return { title: bill.title };
}

export const dynamic = "force-dynamic";

const BADGE =
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md border hairline bg-icy-100/60 px-2 py-0.5 text-xs font-medium text-navy";

const SPONSOR_LINK =
  "inline-flex items-center gap-1 rounded-sm font-semibold text-navy hover:underline";

function FactIcon({ paths }: { paths: string[] }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0 text-navy/50"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default async function OriginalBillRoute({ params }: Props) {
  const { id } = await params;
  const bill = getOriginalBill(id);

  // Missing content is reported as 404 — never invented.
  if (!bill) notFound();

  const facts = [
    {
      label: "Jurisdiction",
      value: bill.jurisdiction,
      icon: [
        "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
        "M2 12h20",
        "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      ],
    },
    {
      label: "Introduced",
      value: bill.introducedDate,
      icon: [
        "M16 2v4",
        "M8 2v4",
        "M3 10h18",
        "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      ],
    },
    {
      label: "Current Status",
      value: bill.currentStatus,
      icon: ["M22 12h-4l-3 9L9 3l-3 9H2", "M27 12.5"],
    },
  ];

  return (
    <div className="relative isolate min-h-[70vh] bg-icy-50">
      <div
        data-original-content
        data-bill-id={bill.id}
        className="mx-auto max-w-[888px] px-4 py-7 sm:px-6 sm:py-8"
      >
        {/* internal navigation — adapted to this site */}
        <Link
          href="/explore"
          className="mb-6 inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border hairline bg-paper px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 shrink-0"
            aria-hidden="true"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back to Feed
        </Link>

        <div className="mb-6">
          <div className="mb-3 flex items-start gap-3 flex-wrap">
            <span className={BADGE}>{bill.level}</span>
            <span className={BADGE}>
              <span aria-hidden="true">{bill.emoji}</span>{" "}
              {bill.policyArea}
            </span>
            <span className={`${BADGE} ml-auto`}>{bill.status}</span>
          </div>
          {/* official title, verbatim */}
          <h1 className="mb-2 font-display text-3xl font-semibold leading-tight tracking-[-0.01em] text-navy [text-wrap:balance]">
            {bill.title}
          </h1>
          <p className="text-base font-medium text-navy/60">{bill.billNumber}</p>
        </div>

        {/* action card — Share / Contact Your Rep (real client controls) */}
        <div className="mb-6">
          <div>
            <div className="overflow-hidden rounded-2xl border hairline bg-paper">
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2 border-t hairline bg-icy-50/60 px-4 py-3">
                  <OriginalBillActionBar
                    id={bill.id}
                    title={bill.title}
                    billNumber={bill.billNumber}
                    level={bill.level}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* facts card: jurisdiction / introduced / current status + sponsors */}
        <div className="rounded-2xl border hairline bg-paper py-6">
          <div className="flex flex-col gap-6">
            <div className="px-6">
              <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
                <div className="grid gap-4 text-sm">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex items-start gap-3">
                      <FactIcon paths={fact.icon} />
                      <div className="min-w-0">
                        <p className="mb-1 font-semibold text-navy">
                          {fact.label}
                        </p>
                        <p className="text-navy/65">{fact.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* sponsors — names keep their original external links */}
                <section className="rounded-xl border hairline p-4">
                  <h2 className="mb-4 font-display text-xl font-semibold leading-snug text-navy">
                    {"Sponsors "}
                    <span className="text-sm font-normal text-navy/50">
                      ({bill.sponsors.length})
                    </span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {bill.sponsors.map((s, i) => (
                      <div
                        key={`${s.name}-${i}`}
                        className="flex items-start gap-3"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border hairline bg-icy-100 text-xs font-semibold text-navy">
                          {s.initials}
                        </span>
                        <div className="min-w-0 text-sm">
                          {s.href ? (
                            <a
                              href={s.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={SPONSOR_LINK}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-3.5 shrink-0 text-navy/50"
                                aria-hidden="true"
                              >
                                <path d="M7 7h10v10" />
                                <path d="M7 17 17 7" />
                              </svg>{" "}
                              {s.name}
                            </a>
                          ) : (
                            <span
                              className={`${SPONSOR_LINK} [&>svg]:hidden`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-3.5 shrink-0"
                                aria-hidden="true"
                              >
                                <path d="M7 7h10v10" />
                                <path d="M7 17 17 7" />
                              </svg>{" "}
                              {s.name}
                            </span>
                          )}
                          <p className="text-xs text-navy/55">{s.meta}</p>
                          <p className="mt-1 text-xs uppercase text-navy/45">
                            {s.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* legislative progress — the six original steps, verbatim */}
              <div className="mt-6">
                <div className="grid grid-cols-6 gap-1">
                  {bill.progressSteps.map((step, i) => (
                    <div key={step} className="min-w-0 text-center">
                      <span
                        aria-hidden="true"
                        className={`block h-2.5 rounded-full ${
                          i === 0 ? "bg-berry" : "bg-navy/15"
                        }`}
                      ></span>
                      <span
                        className={`mt-3 block break-words text-[10px] sm:text-xs ${
                          i === 0 ? "font-semibold text-berry" : "text-navy/50"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* official summary card, verbatim */}
        <div className="rounded-2xl border hairline bg-paper py-6">
          <div className="flex flex-col gap-6">
            <div className="px-6">
              <h2 className="mb-4 font-display text-xl font-semibold text-navy">
                Summary
              </h2>
              <p className="text-sm leading-relaxed text-navy/70">
                {bill.summary}
              </p>
              {/* adjacent inline-flex controls, like the original */}
              <OriginalBillSummaryActions
                id={bill.id}
                title={bill.title}
                billNumber={bill.billNumber}
                level={bill.level}
              />
            </div>
          </div>
        </div>

        {/* original bill text — external link, unchanged */}
        {bill.originalTextSection && bill.originalTextHref && (
          <div className="rounded-2xl border hairline bg-paper py-6">
            <div className="flex flex-col gap-6">
              <div className="px-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-navy">
                    {bill.originalTextSection}
                  </h2>
                  <a
                    href={bill.originalTextHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full border hairline bg-paper px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M7 7h10v10" />
                      <path d="M7 17 17 7" />
                    </svg>{" "}
                    {bill.originalTextLinkText}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
