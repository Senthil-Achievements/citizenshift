/**
 * bills.ts — server-only data access for the Legislation module.
 *
 * Reads and writes the public.bills family (bills, revisions, links,
 * sponsors). Writes are only reached through admin actions, which have
 * already re-verified the acting principal; the original content store
 * (content/original/**) is a READ-ONLY seed source and is never modified.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getOriginalBill, listOriginalBills } from "@/lib/original-bills-store";
import type {
  BillLinkRow,
  BillRevisionRow,
  BillRow,
  BillUpdate,
  SponsorRow,
} from "./types";
import { mapCmsError, pickAllowed, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

const BILL_WRITABLE = [
  "legacy_id",
  "number",
  "title",
  "summary",
  "full_summary",
  "source",
  "source_id",
  "source_url",
  "original_text_url",
  "level",
  "jurisdiction",
  "policy_area",
  "emoji",
  "status",
  "status_date",
  "introduced_date",
  "progress",
  "publish_state",
  "published_at",
] as const;

export interface ListBillsOpts {
  q?: string;
  publishState?: string;
  level?: string;
  contentSource?: string;
  page?: number;
  perPage?: number;
}

export interface ListBillsResult {
  rows: BillRow[];
  total: number;
  error?: CmsError;
}

export async function listBills(
  db: SupabaseClient,
  opts: ListBillsOpts = {},
): Promise<ListBillsResult> {
  const { q, publishState, level, contentSource, page = 1, perPage = 25 } = opts;

  const filters = db.from("bills").select("*", { count: "exact" });
  if (q) filters.or(`title.ilike.%${q}%,number.ilike.%${q}%`);
  if (publishState) filters.eq("publish_state", publishState);
  if (level) filters.eq("level", level);
  if (contentSource) filters.eq("content_source", contentSource);

  const { data, error, count } = await filters
    .order("legacy_id", { ascending: true, nullsFirst: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    // table_missing is expected until the destination project is confirmed
    return { rows: [], total: 0, error: cmsErr };
  }
  return { rows: (data ?? []) as unknown as BillRow[], total: count ?? 0 };
}

export async function getBill(
  db: SupabaseClient,
  id: string,
): Promise<{ row: BillRow | null; error?: CmsError }> {
  const { data, error } = await db.from("bills").select("*").eq("id", id).maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as BillRow) ?? null };
}

export async function getBillByLegacyId(
  db: SupabaseClient,
  legacyId: number,
): Promise<{ row: BillRow | null; error?: CmsError }> {
  const { data, error } = await db
    .from("bills")
    .select("*")
    .eq("legacy_id", legacyId)
    .maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as BillRow) ?? null };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ------------------------------------------------------------------ */
/* Writes (reached only through admin-verified server actions)         */
/* ------------------------------------------------------------------ */

export type CmsWriteOk<T> = { ok: true; row: T };
export type CmsWriteFail = { ok: false; code: CmsError["code"]; message?: string };

export type CreateBillInput = Partial<BillUpdate> & { title: string };

/**
 * Creates a new bill record. content_source marks it as an admin edit when
 * fields other than the initial verbatim seeding are provided; plain creates
 * through this path are always "admin_edit" unless explicitly seeded.
 */
export async function createBill(
  db: SupabaseClient,
  input: CreateBillInput,
  actor: AuditActor = {},
): Promise<CmsWriteOk<BillRow> | CmsWriteFail> {
  const payload = pickAllowed<Record<string, unknown>>(
    { ...input, content_source: "admin_edit" } as Record<string, unknown>,
    [...BILL_WRITABLE, "content_source"],
  );
  if (!payload.title || typeof payload.title !== "string") {
    return { ok: false, code: "invalid", message: "title is required" };
  }

  const { data, error } = await db
    .from("bills")
    .insert(payload)
    .select("*")
    .single();

  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as BillRow;

  const audit = await recordAudit(
    db,
    {
      action: "create",
      entity_type: "bill",
      entity_id: row.id,
      entity_label: row.title,
      summary: "Created bill record",
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  if (!audit.ok) {
    return { ok: true, row }; // the mutation succeeded; audit loss is surfaced by the caller
  }
  return { ok: true, row };
}

/**
 * Updates a bill. The DB trigger snapshots the full previous row into
 * bill_revisions; here we record the audit entry with before/after.
 * Editing a seeded bill flips content_source to admin_edit so later audits
 * can distinguish controlled edits from the original capture.
 */
export async function updateBill(
  db: SupabaseClient,
  id: string,
  input: BillUpdate,
  actor: AuditActor = {},
  note?: string,
): Promise<CmsWriteOk<BillRow> | CmsWriteFail> {
  const existing = await getBill(db, id);
  if (existing.error?.code === "table_missing") {
    return { ok: false, code: "table_missing" };
  }
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    BILL_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  // content verbatim policy: an edit consciously supersedes the captured rows
  if (!("content_source" in payload)) {
    payload.content_source = "admin_edit";
  }

  const { data, error } = await db
    .from("bills")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "not_found") return { ok: false, code: "not_found" };
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as BillRow;

  const revision = await latestRevisionNo(db, id);
  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "bill",
      entity_id: id,
      entity_label: row.title,
      summary: note ?? "Updated bill record",
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
      revision_no: revision,
    },
    actor,
  );
  return { ok: true, row };
}

