/**
 * links.ts — server-only data access for the Link Management module
 * (bill_links for per-bill sources + site_links for site-wide links).
 *
 * EXTERNAL URLs are protective content: the UI may adapt internal routes,
 * but external hrefs are validated as-is and edits to them are audited with
 * before/after values so any accidental change is visible and reversible.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { BillLinkRow, SiteLinkRow } from "./types";
import { mapCmsError, pickAllowed, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

export type CmsWriteOk<T> = { ok: true; row: T };
export type CmsWriteFail = { ok: false; code: CmsError["code"]; message?: string };

/* ------------------------------ bill_links ------------------------------ */

const BILL_LINK_WRITABLE = ["label", "href", "kind", "sort_order", "is_active"] as const;

export interface ListBillLinksOpts {
  billId?: string;
  page?: number;
  perPage?: number;
}

export async function listBillLinks(
  db: SupabaseClient,
  opts: ListBillLinksOpts = {},
): Promise<{ rows: BillLinkRow[]; total: number; error?: CmsError }> {
  const { billId, page = 1, perPage = 50 } = opts;
  let query = db.from("bill_links").select("*", { count: "exact" });
  if (billId) query = query.eq("bill_id", billId);

  const { data, error, count } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as BillLinkRow[], total: count ?? 0 };
}

