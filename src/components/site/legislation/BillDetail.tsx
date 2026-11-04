"use client";

/**
 * BillDetail — the bill-detail experience: bill info, sponsor, conservative
 * legislative progress, official summary, AI explanation (clearly separated)
 * and the original-text panel with official document links.
 *
 * Data comes from the same verified feed as Explore Legislation. Sections the
 * record does not carry are rendered as honest states with official source
 * links — never fabricated.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  type Bill,
  billDateLabel,
  billDisplayNumber,
  billTitle,
  billViewerHref,
  congressGovSearchUrl,
  deriveProgress,
  govInfoSearchUrl,
  isPassed,
  isNew,
  legiscanBillUrl,
  legiscanTextRefUrl,
  parseBillNumber,
} from "@/lib/legislation";
import ShareDialog from "@/components/site/legislation/ShareDialog";
import ContactRepDialog from "@/components/site/legislation/ContactRepDialog";

type Fetch =
  | { phase: "loading" }
  | { phase: "notfound"; tried: string[] }
  | { phase: "error" }
  | { phase: "ready"; bill: Bill; retrievedAt: string };

/** Honest, fetch-free title used for <title> — lives in lib/legislation (server-safe). */

/** Match a record against the route identity (congress/type/num or id/{…}). */
function matchesSlug(bill: Bill, slug: string[]): boolean {
  if (slug[0] === "id") {
    const want = decodeURIComponent(slug[1] ?? "");
    return String(bill.source_id ?? bill.id) === want || String(bill.id) === want;
  }
  const [congressSeg, typeSeg, numSeg] = slug;
  if (!congressSeg || !typeSeg || !numSeg) return false;
  const parsed = parseBillNumber(bill.bill_number);
  if (!parsed) return false;
  if (parsed.billType !== typeSeg.toLowerCase()) return false;
  if (parsed.number !== parseInt(numSeg, 10)) return false;
  if (Number.isInteger(Number(congressSeg))) {
    const d = new Date(bill.introduced_date);
    if (!Number.isNaN(d.getTime())) {
      if (Math.floor((d.getFullYear() - 1789) / 2) + 1 !== Number(congressSeg)) return false;
    }
  }
  return true;
}

async function findBill(slug: string[], signal: AbortSignal): Promise<{ bill: Bill | null; tried: string[] }> {
  const attempted: string[] = [];
  const candidates: string[] = [];

  if (slug[0] === "id" && slug[1]) {
    const want = decodeURIComponent(slug[1]);
    const compact = want.replace(/[^a-z0-9]/gi, "");
    if (compact) candidates.push(`/api/legislation?state=US&q=${encodeURIComponent(compact)}`);
  } else if (slug.length >= 3) {
    const num = slug[2];
    candidates.push(
      `/api/legislation?state=US&q=${encodeURIComponent(num)}`,
      `/api/legislation?state=FL&q=${encodeURIComponent(num)}`,
    );
  }
  candidates.push(`/api/legislation?state=US`, `/api/legislation?state=FL`);

  for (const url of candidates) {
    attempted.push(url);
    try {
      const res = await fetch(url, { signal, cache: "no-store" });
      if (!res.ok) continue;
      const json = (await res.json()) as { bills?: Bill[]; data?: { bills?: Bill[] } };
      const list = json.bills ?? json.data?.bills ?? [];
      const hit = list.find((b) => matchesSlug(b, slug));
      if (hit) return { bill: hit, tried: attempted };
    } catch (err) {
      if ((err as Error)?.name === "AbortError") throw err;
    }
  }
  return { bill: null, tried: attempted };
}

/* ================================================================== */

