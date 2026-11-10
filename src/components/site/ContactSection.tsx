"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import the 3D Floating Orb to ensure 100% SSR safety and fast initial load
const FloatingOrbCanvas = dynamic(
  () => import("@/components/site/FloatingOrbCanvas"),
  { ssr: false }
);

const EMAIL = "erin.chouinard@citizenshift.us";
const PHONE = "+1 (212) 555-0199";
const ADDRESS = "375 Lexington Ave, New York, NY";
const LINKEDIN_URL = "https://www.linkedin.com/company/citizenshift/posts/?feedView=all";

export interface SocialPlatform {
  id: string;
  name: string;
  handle: string;
  url: string;
  badge: string;
  icon: (className?: string) => React.ReactNode;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "instagram",
    name: "INSTAGRAM",
    handle: "@CITIZENSHIFT",
    url: "https://instagram.com/citizenshift", // Ready for user's custom link
    badge: "INSTAGRAM",
    icon: (cls = "size-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: "twitter",
    name: "X (TWITTER)",
    handle: "@CITIZENSHIFT",
    url: "https://x.com/citizenshift", // Ready for user's custom link
    badge: "X / TWITTER",
    icon: (cls = "size-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    name: "FACEBOOK",
    handle: "@CITIZENSHIFT",
    url: "https://facebook.com/citizenshift", // Ready for user's custom link
    badge: "FACEBOOK",
    icon: (cls = "size-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "LINKEDIN",
    handle: "@CITIZENSHIFT",
    url: LINKEDIN_URL,
    badge: "LINKEDIN",
    icon: (cls = "size-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    id: "youtube",
    name: "YOUTUBE",
    handle: "@CITIZENSHIFT",
    url: "https://youtube.com/@citizenshift", // Ready for user's custom link
    badge: "YOUTUBE",
    icon: (cls = "size-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "threads",
    name: "THREADS",
    handle: "@CITIZENSHIFT",
    url: "https://threads.net/@citizenshift", // Ready for user's custom link
    badge: "THREADS",
    icon: (cls = "size-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24C5.464 24 0 18.625 0 12.012 0 5.4 5.464.025 12.186.025c3.272 0 6.33 1.258 8.61 3.543l-2.457 2.493c-1.636-1.636-3.824-2.535-6.153-2.535-4.78 0-8.68 3.864-8.68 8.486 0 4.621 3.9 8.485 8.68 8.485 3.828 0 6.55-2.28 7.027-5.592H12.186v-3.4h10.457c.106.634.16 1.285.16 1.956 0 6.612-4.52 11.039-10.617 11.039z" />
      </svg>
    ),
  },
];

const TOPICS = [
  "✦ Legislative Tracking",
  "✦ 50-State Records",
  "✦ Plain-Language AI",
  "✦ Press & Media",
  "✦ Civic Coalitions",
  "✦ Suggestions",
];

type ActiveTab = "contact" | "careers" | "press";

export default function ContactSection() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("contact");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["✦ Legislative Tracking"]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterPending, setNewsletterPending] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Magnetic button physics ref
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });

