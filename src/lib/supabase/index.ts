/**
 * index.ts — barrel for the Supabase integration.
 *
 * NOTE: this barrel does NOT re-export `./admin`. The admin client holds the
 * secret key; re-exporting it here would make it one careless import away from
 * a client bundle. Import `@/lib/supabase/admin` explicitly, from a
 * server-only file, when elevated access is genuinely required.
 */

export { publicEnv, checkSupabaseConfiguration, isSupabaseConfigured, deriveProjectRef, SupabaseConfigurationError } from "./env";
export type { PublicSupabaseEnv, ServerSupabaseEnv, ConfigCheck } from "./env";

export { getBrowserClient } from "./client";

export {
  createClient,
  verifySession,
  getCurrentUser,
  requireUser,
  requireAdmin,
  isAdminUserId,
  resolveNextParam,
  NotAuthenticatedError,
  AUTH_COOKIE,
} from "./server";
export type { AuthContext } from "./server";
