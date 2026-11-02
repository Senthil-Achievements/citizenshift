/**
 * NotConfiguredNotice — rendered when Supabase environment variables are
 * absent, so a protected area shows an honest, readable explanation instead
 * of an unhandled 500 with a stack trace.
 *
 * It states exactly which variables are missing (names only — never values)
 * and points at `.env.example` and the configuration report. It never claims
 * the feature works, and never pretends a connection exists.
 */

import Link from "next/link";
import { AUTH_ROUTES } from "@/config/auth-routes";

export function NotConfiguredNotice({
  area,
  missing,
}: {
  /** Human name of the area, e.g. "Admin" or "Account". */
  area: string;
  /** Names of the missing environment variables (never values). */
  missing: string[];
}) {
  return (
    <div className="min-h-screen bg-icy-50">
      <header className="border-b hairline bg-paper">
        <div className="shell flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-navy">
            CitizenShift
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/45">
            {area}
          </span>
        </div>
      </header>

      <main className="shell py-16">
        <div className="max-w-xl border hairline bg-paper p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">
            503 — Not configured
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-navy">
            Supabase is not configured for this deployment.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">
            {area} cannot be shown because the application has no Supabase project
            to talk to. Nothing is cached or simulated — this page appears
            because the required environment variables are missing.
          </p>

          {missing.length > 0 && (
            <div className="mt-5 border hairline bg-icy-50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
                Missing
              </p>
              <ul className="mt-2 space-y-1 font-mono text-[12px] text-navy/80">
                {missing.map((name) => (
                  <li key={name}>• {name}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-5 text-sm leading-relaxed text-navy/70">
            To enable it, copy <code className="font-mono text-[12px]">.env.example</code> to{" "}
            <code className="font-mono text-[12px]">.env.local</code>, fill in the values, and
            restart the server. See{" "}
            <code className="font-mono text-[12px]">docs/supabase-configuration-report.md</code>{" "}
            if a project does not exist yet.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={AUTH_ROUTES.afterLogout}
              className="flex h-11 items-center rounded-full bg-navy px-6 text-sm font-semibold text-paper hover:bg-navy-600"
            >
              Back to CitizenShift
            </Link>
            <Link
              href={AUTH_ROUTES.login}
              className="flex h-11 items-center rounded-full border hairline px-6 text-sm font-semibold text-navy hover:border-navy/40"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