  const handleBtnMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = sendBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.28;
    const deltaY = (e.clientY - centerY) * 0.28;
    setBtnOffset({ x: deltaX, y: deltaY });
  };

  const handleBtnMouseLeave = () => {
    setBtnOffset({ x: 0, y: 0 });
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.message.trim()) {
      setError("Please write your message or inquiry.");
      return;
    }

    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSubmitted(true);
    }, 650);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) return;

    setNewsletterPending(true);
    setTimeout(() => {
      setNewsletterPending(false);
      setNewsletterSuccess(true);
      setTimeout(() => setNewsletterSuccess(false), 4500);
      setNewsletterEmail("");
    }, 600);
  };

  return (
    <section
      id="contact"
      className="scroll-mt-20 relative w-full bg-[#eae7df] text-neutral-900 py-16 sm:py-24 lg:py-28 overflow-hidden select-none"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            PART 1: HERO TOP BAR & KINETIC HEADLINE (MATCHING IMAGE)
           ======================================================== */}
        <div className="relative mb-12 sm:mb-16">
          {/* Top row: Section Number "04." and 3 Interactive Status Dots */}
          <div className="flex items-center justify-between pb-4 sm:pb-6">
            <div className="flex items-baseline gap-2 font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-900">
              <span>04.</span>
              <span className="size-2.5 sm:size-3 bg-neutral-900 inline-block mb-1 sm:mb-2 animate-pulse" />
            </div>

            {/* 3 Interactive Editorial Dots */}
            <div className="flex flex-col gap-2.5 items-center cursor-pointer group" title="Section navigator">
              <span className="size-2.5 rounded-full bg-neutral-900 transition-transform group-hover:scale-125" />
              <span className="size-2.5 rounded-full bg-neutral-900/40 transition-transform group-hover:scale-125 group-hover:bg-neutral-900" />
              <span className="size-2.5 rounded-full bg-neutral-900/40 transition-transform group-hover:scale-125 group-hover:bg-neutral-900" />
            </div>
          </div>

          {/* Kinetic Headline with Vibrant Pink/Coral Highlighter Strip */}
          <div className="relative">
            {/* The Signature Vibrant Pink Highlighter Bar */}
            <div className="relative inline-block w-full">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 -inset-y-1 sm:-inset-y-2 w-full max-w-[13.5ch] bg-gradient-to-r from-[#ff4d79] via-[#ff6b95] to-[#f43f5e] origin-left z-0 shadow-sm"
              />

              <h2
                id="contact-heading"
                className="relative z-10 font-sans font-black text-6xl sm:text-8xl md:text-9xl lg:text-[7.5rem] tracking-tight leading-[0.88] text-neutral-950 uppercase"
              >
                GET
              </h2>
            </div>

            <h2 className="font-sans font-black text-6xl sm:text-8xl md:text-9xl lg:text-[7.5rem] tracking-tight leading-[0.88] text-neutral-950 uppercase mt-1 sm:mt-2">
              IN TOUCH:
            </h2>
          </div>
        </div>

        {/* ========================================================
            PART 2: INTERACTIVE FORM CONTAINER (WHITE CARD)
           ======================================================== */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 sm:p-10 md:p-12 mb-12 sm:mb-16">
          {/* Top Interactive Tabs: ○ CONTACT / ● CAREERS / ● PRESS */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 border-b border-neutral-100 pb-6 mb-8">
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`flex items-center gap-2.5 font-sans font-bold text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "contact" ? "text-neutral-950" : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <span
                className={`size-2.5 rounded-full border-2 transition-all ${
                  activeTab === "contact"
                    ? "border-neutral-900 bg-neutral-900 scale-110"
                    : "border-neutral-400 bg-transparent"
                }`}
              />
              <span>CONTACT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("press")}
              className={`flex items-center gap-2.5 font-sans font-bold text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "press" ? "text-neutral-950" : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <span
                className={`size-2.5 rounded-full border-2 transition-all ${
                  activeTab === "press"
                    ? "border-neutral-900 bg-neutral-900 scale-110"
                    : "border-neutral-400 bg-transparent"
                }`}
              />
              <span>PRESS & PARTNERS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("careers")}
              className={`flex items-center gap-2.5 font-sans font-bold text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "careers" ? "text-neutral-950" : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <span
                className={`size-2.5 rounded-full border-2 transition-all ${
                  activeTab === "careers"
                    ? "border-neutral-900 bg-neutral-900 scale-110"
                    : "border-neutral-400 bg-transparent"
                }`}
              />
              <span>CAREERS & FELLOWS</span>
            </button>
          </div>

          {/* Tab Subtitle Description (Changes with Tab) */}
          <AnimatePresence mode="wait">
            <motion.p
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.14em] text-neutral-600 font-semibold mb-10 max-w-2xl leading-relaxed"
            >
              {activeTab === "contact" &&
                "CITIZENSHIFT IS OPEN TO CONSTITUENTS, RESEARCHERS, JOURNALISTS, AND CIVIC LEADERS ACROSS ALL 50 STATES. FEEL FREE TO DROP US A LINE."}
              {activeTab === "press" &&
                "FOR PRESS INQUIRIES, INTERVIEWS, LEGISLATIVE RESEARCH BRIEFINGS, OR CIVIC COALITION PARTNERSHIPS, CONNECT DIRECTLY WITH OUR TEAM."}
              {activeTab === "careers" &&
                "WE ARE RECRUITING FULL-STACK ENGINEERS, CIVIC RESEARCHERS, AND STUDENT AMBASSADORS COMMITTED TO OPEN DEMOCRACY."}
            </motion.p>
          </AnimatePresence>

          {/* Form Content / Success View */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-4 max-w-md mx-auto"
            >
              <div className="size-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center text-3xl font-black shadow-sm">
                ✓
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900">
                Message Transmitted
              </h3>
              <p className="font-sans text-sm text-neutral-600 leading-relaxed">
                Thank you, <strong>{form.name}</strong>. Your inquiry has been routed to our verified desk. We respond within 1 business day.
              </p>
              <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest">
                VERIFIED TICKET #{Math.floor(100000 + Math.random() * 900000)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", phone: "", email: "", message: "" });
                }}
                className="mt-4 px-8 py-3 rounded-full bg-neutral-950 text-white font-mono text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
              >
                Send Another Message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-mono text-rose-700">
                  {error}
                </div>
              )}

              {/* Row 1: NAME and PHONE NUMBER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* NAME Input */}
                <div className="group relative">
                  <div className="flex items-center justify-between pb-2">
                    <label
                      htmlFor="cs-name"
                      className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-neutral-400 group-focus-within:text-neutral-900 transition-colors font-bold"
                    >
                      NAME
                    </label>
                    <span
                      className={`size-2 rounded-full transition-all ${
                        form.name.trim().length > 1
                          ? "bg-emerald-500 scale-125"
                          : "bg-neutral-300 group-focus-within:bg-[#f43f5e]"
                      }`}
                    />
                  </div>
                  <input
                    id="cs-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full py-2.5 font-sans text-base sm:text-lg text-neutral-950 placeholder:text-neutral-300 bg-transparent border-b border-neutral-300 focus:outline-none transition-all"
                  />
                  {/* Kinetic focus line sweep */}
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-neutral-950 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                </div>

                {/* PHONE NUMBER Input */}
                <div className="group relative">
                  <div className="flex items-center justify-between pb-2">
                    <label
                      htmlFor="cs-phone"
                      className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-neutral-400 group-focus-within:text-neutral-900 transition-colors font-bold"
                    >
                      PHONE NUMBER
                    </label>
                    <span
                      className={`size-2 rounded-full transition-all ${
                        form.phone.trim().length > 6
                          ? "bg-emerald-500 scale-125"
                          : "bg-neutral-300 group-focus-within:bg-[#f43f5e]"
                      }`}
                    />
                  </div>
                  <input
                    id="cs-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full py-2.5 font-sans text-base sm:text-lg text-neutral-950 placeholder:text-neutral-300 bg-transparent border-b border-neutral-300 focus:outline-none transition-all"
                  />
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-neutral-950 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                </div>
              </div>

              {/* Row 2: EMAIL */}
              <div className="group relative">
                <div className="flex items-center justify-between pb-2">
                  <label
                    htmlFor="cs-email"
                    className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-neutral-400 group-focus-within:text-neutral-900 transition-colors font-bold"
                  >
                    EMAIL
                  </label>
                  <span
                    className={`size-2 rounded-full transition-all ${
                      form.email.includes("@") && form.email.includes(".")
                        ? "bg-emerald-500 scale-125"
                        : "bg-neutral-300 group-focus-within:bg-[#f43f5e]"
                    }`}
                  />
                </div>
                <input
                  id="cs-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="eleanor@citizenshift.us"
                  className="w-full py-2.5 font-sans text-base sm:text-lg text-neutral-950 placeholder:text-neutral-300 bg-transparent border-b border-neutral-300 focus:outline-none transition-all"
                />
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-neutral-950 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
              </div>

              {/* Row 3: MESSAGE */}
              <div className="group relative">
                <div className="flex items-center justify-between pb-2">
                  <label
                    htmlFor="cs-message"
                    className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-neutral-400 group-focus-within:text-neutral-900 transition-colors font-bold"
                  >
                    MESSAGE / INQUIRY DETAILS
                  </label>
                  <span
                    className={`size-2 rounded-full transition-all ${
                      form.message.trim().length > 5
                        ? "bg-emerald-500 scale-125"
                        : "bg-neutral-300 group-focus-within:bg-[#f43f5e]"
                    }`}
                  />
                </div>
                <textarea
                  id="cs-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what legislation or civic data you're researching..."
                  className="w-full py-2.5 font-sans text-base sm:text-lg text-neutral-950 placeholder:text-neutral-300 bg-transparent border-b border-neutral-300 focus:outline-none transition-all resize-none"
                />
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-neutral-950 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
              </div>

              {/* Interactive Topic Tag Chips */}
              <div>
                <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-neutral-400 mb-3 font-semibold">
                  SELECT RESEARCH TOPICS:
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-3.5 py-1.5 rounded-full font-mono text-[11px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? "bg-neutral-900 text-white font-bold shadow-xs scale-102"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Centered Magnetic Pill SEND Button */}
              <div className="pt-6 flex justify-center">
                <motion.button
                  ref={sendBtnRef}
                  type="submit"
                  disabled={pending}
                  onMouseMove={handleBtnMouseMove}
                  onMouseLeave={handleBtnMouseLeave}
                  animate={{ x: btnOffset.x, y: btnOffset.y }}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                  className="relative group min-w-[200px] h-14 px-12 rounded-full bg-neutral-950 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.24em] hover:bg-neutral-900 active:scale-95 transition-colors shadow-lg shadow-neutral-900/20 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {/* Subtle specular sheen */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {pending ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin size-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>TRANSMITTING…</span>
                    </div>
                  ) : (
                    <span>SEND</span>
                  )}
                </motion.button>
              </div>
            </form>
          )}
        </div>

        {/* ========================================================
            PART 3: ARCHITECTURAL GREY NEWSLETTER BANNER WITH 3D ORB
           ======================================================== */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-[#989da7] text-white p-6 sm:p-10 md:p-12 mb-12 sm:mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Subtle noise / ambient shadow */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column: Label + Interactive 3D Sculpture */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-900 font-bold mb-4">
                CITIZENSHIFT DISPATCH:
              </p>

              {/* 3D Sculpture Viewport */}
              <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-white/10 to-black/20 border border-white/20 shadow-inner flex items-center justify-center">
                <FloatingOrbCanvas color="#ff3b75" />
                <span className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-widest text-neutral-900/60 pointer-events-none">
                  INTERACTIVE 3D SCULPTURE · DRAG TO ROTATE
                </span>
              </div>
            </div>

            {/* Right Column: Ruled Typography Headline + Inline Pill Input */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              {/* Ruled Headlines with Horizontal Lines Running Across */}
              <div className="space-y-3 sm:space-y-4">
                <div className="border-b border-neutral-700/40 pb-2">
                  <h3 className="font-sans font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-neutral-900 leading-tight">
                    PLAIN-LANGUAGE BILLS
                  </h3>
                </div>
                <div className="border-b border-neutral-700/40 pb-2">
                  <h3 className="font-sans font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-neutral-900 leading-tight">
                    STRAIGHT TO YOUR INBOX?
                  </h3>
                </div>
                <div className="border-b border-neutral-700/40 pb-2">
                  <h3 className="font-sans font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-neutral-900 leading-tight">
                    YES PLEASE!
                  </h3>
                </div>
              </div>

              {/* Interactive Newsletter Pill Subscription Input */}
              <form onSubmit={handleNewsletterSubmit} className="relative w-full max-w-lg">
                <div className="relative flex items-center rounded-full bg-white p-1.5 shadow-md">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL…"
                    className="w-full pl-5 pr-28 py-2.5 font-mono text-xs sm:text-sm text-neutral-950 placeholder:text-neutral-400 bg-transparent focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsletterPending}
                    className="absolute right-1.5 px-6 py-2.5 rounded-full bg-neutral-950 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    {newsletterPending ? "…" : newsletterSuccess ? "✓ ADDED" : "SEND"}
                  </button>
                </div>
                {newsletterSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 pl-4 font-mono text-xs text-neutral-950 font-bold"
                  >
                    ✓ You are now subscribed to the weekly CitizenShift legislative brief.
                  </motion.p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ========================================================
            PART 4: BRAND FOOTER GRID & DIRECT CHANNELS (WHITE BLOCK)
           ======================================================== */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 sm:p-10 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Brand Badge Stamp & Social Bar */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div>
                <a
                  href="#home"
                  className="inline-block self-start border-2 border-neutral-950 px-4 py-2 font-mono font-black text-base sm:text-lg tracking-widest text-neutral-950 hover:bg-neutral-950 hover:text-white transition-all shadow-sm"
                >
                  CITIZENSHIFT
                </a>

                <p className="mt-6 font-mono text-[11px] text-neutral-400 uppercase tracking-widest leading-relaxed">
                  NONPARTISAN 501(c)(3) PLATFORM FOR OPEN CIVIC TRACKING ACROSS ALL 50 STATES.
                </p>
              </div>

              {/* Quick Social Platforms Icon Bar */}
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3 font-semibold">
                  OFFICIAL SOCIAL PLATFORMS
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <a
                      key={platform.id}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${platform.name} · ${platform.handle}`}
                      className="size-10 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-white hover:border-neutral-950 hover:shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer group"
                    >
                      {platform.icon("size-4.5 transition-transform group-hover:scale-110")}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Ruled Directory Rows with Click-to-Copy */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight text-neutral-950 leading-tight">
                OPEN LEGISLATIVE DATA FOR ALL 50 STATES
              </h3>

              {/* Ruled Rows with Right Dots */}
              <div className="divide-y divide-neutral-200">
                {/* Phone */}
                <div
                  onClick={() => copyToClipboard(PHONE, "phone")}
                  className="group flex items-center justify-between py-4 cursor-pointer hover:translate-x-1.5 transition-transform"
                >
                  <span className="font-mono text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-neutral-950 transition-colors">
                    {PHONE}
                  </span>
                  <div className="flex items-center gap-2">
                    {copiedKey === "phone" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold">
                        COPIED! ✓
                      </span>
                    ) : (
                      <span className="size-2 rounded-full bg-neutral-900 group-hover:scale-150 transition-transform" />
                    )}
                  </div>
                </div>

                {/* Email */}
                <div
                  onClick={() => copyToClipboard(EMAIL, "email")}
                  className="group flex items-center justify-between py-4 cursor-pointer hover:translate-x-1.5 transition-transform"
                >
                  <span className="font-mono text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-neutral-950 transition-colors">
                    {EMAIL}
                  </span>
                  <div className="flex items-center gap-2">
                    {copiedKey === "email" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold">
                        COPIED! ✓
                      </span>
                    ) : (
                      <span className="size-2 rounded-full bg-neutral-900 group-hover:scale-150 transition-transform" />
                    )}
                  </div>
                </div>

                {/* Address */}
                <div
                  onClick={() => copyToClipboard(ADDRESS, "address")}
                  className="group flex items-center justify-between py-4 cursor-pointer hover:translate-x-1.5 transition-transform"
                >
                  <span className="font-mono text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-neutral-950 transition-colors">
                    {ADDRESS}
                  </span>
                  <div className="flex items-center gap-2">
                    {copiedKey === "address" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold">
                        COPIED! ✓
                      </span>
                    ) : (
                      <span className="size-2 rounded-full bg-neutral-900 group-hover:scale-150 transition-transform" />
                    )}
                  </div>
                </div>

                {/* Social Platforms Directory Rows */}
                {SOCIAL_PLATFORMS.map((platform) => (
                  <a
                    key={platform.id}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between py-4 cursor-pointer hover:translate-x-1.5 transition-transform"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-neutral-500 group-hover:text-neutral-950 transition-colors">
                        {platform.icon("size-4.5")}
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-neutral-950 transition-colors">
                        {platform.name} · {platform.handle}
                      </span>
                    </div>
                    <span className="size-2 rounded-full bg-neutral-900 group-hover:scale-150 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Credit */}
          <div className="mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-neutral-400">
            <span>© 2026 CITIZENSHIFT</span>
            <span>POWER TO THE PEOPLE · ARTICLE I RECORD</span>
          </div>
        </div>
      </div>
    </section>
  );
}
