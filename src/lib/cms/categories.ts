/**
 * categories.ts — server-only data access for jurisdiction levels,
 * policy areas, statuses and tags.
 *
 * These are display taxonomies seeded from the site's own constants; labels
 * are shown on the site, so edits change what visitors see (and are audited).
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { JurisdictionRow, PolicyAreaRow } from "./types";
import { mapCmsError, pickAllowed, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

export type CmsWriteOk<T> = { ok: true; row: T };
export type CmsWriteFail = { ok: false; code: CmsError["code"]; message?: string };

/* ------------------------------ jurisdictions ------------------------------ */

const JURISDICTION_WRITABLE = ["label", "description", "sort_order", "is_active"] as const;

export async function listJurisdictions(
  db: SupabaseClient,
): Promise<{ rows: JurisdictionRow[]; error?: CmsError }> {
  const { data, error } = await db
    .from("jurisdictions")
    .select("*")
    .order("sort_order", { ascending: true });
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], error: cmsErr };
  return { rows: (data ?? []) as unknown as JurisdictionRow[] };
}

export async function updateJurisdiction(
  db: SupabaseClient,
  id: string,
  input: Partial<JurisdictionRow>,
  actor: AuditActor = {},
): Promise<CmsWriteOk<JurisdictionRow> | CmsWriteFail> {
  let before: JurisdictionRow | null = null;
  {
    const { data, error } = await db
      .from("jurisdictions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as JurisdictionRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    JURISDICTION_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const { data, error } = await db
    .from("jurisdictions")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as JurisdictionRow;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "jurisdiction",
      entity_id: id,
      entity_label: row.label,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

/* ------------------------------ policy_areas ------------------------------ */

const POLICY_AREA_WRITABLE = ["label", "emoji", "description", "sort_order", "is_active"] as const;

export async function listPolicyAreas(
  db: SupabaseClient,
): Promise<{ rows: PolicyAreaRow[]; error?: CmsError }> {
  const { data, error } = await db
    .from("policy_areas")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], error: cmsErr };
  return { rows: (data ?? []) as unknown as PolicyAreaRow[] };
}

export async function updatePolicyArea(
  db: SupabaseClient,
  id: string,
  input: Partial<PolicyAreaRow>,
  actor: AuditActor = {},
): Promise<CmsWriteOk<PolicyAreaRow> | CmsWriteFail> {
  let before: PolicyAreaRow | null = null;
  {
    const { data, error } = await db
      .from("policy_areas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as PolicyAreaRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    POLICY_AREA_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const { data, error } = await db
    .from("policy_areas")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as PolicyAreaRow;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "policy_area",
      entity_id: id,
      entity_label: row.label,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

/* ------------------------------ statuses ------------------------------ */

export interface StatusRow {
  id: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const STATUS_WRITABLE = ["label", "description", "sort_order", "is_active"] as const;

export async function listStatuses(
  db: SupabaseClient,
): Promise<{ rows: StatusRow[]; error?: CmsError }> {
  const { data, error } = await db
    .from("bill_statuses")
    .select("*")
    .order("sort_order", { ascending: true });
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], error: cmsErr };
  return { rows: (data ?? []) as unknown as StatusRow[] };
}

export async function updateStatus(
  db: SupabaseClient,
  id: string,
  input: Partial<StatusRow>,
  actor: AuditActor = {},
): Promise<CmsWriteOk<StatusRow> | CmsWriteFail> {
  let before: StatusRow | null = null;
  {
    const { data, error } = await db
      .from("bill_statuses")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as StatusRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    STATUS_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const { data, error } = await db
    .from("bill_statuses")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as StatusRow;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "bill_status",
      entity_id: id,
      entity_label: row.label,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

/* ------------------------------ tags ------------------------------ */

export interface TagRow {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const TAG_WRITABLE = ["slug", "label", "description"] as const;

export async function listTags(
  db: SupabaseClient,
  opts: { q?: string; page?: number; perPage?: number } = {},
): Promise<{ rows: TagRow[]; total: number; error?: CmsError }> {
  const { q, page = 1, perPage = 50 } = opts;
  let query = db.from("tags").select("*", { count: "exact" });
  if (q) query = query.ilike("label", `%${q}%`);

  const { data, error, count } = await query
    .order("label", { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as TagRow[], total: count ?? 0 };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createTag(
  db: SupabaseClient,
  input: { label: string; slug?: string; description?: string | null },
  actor: AuditActor = {},
): Promise<CmsWriteOk<TagRow> | CmsWriteFail> {
  const label = input.label?.trim();
  if (!label) return { ok: false, code: "invalid", message: "label is required" };
  const slug = slugify(input.slug?.trim() || label);
  if (!slug) return { ok: false, code: "invalid", message: "slug could not be derived" };

  const { data, error } = await db
    .from("tags")
    .insert({ label, slug, description: input.description ?? null })
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "a tag with that slug already exists" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as TagRow;

  await recordAudit(
    db,
    {
      action: "create",
      entity_type: "tag",
      entity_id: row.id,
      entity_label: row.label,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function updateTag(
  db: SupabaseClient,
  id: string,
  input: Partial<TagRow>,
  actor: AuditActor = {},
): Promise<CmsWriteOk<TagRow> | CmsWriteFail> {
  let before: Pick<TagRow, "label" | "slug" | "description"> & { id: string } | null = null;
  {
    const { data, error } = await db.from("tags").select("*").eq("id", id).maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as TagRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    TAG_WRITABLE,
  );
  if ("slug" in payload && typeof payload.slug === "string") {
    payload.slug = slugify(payload.slug);
    if (!payload.slug) return { ok: false, code: "invalid", message: "invalid slug" };
  }
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const { data, error } = await db.from("tags").update(payload).eq("id", id).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "a tag with that slug already exists" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as TagRow;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "tag",
      entity_id: id,
      entity_label: row.label,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function deleteTag(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const { data, error: lookupErr } = await db.from("tags").select("*").eq("id", id).maybeSingle();
  if (mapCmsError(lookupErr)?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (!data) return { ok: false, code: "not_found" };
  const before = data as unknown as TagRow;

  const { error } = await db.from("tags").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "tag",
      entity_id: id,
      entity_label: before.label,
      before_data: before as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true };
}
