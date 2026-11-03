/**
 * pages.ts — server-only data access for the Page Management module
 * (site_pages with typed sections + site_page_revisions history).
 *
 * Content originates from the protected original site copy
 * (content/original/content/content-library.json); seeding below is
 * insert-if-absent, and the store itself is never touched.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { PageRevisionRow, SitePageRow, SitePageUpdate } from "./types";
import { mapCmsError, pickAllowed, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

const PAGE_WRITABLE = ["slug", "title", "sections", "publish_state", "published_at"] as const;

export type CmsWriteOk<T> = { ok: true; row: T };
export type CmsWriteFail = { ok: false; code: CmsError["code"]; message?: string };

export interface ListPagesOpts {
  q?: string;
  publishState?: string;
  page?: number;
  perPage?: number;
}

export interface ListPagesResult {
  rows: SitePageRow[];
  total: number;
  error?: CmsError;
}

export async function listPages(
  db: SupabaseClient,
  opts: ListPagesOpts = {},
): Promise<ListPagesResult> {
  const { q, publishState, page = 1, perPage = 25 } = opts;

  let query = db.from("site_pages").select("*", { count: "exact" });
  if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
  if (publishState) query = query.eq("publish_state", publishState);

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as SitePageRow[], total: count ?? 0 };
}

export async function getPage(
  db: SupabaseClient,
  id: string,
): Promise<{ row: SitePageRow | null; error?: CmsError }> {
  const { data, error } = await db.from("site_pages").select("*").eq("id", id).maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as SitePageRow) ?? null };
}

export async function getPageBySlug(
  db: SupabaseClient,
  slug: string,
): Promise<{ row: SitePageRow | null; error?: CmsError }> {
  const { data, error } = await db.from("site_pages").select("*").eq("slug", slug).maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as SitePageRow) ?? null };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Structural validation of the sections payload — data, never code. */
function validateSections(sections: unknown): string | null {
  if (sections === undefined || sections === null) return null; // leave unchanged
  if (!Array.isArray(sections)) return "sections must be an array";
  for (const s of sections) {
    if (typeof s !== "object" || s === null || Array.isArray(s)) {
      return "each section must be an object";
    }
    const kind = (s as Record<string, unknown>).kind;
    if (typeof kind !== "string" || !kind.trim()) {
      return 'every section needs a "kind" string';
    }
  }
  return null;
}

