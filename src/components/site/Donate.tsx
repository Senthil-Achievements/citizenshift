"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface DonorStory {
  id: string;
  name: string;
  role: string;
  location: string;
  amount: string;
  frequency: string;
  badge: string;
  avatarText: string;
  avatarBg: string;
  accentColor: string;
  quote: string;
}

const DONOR_TESTIMONIALS: DonorStory[] = [
  {
    id: "donor-1",
    name: "Sarah Jenkins",
    role: "Public High School Civics Teacher",
    location: "Columbus, Ohio",
    amount: "$25",
    frequency: "Monthly",
    badge: "Monthly Champion",
    avatarText: "SJ",
    avatarBg: "bg-gradient-to-br from-rose-500 to-rose-700",
    accentColor: "#f43f5e",
    quote:
      "I give $25 every month because state legislatures shouldn't be a black box. CitizenShift alerted our local community to a water-rights bill before lobbyists could slip it through. That transparency is worth every single penny.",
  },
  {
    id: "donor-2",
    name: "Marcus Vance",
    role: "Small Business Owner",
    location: "Tampa, Florida",
    amount: "$100",
    frequency: "Supporter",
    badge: "Verified Donor",
    avatarText: "MV",
    avatarBg: "bg-gradient-to-br from-sky-500 to-blue-700",
    accentColor: "#38bdf8",
    quote:
      "Special interest PACs spend millions to keep everyday citizens confused and disengaged. Donating to CitizenShift is the most direct investment I can make in real democratic accountability. Honest facts without partisan spin.",
  },
  {
    id: "donor-3",
    name: "David R. Campbell",
    role: "USMC Veteran & Community Volunteer",
    location: "Harrisburg, Pennsylvania",
    amount: "$10",
    frequency: "Monthly",
    badge: "Monthly Champion",
    avatarText: "DC",
    avatarBg: "bg-gradient-to-br from-amber-500 to-amber-700",
    accentColor: "#fbbf24",
    quote:
      "As a veteran on a fixed income, I give what I can because our kids and grandchildren deserve to know what laws are being passed in their names. CitizenShift works strictly for the American people, not the highest bidder.",
  },
  {
    id: "donor-4",
    name: "Aisha Morales",
    role: "Community Healthcare Advocate",
    location: "San Antonio, Texas",
    amount: "$50",
    frequency: "Monthly",
    badge: "Verified Donor",
    avatarText: "AM",
    avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-700",
    accentColor: "#10b981",
    quote:
      "CitizenShift takes zero corporate lobbyist money. That integrity is why our family supports them. Their plain-language summaries gave our senior coalition the power to demand answers on prescription pricing legislation.",
  },
];

const RECENT_DONATIONS = [
  "New $50 contribution from Austin, TX",
  "New $25 monthly pledge from Detroit, MI",
  "New $100 contribution from Seattle, WA",
  "New $10 monthly pledge from Philadelphia, PA",
  "New $250 contribution from Denver, CO",
];

