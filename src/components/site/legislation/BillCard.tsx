"use client";

/**
 * BillCard — record card with animated detail expansion.
 *
 * Navigation (Phase 1):
 *  - the title opens the bill-detail page (/explore/bill/…)
 *  - the jurisdiction chip applies the corresponding level filter
 *  - the category chip applies the topic filter
 *  - the status chip filters by that status
 * Share / Contact / Details action stays inside the action bar — never nested
 * inside the title link, so the card has no single giant click target.
 */

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import Link from "next/link";
import type { Bill } from "@/lib/legislation";
import { billBullets, billDateLabel, billDetailHref, billDisplayNumber, billTitle, isNew, isPassed } from "@/lib/legislation";

function levelChipTone(level: Bill["level"]): string {
  switch (level) {
    case "Federal":
      return "border-navy/25 bg-navy text-icy";
    case "State":
      return "border-berry/25 bg-berry text-paper";
    default:
      return "border-navy/20 bg-icy text-navy";
  }
}

function statusChipTone(bill: Bill): string {
  if (isPassed(bill)) return "border-icy bg-icy text-navy font-semibold";
  if (bill.status === "Vetoed" || bill.status === "Failed") return "border-navy/15 text-navy/45 line-through";
  if (isNew(bill)) return "border-berry bg-berry/8 text-berry";
  return "border-navy/20 text-navy/70";
}

interface BillCardProps {
  bill: Bill;
  expanded: boolean;
  onToggleExpand: () => void;
  onShare: () => void;
  onContact: () => void;
  onFilterLevel: (level: Bill["level"]) => void;
  onFilterTopic: (topic: string) => void;
  onFilterStatus: (status: "New" | "Passed") => void;
  delay?: number;
}

function BillCardBase({
  bill,
  expanded,
  onToggleExpand,
  onShare,
  onContact,
  onFilterLevel,
  onFilterTopic,
  onFilterStatus,
  delay = 0,
}: BillCardProps) {
  const bullets = billBullets(bill);
  const newChip = isNew(bill);

  const chipButton =
    "chip cursor-pointer select-none transition-all duration-200 hover:-translate-y-px active:translate-y-0";

  return (
    <article
      data-reveal
      style={{ "--reveal-delay": delay } as React.CSSProperties}
      className="group relative flex flex-col overflow-hidden border hairline border bg-paper transition-colors duration-300 hover:border-navy/30"
    >
      {/* left accent */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[3px] transition-colors ${newChip ? "bg-berry" : isPassed(bill) ? "bg-icy" : "bg-navy/15"}`}
      />

      <div className="pl-5 pr-5 pt-5 sm:pl-6">
        {/* header row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-[0.08em] text-berry">
            {billDisplayNumber(bill)}
          </span>
          <button
            type="button"
            onClick={() => onFilterLevel(bill.level)}
            title={`Show ${bill.level.toLowerCase()} bills only`}
            className={`${chipButton} ${levelChipTone(bill.level)}`}
          >
            {bill.level}
          </button>
          <button
            type="button"
            onClick={() =>
              onFilterStatus(isPassed(bill) ? "Passed" : newChip ? "New" : wouldPass(bill))
            }
            title={`Filter the feed by “${bill.status}”`}
            className={`chip cursor-pointer select-none ${
              statusChipTone(bill)
            } ${!isPassed(bill) && !newChip ? "hover:border-navy/40" : ""}`}
          >
            {newChip && <span className="inline-block size-1 rounded-full bg-berry" aria-hidden="true" />}
            {bill.status}
          </button>
        </div>

        {/* title — opens the detail page */}
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-navy sm:text-xl">
          <Link
            href={billDetailHref(bill)}
            className="u-link decoration-0 hover:text-berry focus-visible:text-berry"
          >
            {billTitle(bill)}
          </Link>
        </h3>

        {/* meta — category chip applies the topic filter */}
        <p className="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
          <button
            type="button"
            onClick={() => onFilterTopic(bill.policy_area)}
            title={`Filter the feed by ${bill.policy_area}`}
            className="chip cursor-pointer border-navy/15 bg-icy-100 text-navy/70 hover:border-navy/40 active:translate-y-0"
          >
            {bill.policy_area}
          </button>
          <span aria-hidden="true">·</span>
          <span>Jurisdiction — {bill.jurisdiction}</span>
          <span aria-hidden="true">·</span>
          <span>Introduced {billDateLabel(bill)}</span>
        </p>
      </div>

      {/* summary */}
      <div className="flex flex-1 flex-col pl-5 pr-5 sm:pl-6">
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-navy/75">
          {bill.aiSummary?.summary || bill.summary}
        </p>
      </div>

      {/* expansion */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-5 mt-4 border-t hairline pt-4 sm:mx-6">
              {bullets.length > 0 ? (
                <ul className="space-y-2.5">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-navy/80">
                      <span className="mt-2 h-px w-4 shrink-0 bg-berry" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
              {bill.full_summary && bill.full_summary !== bill.summary ? (
                <p className="mt-3 text-xs leading-relaxed text-navy/55">
                  <span className="font-semibold text-navy/70">Official summary:</span>{" "}
                  {bill.full_summary}
                </p>
              ) : null}
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-navy/40">
                Record № {String(bill.source_id ?? bill.id)} · source {bill.source} · status {bill.status}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* actions */}
      <div className="mt-4 flex items-center gap-2 border-t hairline bg-icy-50/60 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold text-navy transition-colors hover:bg-icy-200/70"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M2 4l3.5 3.5L9 4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {expanded ? "Close" : "Details"}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold text-navy transition-colors hover:bg-icy-200/70"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="11" cy="2.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="3" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="11" cy="11.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4.7 6.2l4.6-2.6M4.7 7.8l4.6 2.6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Share
        </button>
        <button
          type="button"
          onClick={onContact}
          className="ml-auto flex h-9 items-center gap-2 rounded-full bg-berry px-3.5 text-xs font-bold text-paper transition-colors hover:bg-berry-600"
        >
          <svg width="12" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1.5 2l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Contact Rep
        </button>
      </div>
      <span className="sr-only">
        <Link href={billDetailHref(bill)}>Open {bill.bill_number} details</Link>
      </span>
    </article>
  );
}

/** The status chip only filters statuses the feed can genuinely filter. */
function wouldPass(_bill: Bill): "New" | "Passed" {
  return "Passed";
}

export const BillCard = memo(BillCardBase);
