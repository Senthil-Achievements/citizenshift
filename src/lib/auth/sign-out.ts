"use server";

/**
 * sign-out server action.
 *
 * Signs out server-side (revoking the session at the Auth server, not just
 * clearing the cookie) and then redirects to the configured post-logout
 * destination. The destination comes from AUTH_ROUTES — never a literal.
 *
 * ⚠️ UNVERIFIED BUILD — see docs/supabase-configuration-report.md.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, AUTH_COOKIE } from "@/lib/supabase/server";
import { AUTH_ROUTES } from "@/config/auth-routes";

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "global" });
  } catch (err) {
    // Even if the Auth-server call fails, the local session must not survive.
    console.error("[signout] auth server error:", err instanceof Error ? err.message : err);
  }

  // Belt and braces: clear the session cookie directly.
  try {
    const store = await cookies();
    if (store.has(AUTH_COOKIE)) store.delete(AUTH_COOKIE);
  } catch {
    /* cookies may be read-only in this context; middleware will age it out */
  }

  redirect(AUTH_ROUTES.afterLogout);
}