export async function createBillLink(
  db: SupabaseClient,
  input: { bill_id: string; label: string; href: string; kind?: BillLinkRow["kind"]; sort_order?: number },
  actor: AuditActor = {},
): Promise<CmsWriteOk<BillLinkRow> | CmsWriteFail> {
  if (!input.bill_id) return { ok: false, code: "invalid", message: "bill_id is required" };
  if (!input.label?.trim()) return { ok: false, code: "invalid", message: "label is required" };
  if (!input.href?.trim()) return { ok: false, code: "invalid", message: "href is required" };
  const kind = input.kind ?? "external";
  if (!["external", "internal", "document"].includes(kind)) {
    return { ok: false, code: "invalid", message: `invalid kind: ${String(kind)}` };
  }

  // External links must be https — the original content never used anything else.
  if (kind !== "internal" && !/^https:\/\//.test(input.href)) {
    return { ok: false, code: "invalid", message: "external links must use https" };
  }

  const payload = pickAllowed<Record<string, unknown>>(
    input as unknown as Record<string, unknown>,
    ["bill_id", ...BILL_LINK_WRITABLE],
  );
  const { data, error } = await db.from("bill_links").insert(payload).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "invalid" || cmsErr.code === "conflict") {
      return { ok: false, code: cmsErr.code, message: cmsErr.message ?? "bill not found" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as BillLinkRow;

  await recordAudit(
    db,
    {
      action: "create",
      entity_type: "bill_link",
      entity_id: row.id,
      entity_label: row.label,
      summary: `Link added to bill ${input.bill_id}`,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function updateBillLink(
  db: SupabaseClient,
  id: string,
  input: Partial<BillLinkRow>,
  actor: AuditActor = {},
): Promise<CmsWriteOk<BillLinkRow> | CmsWriteFail> {
  let before: BillLinkRow | null = null;
  {
    const { data, error } = await db.from("bill_links").select("*").eq("id", id).maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as BillLinkRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    BILL_LINK_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const targetHref = (payload.href as string | undefined) ?? before.href;
  const targetKind = (payload.kind as BillLinkRow["kind"] | undefined) ?? before.kind;
  if (targetKind !== "internal" && !/^https:\/\//.test(targetHref)) {
    return { ok: false, code: "invalid", message: "external links must use https" };
  }

  const { data, error } = await db.from("bill_links").update(payload).eq("id", id).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as BillLinkRow;

  // Flag an external-URL change loudly in the audit summary.
  const hrefChanged =
    typeof payload.href === "string" && payload.href !== before.href && before.kind !== "internal";
  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "bill_link",
      entity_id: id,
      entity_label: row.label,
      summary: hrefChanged
        ? `External href changed — before: ${before.href} — after: ${row.href}`
        : undefined,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function deleteBillLink(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const { data, error: lookupErr } = await db.from("bill_links").select("*").eq("id", id).maybeSingle();
  if (mapCmsError(lookupErr)?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (!data) return { ok: false, code: "not_found" };
  const before = data as unknown as BillLinkRow;

  const { error } = await db.from("bill_links").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "bill_link",
      entity_id: id,
      entity_label: before.label,
      before_data: before as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true };
}

/* ------------------------------ site_links ------------------------------ */

const SITE_LINK_WRITABLE = [
  "label",
  "href",
  "kind",
  "description",
  "location",
  "sort_order",
  "is_active",
] as const;

export async function listSiteLinks(
  db: SupabaseClient,
  opts: { location?: string; kind?: string; page?: number; perPage?: number } = {},
): Promise<{ rows: SiteLinkRow[]; total: number; error?: CmsError }> {
  const { location, kind, page = 1, perPage = 50 } = opts;
  let query = db.from("site_links").select("*", { count: "exact" });
  if (location) query = query.eq("location", location);
  if (kind) query = query.eq("kind", kind);

  const { data, error, count } = await query
    .order("location", { ascending: true })
    .order("sort_order", { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as SiteLinkRow[], total: count ?? 0 };
}

export async function createSiteLink(
  db: SupabaseClient,
  input: {
    label: string;
    href: string;
    kind?: SiteLinkRow["kind"];
    description?: string | null;
    location?: string | null;
    sort_order?: number;
  },
  actor: AuditActor = {},
): Promise<CmsWriteOk<SiteLinkRow> | CmsWriteFail> {
  if (!input.label?.trim()) return { ok: false, code: "invalid", message: "label is required" };
  if (!input.href?.trim()) return { ok: false, code: "invalid", message: "href is required" };
  const kind = input.kind ?? "external";
  if (kind !== "internal" && kind !== "external") {
    return { ok: false, code: "invalid", message: `invalid kind: ${String(kind)}` };
  }
  if (kind === "external" && !/^https:\/\//.test(input.href)) {
    return { ok: false, code: "invalid", message: "external links must use https" };
  }
  if (kind === "internal" && !input.href.startsWith("/")) {
    return { ok: false, code: "invalid", message: "internal links must be site paths" };
  }

  const payload = pickAllowed<Record<string, unknown>>(
    input as unknown as Record<string, unknown>,
    SITE_LINK_WRITABLE,
  );
  const { data, error } = await db.from("site_links").insert(payload).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as SiteLinkRow;

  await recordAudit(
    db,
    {
      action: "create",
      entity_type: "site_link",
      entity_id: row.id,
      entity_label: row.label,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function updateSiteLink(
  db: SupabaseClient,
  id: string,
  input: Partial<SiteLinkRow>,
  actor: AuditActor = {},
): Promise<CmsWriteOk<SiteLinkRow> | CmsWriteFail> {
  let before: SiteLinkRow | null = null;
  {
    const { data, error } = await db.from("site_links").select("*").eq("id", id).maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as SiteLinkRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    SITE_LINK_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const targetHref = (payload.href as string | undefined) ?? before.href;
  const targetKind = (payload.kind as SiteLinkRow["kind"] | undefined) ?? before.kind;
  if (targetKind === "external" && !/^https:\/\//.test(targetHref)) {
    return { ok: false, code: "invalid", message: "external links must use https" };
  }

  const { data, error } = await db.from("site_links").update(payload).eq("id", id).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as SiteLinkRow;

  const hrefChanged =
    typeof payload.href === "string" && payload.href !== before.href && before.kind === "external";
  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "site_link",
      entity_id: id,
      entity_label: row.label,
      summary: hrefChanged
        ? `External href changed — before: ${before.href} — after: ${row.href}`
        : undefined,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function deleteSiteLink(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const { data, error: lookupErr } = await db.from("site_links").select("*").eq("id", id).maybeSingle();
  if (mapCmsError(lookupErr)?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (!data) return { ok: false, code: "not_found" };
  const before = data as unknown as SiteLinkRow;

  const { error } = await db.from("site_links").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "site_link",
      entity_id: id,
      entity_label: before.label,
      before_data: before as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true };
}
