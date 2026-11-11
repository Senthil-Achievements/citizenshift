import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#060913] text-[#f1f8fd] flex flex-col justify-between selection:bg-[#f43f5e] selection:text-white">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15)_0%,transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-1/4 size-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,transparent_70%)]"
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
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
            Error 404 · Page Not Found
          </span>
        </div>
      </header>

      {/* Center content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-20 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-rose-400 font-mono text-[11px] uppercase tracking-widest">
            <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>Civic Record · Missing Entry</span>
          </div>

          <h1 className="font-display text-7xl sm:text-9xl font-black tracking-tight text-white">
            4<span className="text-rose-500">0</span>4
          </h1>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            The page you requested does not exist.
          </h2>

          <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
            The bill, file, or civic path you are looking for may have been moved, updated, or does not exist in the public record.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-navy font-semibold text-xs uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all shadow-md"
            >
              <span>← Return Home</span>
            </Link>
            <Link
              href="/#legislation"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/20 bg-white/5 text-white font-mono text-xs uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all"
            >
              <span>Explore Public Bills →</span>
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

