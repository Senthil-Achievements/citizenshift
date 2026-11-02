/**
 * PendingAccountPage — honest placeholder for account sections that ship in a
 * later milestone.
 *
 * Deliberately renders NO fake members, conversations, votes or saved bills.
 * It states what is missing and why, and links back to something that works.
 */

import Link from "next/link";
import { AUTH_ROUTES } from "@/config/auth-routes";

export function PendingAccountPage({
  title,
  eyebrow,
  description,
  comingFrom,
}: {
  title: string;
  eyebrow: string;
  description: string;
  comingFrom: string;
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-berry">{eyebrow}</p>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-semibold leading-tight tracking-[-0.02em] text-navy">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/70">{description}</p>
      </header>

      <section className="border hairline bg-paper p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
          Pending — not yet available
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy/75">
          This section ships with a later milestone. Nothing is shown here because no real
          records exist yet — we don't display sample members, conversations, votes or saved
          bills as if they were yours.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy/75">
          Expected in: <strong className="font-semibold text-navy">{comingFrom}</strong>.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={AUTH_ROUTES.profile}
            className="flex h-11 items-center rounded-full bg-navy px-6 text-sm font-semibold text-paper hover:bg-navy-600"
          >
            Your profile
          </Link>
          <Link
            href="/#legislation"
            className="flex h-11 items-center rounded-full border hairline px-6 text-sm font-semibold text-navy hover:border-navy/40"
          >
            Explore legislation
          </Link>
        </div>
      </section>
    </div>
  );
}
