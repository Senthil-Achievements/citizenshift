/**
 * /account layout — requires a verified session for the whole account area.
 *
 * Authorization uses `verifySession()` (getClaims + getUser against the Auth
 * server), never `getSession()` alone. Signed-out visitors are redirected to
 * login with a sanitised `next` so they land back here after signing in.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/supabase/server";
import { SupabaseConfigurationError } from "@/lib/supabase/env";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";
import { AccountNav } from "@/components/account/AccountNav";
import { SignOutButton } from "@/components/account/SignOutButton";
import { NotConfiguredNotice } from "@/components/NotConfiguredNotice";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    ({ user } = await verifySession());
  } catch (err) {
    // Unconfigured deployment → honest notice rather than an unhandled 500.
    if (err instanceof SupabaseConfigurationError) {
      return <NotConfiguredNotice area="Account" missing={err.missing} />;
    }
    throw err;
  }

  if (!user) {
    const attempted = AUTH_ROUTES.profile;
    redirect(`${AUTH_ROUTES.login}?next=${encodeURIComponent(safeInternalRedirect(attempted))}`);
  }

  return (
    <div className="min-h-screen bg-icy-50">
      <header className="border-b hairline bg-paper">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-lg font-semibold tracking-tight text-navy">
              CitizenShift
            </Link>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-navy/45 sm:inline">
              Account
            </span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="shell py-8">
        <AccountNav />
        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
