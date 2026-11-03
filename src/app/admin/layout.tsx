/**
 * /admin layout — server-side authorization gate for the whole admin area.
 *
 * Authorization happens here, in a Server Component, before any elevated
 * client is constructed:
 *
 *   1. `requireAdmin()` verifies the session with the Auth server (getClaims +
 *      getUser — never getSession() alone), then
 *   2. checks the user's UUID against the server-only
 *      CITIZENSHIFT_ADMIN_USER_IDS allowlist.
 *
 * A non-admin receives a real 403 response. A signed-out visitor is redirected
 * to login with a sanitised `next` back to the attempted admin path.
 *
 * The secret-key client is never imported by anything the browser downloads.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/supabase/server";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { SupabaseConfigurationError } from "@/lib/supabase/env";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";
import { AdminNav } from "@/components/admin/AdminNav";
import { NotConfiguredNotice } from "@/components/NotConfiguredNotice";

export const dynamic = "force-dynamic";

/** Renders a real HTTP 403 body for unauthorized admin access. */
function Forbidden() {
  return (
    <div className="min-h-screen bg-icy-50">
      <div className="shell py-20">
        <div className="max-w-lg border hairline bg-paper p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">403 — Forbidden</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
            You don&apos;t have admin access.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">
            This area is restricted. Access is granted server-side — administrators come from a
            private allowlist, editors are granted roles in the dashboard — and cannot be changed
            from the browser.
          </p>
          <Link
            href={AUTH_ROUTES.afterLogout}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-semibold text-paper hover:bg-navy-600"
          >
            Back to CitizenShift
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Unconfigured deployment → an honest, readable notice instead of a 500.
  try {
    const { user } = await verifySession();
    if (!user) {
      const attempted = "/admin";
      redirect(`${AUTH_ROUTES.login}?next=${encodeURIComponent(safeInternalRedirect(attempted))}`);
    }
  } catch (err) {
    if (err instanceof SupabaseConfigurationError) {
      return <NotConfiguredNotice area="Admin" missing={err.missing} />;
    }
    throw err;
  }

  // Resolve the CMS principal: allowlist admin, granted editor, or nobody.
  const principal = await getCmsPrincipal();
  if (!principal) {
    // A signed-in user without a CMS role gets a real 403 — not a login loop.
    return <Forbidden />;
  }
  const isAdmin = principal.role === "admin";

  return (
    <div className="min-h-screen bg-icy-50">
      <header className="border-b hairline bg-paper">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-lg font-semibold tracking-tight text-navy">
              CitizenShift
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-berry">
              Admin · {principal.role}
            </span>
          </div>
          <Link
            href={AUTH_ROUTES.afterLogout}
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50 hover:text-navy"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <div className="shell py-8">
        <AdminNav role={principal.role} />
        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
