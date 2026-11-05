"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { OriginalBill } from "@/lib/original-bills";
import ContactRepDialog from "@/components/site/legislation/ContactRepDialog";
import { shareOrCopy } from "@/components/site/legislation/ShareDialog";

interface Props {
  bill: OriginalBill;
}

export default function BillDetailView({ bill }: Props) {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [comments, setComments] = useState<
    Array<{ id: string; author: string; role: string; text: string; time: string; likes: number }>
  >([
    {
      id: "c1",
      author: "Constituent Advocate",
      role: "Verified District Citizen",
      text: "Essential legislation for transparency and protecting constituents. Glad to see bipartisan co-sponsors on this record.",
      time: "2 hours ago",
      likes: 3,
    },
  ]);
  const [commentInput, setCommentInput] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleUpvote = () => {
    if (userVote === "up") {
      setUpvotes((v) => Math.max(0, v - 1));
      setUserVote(null);
    } else {
      setUpvotes((v) => v + 1);
      if (userVote === "down") setDownvotes((v) => Math.max(0, v - 1));
      setUserVote(true as any ? "up" : null);
      showToast("Constituent vote registered: Upvoted");
    }
  };

  const handleDownvote = () => {
    if (userVote === "down") {
      setDownvotes((v) => Math.max(0, v - 1));
      setUserVote(null);
    } else {
      setDownvotes((v) => v + 1);
      if (userVote === "up") setUpvotes((v) => Math.max(0, v - 1));
      setUserVote("down");
      showToast("Constituent vote registered: Downvoted");
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    showToast(!isSaved ? "Bill saved to your civic library" : "Bill removed from saved library");
  };

  const handleShare = async () => {
    const shim = {
      id: bill.id,
      bill_number: bill.billNumber,
      title: bill.title,
      summary: bill.summary,
      level: bill.level as any,
      jurisdiction: bill.jurisdiction,
      status: bill.status,
      policy_area: bill.policyArea,
      introduced_date: bill.introducedDate,
      source: "citizenshift-original",
    };
    await shareOrCopy(shim);
    showToast("Bill link copied to clipboard");
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newC = {
      id: String(Date.now()),
      author: "Constituent",
      role: "Registered Voter",
      text: commentInput.trim(),
      time: "Just now",
      likes: 0,
    };
    setComments([newC, ...comments]);
    setCommentInput("");
    showToast("Your constituent thought has been posted");
  };

  const bullets = bill.bullets && bill.bullets.length > 0
    ? bill.bullets
    : [
        `Prohibits listing or transactions conflicting with public interest and federal standards.`,
        `Applies to all related agreements and designated contracts within jurisdiction.`,
        `Effective upon statutory enactment and published in official legislative record.`,
      ];

  const billShim = {
    id: bill.id,
    bill_number: bill.billNumber,
    title: bill.title,
    summary: bill.summary,
    level: bill.level as any,
    jurisdiction: bill.jurisdiction,
    status: bill.status,
    policy_area: bill.policyArea,
    introduced_date: bill.introducedDate,
    source: "citizenshift-original",
  };

  return (
    <div className="relative isolate min-h-screen bg-[#f7f5f0] pb-24 pt-6 text-navy">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-navy/15 bg-navy px-5 py-2.5 text-xs font-semibold text-paper shadow-lg flex items-center gap-2"
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[920px] px-4 sm:px-6">
        {/* Navigation row */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/explore"
            className="group inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-4 py-1.5 text-xs font-semibold text-navy transition-all duration-200 hover:border-navy/40 hover:-translate-y-px active:translate-y-0 shadow-xs"
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
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back to Feed</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-navy/15 bg-navy px-2.5 py-0.5 text-xs font-semibold text-paper">
              {bill.level}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-white px-2.5 py-0.5 text-xs font-medium text-navy shadow-xs">
              <span aria-hidden="true">{bill.emoji || "📄"}</span> {bill.policyArea}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-berry/30 bg-berry/10 px-2.5 py-0.5 text-xs font-bold text-berry">
              <span className="size-1.5 rounded-full bg-berry" />
              {bill.status}
            </span>
          </div>
        </div>

        {/* Title and Bill Number Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-[2.25rem] leading-[1.18] [text-wrap:balance]">
            {bill.title}
          </h1>
          <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-navy/55 sm:text-sm">
            {bill.billNumber}
          </p>
        </div>

        {/* Action Bar (Exact match to Image 2) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3"
        >
          {/* Upvote / Downvote Pill */}
          <div className="inline-flex items-center rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy shadow-xs">
            <button
              type="button"
              onClick={handleUpvote}
              aria-label="Upvote bill"
              className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors ${
                userVote === "up" ? "text-emerald-700 font-bold" : "hover:text-emerald-600 text-navy/75"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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
              aria-label="Downvote bill"
              className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors ${
                userVote === "down" ? "text-rose-700 font-bold" : "hover:text-rose-600 text-navy/75"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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

          {/* Comments count button */}
          <button
            type="button"
            onClick={() => setCommentsOpen(!commentsOpen)}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy shadow-xs transition hover:border-navy/40 hover:bg-gray-50 active:translate-y-px"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-navy/60"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            <span>{comments.length}</span>
          </button>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy shadow-xs transition hover:border-navy/40 hover:bg-gray-50 active:translate-y-px"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy shadow-xs transition hover:border-navy/40 hover:bg-gray-50 active:translate-y-px"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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

          {/* Contact Your Rep Button (Dark teal background as in Image 2) */}
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#133238] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1a444c] active:translate-y-px"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
        </motion.div>

        {/* Comments Section Drawer (collapsible) */}
        <AnimatePresence>
          {commentsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden rounded-2xl border border-navy/15 bg-white p-5 shadow-sm"
            >
              <h3 className="font-display text-lg font-semibold text-navy">Constituent Community Notes</h3>
              <p className="mt-1 text-xs text-navy/60">
                Discuss this bill directly with verified citizens in your jurisdiction.
              </p>

              <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your perspective on this legislation..."
                  className="flex-1 rounded-full border border-navy/20 px-4 py-2 text-xs text-navy placeholder:text-navy/40 focus:border-navy focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-paper hover:bg-navy/90"
                >
                  Post Note
                </button>
              </form>

              <div className="mt-4 space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-navy/10 bg-icy-50/50 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-navy">{c.author}</span>
                      <span className="font-mono text-[10px] text-navy/40">{c.time}</span>
                    </div>
                    <p className="mt-1 text-navy/75 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card 1: Facts, Sponsors & Progress Stepper (Image 2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_1.7fr]">
            {/* Left Column: Facts */}
            <div className="flex flex-col justify-start space-y-5 text-sm">
              {/* Jurisdiction */}
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 shrink-0 text-navy/50 mt-0.5"
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

              {/* Introduced */}
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 shrink-0 text-navy/50 mt-0.5"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <div>
                  <p className="font-semibold text-navy">Introduced</p>
                  <p className="text-navy/65">{bill.introducedDate}</p>
                </div>
              </div>

              {/* Current Status */}
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 shrink-0 text-navy/50 mt-0.5"
                >
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="M7 21h10" />
                  <path d="M12 3v18" />
                  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                </svg>
                <div>
                  <p className="font-semibold text-navy">Current Status</p>
                  <p className="text-navy/65">{bill.currentStatus}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Sponsors (Circled in Image 2) */}
            <section className="rounded-xl border border-navy/10 bg-[#faf8f5]/60 p-4 sm:p-5">
              <h2 className="mb-4 font-display text-xl font-semibold leading-snug text-navy">
                Sponsors{" "}
                <span className="text-sm font-normal text-navy/50">
                  ({bill.sponsors?.length || 0})
                </span>
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {bill.sponsors && bill.sponsors.length > 0 ? (
                  bill.sponsors.map((s, i) => (
                    <div key={`${s.name}-${i}`} className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-navy/10 bg-icy-100 text-xs font-bold text-navy">
                        {s.initials}
                      </span>
                      <div className="min-w-0 text-sm">
                        <a
                          href={s.href || `https://www.congress.gov/search?q=${encodeURIComponent(s.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-navy hover:text-berry hover:underline transition-colors"
                        >
                          <span className="truncate">{s.name}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-3.5 shrink-0 text-navy/45"
                          >
                            <path d="M7 7h10v10" />
                            <path d="M7 17 17 7" />
                          </svg>
                        </a>
                        <p className="text-xs text-navy/55">{s.meta}</p>
                        <p className="mt-0.5 text-[10px] uppercase font-mono tracking-wider text-navy/45">
                          {s.role}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-navy/50 sm:col-span-2">
                    Official sponsor details pending entry in the legislative record.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Stepper: Legislative Progress (Exact 6 steps as in Image 2) */}
          <div className="mt-8 pt-6 border-t border-navy/10">
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {bill.progressSteps.map((step, i) => {
                const isActive = i === 0; // "Introduced" is active
                return (
                  <div key={step} className="min-w-0 text-center">
                    <span
                      aria-hidden="true"
                      className={`block h-2 rounded-full transition-all duration-300 ${
                        isActive ? "bg-berry" : "bg-navy/15"
                      }`}
                    />
                    <span
                      className={`mt-2.5 block break-words text-[10px] sm:text-xs leading-tight ${
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
        </motion.div>

        {/* Card 2: Summary Card (Image 2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mt-6 rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7"
        >
          <h2 className="font-display text-xl font-semibold text-navy">Summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/75 sm:text-[15px]">
            {bill.summary}
          </p>

          {/* Bullet points (Wildfire bill bullets from Image 1) */}
          {bullets && bullets.length > 0 && (
            <div className="mt-4 border-t border-navy/10 pt-4">
              <ul className="space-y-2.5">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-navy/80">
                    <span className="mt-2.5 h-0.5 w-3.5 shrink-0 bg-berry rounded-full" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Adjacent inline-flex controls (Exact match to Image 2) */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAiSummaryOpen(!aiSummaryOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-5 py-2.5 text-xs font-semibold text-navy transition-all duration-200 hover:border-navy/40 hover:bg-gray-50 active:translate-y-px shadow-xs sm:text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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
              <span>{aiSummaryOpen ? "Hide Plain-Language Summary" : "Generate plain-language summary"}</span>
            </button>

            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#133238] px-5 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-[#1a444c] active:translate-y-px shadow-xs sm:text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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

          {/* AI Plain Language Summary Drawer */}
          <AnimatePresence>
            {aiSummaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-5 rounded-xl border border-navy/15 bg-icy-50/70 p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-2 rounded-full bg-berry" />
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-navy/70">
                      Plain-Language Civic Analysis · Powered by CitizenShift AI
                    </p>
                  </div>
                  <h4 className="mt-2 font-display text-base font-semibold text-navy">
                    What does this bill mean for you?
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-navy/75">
                    This measure directly addresses public interest by establishing regulatory guardrails under the Commodity Exchange Act.
                    It ensures registered trading platforms cannot offer speculative derivative or prediction contracts on natural disasters like wildfires, removing perverse financial incentives and reinforcing public safety.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="rounded-lg border border-navy/10 bg-white p-3">
                      <span className="font-semibold text-navy">Who is affected:</span>
                      <p className="mt-1 text-navy/65">
                        Commodity trading exchanges, financial institutions, and emergency response communities.
                      </p>
                    </div>
                    <div className="rounded-lg border border-navy/10 bg-white p-3">
                      <span className="font-semibold text-navy">Constituent Action:</span>
                      <p className="mt-1 text-navy/65">
                        Use the “Contact Your Rep” button above to voice your support or concerns directly to your federal representative.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Card 3: Original Bill Text (Image 2) */}
        {bill.originalTextSection && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="mt-6 rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-navy">
                {bill.originalTextSection}
              </h2>
              <a
                href={bill.originalTextHref || `https://www.congress.gov/search?q=${encodeURIComponent(bill.billNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-5 py-2.5 text-xs font-semibold text-navy transition-all duration-200 hover:border-navy/40 hover:bg-gray-50 active:translate-y-px shadow-xs sm:text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4 shrink-0 text-navy/60"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>{bill.originalTextLinkText || "Read Original Text"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-navy/45"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </a>
            </div>
          </motion.div>
        )}
      </div>

      {/* Contact Rep Modal */}
      <ContactRepDialog
        bill={billShim}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}

