/**
 * context.ts — server-only context resolution for admin actions.
 *
 * Every admin server action calls requireCmsContext() FIRST. It:
 *   1. verifies the signed-in identity with the Auth server (not cookies-as-trust),
 *   2. resolves the CMS role (allowlist admin > cms_user_roles editor),
 *   3. returns the service-role client, only after steps 1–2 succeed.
 *
 * Unauthenticated / unconfigured / unauthorized callers get an honest denial
 * envelope; the service-role client is never returned to them.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal, type CmsPrincipal } from "@/lib/cms/guard";

export interface CmsContext {
  principal: CmsPrincipal;
  /** service-role client; server-only, never leaves this module chain */
  db: SupabaseClient;
}

export type CmsContextFailure =
  | "unauthenticated"
  | "forbidden"
  | "not_configured";

export type CmsContextResult =
  | { ok: true; ctx: CmsContext }
  | { ok: false; code: CmsContextFailure };

/** Resolves the acting identity + organizational role + service-role client. */
export async function requireCmsContext(): Promise<CmsContextResult> {
  const principal = await getCmsPrincipal();
  if (!principal) return { ok: false, code: "unauthenticated" };

  if (!isAdminClientAvailable()) return { ok: false, code: "not_configured" };
  return { ok: true, ctx: { principal, db: getAdminClient() } };
}

/** Same, but editor role is not enough — allowlist admin required. */
export async function requireAdminContext(): Promise<CmsContextResult> {
  const result = await requireCmsContext();
  if (!result.ok) return result;
  if (result.ctx.principal.role !== "admin") return { ok: false, code: "forbidden" };
  return result;
}

/** Convenience for actions: mapping role → allowed write domain. */
export function canWriteContent(principal: CmsPrincipal): boolean {
  return principal.role === "admin" || principal.role === "editor";
}

export function canAdministrate(principal: CmsPrincipal): boolean {
  return principal.role === "admin";
}
