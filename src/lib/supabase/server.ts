/**
 * server.ts — cookie-aware Supabase client for Server Components, Server
 * Actions and Route Handlers.
 *
 * Uses @supabase/ssr `createServerClient`, which reads the session from the
 * incoming request cookies and writes refreshed tokens back to the response.
 *
 * SECURITY CONTRACT
 *  - Never authorizes anything on `getSession()` alone. `getSession()` only
 *    decodes whatever cookie is present; it does not verify the token with
 *    the Auth server. Every authorization path here goes through
 *    `verifySession()` (getClaims + getUser) or `getUser()`.
 *  - This module never exposes SUPABASE_SECRET_KEY. For admin work import
 *    `./admin` instead — that module is server-only and must never be
 *    imported from a client component.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { publicEnv, serverEnv, SupabaseConfigurationError } from "./env";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";

/** Cookie namespace shared by the browser client and this one. */
export const AUTH_COOKIE = "citizenshift-auth";

/**
 * Returns a cookie-scoped Supabase client for the current request.
 * Throws `SupabaseConfigurationError` when the environment is not configured —
 * callers in the auth flow should let this surface so the operator sees it.
 */
export async function createClient(): Promise<SupabaseClient> {
  const env = publicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // The middleware refresh path performs the actual write.
        }
      },
    },
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: AUTH_COOKIE,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Identity verification                                               */
/* ------------------------------------------------------------------ */

export interface AuthContext {
  user: User | null;
  /** Claims validated by the Auth server, when available. */
  claims: Record<string, unknown> | null;
}

/**
 * Resolves the authenticated user for the current request.
 *
 * Order of trust:
 *   1. `getClaims()` — validates the JWT with the Auth server and returns its
 *      claims without a full user fetch. Returns null when unavailable.
 *   2. `getUser()` — authoritative lookup against the Auth server. This is
 *      what actually proves the session is real.
 *
 * `getSession()` is deliberately NOT used as a standalone authority anywhere.
 */
export async function verifySession(supabase?: SupabaseClient): Promise<AuthContext> {
  const client = supabase ?? (await createClient());

  let claims: Record<string, unknown> | null = null;
  try {
    // getClaims() exists on supabase-js >= 2.67; older clients fall through.
    const claimsFn = (client.auth as unknown as { getClaims?: () => Promise<Record<string, unknown> | null> }).getClaims;
    if (typeof claimsFn === "function") {
      claims = await claimsFn.call(client.auth);
    }
  } catch {
    claims = null;
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { user: null, claims: null };

  return { user: data.user, claims };
}

/** Convenience: the user, or null. Never throws on missing configuration. */
export async function getCurrentUser(supabase?: SupabaseClient): Promise<User | null> {
  try {
    const { user } = await verifySession(supabase);
    return user;
  } catch (err) {
    if (err instanceof SupabaseConfigurationError) return null;
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Server-side identity for protected routes                           */
/* ------------------------------------------------------------------ */

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "NotAuthenticatedError";
  }
}

/**
 * Requires a verified session. Throws `NotAuthenticatedError` rather than
 * returning null, so callers cannot accidentally treat "no user" as "public
 * route" and continue.
 */
export async function requireUser(): Promise<User> {
  const { user } = await verifySession();
  if (!user) throw new NotAuthenticatedError();
  return user;
}

/**
 * Authorizes a user against the server-only admin allowlist.
 *
 * The allowlist is `CITIZENSHIFT_ADMIN_USER_IDS`, read from the server
 * environment. It is NOT derived from user metadata, app_metadata, or any
 * client-editable field — a user cannot promote themselves by editing their
 * own profile or raw_user_meta_data.
 *
 * Returns the user when authorized, `null` otherwise. Callers must respond
 * with HTTP 403 on null.
 */
export async function requireAdmin(): Promise<User | null> {
  let env;
  try {
    env = serverEnv();
  } catch {
    return null; // unconfigured → nobody is admin
  }

  if (env.adminUserIds.length === 0) return null;

  const { user } = await verifySession();
  if (!user) return null;

  return env.adminUserIds.includes(user.id) ? user : null;
}

/** True when the given user id is in the server-only admin allowlist. */
export function isAdminUserId(id: string): boolean {
  try {
    return serverEnv().adminUserIds.includes(id);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Redirects                                                           */
/* ------------------------------------------------------------------ */

/**
 * Resolves the post-authentication destination from a `next` parameter,
 * passing it through `safeInternalRedirect` so an attacker-supplied
 * `?next=https://evil.com` can never bounce a signed-in user off-site.
 */
export function resolveNextParam(next: unknown, fallback?: string): string {
  return safeInternalRedirect(next, fallback ?? AUTH_ROUTES.afterReturningLogin);
}
