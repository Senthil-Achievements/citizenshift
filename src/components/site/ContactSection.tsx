"use client";

import React, { useState } from "react";

const EMAIL = "erin.chouinard@citizenshift.us";
const PHONE = "+1 (212) 555-0199";
const ADDRESS = "New York, NY";

function CornerCrosshair({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const posClasses = {
    tl: "-top-2.5 -left-2.5",
    tr: "-top-2.5 -right-2.5",
    bl: "-bottom-2.5 -left-2.5",
    br: "-bottom-2.5 -right-2.5",
  }[position];

  return (
    <div
      className={`absolute ${posClasses} z-20 pointer-events-none flex items-center justify-center text-zinc-400 select-none`}
      aria-hidden="true"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-zinc-400">
        <path d="M7.5 0V15M0 7.5H15" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    </div>
  );
}

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setError("Please write a short message.");
      return;
    }

    setPending(true);

    // Simulate submission / send
    setTimeout(() => {
      setPending(false);
      setSubmitted(true);
    }, 700);
  };

  return (
    <section id="contact" className="relative w-full bg-[#08090b] py-20 sm:py-28 text-white overflow-hidden scroll-mt-24">
      {/* Subtle background ambient grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* The Outer Frame with 4 Corner Crosshairs */}
        <div className="relative rounded-2xl bg-[#121316] border border-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
          {/* Corner Crosshairs */}
          <CornerCrosshair position="tl" />
          <CornerCrosshair position="tr" />
          <CornerCrosshair position="bl" />
          <CornerCrosshair position="br" />

          {/* Dual Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
            {/* ========================================================
                LEFT COLUMN: Information & Direct Channels
               ======================================================== */}
            <div className="p-8 sm:p-12 lg:p-14 lg:col-span-6 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-[44px] font-bold tracking-tight text-white leading-tight font-sans">
                  Get in touch
                </h2>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-md">
                  If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.
                </p>
              </div>

              {/* 3 Contact Info Cards */}
              <div className="mt-10 sm:mt-12 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email Card */}
                  <a
                    href={`mailto:${EMAIL}?subject=${encodeURIComponent("CitizenShift Inquiry")}`}
                    className="flex items-center gap-3.5 rounded-xl bg-[#18191d] border border-white/5 p-4 hover:border-white/15 transition group"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300 group-hover:text-white transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">Email</p>
                      <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-200 transition">
                        {EMAIL}
                      </p>
                    </div>
                  </a>

                  {/* Phone Card */}
                  <a
                    href={`tel:${PHONE.replace(/\s+/g, "")}`}
                    className="flex items-center gap-3.5 rounded-xl bg-[#18191d] border border-white/5 p-4 hover:border-white/15 transition group"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300 group-hover:text-white transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">Phone</p>
                      <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-200 transition">
                        {PHONE}
                      </p>
                    </div>
                  </a>
                </div>

                {/* Address Card */}
                <div className="flex items-center gap-3.5 rounded-xl bg-[#18191d] border border-white/5 p-4 max-w-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Address</p>
                    <p className="text-xs text-zinc-400">
                      {ADDRESS}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                RIGHT COLUMN: Modern Dark Form
               ======================================================== */}
            <div className="p-8 sm:p-12 lg:p-14 lg:col-span-6 bg-[#121316] flex flex-col justify-center">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center text-2xl">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold text-white">Message received!</h3>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Thank you, {form.name}. Our team will review your message and respond within 1 business day.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", message: "" });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {error && (
                    <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs sm:text-sm font-medium text-white mb-1.5">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder=""
                      className="w-full h-11 px-4 text-sm rounded-xl border border-zinc-800 bg-[#0c0d0f] text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs sm:text-sm font-medium text-white mb-1.5">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder=""
                      className="w-full h-11 px-4 text-sm rounded-xl border border-zinc-800 bg-[#0c0d0f] text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs sm:text-sm font-medium text-white mb-1.5">
                      Phone
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder=""
                      className="w-full h-11 px-4 text-sm rounded-xl border border-zinc-800 bg-[#0c0d0f] text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-xs sm:text-sm font-medium text-white mb-1.5">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder=""
                      className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-800 bg-[#0c0d0f] text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="w-full h-12 rounded-xl bg-zinc-200 hover:bg-white active:scale-[0.99] text-zinc-950 font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {pending ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Sending…</span>
                        </>
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