function initialsAvatar(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ProgressTimeline({ bill }: { bill: Bill }) {
  const progress = deriveProgress(bill);
  if (!progress.supported) {
    return (
      <div className="border hairline bg-icy-50 p-5">
        <p className="text-sm font-semibold text-navy">Current official status</p>
        <p className="mt-1 font-mono text-sm text-berry">{bill.status || "Not stated in record"}</p>
        <p className="mt-2 text-xs leading-relaxed text-navy/60">
          The record does not yet describe chamber milestones this bill has cleared,
          so no progress bar is drawn. Official actions are always listed
          chronologically at the source:{" "}
          <a className="text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry" href={congressGovSearchUrl(bill.bill_number) ?? "#"} target="_blank" rel="noopener noreferrer">
            Congress.gov
          </a>{" "}
          →{" "}
          <a className="text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry" href={govInfoSearchUrl(bill.bill_number) ?? "#"} target="_blank" rel="noopener noreferrer">
            GovInfo
          </a>
        </p>
      </div>
    );
  }
  return (
    <ol className="flex w-full max-w-full gap-0 overflow-x-auto no-scrollbar" aria-label="Legislative progress">
      {progress.milestones.map((m, i) => (
        <li
          key={m.name}
          aria-label={`${m.name} — ${m.status}`}
          className="flex min-w-[96px] flex-1 flex-col items-center text-center"
        >
          <span
            aria-hidden="true"
            className={`grid size-8 place-items-center rounded-full border text-[10px] font-bold ${
              m.status === "completed"
                ? "border-navy bg-navy text-paper"
                : m.status === "current"
                  ? "border-berry bg-berry text-paper"
                  : "border-navy/15 bg-paper text-navy/35"
            }`}
          >
            {i + 1}
          </span>
          <p
            className={`mt-2 whitespace-nowrap px-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
              m.status === "completed"
                ? "text-navy"
                : m.status === "current"
                  ? "font-semibold text-berry"
                  : "text-navy/35"
            }`}
          >
            {m.name}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function BillDetail({
  slug,
  textViewer = false,
}: {
  slug: string[];
  textViewer?: boolean;
}) {
  const [state, setState] = useState<Fetch>({ phase: "loading" });
  const [shareOpen, setShareOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const found = await findBill(slug, controller.signal);
        if (!controller.signal.aborted) {
          setState(
            found.bill
              ? { phase: "ready", bill: found.bill, retrievedAt: new Date().toISOString() }
              : { phase: "notfound", tried: found.tried },
          );
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setState({ phase: "error" });
      }
    })();
    return () => controller.abort();
  }, [slug.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- the original-text viewer route ---------- */
  if (textViewer) {
    if (state.phase === "ready") return <TextViewer bill={state.bill} retrievedAt={state.retrievedAt} />;
    if (state.phase === "loading")
      return (
        <Shell>
          <div className="mx-auto max-w-3xl px-5 py-20">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-navy/50" aria-busy="true">
              Locating the official document…
            </p>
          </div>
        </Shell>
      );
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-5 py-20">
          <p className="font-display text-3xl font-semibold text-navy">Document unavailable</p>
          <p className="mt-3 text-sm text-navy/70">
            {state.phase === "notfound"
              ? "This bill is not in the current feed window, so its original document cannot be sited here. Discover it through the official sources below."
              : "The record service is not responding. No document is being simulated."}
          </p>
          <a
            href="/explore"
            className="mt-6 inline-block rounded-full bg-berry px-6 py-3 text-sm font-bold text-paper hover:bg-berry-600"
          >
            Back to Explore Legislation
          </a>
        </div>
      </Shell>
    );
  }

  if (state.phase === "loading")
    return (
      <Shell>
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="h-6 w-48 animate-pulse rounded-full bg-navy/10" />
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded bg-navy/10" />
          <div className="mt-4 h-5 w-1/3 animate-pulse rounded bg-navy/10" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded bg-navy/5" />
            <div className="h-40 animate-pulse rounded bg-navy/5" />
          </div>
        </div>
      </Shell>
    );

  if (state.phase === "notfound" || state.phase === "error")
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-5 py-20">
          <p className="eyebrow text-navy/50">Not in the current record window</p>
          <p className="mt-4 font-display text-3xl font-semibold text-navy">
            This bill isn’t in the live feed right now.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-navy/70">
            {state.phase === "error"
              ? "The record service could not be reached. CitizenShift never substitutes sample data."
              : "Feeds cover current legislation per state and Congress. The record hasn’t surfaced this bill yet — follow the official sources for the authoritative file."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="rounded-full bg-berry px-6 py-3 text-sm font-bold text-paper hover:bg-berry-600">
              Explore Legislation
            </Link>
            {slug.length >= 3 && Number.isInteger(Number(slug[2])) && (
              <>
                <a
                  href={congressGovSearchUrl(`${slug[1] === "s" ? "S." : "H.R."} ${slug[2]}`) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border hairline bg-paper px-6 py-3 text-sm font-semibold text-navy hover:border-navy/40"
                >
                  Search Congress.gov ↗
                </a>
                <a
                  href={govInfoSearchUrl(`${slug[1] === "s" ? "S." : "H.R."} ${slug[2]}`) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border hairline bg-paper px-6 py-3 text-sm font-semibold text-navy hover:border-navy/40"
                >
                  Search GovInfo ↗
                </a>
              </>
            )}
          </div>
        </div>
      </Shell>
    );

  /* ---------- ready ---------- */
  const bill = state.bill;
  const parsed = parseBillNumber(bill.bill_number);
  const displayNumber = billDisplayNumber(bill);
  const title = billTitle(bill);
  const viewerHref = billViewerHref(bill);
  const govUrl = govInfoSearchUrl(bill.bill_number);
  const congressUrl = congressGovSearchUrl(bill.bill_number);
  const legiscanUrl = legiscanBillUrl(bill) ?? (bill.source.toLowerCase() === "legiscan" ? `https://legiscan.com/US/search?query=${encodeURIComponent(bill.bill_number.replace(/[^a-z0-9 ]/gi, "").trim())}` : null);
  const legiscanRef = legiscanTextRefUrl(bill);

  return (
    <Shell>
      <div
        className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
      >
        {/* breadcrumb */}
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-navy/50">
          <Link href="/" className="hover:text-navy">CitizenShift</Link>
          {" / "}
          <Link href="/explore" className="hover:text-navy">Explore</Link>
          {" / "}
          <span className="text-navy/80">{displayNumber}</span>
        </p>

        {/* ===== heading ===== */}
        <header className="mt-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-navy/25 bg-navy text-icy">{bill.level}</span>
            <span className="chip border-navy/20 bg-icy text-navy">{bill.policy_area}</span>
            <span
              className={`chip ${
                isPassed(bill)
                  ? "border-icy bg-icy font-semibold text-navy"
                  : isNew(bill)
                    ? "border-berry bg-berry text-paper"
                    : chipTone
              }`}
            >
              {bill.status}
            </span>
          </div>
          <h1 className="font-display text-[clamp(1.9rem,4.6vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-navy">
            {title}
          </h1>
          <p className="font-mono text-sm text-navy/70">
            {displayNumber}
            {bill.level === "Federal"
              ? ` · ${(() => {
                  const d = new Date(bill.introduced_date);
                  if (Number.isNaN(d.getTime())) return "";
                  const n = Math.floor((d.getFullYear() - 1789) / 2) + 1;
                  const r10 = n % 10, r100 = n % 100;
                  const suf = r10 === 1 && r100 !== 11 ? "st" : r10 === 2 && r100 !== 12 ? "nd" : r10 === 3 && r100 !== 13 ? "rd" : "th";
                  return `${n}${suf} Congress`;
                })()}`
              : ` · ${bill.jurisdiction}`}
            {parsed ? ` · ${parsed.chamber ?? ""}` : ""}
          </p>

          {/* action bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex h-11 items-center gap-2 rounded-full border hairline bg-paper px-5 text-sm font-semibold text-navy transition hover:border-navy/40"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="11" cy="2.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="3" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="11" cy="11.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4.7 6.2l4.6-2.6M4.7 7.8l4.6 2.6" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Share
            </button>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="flex h-11 items-center gap-2 rounded-full bg-berry px-5 text-sm font-bold text-paper transition hover:bg-berry-600"
            >
              <svg width="14" height="11" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1.5 2l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Contact Your Rep
            </button>
          </div>
        </header>

        {/* ===== bill information + sponsor ===== */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* bill information */}
          <section data-reveal className="border hairline bg-paper lg:col-span-7">
            <h2 className="border-b hairline px-6 py-4 font-display text-lg font-semibold text-navy">
              Bill information
            </h2>
            <dl className="grid grid-cols-2 gap-px bg-icy/10 sm:grid-cols-4">
              {[
                ["Jurisdiction", bill.jurisdiction],
                ["Introduced", billDateLabel(bill)],
                ["Current status", bill.status || "—"],
                ["Chamber", parsed?.chamber ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="bg-paper p-5">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/45">{k}</dt>
                  <dd className="mt-1.5 text-sm font-medium text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* sponsor */}
          <section data-reveal className="border hairline bg-paper lg:col-span-5">
            <h2 className="border-b hairline px-6 py-4 font-display text-lg font-semibold text-navy">
              Sponsor
            </h2>
            <div className="p-6">
              {/* The current feed record does not carry sponsor identity. Show the
                  initials workbench + official member lookup instead of inventing. */}
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-full bg-icy font-display text-sm font-semibold text-navy" aria-hidden="true">
                  <span className="opacity-40">?</span>
                </span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-navy/50">
                    Not included in this record
                  </p>
                  <p className="mt-0.5 text-sm text-navy/70">
                    Verify on the official member directory:
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={congressUrl ?? "https://www.congress.gov/members"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border hairline px-4 py-2 text-xs font-semibold text-navy hover:border-navy/40"
                >
                  Congress.gov — bill file ↗
                </a>
                <a
                  href="https://clerk.house.gov/Members.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border hairline px-4 py-2 text-xs font-semibold text-navy hover:border-navy/40"
                >
                  House Clerk roster ↗
                </a>
                <a
                  href="https://www.senate.gov/senators/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border hairline px-4 py-2 text-xs font-semibold text-navy hover:border-navy/40"
                >
                  Senate roster ↗
                </a>
              </div>
            </div>
          </section>

          {/* progress */}
          <section data-reveal className="min-w-0 border hairline bg-paper lg:col-span-12">
            <h2 className="border-b hairline px-6 py-4 font-display text-lg font-semibold text-navy">
              Legislative progress
            </h2>
            <div className="px-4 py-6 sm:px-6">
              <ProgressTimeline bill={bill} />
            </div>
          </section>

          {/* summaries */}
          <section data-reveal className="border hairline bg-paper lg:col-span-12">
            <h2 className="border-b hairline px-6 py-4 font-display text-lg font-semibold text-navy">
              Summary
            </h2>
            <div className="p-6">
              {bill.full_summary || bill.summary ? (
                <>
                  <p className="eyebrow text-icy/0" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-berry">Official summary</p>
                  <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-navy/85">
                    {bill.full_summary || bill.summary}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
                    Via the official record service ({bill.source}) — retrieved {new Date(state.retrievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-navy/60">
                  An official summary is not available for this bill yet. CitizenShift does not fabricate one.
                </p>
              )}
            </div>

            {/* AI explanation — visibly separated */}
            <div className="mx-6 mb-6 border-t hairline pt-6" id="explanation">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/60">
                  CitizenShift explanation — AI generated
                </p>
                <span className="chip border-icy bg-icy text-navy">Not official text</span>
              </div>
              {bill.aiSummary?.summary || (bill.aiSummary?.summaryBullets?.length ?? 0) > 0 ? (
                <AiExplanation bill={bill} />
              ) : (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy/65">
                  A neutral, plain-language explanation has not been generated for this
                  bill yet. It will appear here once the explanation service processes
                  the record — never as a stand-in for official text.
                </p>
              )}
            </div>
          </section>

          {/* ===== original bill text ===== */}
          <section data-reveal className="border hairline bg-paper lg:col-span-12">
            <h2 className="border-b hairline px-6 py-4 font-display text-lg font-semibold text-navy">
              Original Bill Text
            </h2>
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold text-navy">
                    {displayNumber} — {bill.status || "Introduced"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-navy/50">
                    Text version — {bill.status || "Introduced"} · Format — {legiscanRef ? "source page (HTML)" : "as published by source"} · {bill.level} record
                  </p>
                </div>
                <Link
                  href={viewerHref}
                  className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-berry px-6 text-sm font-bold text-paper transition hover:bg-berry-600"
                >
                  Read Original Text
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Link>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-navy/70">
                Open the original legislative document inside CitizenShift — with a
                separate link to view it on the source site. Official text takes
                priority; mirrors are clearly labeled.
              </p>

              {/* document source priority list */}
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                <SourceLink
                  rank="1 — Official"
                  name="GovInfo"
                  note="Official congressional bill text & status collections"
                  href={govUrl}
                />
                <SourceLink
                  rank="2 — Official"
                  name="Congress.gov"
                  note="The official legislative record & text links"
                  href={congressUrl}
                />
                <SourceLink
                  rank={legiscanRef ? "3 — Reference mirror" : "3 — Reference search"}
                  name="LegiScan"
                  note={legiscanRef ? "Reference text URL carried by this record — a mirror, not an official government source" : "Bill search mirror — reference only, not an official government source"}
                  href={legiscanRef ?? legiscanUrl}
                />
              </ul>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
                Verified {new Date(state.retrievedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · Record № {String(bill.source_id ?? bill.id)} · source {bill.source}
              </p>
            </div>
          </section>
        </div>
      </div>

      <ShareDialog bill={bill} open={shareOpen} onClose={() => setShareOpen(false)} />
      <ContactRepDialog bill={bill} open={contactOpen} onClose={() => setContactOpen(false)} />
    </Shell>
  );
}

const chipTone = "border-navy/20 text-navy/70";

function SourceLink({ rank, name, note, href }: { rank: string; name: string; note: string; href: string | null }) {
  if (!href) {
    return (
      <li className="border hairline bg-icy-50 p-4 opacity-60">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-navy/40">{rank}</p>
        <p className="mt-1 text-sm font-semibold text-navy">{name}</p>
        <p className="mt-1 text-xs text-navy/50">No direct link in this record — search the source by bill number.</p>
      </li>
    );
  }
  return (
    <li className="border hairline bg-icy-50 p-4 transition hover:border-navy/30">
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-navy/40">{rank}</p>
        <p className="mt-1 text-sm font-semibold text-navy">{name} ↗</p>
        <p className="mt-1 text-xs leading-relaxed text-navy/60">{note}</p>
      </a>
    </li>
  );
}

function AiExplanation({ bill }: { bill: Bill }) {
  const bullets = bill.aiSummary?.summaryBullets;
  return (
    <div data-reveal className="mt-4 border-l-2 border-icy pl-5">
      {bullets?.length ? (
        <ul className="space-y-2.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-navy/80">
              <span className="mt-2 h-px w-4 shrink-0 bg-berry" aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
      ) : null}
      {bill.aiSummary?.summary && (bullets?.length ?? 0) === 0 ? (
        <p className="max-w-3xl text-sm leading-relaxed text-navy/80">{bill.aiSummary.summary}</p>
      ) : null}
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-navy/55">
        Educational information generated automatically from the verified record — not
        official legislative text and not legal advice. Confirm everything against the
        original document above.
      </p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="relative isolate min-h-[70vh] bg-icy-50">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Text viewer                                                        */
/* ------------------------------------------------------------------ */

function TextViewer({ bill, retrievedAt }: { bill: Bill; retrievedAt: string }) {
  const legiscanRef = legiscanTextRefUrl(bill);
  const embedUrl = legiscanRef ?? legiscanBillUrl(bill);
  const govUrl = govInfoSearchUrl(bill.bill_number);
  const congressUrl = congressGovSearchUrl(bill.bill_number);
  const backHref = billViewerHref(bill).replace(/\/text$/, "");
  const title = billTitle(bill);
  const displayNumber = billDisplayNumber(bill);
  // only genuine PDF documents embed reliably; HTML portals commonly block framing
  const embedsInline = Boolean(embedUrl && /\.pdf(\?|#|$)/i.test(embedUrl));

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-navy/50">
          <Link href={backHref} className="hover:text-navy">← Back to {displayNumber}</Link>
        </p>

        <header className="mt-6 flex flex-col gap-4">
          <div>
            <p className="eyebrow text-berry">Original Bill Text</p>
            <h1 className="mt-2 font-display text-[clamp(1.6rem,3.6vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-navy">
              {displayNumber} — {bill.status || "Introduced"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-navy/70">{title}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {congressUrl && (
              <a href={congressUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-paper hover:bg-navy-600">
                Open official source ↗
              </a>
            )}
            {govUrl && (
              <a href={govUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center gap-2 rounded-full border hairline bg-paper px-5 text-sm font-semibold text-navy hover:border-navy/40">
                Download from GovInfo ↗
              </a>
            )}
            {legiscanRef && (
              <a href={legiscanRef} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center gap-2 rounded-full border hairline bg-paper px-5 text-sm font-semibold text-navy hover:border-navy/40">
                Open LegiScan reference ↗
              </a>
            )}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
            Source {bill.source} · {legiscanRef ? "reference mirror — not an official government source · " : ""}verified {new Date(retrievedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </header>

        {/* document panel — embed only real documents (PDF); LegiScan pages set
            X-Frame-Options: SAMEORIGIN, so a frame would just render a browser
            error page. Honest state instead of a broken embed. Never a
            placeholder PDF. */}
        <div className="mt-8 border hairline bg-paper" data-reveal>
          {embedsInline && embedUrl ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b hairline bg-icy-50 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
                  Embedded document · if blocked by the source, open it in a new tab above
                </p>
                <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-[0.16em] text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry">
                  Open standalone ↗
                </a>
              </div>
              <iframe
                src={embedUrl}
                title={`Original document — ${displayNumber}`}
                className="h-[70vh] w-full bg-icy-50"
                loading="lazy"
                referrerPolicy="no-referrer"
              >
                <p className="p-6 text-sm text-navy">
                  Your browser cannot display the embedded document. Open it in a new
                  tab from the buttons above.
                </p>
              </iframe>
            </>
          ) : (
            <div className="p-8">
              <p className="font-display text-xl font-semibold text-navy">
                {embedUrl
                  ? "The document source does not permit embedding"
                  : "No embeddable text URL on file for this record"}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy/70">
                {embedUrl
                  ? "LegiScan (and most legislative portals) block third-party framing, so CitizenShift shows this honest state instead of a broken or simulated reader. The same original document opens in a new tab with one of the buttons above."
                  : "CitizenShift does not simulate a document. Retrieve the official bill text from the sources above — GovInfo carries the official PDF, and Congress.gov links every printed version."}
              </p>
              {legiscanRef && (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/45">
                  Reference mirror — {legiscanRef.replace(/^https?:\/\//, "")} · not an official government source
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
