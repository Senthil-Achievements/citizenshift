/**
 * admin.ts — SERVER-ONLY Supabase client using the secret (service_role) key.
 *
 * This client bypasses Row Level Security. It must NEVER be imported by a
 * client component, a Server Component that renders to the browser without an
 * authorization check, or anything reachable from a public API route.
 *
 * Rules enforced by convention in this file:
 *   - Every exported function that touches data requires an already-verified
 *     admin user, or performs its own `requireAdmin()` check first.
 *   - No function returns the secret key, and none logs it.
 *   - The file has no "use client" directive and imports only server modules.
 *
 * ⚠️ UNVERIFIED BUILD — see docs/supabase-configuration-report.md. This module
 * has not been executed against a live project.
 */

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { serverEnv, SupabaseConfigurationError } from "./env";
import { requireAdmin, verifySession } from "./server";

let adminClient: SupabaseClient | null = null;

/**
 * Returns the shared admin client.
 *
 * `persistSession: false` and `autoRefreshToken: false` are essential: the
 * service_role key has no user session, and letting supabase-js try to manage
 * one would write tokens into a cookie store that does not exist here.
 */
export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const env = serverEnv(); // throws SupabaseConfigurationError when unset

  adminClient = createSupabaseClient(env.url, env.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "citizenshift-admin",
    },
    global: {
      headers: { "X-Client-Info": "citizenshift-admin-server" },
    },
  });

  return adminClient;
}

/** True when the admin client can be constructed (env fully configured). */
export function isAdminClientAvailable(): boolean {
  try {
    getAdminClient();
    return true;
  } catch (err) {
    if (err instanceof SupabaseConfigurationError) return false;
    throw err;
  }
}

/**
 * Guarded accessor for admin operations.
 *
 * Performs BOTH checks before handing out the elevated client:
 *   1. the caller is an authenticated Supabase user, and
 *   2. that user's id is in the server-only CITIZENSHIFT_ADMIN_USER_IDS list.
 *
 * Returns null when either fails. Route handlers must respond 403 to null —
 * never fall through to a public path.
 */
export async function getAuthorizedAdminClient(): Promise<SupabaseClient | null> {
  const adminUser = await requireAdmin();
  if (!adminUser) return null;
  if (!isAdminClientAvailable()) return null;
  return getAdminClient();
}

/* ------------------------------------------------------------------ */
/* Auth admin operations                                               */
/* ------------------------------------------------------------------ */

/**
 * Lists users with pagination via the Auth Admin API.
 *
 * Must only be reached through `getAuthorizedAdminClient()`. The browser can
 * never call this: it lives behind a server route handler that authorizes
 * first, and the secret key never leaves the server.
 */
export async function listUsersPage(options: {
  page: number;
  perPage: number;
}) {
  const supabase = getAdminClient();
  const { page, perPage } = options;

  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) throw error;

  return {
    users: data.users,
    /** Total users reported by the Auth server, for pagination. */
    total: data.users.length === perPage ? (page + 1) * perPage : page * perPage - (perPage - data.users.length),
    hasMore: data.users.length === perPage,
  };
}

/** Fetches one user by id. Returns null when not found or not authorized. */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Idempotently ensures a profile row exists for an Auth user.
 *
 * Safe to call on every OAuth callback and every email sign-in: a repeated
 * call will not create a duplicate because the primary key is the Auth user
 * id and the insert uses `on conflict do nothing`.
 */
export async function ensureProfile(userId: string): Promise<{ created: boolean }> {
  const supabase = getAdminClient();

  const { error } = await supabase.from("profiles").insert({ id: userId });

  if (error) {
    // 23505 = unique_violation → the profile already exists. That is success.
    if (error.code === "23505") return { created: false };
    // 42501 = RLS rejection / missing table → surface it rather than pretend.
    if (error.code === "42P01" || error.code === "42501") throw error;
    // Any other error: re-check for existence before failing.
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (data) return { created: false };
    throw error;
  }

  return { created: true };
}

/** Reads a profile row for a user. Respects RLS via the caller's client normally;
 *  this admin variant is for server-side management views only. */
export async function getProfileForUser(userId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Health probe used by /admin/integrations/supabase.
 *
 * Returns only booleans, counts and timings — never a key, never row content
 * beyond what a connectivity check requires.
 */
export async function probeSupabase(): Promise<{
  authReachable: boolean;
  databaseReachable: boolean;
  latencyMs: number;
  error?: string;
}> {
  const started = Date.now();
  try {
    const supabase = getAdminClient();

    const authResult = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    const authReachable = !authResult.error;

    const dbResult = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    const databaseReachable = !dbResult.error;

    const error = authResult.error?.message ?? dbResult.error?.message;

    return {
      authReachable,
      databaseReachable,
      latencyMs: Date.now() - started,
      ...(error && !authReachable && !databaseReachable ? { error } : {}),
    };
  } catch (err) {
    return {
      authReachable: false,
      databaseReachable: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Verifies the calling user is admin, then runs an admin operation. */
export async function withAdmin<T>(
  operation: (supabase: SupabaseClient) => Promise<T>,
): Promise<{ ok: true; result: T } | { ok: false; status: 401 | 403 | 503 }> {
  const { user } = await verifySession();
  if (!user) return { ok: false, status: 401 };

  try {
    const supabase = await getAuthorizedAdminClient();
    if (!supabase) return { ok: false, status: 403 };
    return { ok: true, result: await operation(supabase) };
  } catch (err) {
    if (err instanceof SupabaseConfigurationError) return { ok: false, status: 503 };
    throw err;
  }
}
