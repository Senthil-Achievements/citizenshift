/**
 * guard.ts — CMS authorization.
 *
 * Root of trust (unchanged from the existing area):
 *   1. The signed-in identity is verified server-side with the Supabase Auth
 *      server (`verifySession()` in src/lib/supabase/server.ts).
 *   2. "admin" is granted ONLY by the server-only allowlist environment
 *      variable CITIZENSHIFT_ADMIN_USER_IDS. No database row, no metadata,
 *      no user content can make a user an admin.
 *   3. "editor" is a weaker content-editing role stored in cms_user_roles,
 *      granted by an admin through the Users module. Reads of that table use
 *      the service-role client — but ONLY after step 1 has established a real
 *      signed-in identity, so no anonymous traffic ever reaches the elevated
 *      client. Editors can never grant roles, never manage users and never
 *      change site settings.
 *
 * Editors additionally go through identity step 1 on every write action, so
 * a session that lapses mid-use cannot act as an editor either.
 */

import "server-only";

import type { User } from "@supabase/supabase-js";

import { getCurrentUser, isAdminUserId } from "@/lib/supabase/server";
import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";

export type CmsRole = "admin" | "editor";

export interface CmsPrincipal {
  user: User;
  role: CmsRole;
}

/**
 * Resolve the acting user and their CMS role.
 * Returns null when unauthenticated, unconfigured, or unauthorized.
 */
export async function getCmsPrincipal(): Promise<CmsPrincipal | null> {
  let user: User | null = null;
  try {
    user = await getCurrentUser();
  } catch {
    return null;
  }
  if (!user) return null;

  // 1. allowlist admins (root of trust, server-only env)
  if (isAdminUserId(user.id)) {
    return { user, role: "admin" };
  }

  // 2. editor grants — needs the service role to read the locked table;
  //    identity has already been verified above.
  if (!isAdminClientAvailable()) return null;
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("cms_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data || data.role !== "editor") return null;
  return { user, role: "editor" };
}

/** True when admin-only (settings, roles, users, destructive operations). */
export function isAdminRole(principal: CmsPrincipal | null): principal is CmsPrincipal & { role: "admin" } {
  return !!principal && principal.role === "admin";
}
