/**
 * /auth/callback — OAuth / PKCE return handler.
 *
 * Google (and any future provider) redirects back here with a `code`. The
 * code is exchanged server-side for a real session via exchangeCodeForSession();
 * the session cookie is written by @supabase/ssr.
 *
 * SECURITY
 *  - `next` is passed through safeInternalRedirect(). An attacker-supplied
 *    `?next=https://evil.com` is rejected and replaced with the default
 *    destination — no open redirect.
 *  - A failed exchange returns a visible error state, never a silent
 *    "signed in" impression.
 *  - ensureProfile() runs here so Google sign-up produces a profile row, and
 *    it is idempotent so a retried callback cannot duplicate one.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project was available (see
 * docs/supabase-configuration-report.md). Google OAuth has NOT been tested.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureOwnProfile } from "@/lib/supabase/profiles";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const destination = safeInternalRedirect(next, AUTH_ROUTES.afterFirstLogin);

  // The provider itself reported a failure (denied consent, misconfigured
  // client, etc.). Surface it honestly rather than redirecting as if ok.
  if (error) {
    const failure = request.nextUrl.clone();
    failure.pathname = AUTH_ROUTES.login;
    failure.search = "";
    failure.searchParams.set("error", error);
    if (errorDescription) failure.searchParams.set("error_description", errorDescription);
    failure.searchParams.set("next", destination);
    return NextResponse.redirect(failure);
  }

  if (!code) {
    const failure = request.nextUrl.clone();
    failure.pathname = AUTH_ROUTES.login;
    failure.search = "";
    failure.searchParams.set("error", "missing_code");
    failure.searchParams.set("next", destination);
    return NextResponse.redirect(failure);
  }

  try {
    const supabase = await createClient();

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
      const failure = request.nextUrl.clone();
      failure.pathname = AUTH_ROUTES.login;
      failure.search = "";
      failure.searchParams.set("error", exchangeError?.code ?? "exchange_failed");
      if (exchangeError?.message) failure.searchParams.set("error_description", exchangeError.message);
      failure.searchParams.set("next", destination);
      return NextResponse.redirect(failure);
    }

    // Idempotent: the DB trigger may already have created this row on the
    // upstream insert, and a retried callback must not create a second one.
    // Uses the caller's own RLS-scoped client with the just-established
    // session — the row id always comes from the verified session.
    try {
      await ensureOwnProfile();
    } catch {
      // Profile creation failure must not block sign-in; the account page
      // retries via ensureOwnProfile() once the migration is confirmed.
    }

    // First-time users go to onboarding; returning users to the feed.
    const isNewUser = !data.user.email_confirmed_at
      ? false
      : Date.now() - new Date(data.user.created_at).getTime() < 5 * 60 * 1000;

    const target = isNewUser ? AUTH_ROUTES.afterFirstLogin : destination;

    const success = request.nextUrl.clone();
    success.pathname = target;
    success.search = "";
    return NextResponse.redirect(success);
  } catch (err) {
    console.error("[auth/callback] unexpected failure:", err instanceof Error ? err.message : err);
    const failure = request.nextUrl.clone();
    failure.pathname = AUTH_ROUTES.login;
    failure.search = "";
    failure.searchParams.set("error", "callback_failed");
    failure.searchParams.set("next", destination);
    return NextResponse.redirect(failure);
  }
}
