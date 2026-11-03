/**
 * users.ts — server-only data access for the User Management module.
 *
 * Admins come exclusively from the server-only env allowlist
 * (CITIZENSHIFT_ADMIN_USER_IDS) — that list is never stored in the database,
 * so no DB write can create an admin. This module manages:
 *   - reading accounts (via the admin API + profiles),
 *   - granting/revoking the weaker "editor" role (cms_user_roles),
 *   - audit log entries for every role change.
 *
 * All functions assume the caller has ALREADY verified the acting user is an
 * allowlist admin; grant/revoke re-verify the identity that actors claim.
 */

import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getAdminClient, isAdminClientAvailable, listUsersPage } from "@/lib/supabase/admin";
import { isAdminUserId } from "@/lib/supabase/server";
import { mapCmsError, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

export interface AdminUserRow {
  id: string;
  email: string | null;
  /** display name from the profiles table when present */
  fullName: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  role: "admin" | "editor" | "member";
}

export interface ListUserOpts {
  q?: string;
  page?: number;
  perPage?: number;
}

export interface ListUserResult {
  rows: AdminUserRow[];
  total: number;
  error?: CmsError;
}

/**
 * Lists auth users with their CMS role. The admin API cannot search+eppage on
 * many projects, so we page through all users and filter here — acceptable at
 * the scale of a campaign site and honest about what the API supports.
 */
export async function listUsers(opts: ListUserOpts = {}): Promise<ListUserResult> {
  const { q, page = 1, perPage = 25 } = opts;

  if (!isAdminClientAvailable()) {
    return { rows: [], total: 0, error: { code: "not_configured" } };
  }
  const admin = getAdminClient();

  const roles = await loadEditorRoles(admin);
  const roleError = roles.error;

  // Scan users from the start; collect into a filtered list.
  const matched: { user: User; fullName: string | null }[] = [];
  let totalScanned = 0;
  let scanPage = 1;
  const scanPerPage = 200;

  // Cap the scan defensively so a runaway directory can't pin the server.
  const MAX_SCAN_PAGES = 50;
  while (scanPage <= MAX_SCAN_PAGES) {
    let batch: Awaited<ReturnType<typeof listUsersPage>>;
    try {
      batch = await listUsersPage({ page: scanPage, perPage: scanPerPage });
    } catch (err) {
      return {
        rows: [],
        total: 0,
        error: {
          code: "unknown",
          message: err instanceof Error ? err.message : "user directory unreachable",
        },
      };
    }
    if (batch.users.length === 0) break;
    totalScanned += batch.users.length;

    for (const u of batch.users) {
      const email = u.email ?? "";
      const name = (u.user_metadata?.full_name as string | undefined) ?? null;
      if (
        !q ||
        email.toLowerCase().includes(q.toLowerCase()) ||
        (name && name.toLowerCase().includes(q.toLowerCase()))
      ) {
        matched.push({ user: u, fullName: name });
      }
    }

    if (batch.users.length < scanPerPage) break;
    scanPage += 1;
  }

  const total = matched.length;
  const start = (page - 1) * perPage;
  const slice = matched.slice(start, start + perPage);

  const rows: AdminUserRow[] = slice.map(({ user, fullName }) => ({
    id: user.id,
    email: user.email ?? null,
    fullName,
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    role: isAdminUserId(user.id) ? "admin" : roles.ids.has(user.id) ? "editor" : "member",
  }));

  return { rows, total, error: roleError };
}

interface EditorRoles {
  ids: Set<string>;
  granted_by: Map<string, string | null>;
  error?: CmsError;
}

async function loadEditorRoles(admin: SupabaseClient): Promise<EditorRoles> {
  const { data, error } = await admin
    .from("cms_user_roles")
    .select("user_id, granted_by");
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    return { ids: new Set(), granted_by: new Map(), error: cmsErr };
  }
  const ids = new Set<string>();
  const granted_by = new Map<string, string | null>();
  for (const row of (data ?? []) as { user_id: string; granted_by: string | null }[]) {
    ids.add(row.user_id);
    granted_by.set(row.user_id, row.granted_by);
  }
  return { ids, granted_by };
}

/** Grant the editor role. The acting principal must be an allowlist admin. */
export async function grantEditorRole(
  currentAdminId: string,
  targetUserId: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | { ok: false; code: CmsError["code"]; message?: string }> {
  if (!isAdminUserId(currentAdminId)) {
    return { ok: false, code: "invalid", message: "only allowlist admins may grant roles" };
  }
  if (!isAdminClientAvailable()) return { ok: false, code: "not_configured" };
  const admin = getAdminClient();

  // Verify the target exists; never write for a ghost id.
  const target = await admin.auth.admin.getUserById(targetUserId);
  if (target.error || !target.data?.user) {
    return { ok: false, code: "not_found", message: "user not found in auth directory" };
  }

  const { error } = await admin
    .from("cms_user_roles")
    .upsert(
      { user_id: targetUserId, role: "editor", granted_by: currentAdminId },
      { onConflict: "user_id" },
    );
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    admin,
    {
      action: "update",
      entity_type: "user",
      entity_id: targetUserId,
      entity_label: target.data.user.email ?? targetUserId,
      summary: "Granted the editor role",
      after_data: { role: "editor", granted_by: currentAdminId },
    },
    { actorId: actor.actorId ?? currentAdminId, actorLabel: actor.actorLabel ?? null },
  );
  return { ok: true };
}

/** Revoke the editor role. Admin allowlist membership is never revocable here. */
export async function revokeEditorRole(
  currentAdminId: string,
  targetUserId: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | { ok: false; code: CmsError["code"]; message?: string }> {
  if (!isAdminUserId(currentAdminId)) {
    return { ok: false, code: "invalid", message: "only allowlist admins may revoke roles" };
  }
  if (!isAdminClientAvailable()) return { ok: false, code: "not_configured" };
  const admin = getAdminClient();

  if (isAdminUserId(targetUserId)) {
    return {
      ok: false,
      code: "invalid",
      message: "allowlist admins cannot be modified through the CMS",
    };
  }

  const { data: existingRow } = await admin
    .from("cms_user_roles")
    .select("*")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!existingRow) return { ok: false, code: "not_found", message: "user is not an editor" };

  const { error } = await admin.from("cms_user_roles").delete().eq("user_id", targetUserId);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  const target = await admin.auth.admin.getUserById(targetUserId);
  await recordAudit(
    admin,
    {
      action: "update",
      entity_type: "user",
      entity_id: targetUserId,
      entity_label: target.data?.user?.email ?? targetUserId,
      summary: "Revoked the editor role",
      before_data: existingRow as unknown as Record<string, unknown>,
      after_data: { role: "member" },
    },
    { actorId: actor.actorId ?? currentAdminId, actorLabel: actor.actorLabel ?? null },
  );
  return { ok: true };
}

/**
 * Self-protection guard used by the actions layer: an editor must never be
 * able to reach user/role/setting management. Actions re-check this on every
 * call so the enforcement does not depend on the UI.
 */
export function canManageUsers(role: "admin" | "editor" | undefined | null): boolean {
  return role === "admin";
}
