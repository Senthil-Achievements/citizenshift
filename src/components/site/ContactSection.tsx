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
      className={`absolute ${posClasses} z-20 pointer-events-none flex items-center justify-center text-berry/70 select-none`}
      aria-hidden="true"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-berry">
        <path d="M7.5 0V15M0 7.5H15" stroke="currentColor" strokeWidth="1.5" />
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

    setTimeout(() => {
      setPending(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <section
      id="contact"
      className="relative w-full bg-[#071120] py-20 sm:py-28 text-paper overflow-hidden scroll-mt-24 border-t hairline-light"
      aria-labelledby="contact-heading"
    >
      {/* Background Dot Matrix */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-berry/10 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Outer Frame with 4 Corner Crosshairs */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-[#0b1830] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.65)] overflow-visible">
          {/* 4 Corner Crosshairs */}
          <CornerCrosshair position="tl" />
          <CornerCrosshair position="tr" />
          <CornerCrosshair position="bl" />
          <CornerCrosshair position="br" />

          {/* Dual Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 rounded-2xl sm:rounded-3xl overflow-hidden">
            {/* ========================================================
                LEFT COLUMN: Information & CitizenShift Direct Channels
               ======================================================== */}
            <div className="p-8 sm:p-12 lg:p-14 lg:col-span-6 flex flex-col justify-between bg-gradient-to-b from-[#0c1a35] to-[#09152b]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-berry font-semibold mb-3">
                  04 / CONTACT · VERIFIED INBOX
                </p>
                <h2
                  id="contact-heading"
                  className="font-display text-3xl sm:text-4xl md:text-[44px] font-semibold tracking-[-0.02em] text-paper leading-[1.05]"
                >
                  Get in touch
                </h2>
                <p className="mt-4 font-sans text-sm sm:text-[15px] leading-relaxed text-icy/75 max-w-md">
                  If you have questions regarding CitizenShift, legislation tracking, press, or civic partnerships, please fill out the form here. We do our best to respond within 1 business day.
                </p>
              </div>

              {/* 3 Contact Info Cards */}
              <div className="mt-10 sm:mt-12 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email Card */}
                  <a
                    href={`mailto:${EMAIL}?subject=${encodeURIComponent("CitizenShift Inquiry")}`}
                    className="flex items-center gap-3.5 rounded-xl bg-white/5 border border-white/10 p-4 hover:border-berry/50 hover:bg-white/8 transition-all group shadow-sm"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-berry/20 text-berry border border-berry/30 group-hover:bg-berry group-hover:text-paper transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-icy/60 font-semibold">Email</p>
                      <p className="text-xs font-mono text-paper truncate group-hover:text-white transition">
                        {EMAIL}
                      </p>
                    </div>
                  </a>

                  {/* Phone Card */}
                  <a
                    href={`tel:${PHONE.replace(/\s+/g, "")}`}
                    className="flex items-center gap-3.5 rounded-xl bg-white/5 border border-white/10 p-4 hover:border-berry/50 hover:bg-white/8 transition-all group shadow-sm"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-berry/20 text-berry border border-berry/30 group-hover:bg-berry group-hover:text-paper transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-icy/60 font-semibold">Phone</p>
                      <p className="text-xs font-mono text-paper truncate group-hover:text-white transition">
                        {PHONE}
                      </p>
                    </div>
                  </a>
                </div>

                {/* Address Card */}
                <div className="flex items-center gap-3.5 rounded-xl bg-white/5 border border-white/10 p-4 max-w-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-navy-800 text-icy border border-white/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-icy/60 font-semibold">Address</p>
                    <p className="text-xs font-sans text-paper">
                      {ADDRESS} · <span className="text-icy/50 font-mono text-[10px]">Nonpartisan 501(c)(3)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                RIGHT COLUMN: Form adapted to CitizenShift
               ======================================================== */}
            <div className="p-8 sm:p-12 lg:p-14 lg:col-span-6 bg-[#09152b]/95 flex flex-col justify-center">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-berry/20 border border-berry/40 text-berry mx-auto flex items-center justify-center text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-paper">Message received</h3>
                  <p className="font-sans text-sm text-icy/80 max-w-sm mx-auto leading-relaxed">
                    Thank you, {form.name}. Our team has received your message and will respond from our verified inbox within 1 business day.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", message: "" });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono uppercase tracking-wider text-paper transition border border-white/15"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {error && (
                    <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-2.5 text-xs font-medium text-rose-200">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-mono uppercase tracking-[0.16em] text-icy/70 mb-1.5 font-semibold">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full h-11 px-4 text-sm rounded-xl border border-white/15 bg-navy-950/70 text-paper placeholder:text-icy/30 focus:border-berry focus:outline-none focus:ring-2 focus:ring-berry/20 transition font-sans"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-mono uppercase tracking-[0.16em] text-icy/70 mb-1.5 font-semibold">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full h-11 px-4 text-sm rounded-xl border border-white/15 bg-navy-950/70 text-paper placeholder:text-icy/30 focus:border-berry focus:outline-none focus:ring-2 focus:ring-berry/20 transition font-sans"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-mono uppercase tracking-[0.16em] text-icy/70 mb-1.5 font-semibold">
                      Phone
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-11 px-4 text-sm rounded-xl border border-white/15 bg-navy-950/70 text-paper placeholder:text-icy/30 focus:border-berry focus:outline-none focus:ring-2 focus:ring-berry/20 transition font-sans"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-mono uppercase tracking-[0.16em] text-icy/70 mb-1.5 font-semibold">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can CitizenShift assist with your civic research or questions?"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-white/15 bg-navy-950/70 text-paper placeholder:text-icy/30 focus:border-berry focus:outline-none focus:ring-2 focus:ring-berry/20 transition resize-none font-sans"
                    />
                  </div>

                  {/* CitizenShift Signature Berry Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="w-full h-12 rounded-xl bg-berry hover:bg-berry-600 active:scale-[0.99] text-paper font-semibold text-sm tracking-wide shadow-lg shadow-berry/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {pending ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-paper" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Sending…</span>
                        </>
                      ) : (
                        <span>Submit</span>
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
