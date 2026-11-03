"use client";

/**
 * AdminNav — client nav for the admin area (needs usePathname for active state).
 * Contains no secrets and performs no data fetching; the role is passed in from
 * the server layout, which has already verified the principal.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_ROUTES } from "@/config/auth-routes";

const LINKS = [
  { href: AUTH_ROUTES.adminDashboard, label: "Dashboard", adminOnly: false },
  { href: AUTH_ROUTES.adminLegislation, label: "Legislation", adminOnly: false },
  { href: AUTH_ROUTES.adminSponsors, label: "Sponsors", adminOnly: false },
  { href: AUTH_ROUTES.adminCategories, label: "Categories", adminOnly: false },
  { href: AUTH_ROUTES.adminLinks, label: "Links", adminOnly: false },
  { href: AUTH_ROUTES.adminPages, label: "Pages", adminOnly: false },
  { href: AUTH_ROUTES.adminCommunity, label: "Community", adminOnly: false },
  { href: AUTH_ROUTES.adminAudit, label: "Audit log", adminOnly: false },
  { href: AUTH_ROUTES.adminUsers, label: "Users", adminOnly: true },
  { href: AUTH_ROUTES.adminSettings, label: "Settings", adminOnly: true },
  { href: AUTH_ROUTES.adminCustomers, label: "Customers", adminOnly: true },
  { href: AUTH_ROUTES.adminIntegrations, label: "Supabase", adminOnly: true },
] as const;

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-2">
      {LINKS.filter((link) => isAdmin || !link.adminOnly).map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(`${link.href}/`)) ||
          (link.href === "/admin" && pathname === "/admin");
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
