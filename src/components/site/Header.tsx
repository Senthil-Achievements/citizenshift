"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import JoinModal from "@/components/site/JoinModal";

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Explore Legislation", href: "#legislation" },
  { label: "Stories", href: "/testimonials" },
  { label: "About", href: "#about" },
  { label: "Donate", href: "#donate" },
  { label: "The Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinIntent, setJoinIntent] = useState<"join" | "signin" | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Detect whether the header currently floats over the dark hero.
  useEffect(() => {
    const hero = document.getElementById("home");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOverDark(entry.boundingClientRect.top < window.innerHeight * 0.6 && entry.isIntersecting),
      { rootMargin: "-10% 0px -88% 0px" },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [mounted]);

  // Lock scroll when the mobile menu is open (Lenis-aware)
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    window.__lenis?.stop();
    return () => {
      document.body.style.overflow = "";
      window.__lenis?.start();
    };
  }, [menuOpen]);

  const isHome = pathname === "/";
  const dark = isHome && overDark && !scrolled && !menuOpen;
  const darkBelow = pathname !== "/"; // never used in single-page deployment, future-proof

  void darkBelow;

  const linkTone = dark ? "text-paper/85 hover:text-paper" : "text-navy/80 hover:text-navy";

  const resolveNavHref = (href: string) => {
    if (pathname !== "/" && href.startsWith("#")) {
      return `/${href}`;
    }
    return href;
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] border-b transition-all duration-500 ${
          scrolled || menuOpen
            ? "border-transparent bg-paper/90 text-navy shadow-[0_1px_0_-0.5px_rgba(23,59,87,0.14)] backdrop-blur-md"
            : dark
              ? "border-transparent bg-transparent text-paper"
              : "border-transparent bg-transparent text-navy"
        }`}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          {/* wordmark */}
          <Link href={pathname === "/" ? "#home" : "/"} className="group flex items-center gap-2.5" aria-label="CitizenShift home">
            <span
              className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-full ring-1 transition-colors ${
                dark ? "ring-paper/30" : "ring-navy/20"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="" width={36} height={36} className="size-9" />
            </span>
            <span className="flex flex-col leading-none">
              <span className={`font-display text-[1.05rem] font-semibold tracking-tight ${dark ? "text-paper" : "text-navy"}`}>
                CitizenShift
              </span>
              <span className={`eyebrow mt-1 !text-[8px] ${dark ? "text-icy/60" : "text-navy/45"}`}>
                Bringing power to the people
              </span>
            </span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={resolveNavHref(item.href)}
                className={`text-[13px] font-medium transition-colors ${linkTone}`}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setJoinIntent("signin")}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
                dark
                  ? "border-paper/30 hover:border-paper hover:bg-paper hover:text-navy"
                  : "border-navy/25 hover:border-navy hover:bg-navy hover:text-icy"
              }`}
            >
              Sign In
            </button>
            <Link
              href={resolveNavHref("#donate")}
              className="-ml-3 rounded-full bg-berry px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-berry-600"
            >
              Donate
            </Link>
          </nav>

          {/* mobile trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setJoinIntent("signin")}
              className={`hidden rounded-full border px-3.5 py-2 text-xs font-semibold sm:block ${
                dark ? "border-paper/30 text-paper" : "border-navy/25 text-navy"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={`grid size-10 place-items-center rounded-full border transition-colors ${
                menuOpen || !dark ? "hairline text-navy" : "hairline-light text-paper"
              }`}
            >
              <span className="relative block h-3 w-4.5" aria-hidden="true">
                <span
                  className={`absolute left-1/2 top-0 h-px w-4 -translate-x-1/2 bg-current transition-transform duration-300 ${
                    menuOpen ? "translate-y-[5.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-1/2 bottom-0 h-px w-4 -translate-x-1/2 bg-current transition-transform duration-300 ${
                    menuOpen ? "-translate-y-[5.5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* fullscreen mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[75] bg-navy-900 text-paper lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grain pointer-events-none relative flex h-full flex-col overflow-hidden">
              <div className="shell pointer-events-auto flex flex-1 flex-col pt-16">
                <nav className="flex flex-1 flex-col justify-center" aria-label="Mobile">
                  {NAV.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={resolveNavHref(item.href)}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-baseline justify-between border-b border-icy/12 py-4"
                      >
                        <span className="font-display text-[clamp(1.75rem,7vw,2.75rem)] font-semibold leading-tight tracking-tight transition-colors group-hover:text-icy">
                          {item.label}
                        </span>
                        <span className="font-mono text-xs text-berry">0{NAV.indexOf(item) + 1}</span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col gap-3 pb-10"
                >
                  <Link
                    href={resolveNavHref("#donate")}
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 rounded-full bg-berry px-5 py-3.5 text-center font-semibold text-paper"
                  >
                    Donate
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setJoinIntent("signin");
                    }}
                    className="rounded-full border border-icy/25 px-5 py-3.5 text-center font-semibold text-icy"
                  >
                    Sign In
                  </button>
                  <p className="pt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-icy/50">
                    Nonpartisan · New York, NY · citizenshift.us
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <JoinModal open={joinIntent !== null} onClose={() => setJoinIntent(null)} intent={joinIntent ?? "join"} />
    </>
  );
}
