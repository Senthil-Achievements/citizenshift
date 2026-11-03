/**
 * sponsors.ts — server-only data access for the Sponsor Management module.
 *
 * sponsor rows are shared across bills (bill_sponsors joins with a role and
 * display order). Edits are audited with before/after payloads.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SponsorRow, SponsorUpdate } from "./types";
import { mapCmsError, pickAllowed, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

const SPONSOR_WRITABLE = ["name", "initials", "meta", "party", "title", "source_url"] as const;

export interface ListSponsorsOpts {
  q?: string;
  page?: number;
  perPage?: number;
}

export interface ListSponsorsResult {
  rows: SponsorRow[];
  total: number;
  error?: CmsError;
}

export async function listSponsors(
  db: SupabaseClient,
  opts: ListSponsorsOpts = {},
): Promise<ListSponsorsResult> {
  const { q, page = 1, perPage = 25 } = opts;

  let query = db.from("sponsors").select("*", { count: "exact" });
  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error, count } = await query
    .order("name", { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1);

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as SponsorRow[], total: count ?? 0 };
}

export async function getSponsor(
  db: SupabaseClient,
  id: string,
): Promise<{ row: SponsorRow | null; error?: CmsError }> {
  const { data, error } = await db.from("sponsors").select("*").eq("id", id).maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as SponsorRow) ?? null };
}

/** Count of bills a sponsor is attached to, for delete-time warnings. */
export async function countSponsorBillLinks(
  db: SupabaseClient,
  sponsorId: string,
): Promise<{ count: number; error?: CmsError }> {
  const { count, error } = await db
    .from("bill_sponsors")
    .select("*", { count: "exact", head: true })
    .eq("sponsor_id", sponsorId);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { count: 0, error: cmsErr };
  return { count: count ?? 0 };
}

export type CmsWriteOk<T> = { ok: true; row: T };
export type CmsWriteFail = { ok: false; code: CmsError["code"]; message?: string };

export async function createSponsor(
  db: SupabaseClient,
  input: SponsorUpdate & { name: string },
  actor: AuditActor = {},
): Promise<CmsWriteOk<SponsorRow> | CmsWriteFail> {
  if (!input.name || !input.name.trim()) {
    return { ok: false, code: "invalid", message: "name is required" };
  }
  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    SPONSOR_WRITABLE,
  );

  const { data, error } = await db.from("sponsors").insert(payload).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as SponsorRow;

  await recordAudit(
    db,
    {
      action: "create",
      entity_type: "sponsor",
      entity_id: row.id,
      entity_label: row.name,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function updateSponsor(
  db: SupabaseClient,
  id: string,
  input: SponsorUpdate,
  actor: AuditActor = {},
): Promise<CmsWriteOk<SponsorRow> | CmsWriteFail> {
  const existing = await getSponsor(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    SPONSOR_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const { data, error } = await db.from("sponsors").update(payload).eq("id", id).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as SponsorRow;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "sponsor",
      entity_id: id,
      entity_label: row.name,
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

/**
 * Deleting a sponsor detaches it from every bill (cascade). The audit row
 * keeps the full before-state so the attachment set is recoverable by hand.
 */
export async function deleteSponsor(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const existing = await getSponsor(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const links = await countSponsorBillLinks(db, id);
  const { error } = await db.from("sponsors").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "sponsor",
      entity_id: id,
      entity_label: existing.row.name,
      summary:
        links.count > 0
          ? `Deleted sponsor detached from ${links.count} bill assignment(s).`
          : "Deleted sponsor",
      before_data: existing.row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true };
}