export async function createPage(
  db: SupabaseClient,
  input: { slug?: string; title: string; sections?: unknown; publish_state?: SitePageRow["publish_state"] },
  actor: AuditActor = {},
): Promise<CmsWriteOk<SitePageRow> | CmsWriteFail> {
  const title = input.title?.trim();
  if (!title) return { ok: false, code: "invalid", message: "title is required" };
  const slug = slugify(input.slug?.trim() || title);
  if (!slug) return { ok: false, code: "invalid", message: "slug could not be derived" };

  const sectionsErr = validateSections(input.sections ?? []);
  if (sectionsErr) return { ok: false, code: "invalid", message: sectionsErr };

  const payload: Record<string, unknown> = {
    slug,
    title,
    sections: input.sections ?? [],
  };
  if (input.publish_state) payload.publish_state = input.publish_state;
  if (actor.actorId) payload.created_by = actor.actorId;

  const { data, error } = await db.from("site_pages").insert(payload).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "a page with that slug already exists" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as SitePageRow;

  await recordAudit(
    db,
    {
      action: "create",
      entity_type: "page",
      entity_id: row.id,
      entity_label: row.title,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function updatePage(
  db: SupabaseClient,
  id: string,
  input: SitePageUpdate & { note?: string },
  actor: AuditActor = {},
): Promise<CmsWriteOk<SitePageRow> | CmsWriteFail> {
  const existing = await getPage(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const sectionsErr = validateSections(input.sections);
  if (sectionsErr) return { ok: false, code: "invalid", message: sectionsErr };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    PAGE_WRITABLE,
  );
  if (Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const { data, error } = await db.from("site_pages").update(payload).eq("id", id).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "a page with that slug already exists" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as SitePageRow;

  // The DB trigger captured the revision; find its number for the audit link.
  const { data: rev } = await db
    .from("site_page_revisions")
    .select("revision_no")
    .eq("page_id", id)
    .order("revision_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  const revisionNo = rev ? (rev as { revision_no: number }).revision_no : null;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "page",
      entity_id: id,
      entity_label: row.title,
      summary: input.note ?? undefined,
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
      revision_no: revisionNo,
    },
    actor,
  );
  return { ok: true, row };
}

export async function setPagePublishState(
  db: SupabaseClient,
  id: string,
  state: SitePageRow["publish_state"],
  actor: AuditActor = {},
): Promise<CmsWriteOk<SitePageRow> | CmsWriteFail> {
  if (state !== "draft" && state !== "published" && state !== "archived") {
    return { ok: false, code: "invalid", message: `unknown publish state: ${String(state)}` };
  }
  const existing = await getPage(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const patch: Record<string, unknown> = {
    publish_state: state,
    published_at:
      state === "published" ? existing.row.published_at ?? new Date().toISOString() : null,
  };
  const { data, error } = await db.from("site_pages").update(patch).eq("id", id).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as SitePageRow;

  await recordAudit(
    db,
    {
      action: state === "published" ? "publish" : state === "archived" ? "archive" : "unpublish",
      entity_type: "page",
      entity_id: id,
      entity_label: row.title,
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function deletePage(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const existing = await getPage(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const { error } = await db.from("site_pages").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "page",
      entity_id: id,
      entity_label: existing.row.title,
      before_data: existing.row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Revisions and rollback                                              */
/* ------------------------------------------------------------------ */

export async function listPageRevisions(
  db: SupabaseClient,
  pageId: string,
  opts: { page?: number; perPage?: number } = {},
): Promise<{ rows: PageRevisionRow[]; error?: CmsError }> {
  const { page = 1, perPage = 25 } = opts;
  const { data, error } = await db
    .from("site_page_revisions")
    .select("*")
    .eq("page_id", pageId)
    .order("revision_no", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], error: cmsErr };
  return { rows: (data ?? []) as unknown as PageRevisionRow[] };
}

export async function rollbackPage(
  db: SupabaseClient,
  id: string,
  revisionNo: number,
  actor: AuditActor = {},
): Promise<CmsWriteOk<SitePageRow> | CmsWriteFail> {
  if (!Number.isFinite(revisionNo) || revisionNo < 1) {
    return { ok: false, code: "invalid", message: "invalid revision number" };
  }
  const existing = await getPage(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const { data: rev, error: revErr } = await db
    .from("site_page_revisions")
    .select("*")
    .eq("page_id", id)
    .eq("revision_no", revisionNo)
    .maybeSingle();
  const revCmsErr = mapCmsError(revErr);
  if (revCmsErr) return { ok: false, code: revCmsErr.code, message: revCmsErr.message };
  if (!rev) return { ok: false, code: "not_found", message: `revision ${revisionNo} not found` };
  const revision = rev as unknown as PageRevisionRow;

  await recordAudit(
    db,
    {
      action: "rollback",
      entity_type: "page",
      entity_id: id,
      entity_label: existing.row.title,
      summary: `Rolled back to revision ${revisionNo}`,
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: revision.data,
      revision_no: revisionNo,
    },
    actor,
  );

  const snapshot = pickAllowed<Record<string, unknown>>(revision.data, PAGE_WRITABLE);
  const { data, error } = await db
    .from("site_pages")
    .update(snapshot)
    .eq("id", id)
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  return { ok: true, row: data as unknown as SitePageRow };
}

/* ------------------------------------------------------------------ */
/* Seeding from the protected original site copy (insert-if-absent)    */
/* ------------------------------------------------------------------ */

export interface SeedPagesResult {
  ok: boolean;
  seeded: number;
  skipped: number;
  error?: CmsError;
  tableMissing?: boolean;
}

interface LibraryBlock {
  type?: string;
  text?: string;
  href?: string;
  [extra: string]: unknown;
}

interface LibraryPage {
  url?: string;
  title?: string;
  content_blocks?: LibraryBlock[];
}

/**
 * Seeds site_pages from content/original/content/content-library.json so the
 * CMS starts from the ORIGINAL site copy verbatim. Insert-if-absent by slug;
 * re-running changes nothing.
 */
export async function seedPagesFromOriginalLibrary(
  db: SupabaseClient,
  actor: AuditActor = {},
): Promise<SeedPagesResult> {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const path = join(root, "content", "original", "content", "content-library.json");

  let parsed: { source_pages?: LibraryPage[] };
  try {
    parsed = JSON.parse(readFileSync(path, "utf8")) as { source_pages?: LibraryPage[] };
  } catch (err) {
    return {
      ok: false,
      seeded: 0,
      skipped: 0,
      error: { code: "invalid", message: `original library unreadable: ${String(err)}` },
    };
  }
  const entries = parsed.source_pages ?? [];

  const result: SeedPagesResult = { ok: true, seeded: 0, skipped: 0 };
  for (const entry of entries) {
    const slugSource = entry.url ?? entry.title;
    if (!slugSource) continue;
    const slug = entry.url
      ? // site pages keyed by their public path: /donate -> donate
        slugify(String(entry.url).replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "")) || "home"
      : slugify(String(entry.title));
    if (!slug) continue;

    const sections = (entry.content_blocks ?? []).map((b, i) => ({
      kind: "text",
      block_type: b.type ?? "section",
      heading: "",
      body: b.text ?? "",
      href: b.href ?? null,
      sort_order: i,
    }));

    const { error } = await db.from("site_pages").insert({
      slug,
      title: entry.title ?? slug,
      sections,
      publish_state: "draft",
    });
    const cmsErr = mapCmsError(error);
    if (cmsErr?.code === "table_missing") return { ...result, ok: false, tableMissing: true };
    if (cmsErr?.code === "conflict") {
      result.skipped += 1;
      continue;
    }
    if (cmsErr) {
      return { ...result, ok: false, error: cmsErr };
    }
    result.seeded += 1;
  }

  await recordAudit(
    db,
    {
      action: "seed",
      entity_type: "page",
      entity_label: "original site copy",
      summary: `Seeded site pages from the protected original library: ${result.seeded} created, ${result.skipped} already present.`,
    },
    actor,
  );
  return result;
}
