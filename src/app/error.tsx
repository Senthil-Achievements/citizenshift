"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side errors safely without exposing secrets
    console.error("CitizenShift application error:", error?.message);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-[#060913] text-[#f1f8fd] flex flex-col justify-between selection:bg-[#f43f5e] selection:text-white">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      {/* Top minimal header */}
      <header className="relative z-10 border-b border-white/10 px-6 py-4 sm:px-12">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="" width={32} height={32} className="size-8" />
            <span className="font-display text-lg font-bold text-white tracking-tight">
              CitizenShift
            </span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400">
            System Notice
          </span>
        </div>
      </header>

      {/* Center content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-20 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] uppercase tracking-widest">
            <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Service Temporarily Interrupted</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Something unexpected occurred.
          </h1>

          <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
            The application encountered a transient issue while reading the record. Your data and session remain secure.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-navy font-semibold text-xs uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span>Try Again ↻</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/20 bg-white/5 text-white font-mono text-xs uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all"
            >
              <span>← Return Home</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-4 text-center text-xs font-mono text-white/40">
        © {new Date().getFullYear()} CitizenShift · Independent Nonpartisan Platform · New York, NY
      </footer>
    </div>
  );
}

