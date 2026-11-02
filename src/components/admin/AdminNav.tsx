"use client";

/**
 * AdminNav — client nav for the admin area (needs usePathname for active state).
 * Contains no secrets and performs no data fetching.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_ROUTES } from "@/config/auth-routes";

const LINKS = [
  { href: AUTH_ROUTES.adminIntegrations, label: "Supabase" },
  { href: AUTH_ROUTES.adminCustomers, label: "Customers" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition ${
              active
                ? "bg-navy text-paper"
                : "border hairline bg-paper text-navy/70 hover:border-navy/40 hover:text-navy"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