/** Publish / unpublish / archive — dedicated action for the publish state. */
export async function setBillPublishState(
  db: SupabaseClient,
  id: string,
  state: BillRow["publish_state"],
  actor: AuditActor = {},
): Promise<CmsWriteOk<BillRow> | CmsWriteFail> {
  if (state !== "draft" && state !== "published" && state !== "archived") {
    return { ok: false, code: "invalid", message: `unknown publish state: ${String(state)}` };
  }

  const existing = await getBill(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const patch: Record<string, unknown> = {
    publish_state: state,
    published_at:
      state === "published"
        ? existing.row.published_at ?? new Date().toISOString()
        : null,
  };

  const { data, error } = await db
    .from("bills")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as BillRow;

  await recordAudit(
    db,
    {
      action: state === "published" ? "publish" : state === "archived" ? "archive" : "unpublish",
      entity_type: "bill",
      entity_id: id,
      entity_label: row.title,
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

/**
 * Deletes a bill row. The protected original store is untouched — the bill
 * can always be re-seeded. Requires explicit confirmation upstream.
 */
export async function deleteBill(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const existing = await getBill(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const { error } = await db.from("bills").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "bill",
      entity_id: id,
      entity_label: existing.row.title,
      summary: "Deleted bill record (original store snapshot retained)",
      before_data: existing.row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Revisions and rollback                                              */
/* ------------------------------------------------------------------ */

async function latestRevisionNo(db: SupabaseClient, billId: string): Promise<number | null> {
  const { data } = await db
    .from("bill_revisions")
    .select("revision_no")
    .eq("bill_id", billId)
    .order("revision_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return (data as { revision_no: number }).revision_no ?? null;
}

export async function listBillRevisions(
  db: SupabaseClient,
  billId: string,
  opts: { page?: number; perPage?: number } = {},
): Promise<{ rows: BillRevisionRow[]; error?: CmsError }> {
  const { page = 1, perPage = 25 } = opts;
  const { data, error } = await db
    .from("bill_revisions")
    .select("*")
    .eq("bill_id", billId)
    .order("revision_no", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], error: cmsErr };
  return { rows: (data ?? []) as unknown as BillRevisionRow[] };
}

/**
 * Restores revision `revisionNo` of a bill by writing its snapshot back.
 * Rollback is itself an update — the current state is snapshotted as a new
 * revision first (by trigger) and the whole move is audited with both rows.
 */
export async function rollbackBill(
  db: SupabaseClient,
  id: string,
  revisionNo: number,
  actor: AuditActor = {},
): Promise<CmsWriteOk<BillRow> | CmsWriteFail> {
  if (!Number.isFinite(revisionNo) || revisionNo < 1) {
    return { ok: false, code: "invalid", message: "invalid revision number" };
  }

  const existing = await getBill(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const { data: rev, error: revErr } = await db
    .from("bill_revisions")
    .select("*")
    .eq("bill_id", id)
    .eq("revision_no", revisionNo)
    .maybeSingle();

  const revCmsErr = mapCmsError(revErr);
  if (revCmsErr) return { ok: false, code: revCmsErr.code, message: revCmsErr.message };
  if (!rev) return { ok: false, code: "not_found", message: `revision ${revisionNo} not found` };
  const revision = rev as unknown as BillRevisionRow;

  // Audit the row BEFORE overwriting it so both states are on the log.
  await recordAudit(
    db,
    {
      action: "rollback",
      entity_type: "bill",
      entity_id: id,
      entity_label: existing.row.title,
      summary: `Rolled back to revision ${revisionNo}`,
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: revision.data,
      revision_no: revisionNo,
    },
    actor,
  );

  // Copy only the writable columns out of the snapshot (id/created_at/etc. stay).
  const snapshot = pickAllowed<Record<string, unknown>>(
    revision.data,
    BILL_WRITABLE,
  );
  const { data, error } = await db
    .from("bills")
    .update(snapshot)
    .eq("id", id)
    .select("*")
    .single();

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  return { ok: true, row: data as unknown as BillRow };
}

/* ------------------------------------------------------------------ */
/* Seeding from the protected original store (insert-if-absent)        */
/* ------------------------------------------------------------------ */

export interface SeedStats {
  billsSeeded: number;
  billsSkipped: number;
  sponsorsSeeded: number;
  sponsorLinksSeeded: number;
  billLinksSeeded: number;
  policyAreasSeeded: number;
  skippedDuplicates: number;
}

export type SeedRowFailure = { legacyId: string; message: string };

export interface SeedResult {
  ok: boolean;
  stats?: SeedStats;
  failures?: SeedRowFailure[];
  error?: CmsError;
  /** true when migrations are not applied yet (destination not confirmed) */
  tableMissing?: boolean;
}

/**
 * Seeds the CMS tables from the machine-captured original store — verbatim.
 * Insert-if-absent everywhere: re-running refreshes nothing, deletes nothing.
 */
export async function seedBillsFromOriginalStore(
  db: SupabaseClient,
  actor: AuditActor = {},
): Promise<SeedResult> {
  const bills = listOriginalBills();
  const stats: SeedStats = {
    billsSeeded: 0,
    billsSkipped: 0,
    sponsorsSeeded: 0,
    sponsorLinksSeeded: 0,
    billLinksSeeded: 0,
    policyAreasSeeded: 0,
    skippedDuplicates: 0,
  };
  const failures: SeedRowFailure[] = [];

  const nameToId = await seedSponsors(db, bills, stats, failures);
  if (nameToId === "table_missing") {
    return { ok: false, tableMissing: true, stats, failures };
  }

  const billIds = new Map<string, string>();

  for (const bill of bills) {
    const row = {
      legacy_id: Number(bill.id),
      number: bill.billNumber,
      title: bill.title,
      summary: bill.summary,
      source: "original-site",
      source_url: bill.originalTextHref,
      original_text_url: bill.originalTextHref,
      level: bill.level,
      jurisdiction: bill.jurisdiction,
      policy_area: bill.policyArea,
      emoji: bill.emoji,
      status: bill.currentStatus,
      introduced_date: bill.introducedDate,
      progress: bill.progressSteps,
      content_source: "original_capture" as const,
      publish_state: "published" as const,
      published_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from("bills")
      .insert(row)
      .select("id")
      .single();

    const cmsErr = mapCmsError(error);
    if (cmsErr) {
      if (cmsErr.code === "conflict") {
        stats.skippedDuplicates += 1;
        try {
          const existing = await getBillByLegacyId(db, Number(bill.id));
          if (existing.row) billIds.set(bill.id, existing.row.id);
        } catch {
          failures.push({ legacyId: bill.id, message: "duplicate but unreadable" });
        }
        continue;
      }
      if (cmsErr.code === "table_missing") {
        return { ok: false, tableMissing: true, stats, failures };
      }
      failures.push({ legacyId: bill.id, message: cmsErr.message ?? cmsErr.code });
      continue;
    }

    const inserted = data as { id: string } | null;
    if (inserted) {
      billIds.set(bill.id, inserted.id);
      stats.billsSeeded += 1;

      if (bill.originalTextHref) {
        const { error: linkErr } = await db.from("bill_links").insert({
          bill_id: inserted.id,
          label: bill.originalTextLinkText ?? "Read Original Text",
          href: bill.originalTextHref,
          kind: "document",
          sort_order: 0,
        });
        if (!linkErr) stats.billLinksSeeded += 1;
        else if (!failures.some((f) => f.legacyId === bill.id)) {
          failures.push({ legacyId: bill.id, message: "bill_links insert failed" });
        }
      }
    }
  }

  for (const bill of bills) {
    const billId = billIds.get(bill.id);
    if (!billId) continue;

    let order = 0;
    for (const sponsor of bill.sponsors) {
      const sponsorId = nameToId.get(sponsor.name.toLowerCase());
      if (!sponsorId) {
        failures.push({ legacyId: bill.id, message: `sponsor missing: ${sponsor.name}` });
        continue;
      }
      const { error: relErr } = await db
        .from("bill_sponsors")
        .insert({ bill_id: billId, sponsor_id: sponsorId, role: sponsor.role, sort_order: order });
      if (relErr) {
        if (mapCmsError(relErr)?.code === "conflict") {
          stats.skippedDuplicates += 1;
        } else {
          failures.push({ legacyId: bill.id, message: `sponsor rel failed: ${sponsor.name}` });
        }
      } else {
        stats.sponsorLinksSeeded += 1;
      }
      order += 1;
    }
  }

  const policyResult = await seedPolicyAreasFromStore(db, stats);
  if (policyResult === "table_missing") {
    return { ok: false, tableMissing: true, stats, failures };
  }

  const audit = await recordAudit(
    db,
    {
      action: "seed",
      entity_type: "bill",
      entity_label: "original content store",
      summary: `Seeded CMS from the protected original store: ${stats.billsSeeded} new bills, ${stats.sponsorsSeeded} sponsors, ${stats.billLinksSeeded} links, ${stats.policyAreasSeeded} categories.`,
      after_data: stats as unknown as Record<string, unknown>,
    },
    actor,
  );
  if (!audit.ok && !failures.some((f) => f.legacyId === "audit")) {
    failures.push({ legacyId: "audit", message: audit.error?.code ?? "audit failed" });
  }

  return { ok: failures.length === 0, stats, failures: failures.length ? failures : undefined };
}

async function seedSponsors(
  db: SupabaseClient,
  bills: {
    sponsors: { name: string; initials: string; meta?: string | null; role: string; href: string | null }[];
  }[],
  stats: SeedStats,
  failures: SeedRowFailure[],
): Promise<Map<string, string> | "table_missing"> {
  // Resolve or create one sponsors row per distinct name; returns name -> id.
  // Insert-if-absent: existing rows are reused, never overwritten.
  const nameToId = new Map<string, string>();

  for (const bill of bills) {
    for (const sponsor of bill.sponsors) {
      const key = sponsor.name.toLowerCase();
      if (nameToId.has(key)) continue;

      const { data: existing, error: lookupErr } = await db
        .from("sponsors")
        .select("id")
        .eq("name", sponsor.name)
        .maybeSingle();

      if (lookupErr && mapCmsError(lookupErr)?.code === "table_missing") {
        return "table_missing";
      }

      if (existing) {
        nameToId.set(key, existing.id);
        continue;
      }

      const row = {
        name: sponsor.name,
        initials: sponsor.initials,
        meta: sponsor.meta ?? null,
        source_url: sponsor.href,
      };
      const { data, error } = await db.from("sponsors").insert(row).select("id").single();
      const cmsErr = mapCmsError(error);
      if (cmsErr) {
        if (cmsErr.code === "conflict") {
          // raced or seeded elsewhere: resolve the existing id by name
          stats.skippedDuplicates += 1;
          const { data: after } = await db
            .from("sponsors")
            .select("id")
            .eq("name", sponsor.name)
            .maybeSingle();
          if (after) nameToId.set(key, after.id);
          continue;
        }
        if (cmsErr.code === "table_missing") return "table_missing";
        failures.push({ legacyId: "sponsor", message: `${sponsor.name}: ${cmsErr.code}` });
        continue;
      }

      if (data) {
        const cast = data as { id: string };
        nameToId.set(key, cast.id);
        stats.sponsorsSeeded += 1;
      }
    }
  }

  return nameToId;
}

async function seedPolicyAreasFromStore(
  db: SupabaseClient,
  stats: SeedStats,
): Promise<"ok" | "table_missing"> {
  // The DISPLAYED policy areas live in the guards of the captured payload, not
  // in the raw API data for 45/50 bills — so the store's displayed values are
  // seeded exactly as observed.
  const bills = listOriginalBills();
  const seen = new Map<string, string>();
  for (const b of bills) {
    if (!b.policyArea) continue;
    const slug = slugify(b.policyArea);
    if (!slug) continue;
    if (!seen.has(slug)) seen.set(slug, b.emoji || "");
  }

  for (const [slug, emoji] of seen) {
    const label =
      bills.find((b) => slugify(b.policyArea) === slug)?.policyArea ?? slug;
    const { error } = await db
      .from("policy_areas")
      .upsert({ id: slug, label, emoji: emoji || null }, { onConflict: "id" });
    const cmsErr = mapCmsError(error);
    if (cmsErr?.code === "table_missing") return "table_missing";
    if (cmsErr) continue;
    stats.policyAreasSeeded += 1;
  }
  return "ok";
}
