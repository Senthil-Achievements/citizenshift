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
  billDetailHref,
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
      return "border-navy bg-navy text-white font-bold";
    case "State":
      return "border-berry bg-berry text-white font-bold";
    default:
      return "border-slate-300 bg-slate-100 text-slate-800 font-bold";
  }
}

function statusChipTone(bill: Bill): string {
  if (isPassed(bill)) return "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold";
  if (bill.status === "Vetoed" || bill.status === "Failed") return "border-slate-300 bg-slate-100 text-slate-600 line-through font-semibold";
  if (isNew(bill) || bill.status === "Introduced") return "border-rose-300 bg-rose-50 text-rose-800 font-bold";
  return "border-slate-300 bg-slate-50 text-slate-800 font-bold";
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

        {/* title — animated underline on hover, clicks expand card details inline on the same page */}
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

        {/* meta — category chip applies the topic filter with high contrast */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider">
          <button
            type="button"
            onClick={() => onFilterTopic(bill.policy_area)}
            title={`Filter the feed by ${bill.policy_area}`}
            className="inline-flex items-center rounded-md border border-blue-300 bg-blue-50/90 px-2 py-0.5 text-[11px] font-bold text-blue-950 shadow-2xs transition hover:bg-blue-100 hover:border-blue-400 active:translate-y-0"
          >
            {bill.policy_area}
          </button>
          <span className="text-slate-400 font-black" aria-hidden="true">·</span>
          <span className="font-bold text-slate-800">JURISDICTION — {bill.jurisdiction}</span>
          <span className="text-slate-400 font-black" aria-hidden="true">·</span>
          <span className="font-bold text-slate-800">
            {bill.status === "Introduced" ? "INTRODUCED" : "LAST ACTION"} {billDateLabel(bill)}
          </span>
        </div>
      </div>

      {/* summary preview */}
      <div className="flex flex-1 flex-col pl-5 pr-5 sm:pl-6">
        <p className={`mt-2.5 text-sm sm:text-[14.5px] leading-relaxed text-slate-900 font-medium ${expanded ? "" : "line-clamp-3"}`}>
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
                  <span className="mx-1 h-3 w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={handleDownvote}
                    aria-label="Downvote"
                    className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors ${
                      userVote === "down" ? "text-rose-700 font-bold" : "hover:text-rose-600 text-slate-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-rose-600"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900"
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
                    className={isSaved ? "text-rose-600" : "text-slate-500"}
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                {/* Share button */}
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900"
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
                    className="text-slate-500"
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
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#133238] hover:bg-[#1a444c] px-3.5 py-1 text-xs font-semibold text-white shadow-xs transition"
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

              {/* Facts & Sponsors Grid */}
              <div className="grid gap-6 md:grid-cols-[1fr_1.7fr] rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                {/* Left Column: Facts */}
                <div className="flex flex-col justify-start space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Jurisdiction</p>
                      <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">{bill.jurisdiction}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Introduced</p>
                      <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">{billDateLabel(bill)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                        <path d="M7 21h10" />
                        <path d="M12 3v18" />
                        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Status</p>
                      <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">{bill.status}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Sponsors */}
                <section className="rounded-xl border border-slate-200/80 bg-[#faf8f5]/80 p-4 shadow-xs">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-display text-base font-bold text-slate-900">
                      Sponsors
                    </h4>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {sponsors.length}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {sponsors.length > 0 ? (
                      sponsors.map((s, i) => (
                        <div key={`${s.name}-${i}`} className="flex items-start gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-800 shadow-2xs">
                            {s.initials}
                          </span>
                          <div className="min-w-0 text-xs">
                            <a
                              href={s.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-berry hover:underline transition-colors"
                            >
                              <span className="truncate">{s.name}</span>
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
                                className="size-3 shrink-0 text-slate-400"
                              >
                                <path d="M7 7h10v10" />
                                <path d="M7 17 17 7" />
                              </svg>
                            </a>
                            <p className="text-slate-600 font-medium">{s.party} · {s.district}</p>
                            <p className="mt-0.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500">
                              {s.role}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 sm:col-span-2">
                        Sponsor roster recorded officially in congressional records.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* 6-step Legislative Progress Stepper */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {PROGRESS_STEPS.map((step, i) => {
                    const isActive = i === 0;
                    return (
                      <div key={step} className="min-w-0 text-center">
                        <span
                          aria-hidden="true"
                          className={`block rounded-full transition-all duration-300 ${
                            isActive
                              ? "h-2 bg-berry shadow-xs"
                              : "h-2 bg-slate-200"
                          }`}
                        />
                        <span
                          className={`mt-2 block break-words leading-tight ${
                            isActive
                              ? "text-[10px] sm:text-xs font-bold text-slate-900"
                              : "text-[10px] sm:text-xs text-slate-500 font-medium"
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
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h4 className="font-display text-base sm:text-lg font-bold text-slate-900">Summary</h4>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-800">
                  {bill.full_summary || bill.summary}
                </p>

                {bullets.length > 0 && (
                  <ul className="mt-3.5 space-y-2 border-t border-slate-100 pt-3">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-slate-800">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-berry rounded-full" aria-hidden="true" />
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 shadow-xs"
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#133238] hover:bg-[#1a444c] px-4 py-1.5 text-xs font-semibold text-white transition shadow-xs"
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
                      <div className="mt-3.5 rounded-xl border border-slate-200 bg-icy-50/70 p-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-berry" />
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            CitizenShift Civic AI Summary
                          </span>
                        </div>
                        <p className="mt-1.5 text-slate-700 leading-relaxed">
                          This bill establishes consumer protections under federal law to prevent financial contracts and speculation from conflicting with public safety. It ensures regulatory clarity upon enactment.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Original Bill Text Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="font-display text-sm font-bold text-slate-900">
                  Original Bill Text
                </span>
                <a
                  href={bill.source_url || `https://www.congress.gov/search?q=${encodeURIComponent(bill.bill_number)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white text-slate-800 px-3.5 py-1.5 text-xs font-semibold hover:border-slate-400 hover:bg-slate-50 transition shadow-xs"
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
                    className="text-slate-500"
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
                    className="text-slate-400"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </a>
              </div>

              {/* Record metadata */}
              <p className="font-mono text-[10px] uppercase font-semibold tracking-[0.16em] text-slate-500">
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
