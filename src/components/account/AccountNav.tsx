"use client";

/**
 * AccountNav — client nav for the signed-in area (needs usePathname).
 * No data fetching, no secrets.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_ROUTES } from "@/config/auth-routes";

const LINKS = [
  { href: AUTH_ROUTES.saved, label: "Saved" },
  { href: AUTH_ROUTES.community, label: "Community" },
  { href: AUTH_ROUTES.messages, label: "Messages" },
  { href: AUTH_ROUTES.profile, label: "Profile" },
  { href: AUTH_ROUTES.settings, label: "Settings" },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto pb-1">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition ${
              active
                ? "bg-navy text-paper"
                : "border hairline bg-paper text-navy/70 hover:border-navy/40 hover:text-navy"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
