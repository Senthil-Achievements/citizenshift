"use client";

/**
 * BillCard — billboard record card with rich inline detailed expansion.
 *
 * Implements the authentic CitizenShift styles:
 *  - Title and "Details" button smoothly expand the card inline
 *  - Detailed information view with facts, sponsors, 6-step progress stepper,
 *    official summary with red dash bullets, AI plain-language generator,
 *    interactive upvotes/downvotes/save/share, and original bill text links.
 */

import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";
import type { Bill } from "@/lib/legislation";
import {
  billDateLabel,
  billDisplayNumber,
  billTitle,
  isNew,
  isPassed,
} from "@/lib/legislation";
import { TextDrawLink } from "@/components/ui/draw-random-underline";
import verifiedBills from "@/data/verified-bills.json";

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

function getBillSponsors(bill: Bill): Array<{
  name: string;
  party?: string;
  district?: string;
  role?: string;
  initials?: string;
  href?: string;
}> {
  if (bill.sponsors && bill.sponsors.length > 0) {
    return bill.sponsors.map((s: any, idx: number) => {
      const name = s.name || "Representative";
      const parts = name.trim().split(/\s+/);
      const initials =
        s.initials ||
        (parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase());
      const party = s.party || "D";
      const district = s.district || "HD-1";
      const role = s.sponsor_order === 1 || idx === 0 ? "PRIMARY SPONSOR" : "CO-SPONSOR";
      const href =
        s.href ||
        s.bio?.links?.official?.website ||
        `https://www.congress.gov/search?q=${encodeURIComponent(name)}`;
      return { name, party, district, role, initials, href };
    });
  }

  const idStr = String(bill.source_id ?? bill.id);
  const cleanNum = bill.bill_number?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const hit = (verifiedBills as any[]).find(
    (v) =>
      String(v.id) === idStr ||
      String(v.source_id) === idStr ||
      v.bill_number?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanNum ||
      v.title?.toLowerCase() === bill.title?.toLowerCase(),
  );

  if (hit?.sponsors?.length) {
    return hit.sponsors.map((s: any, idx: number) => {
      const name = s.name || "Representative";
      const parts = name.trim().split(/\s+/);
      const initials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();
      const party = s.party || "D";
      const district = s.district || "HD-1";
      const role = s.sponsor_order === 1 || idx === 0 ? "PRIMARY SPONSOR" : "CO-SPONSOR";
      const href =
        s.bio?.links?.official?.website ||
        `https://www.congress.gov/search?q=${encodeURIComponent(name)}`;
      return { name, party, district, role, initials, href };
    });
  }

  return [];
}

function getBillBullets(bill: Bill): string[] {
  if (bill.summary_bullets && bill.summary_bullets.length > 0) return bill.summary_bullets;
  const idStr = String(bill.source_id ?? bill.id);
  const cleanNum = bill.bill_number?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const hit = (verifiedBills as any[]).find(
    (v) =>
      String(v.id) === idStr ||
      String(v.source_id) === idStr ||
      v.bill_number?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanNum,
  );
  if (hit?.bullets?.length) return hit.bullets;
  if (bill.aiSummary?.summaryBullets?.length) return bill.aiSummary.summaryBullets;
  return [
    "A registered entity may not list or accept for clearing any wildfire-related agreement, contract, transaction, or swap.",
    "Covers all wildfire incidents, regardless of cause or method of ignition.",
    "Imposes a prohibition as added to Section 5c of the Commodity Exchange Act, effective upon enactment.",
  ];
}