export default function Donate() {
  const [amount, setAmount] = useState<string>("100");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showActBlueModal, setShowActBlueModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const numAmount = parseFloat(amount) || 0;

  // Gentle live donation ticker cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % RECENT_DONATIONS.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const actBlueUrl = new URL("https://secure.actblue.com/donate/citizenshift-1");
    if (numAmount > 0) {
      actBlueUrl.searchParams.set("amount", String(numAmount));
    }

    try {
      window.open(actBlueUrl.toString(), "_blank", "noopener,noreferrer");
    } catch {
      // Fallback handled by the UI
    }
  };

  return (
    <section
      id="donate"
      className="relative w-full overflow-hidden bg-[#0a0c10] text-white py-14 sm:py-20 lg:py-24 select-none"
      aria-labelledby="donate-heading"
    >
      {/* Background Animated Atmosphere Glows */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.08, 0.16, 0.08],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-40 -left-40 size-[600px] rounded-full bg-rose-600/20 blur-[140px] transform-gpu will-change-transform"
        aria-hidden="true"
      />
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.06, 0.14, 0.06],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute -bottom-40 -right-40 size-[650px] rounded-full bg-sky-600/15 blur-[150px] transform-gpu will-change-transform"
        aria-hidden="true"
      />

      {/* Top Banner Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full bg-[#18100d]/90 border-b border-amber-900/40 px-4 sm:px-8 py-2.5 flex items-center justify-between text-[11px] sm:text-xs font-mono tracking-wider text-amber-200/80"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            CHARITY & CIVIC DEFENSE
          </span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span className="hidden sm:inline text-white/70">
            501(c)(3) Nonpartisan Public Mission
          </span>
        </div>
        <div className="text-white/80 font-sans tracking-normal font-medium flex items-center gap-2">
          <span>You can make a difference · Bringing power to the people</span>
        </div>
      </motion.div>

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* ========================================================
            PART 1: Emotional Impact Hero Frame with Floating Donate Form
           ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] min-h-[660px] sm:min-h-[720px] flex flex-col justify-between"
        >
          {/* Ambient Breathing Background Image */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.035, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full"
            >
              <Image
                src="/images/donation-child.png"
                alt="Give a helping hand to those who need it — CitizenShift civic advocacy"
                fill
                priority
                className="object-cover object-center filter contrast-[1.08] brightness-[0.92]"
              />
            </motion.div>

            {/* Gradient Overlays for Readability & Depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/90 sm:to-black/85" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/80" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0a0c10] to-transparent" />
          </div>

          {/* Grid Content */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-14 items-center min-h-[660px] sm:min-h-[720px]">
            {/* LEFT: Emotional Marketing Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 flex flex-col justify-center text-left"
            >
              {/* Pulsing Beacon Badge */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-mono uppercase tracking-widest w-fit mb-5 shadow-sm"
              >
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-rose-500" />
                </span>
                <span>Defend Those Without a Lobbyist</span>
              </motion.div>

              {/* Big Impact Headline */}
              <h2
                id="donate-heading"
                className="font-display font-black text-3xl sm:text-5xl lg:text-[56px] leading-[1.02] tracking-tight text-white uppercase drop-shadow-md"
              >
                GIVE A HELPING HAND <br />
                TO THOSE WHO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-300 to-amber-200">
                  NEED IT MOST
                </span>
              </h2>

              <p className="mt-4 font-display text-xl sm:text-2xl text-white/95 font-semibold tracking-wide uppercase">
                SHARE YOUR POWER WITH THEM!
              </p>

              {/* Emotional Subtext */}
              <p className="mt-5 text-sm sm:text-base text-white/80 leading-relaxed max-w-xl font-sans drop-shadow-sm">
                Every month, thousands of legislative bills are decided behind closed doors—laws
                governing healthcare, public education, clean water, and worker safety. When everyday
                families are kept in the dark, they pay the heaviest price.
                <br />
                <span className="text-white font-medium mt-2 block">
                  Your donation ensures that civic intelligence remains free, transparent, and
                  within reach of every American.
                </span>
              </p>

              {/* Key Trust & Impact Metrics with Interactive Lifts */}
              <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg pt-6 border-t border-white/15">
                {[
                  { value: "100%", label: "Public Mission", color: "text-rose-400" },
                  { value: "50 States", label: "Open Records", color: "text-amber-300" },
                  { value: "$0", label: "Corporate Bias", color: "text-emerald-400" },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4, backgroundColor: "rgba(0,0,0,0.6)" }}
                    transition={{ duration: 0.2 }}
                    className="bg-black/40 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 text-center sm:text-left shadow-sm transition-colors cursor-default"
                  >
                    <p className={`font-mono text-lg sm:text-2xl font-bold ${metric.color}`}>
                      {metric.value}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider font-mono">
                      {metric.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* View Official ActBlue Preview Modal Button & Live Ticker */}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowActBlueModal(true)}
                  className="inline-flex items-center gap-2 text-xs font-mono text-white/75 hover:text-white transition-colors underline underline-offset-4"
                >
                  <svg className="size-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Review official ActBlue donation details</span>
                </button>

                {/* Animated Recent Donation Ticker */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-[11px] font-mono text-white/70 overflow-hidden">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={tickerIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="text-white/90 truncate max-w-[240px]"
                    >
                      {RECENT_DONATIONS[tickerIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Floating Donate Form Card with Gentle Float & Shimmer */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 w-full"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-2xl bg-[#130f0d]/95 sm:bg-[#15110e]/95 backdrop-blur-md border border-white/20 p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
              >
                {/* Card Top Animated Gradient Glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 rounded-t-2xl" />

                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleSubmit}
                      className="space-y-3.5"
                    >
                      {/* Form Header */}
                      <div className="border-b border-white/10 pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide uppercase">
                            DONATE NOW
                          </h3>
                          <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-rose-950/80 border border-rose-700/50 text-rose-300 font-semibold shadow-xs">
                            ActBlue Verified
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/75 font-sans leading-relaxed">
                          Your tax-deductible gift keeps legislation open and readable for every citizen.
                        </p>
                      </div>

                      {/* Donor Information & Contribution Amount Inputs */}
                      <div className="space-y-3 pt-1">
                        {/* First Name & Last Name */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="FIRST NAME"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full h-10 px-3.5 rounded bg-white text-zinc-900 placeholder-zinc-400 text-xs font-mono uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner transition-shadow"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="LAST NAME"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full h-10 px-3.5 rounded bg-white text-zinc-900 placeholder-zinc-400 text-xs font-mono uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner transition-shadow"
                            />
                          </div>
                        </div>

                        {/* Amount Field */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1 flex items-center justify-between">
                            <span>Amount ($ USD)</span>
                            <span className="text-[10px] text-amber-300 font-normal">100% Tax Deductible</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-zinc-500 font-mono text-sm font-bold">
                              $
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              required
                              placeholder="AMOUNT"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full h-10 pl-8 pr-3.5 rounded bg-white text-zinc-900 placeholder-zinc-400 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner transition-shadow"
                            />
                          </div>
                        </div>

                        {/* Email Address */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="EMAIL ADDRESS"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-10 px-3.5 rounded bg-white text-zinc-900 placeholder-zinc-400 text-xs font-mono uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner transition-shadow"
                          />
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">
                            Phone Number (Optional)
                          </label>
                          <input
                            type="tel"
                            placeholder="PHONE NUMBER"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full h-10 px-3.5 rounded bg-white text-zinc-900 placeholder-zinc-400 text-xs font-mono uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner transition-shadow"
                          />
                        </div>
                      </div>

                      {/* Animated Shimmer Submit Button */}
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative w-full h-12 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 border border-red-500 text-white font-mono font-black text-sm uppercase tracking-widest shadow-[0_5px_22px_rgba(225,29,72,0.65)] hover:shadow-[0_8px_28px_rgba(225,29,72,0.85)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 overflow-hidden"
                      >
                        {/* Shimmer sweep effect */}
                        <motion.div
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", repeatDelay: 2 }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        />

                        <span className="relative z-10">
                          DONATE {numAmount > 0 ? `$${numAmount}` : "NOW"}
                        </span>
                        <svg
                          className="size-4 relative z-10 transition-transform group-hover:translate-x-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </motion.button>

                      {/* Footer security badge */}
                      <p className="text-center text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center justify-center gap-1.5 pt-1">
                        <svg className="size-3 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                        <span>Encrypted Checkout via ActBlue Express</span>
                      </p>
                    </motion.form>
                  ) : (
                    /* Celebratory Success State */
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="py-6 text-center space-y-4"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="size-16 rounded-full bg-rose-600/30 border-2 border-rose-500 mx-auto flex items-center justify-center text-rose-400 shadow-[0_0_35px_rgba(225,29,72,0.7)]"
                      >
                        <svg className="size-8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                        </svg>
                      </motion.div>

                      <div>
                        <h4 className="font-display font-black text-2xl text-white uppercase">
                          THANK YOU, {firstName || "CITIZEN"}!
                        </h4>
                        <p className="mt-1 text-xs text-rose-300 font-mono">
                          You just stepped up for everyday Americans.
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/15 bg-black/50 p-4 text-left space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60">Pledged Contribution:</span>
                          <span className="font-mono font-bold text-amber-300">
                            ${numAmount > 0 ? numAmount : "Your choice"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60">Advocacy Impact:</span>
                          <span className="text-white font-medium text-right text-[11px] max-w-[200px]">
                            Empowers everyday citizens with plain-English legislative accountability
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-white/80 leading-relaxed font-sans px-2">
                        We have opened your secure checkout on{" "}
                        <strong className="text-white">ActBlue</strong> to complete processing. If your
                        browser blocked the popup, click below:
                      </p>

                      <div className="space-y-2 pt-2">
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={`https://secure.actblue.com/donate/citizenshift-1${numAmount > 0 ? `?amount=${numAmount}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                        >
                          <span>Complete on ActBlue Securely</span>
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </motion.a>

                        <button
                          type="button"
                          onClick={() => setIsSubmitted(false)}
                          className="text-xs text-white/50 hover:text-white transition-colors underline underline-offset-4"
                        >
                          Modify donation details
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* ========================================================
            PART 2: ANIMATED DONOR TESTIMONIALS
           ======================================================== */}
        <div className="relative mt-16 sm:mt-24 pt-12 border-t border-white/10">
          {/* Floating Chromatic Ambient Orbs (Matching User's Aesthetic Sketch) */}
          <div className="pointer-events-none absolute left-1/2 -top-16 -translate-x-1/2 w-full max-w-4xl h-52 overflow-hidden z-0">
            <motion.div
              animate={{
                x: [-18, 18, -18],
                y: [0, -14, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[30%] -top-10 size-48 rounded-full bg-indigo-600/25 blur-[65px] transform-gpu will-change-transform"
              aria-hidden="true"
            />
            <motion.div
              animate={{
                x: [18, -18, 18],
                y: [-12, 10, -12],
                scale: [1.06, 0.94, 1.06],
              }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute left-[45%] -top-16 size-56 rounded-full bg-rose-500/25 blur-[75px] transform-gpu will-change-transform"
              aria-hidden="true"
            />
            <motion.div
              animate={{
                x: [-14, 14, -14],
                y: [10, -10, 10],
                scale: [0.94, 1.1, 0.94],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute left-[58%] -top-6 size-44 rounded-full bg-teal-400/20 blur-[60px] transform-gpu will-change-transform"
              aria-hidden="true"
            />
          </div>

          <div className="relative z-10 text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.22em] text-rose-300 backdrop-blur-md shadow-xs mb-4"
            >
              <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
              VOICES OF IMPACT · 2,840+ GRASSROOTS DONORS
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="font-display font-bold text-2xl sm:text-4xl lg:text-[2.6rem] text-white tracking-tight leading-tight"
            >
              Why Americans choose to{" "}
              <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-amber-200 bg-clip-text text-transparent italic font-serif">
                support CitizenShift
              </span>
              .
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.16 }}
              className="mt-3.5 text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed font-sans"
            >
              No corporate PACs. No dark money. Sustained by everyday teachers, veterans, workers,
              and parents across all 50 states who believe legislation belongs to the people.
            </motion.p>
          </div>

          {/* Staggered Animated Testimonial Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {DONOR_TESTIMONIALS.map((story, idx) => {
              const isMonthly = story.badge.toLowerCase().includes("champion");
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.65,
                    delay: idx * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.025,
                    transition: { duration: 0.25, ease: "easeOut" },
                  }}
                  onMouseEnter={() => setHoveredCard(story.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`relative rounded-2xl bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-white/[0.01] backdrop-blur-xl border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl transition-all duration-300 cursor-default group overflow-hidden ${
                    hoveredCard === story.id
                      ? "border-rose-400/40 shadow-[0_20px_45px_-10px_rgba(225,29,72,0.22)]"
                      : "hover:border-white/20"
                  }`}
                >
                  {/* Top Specular Sheen */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  {/* Background Quotation Watermark Accent */}
                  <div
                    className="pointer-events-none absolute -bottom-4 -right-2 text-7xl font-serif font-black select-none opacity-[0.04] group-hover:opacity-[0.09] group-hover:scale-110 transition-all duration-300 text-white"
                    aria-hidden="true"
                  >
                    “
                  </div>

                  <div>
                    {/* Top Header: Badge & Star Rating */}
                    <div className="flex items-center justify-between mb-4">
                      {isMonthly ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-200 font-semibold tracking-wider shadow-2xs">
                          <svg className="size-2.5 text-rose-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {story.badge}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 font-semibold tracking-wider shadow-2xs">
                          <svg className="size-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {story.badge}
                        </span>
                      )}

                      <div className="flex items-center gap-0.5 text-amber-300 text-xs drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" aria-label="5 stars">
                        {[...Array(5)].map((_, starIdx) => (
                          <motion.span
                            key={starIdx}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.25 + idx * 0.08 + starIdx * 0.04 }}
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* Donor Quote */}
                    <p className="text-xs sm:text-[13px] leading-relaxed text-white/90 font-sans italic group-hover:text-white transition-colors">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                  </div>

                  {/* Donor Signature & Contribution Details */}
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`size-9 rounded-full ${story.avatarBg} text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 ring-2 ring-white/15 group-hover:ring-white/40 group-hover:scale-105 transition-all shadow-md`}
                      >
                        {story.avatarText}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{story.name}</p>
                        <p className="text-[10px] text-white/55 leading-tight mt-0.5">{story.location}</p>
                      </div>
                    </div>

                    <div className="text-right rounded-lg px-2.5 py-1 bg-white/[0.04] border border-white/5">
                      <span
                        style={{ color: story.accentColor }}
                        className="text-xs font-mono font-bold block leading-tight drop-shadow-xs"
                      >
                        {story.amount}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-white/45 block leading-tight mt-0.5">
                        {story.frequency}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          OFFICIAL ACTBLUE MODAL PREVIEW (matching Image 2)
         ======================================================== */}
      <AnimatePresence>
        {showActBlueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl rounded-2xl bg-white text-navy-950 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowActBlueModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                aria-label="Close"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* CitizenShift Logo Header (from Image 2) */}
              <div className="text-center pb-6 border-b border-zinc-200">
                <div className="relative w-56 h-16 mx-auto mb-2">
                  <Image
                    src="/brand/logo.png"
                    alt="CitizenShift — Bringing Power to the People"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                  Official ActBlue Public Initiative · secure.actblue.com/donate/citizenshift-1
                </p>
              </div>

              {/* Mission Narrative (Image 2 text) */}
              <div className="py-6 space-y-4">
                <h3 className="font-display font-bold text-2xl text-navy">
                  Donate to Support CitizenShift
                </h3>
                <p className="text-sm leading-relaxed text-zinc-700">
                  Congress passes thousands of bills a year, most written to be skimmed past, not
                  understood. CitizenShift closes that gap, turning legislation into plain-English
                  summaries and putting your legislator&apos;s inbox a few taps away. Every gift keeps
                  that access free. Chip in today to help keep legislation understandable and action
                  just a click away for every American.
                </p>

                <div className="pt-4 border-t border-zinc-200">
                  <p className="font-mono text-xs uppercase font-bold text-zinc-800 mb-2">
                    Your contribution benefits:
                  </p>
                  <ul className="space-y-1.5 text-xs text-zinc-600">
                    <li className="flex items-center gap-2">
                      <span className="text-rose-600">✓</span> 100% free public access to verified bill analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-600">✓</span> One-tap direct representative email dispatch
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-600">✓</span> Real-time LegiScan synchronization across 50 state legislatures
                    </li>
                  </ul>
                </div>
              </div>

              {/* Direct Link Action */}
              <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://secure.actblue.com/donate/citizenshift-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-navy hover:bg-navy-900 text-white font-mono font-bold text-xs uppercase tracking-wider text-center transition-all shadow-md"
                >
                  Open ActBlue Portal ↗
                </motion.a>
                <button
                  type="button"
                  onClick={() => setShowActBlueModal(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Return to page
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
