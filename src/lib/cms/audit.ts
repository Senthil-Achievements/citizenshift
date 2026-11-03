/**
 * audit.ts — the ONLY writer of public.audit_logs.
 *
 * Every CMS mutation records: who (actor), what (entity + action), when,
 * and the full before/after row payload. Rows are insert-only; there is no
 * update or delete path for the audit log anywhere in the codebase.
 *
 * Server-only by construction: importing this file from a client component
 * fails the build ("server-only").
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditLogInput, AuditLogRow } from "./types";
import { mapCmsError, type CmsError } from "./repository";

export interface AuditWriteResult {
  ok: boolean;
  error?: CmsError;
}

export interface AuditActor {
  /** auth.users.id of the acting admin, when known */
  actorId?: string | null;
  /** display label (email at the time), when known */
  actorLabel?: string | null;
}

/**
 * Insert one audit row. Failures never break the calling mutation flow but
 * are reported to the caller, which must surface them (the UI shows an
 * "audit could not be written" warning rather than silently dropping history).
 */
export async function recordAudit(
  db: SupabaseClient,
  input: AuditLogInput,
  actor: AuditActor = {},
): Promise<AuditWriteResult> {
  try {
    const { error } = await db
      .from("audit_logs")
      .insert({
        actor_id: actor.actorId ?? null,
        actor_label: actor.actorLabel ?? null,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id ?? null,
        entity_label: input.entity_label ?? null,
        summary: input.summary ?? null,
        before_data: input.before_data ?? null,
        after_data: input.after_data ?? null,
        revision_no: input.revision_no ?? null,
      });

    if (error) {
      const mapped = mapCmsError(error);
      if (mapped) return { ok: false, error: mapped };
      return { ok: false, error: { code: "unknown", message: error.message } };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapCmsError(err) ?? { code: "unknown" } };
  }
}

/** Read the audit trail, newest first. Server-only; only reached by admins. */
export async function listAuditLogs(
  db: SupabaseClient,
  opts: QueryAuditOpts = {},
): Promise<{ rows: AuditLogRow[]; error?: CmsError }> {
  const { entity_type, entity_id, actor_id, page = 1, perPage = 25 } = opts;

  let query = db
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (entity_type) {
    query = query.eq("entity_type", entity_type);
    if (entity_id) {
      query = query.eq("entity_id", entity_id);
    }
  }
  if (actor_id) {
    query = query.eq("actor_id", actor_id);
  }

  const { data, error } = await query;
  if (error) return { rows: [], error: mapCmsError(error) ?? { code: "unknown" } };
  return { rows: (data ?? []) as unknown as AuditLogRow[] };
}

export interface QueryAuditOpts {
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  page?: number;
  perPage?: number;
}