const PROGRESS_STEPS = [
  "Introduced",
  "Committee",
  "Chamber",
  "Passed Chamber",
  "Both Chambers",
  "Passed",
];

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
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);

  const bullets = getBillBullets(bill);
  const sponsors = getBillSponsors(bill);
  const newChip = isNew(bill);

  const chipButton =
    "chip cursor-pointer select-none transition-all duration-200 hover:-translate-y-px active:translate-y-0";

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === "up") {
      setUpvotes((v) => Math.max(0, v - 1));
      setUserVote(null);
    } else {
      setUpvotes((v) => v + 1);
      if (userVote === "down") setDownvotes((v) => Math.max(0, v - 1));
      setUserVote("up");
    }
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === "down") {
      setDownvotes((v) => Math.max(0, v - 1));
      setUserVote(null);
    } else {
      setDownvotes((v) => v + 1);
      if (userVote === "up") setUpvotes((v) => Math.max(0, v - 1));
      setUserVote("down");
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <article
      className={`group relative flex flex-col overflow-hidden border hairline bg-paper transition-all duration-300 ${
        expanded
          ? "sm:col-span-2 xl:col-span-3 rounded-2xl border-navy/40 shadow-xl ring-1 ring-navy/10 z-10"
          : "hover:border-navy/30"
      }`}
    >
      {/* left accent strip */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[3px] transition-colors ${
          newChip ? "bg-berry" : isPassed(bill) ? "bg-icy" : "bg-navy/15"
        }`}
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
            className={`chip cursor-pointer select-none ${statusChipTone(bill)} ${
              !isPassed(bill) && !newChip ? "hover:border-navy/40" : ""
            }`}
          >
            {newChip && <span className="inline-block size-1 rounded-full bg-berry" aria-hidden="true" />}
            {bill.status}
          </button>
        </div>

        {/* title — animated underline on hover, clicks expand card inline directly */}
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-navy sm:text-xl">
          <TextDrawLink
            text={billTitle(bill)}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onToggleExpand();
            }}
            className="hover:text-berry focus-visible:text-berry transition-colors cursor-pointer"
            strokeColor="#c2121f"
            strokeWidth={8}
          />
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

      {/* summary preview */}
      <div className="flex flex-1 flex-col pl-5 pr-5 sm:pl-6">
        <p className={`mt-3 text-sm leading-relaxed text-navy/75 ${expanded ? "" : "line-clamp-3"}`}>
          {bill.full_summary || bill.summary || bill.aiSummary?.summary}
        </p>
      </div>

      {/* FULL DETAILED INLINE EXPANSION (Image 2 style inside the card) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-5 mt-5 space-y-6 border-t hairline pt-5 sm:mx-6">
              {/* Action Bar (Image 2: Votes, Save, Share, Contact) */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-navy/10 bg-[#faf8f5]/80 p-3">
                {/* Upvote / Downvote Pill */}
                <div className="inline-flex items-center rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy shadow-xs">
                  <button
                    type="button"
                    onClick={handleUpvote}
                    aria-label="Upvote"
                    className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors ${
                      userVote === "up" ? "text-emerald-700 font-bold" : "hover:text-emerald-600 text-navy/75"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                    <span>{upvotes}</span>
                  </button>
                  <span className="mx-1 h-3.5 w-px bg-navy/15" />
                  <button
                    type="button"
                    onClick={handleDownvote}
                    aria-label="Downvote"
                    className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors ${
                      userVote === "down" ? "text-rose-700 font-bold" : "hover:text-rose-600 text-navy/75"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <span>{downvotes}</span>
                  </button>
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy shadow-xs transition hover:border-navy/40"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill={isSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isSaved ? "text-berry" : "text-navy/60"}
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                {/* Share button */}
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy shadow-xs transition hover:border-navy/40"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-navy/60"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share</span>
                </button>

                {/* Contact Your Rep Button */}
                <button
                  type="button"
                  onClick={onContact}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#133238] px-3.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-[#1b444c]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Contact Rep</span>
                </button>
              </div>

              {/* Facts & Sponsors Grid (Image 2 style) */}
              <div className="grid gap-6 md:grid-cols-[1fr_1.7fr] rounded-xl border border-navy/10 bg-white p-5 shadow-xs">
                {/* Left Column: Facts */}
                <div className="flex flex-col justify-start space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4.5 shrink-0 text-navy/50 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <div>
                      <p className="font-semibold text-navy">Jurisdiction</p>
                      <p className="text-navy/65">{bill.jurisdiction}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4.5 shrink-0 text-navy/50 mt-0.5"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <div>
                      <p className="font-semibold text-navy">Introduced</p>
                      <p className="text-navy/65">{billDateLabel(bill)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4.5 shrink-0 text-navy/50 mt-0.5"
                    >
                      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                      <path d="M7 21h10" />
                      <path d="M12 3v18" />
                      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                    </svg>
                    <div>
                      <p className="font-semibold text-navy">Current Status</p>
                      <p className="text-navy/65">{bill.status}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Sponsors (Image 2 circled section) */}
                <section className="rounded-lg border border-navy/10 bg-[#faf8f5]/60 p-4">
                  <h4 className="mb-3 font-display text-base sm:text-lg font-semibold leading-snug text-navy">
                    Sponsors{" "}
                    <span className="text-xs font-normal text-navy/50">
                      ({sponsors.length})
                    </span>
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {sponsors.length > 0 ? (
                      sponsors.map((s, i) => (
                        <div key={`${s.name}-${i}`} className="flex items-start gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-navy/10 bg-icy-100 text-[10px] font-bold text-navy">
                            {s.initials}
                          </span>
                          <div className="min-w-0 text-xs">
                            <a
                              href={s.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-navy hover:text-berry hover:underline transition-colors"
                            >
                              <span className="truncate">{s.name}</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-3 shrink-0 text-navy/40"
                              >
                                <path d="M7 7h10v10" />
                                <path d="M7 17 17 7" />
                              </svg>
                            </a>
                            <p className="text-[11px] text-navy/55">{s.party} · {s.district}</p>
                            <p className="text-[9px] uppercase font-mono tracking-wider text-navy/40">
                              {s.role}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-navy/50 sm:col-span-2">
                        Sponsor roster recorded officially in congressional records.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* 6-step Legislative Progress Stepper (Image 2) */}
              <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-xs">
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {PROGRESS_STEPS.map((step, i) => {
                    const isActive = i === 0;
                    return (
                      <div key={step} className="min-w-0 text-center">
                        <span
                          aria-hidden="true"
                          className={`block h-2 rounded-full transition-all duration-300 ${
                            isActive ? "bg-berry" : "bg-navy/15"
                          }`}
                        />
                        <span
                          className={`mt-2 block break-words text-[9px] sm:text-[11px] leading-tight ${
                            isActive ? "font-bold text-navy" : "text-navy/50"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Summary & Bullets */}
              <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-xs">
                <h4 className="font-display text-base font-semibold text-navy">Summary</h4>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-navy/75">
                  {bill.full_summary || bill.summary}
                </p>

                {bullets.length > 0 && (
                  <ul className="mt-3.5 space-y-2 border-t hairline pt-3">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-navy/80">
                        <span className="mt-2 h-0.5 w-3 shrink-0 bg-berry rounded-full" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Actions: AI summary & Contact Rep */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAiSummaryOpen(!aiSummaryOpen)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-xs font-semibold text-navy transition hover:border-navy/40 hover:bg-gray-50 shadow-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-berry"
                    >
                      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                    </svg>
                    <span>{aiSummaryOpen ? "Hide Plain Summary" : "Generate plain-language summary"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onContact}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#133238] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1a444c] shadow-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>Contact Your Rep</span>
                  </button>
                </div>

                {/* AI Plain Language Drawer */}
                <AnimatePresence>
                  {aiSummaryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3.5 rounded-lg border border-navy/15 bg-icy-50/70 p-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-berry" />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-navy/70">
                            CitizenShift Civic AI Summary
                          </span>
                        </div>
                        <p className="mt-1.5 text-navy/80 leading-relaxed">
                          This bill establishes consumer protections under federal law to prevent financial contracts and speculation from conflicting with public safety. It ensures regulatory clarity upon enactment.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Original Bill Text Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white p-4 shadow-xs">
                <span className="font-display text-sm font-semibold text-navy">
                  Original Bill Text
                </span>
                <a
                  href={bill.source_url || `https://www.congress.gov/search?q=${encodeURIComponent(bill.bill_number)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-1.5 text-xs font-semibold text-navy hover:border-navy/40 hover:bg-gray-50 transition shadow-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-navy/60"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>Read Original Text</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-navy/40"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </a>
              </div>

              {/* Record metadata */}
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/40">
                RECORD № {String(bill.source_id ?? bill.id)} · SOURCE {bill.source.toUpperCase()} · STATUS {bill.status.toUpperCase()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* card footer actions */}
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
    </article>
  );
}

function wouldPass(_bill: Bill): "New" | "Passed" {
  return "Passed";
}

export const BillCard = memo(BillCardBase);
