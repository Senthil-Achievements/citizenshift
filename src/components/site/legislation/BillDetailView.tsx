"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { OriginalBill } from "@/lib/original-bills";
import ContactRepDialog from "@/components/site/legislation/ContactRepDialog";
import { shareOrCopy } from "@/components/site/legislation/ShareDialog";
import { TextDrawLink } from "@/components/ui/draw-random-underline";

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
    <div className="relative isolate min-h-screen bg-[#faf9f6] pb-24 pt-6 text-slate-900 antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xl flex items-center gap-2"
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[920px] px-4 sm:px-6">
        {/* Navigation row */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-4 flex items-center justify-between"
        >
          <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 shadow-xs"
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
                className="transition-transform duration-200 group-hover:-translate-x-0.5 text-slate-500"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>Back to Feed</span>
            </Link>
          </motion.div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-navy/20 bg-navy px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
              {bill.level}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-900 shadow-xs">
              <span aria-hidden="true">{bill.emoji || "📄"}</span> {bill.policyArea}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 shadow-xs">
              <span className="size-1.5 rounded-full bg-rose-600" />
              {bill.status}
            </span>
          </div>
        </motion.div>

        {/* Title and Bill Number Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6"
        >
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[2rem] leading-snug [text-wrap:balance]">
            <TextDrawLink
              text={bill.title}
              strokeColor="#e11d48"
              strokeWidth={6}
              className="cursor-default"
            />
          </h1>
          <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 sm:text-sm">
            {bill.billNumber}
          </p>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-6 flex flex-wrap items-center gap-2 sm:gap-2.5"
        >
          {/* Upvote / Downvote Pill */}
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-xs">
            <motion.button
              whileTap={{ scale: 0.88 }}
              type="button"
              onClick={handleUpvote}
              aria-label="Upvote bill"
              className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors ${
                userVote === "up" ? "text-emerald-700 font-bold" : "hover:text-emerald-600 text-slate-700"
              }`}
            >
              <motion.svg
                animate={userVote === "up" ? { y: [-2, 0], scale: [1.2, 1] } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600"
              >
                <path d="m18 15-6-6-6 6" />
              </motion.svg>
              <motion.span
                key={upvotes}
                initial={{ y: -4, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {upvotes}
              </motion.span>
            </motion.button>
            <span className="mx-1 h-3.5 w-px bg-slate-200" />
            <motion.button
              whileTap={{ scale: 0.88 }}
              type="button"
              onClick={handleDownvote}
              aria-label="Downvote bill"
              className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors ${
                userVote === "down" ? "text-rose-700 font-bold" : "hover:text-rose-600 text-slate-700"
              }`}
            >
              <motion.svg
                animate={userVote === "down" ? { y: [2, 0], scale: [1.2, 1] } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
              </motion.svg>
              <motion.span
                key={downvotes}
                initial={{ y: 4, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {downvotes}
              </motion.span>
            </motion.button>
          </div>

          {/* Comments count button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setCommentsOpen(!commentsOpen)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900"
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
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            <span>{comments.length}</span>
          </motion.button>

          {/* Save button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900"
          >
            <motion.svg
              animate={isSaved ? { scale: [1.3, 1] } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
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
            </motion.svg>
            <span>{isSaved ? "Saved" : "Save"}</span>
          </motion.button>

          {/* Share button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900"
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
          </motion.button>

          {/* Contact Your Rep Button */}
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setContactOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#133238] hover:bg-[#1a444c] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition"
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
          </motion.button>
        </motion.div>

        {/* Comments Section Drawer (collapsible) */}
        <AnimatePresence>
          {commentsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <h3 className="font-display text-lg font-bold text-slate-900">Constituent Community Notes</h3>
              <p className="mt-1 text-xs text-slate-600">
                Discuss this bill directly with verified citizens in your jurisdiction.
              </p>

              <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your perspective on this legislation..."
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#133238] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a444c] transition"
                >
                  Post Note
                </button>
              </form>

              <div className="mt-4 space-y-2.5">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.author}</span>
                      <span className="font-mono text-[10px] text-slate-500">{c.time}</span>
                    </div>
                    <p className="mt-1 text-slate-700 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card 1: Facts, Sponsors & Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7 transition-shadow hover:shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_1.7fr]">
            {/* Left Column: Facts */}
            <div className="flex flex-col justify-start space-y-4 text-sm">
              {/* Jurisdiction */}
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="flex items-start gap-3 group cursor-default"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
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
              </motion.div>

              {/* Introduced */}
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="flex items-start gap-3 group cursor-default"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
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
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Introduced</p>
                  <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">{bill.introducedDate}</p>
                </div>
              </motion.div>

              {/* Current Status */}
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="flex items-start gap-3 group cursor-default"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
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
                  <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">{bill.currentStatus}</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Sponsors */}
            <section className="rounded-xl border border-slate-200/80 bg-[#faf8f5]/80 p-4 sm:p-5">
              <div className="mb-3.5 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Sponsors
                </h2>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {bill.sponsors?.length || 0}
                </span>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {bill.sponsors && bill.sponsors.length > 0 ? (
                  bill.sponsors.map((s, i) => (
                    <motion.div
                      key={`${s.name}-${i}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      whileHover={{ y: -2 }}
                      className="flex items-start gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-white"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs">
                        {s.initials}
                      </span>
                      <div className="min-w-0 text-xs">
                        <a
                          href={s.href || `https://www.congress.gov/search?q=${encodeURIComponent(s.name)}`}
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
                        <p className="text-slate-600 font-medium">{s.meta}</p>
                        <p className="mt-0.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500">
                          {s.role}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 sm:col-span-2">
                    Official sponsor details pending entry in the legislative record.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Stepper: Legislative Progress */}
          <div className="mt-7 pt-5 border-t border-slate-200">
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {bill.progressSteps.map((step, i) => {
                const isActive = i === 0; // "Introduced" is active
                return (
                  <div key={step} className="min-w-0 text-center">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      {isActive && (
                        <motion.span
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-berry via-rose-500 to-berry shadow-xs"
                        />
                      )}
                    </div>
                    <motion.span
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                      className={`mt-2 block break-words text-[10px] sm:text-xs leading-tight ${
                        isActive
                          ? "font-bold text-slate-900"
                          : "text-slate-500 font-medium"
                      }`}
                    >
                      {step}
                    </motion.span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7"
        >
          <h2 className="font-display text-xl font-bold text-slate-900">Summary</h2>
          <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-slate-800">
            {bill.summary}
          </p>

          {/* Bullet points */}
          {bullets && bullets.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <ul className="space-y-2.5">
                {bullets.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-800"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-berry rounded-full animate-pulse" aria-hidden="true" />
                    <span>{b}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Adjacent inline-flex controls */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setAiSummaryOpen(!aiSummaryOpen)}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 shadow-xs"
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
                className="text-berry transition-transform duration-300 group-hover:rotate-12"
              >
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <span>{aiSummaryOpen ? "Hide Plain-Language Summary" : "Generate plain-language summary"}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setContactOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#133238] hover:bg-[#1a444c] px-4.5 py-2 text-xs sm:text-sm font-semibold text-white transition shadow-xs"
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
            </motion.button>
          </div>

          {/* AI Plain Language Summary Drawer */}
          <AnimatePresence>
            {aiSummaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-xl border border-slate-200 bg-icy-50/70 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-2 rounded-full bg-berry animate-ping" />
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Plain-Language Civic Analysis · Powered by CitizenShift AI
                    </p>
                  </div>
                  <h4 className="mt-2 font-display text-base font-bold text-slate-900">
                    What does this bill mean for you?
                  </h4>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-700">
                    This measure directly addresses public interest by establishing regulatory guardrails under federal law.
                    It ensures registered trading platforms cannot offer speculative derivative or prediction contracts on natural disasters like wildfires, removing perverse financial incentives and reinforcing public safety.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                      <span className="font-bold text-slate-900">Who is affected:</span>
                      <p className="mt-0.5 text-slate-600">
                        Commodity trading exchanges, financial institutions, and emergency response communities.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                      <span className="font-bold text-slate-900">Constituent Action:</span>
                      <p className="mt-0.5 text-slate-600">
                        Use the “Contact Your Rep” button above to voice your support or concerns directly to your federal representative.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Card 3: Original Bill Text */}
        {bill.originalTextSection && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                {bill.originalTextSection}
              </h2>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href={bill.originalTextHref || `https://www.congress.gov/search?q=${encodeURIComponent(bill.billNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white text-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold transition hover:border-slate-400 hover:bg-slate-50 shadow-xs"
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
                  className="size-4 shrink-0 text-slate-600"
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
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </motion.a>
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

