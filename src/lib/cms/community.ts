/**
 * community.ts — server-only data access for the Community Management module:
 * communities, channels, and the moderation report queue.
 *
 * Status transitions on moderation reports are audited with before/after so
 * any moderation decision is reviewable.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChannelRow, CommunityRow, CommunityUpdate } from "./types";
import { mapCmsError, pickAllowed, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

const COMMUNITY_WRITABLE = [
  "slug",
  "name",
  "description",
  "jurisdiction",
  "policy_area",
  "publish_state",
  "published_at",
] as const;

const CHANNEL_WRITABLE = ["slug", "name", "topic", "description", "is_active", "sort_order"] as const;

export type CmsWriteOk<T> = { ok: true; row: T };
export type CmsWriteFail = { ok: false; code: CmsError["code"]; message?: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ------------------------------ communities ------------------------------ */

export interface ListCommunitiesOpts {
  q?: string;
  publishState?: string;
  page?: number;
  perPage?: number;
}

export async function listCommunities(
  db: SupabaseClient,
  opts: ListCommunitiesOpts = {},
): Promise<{ rows: CommunityRow[]; total: number; error?: CmsError }> {
  const { q, publishState, page = 1, perPage = 25 } = opts;
  let query = db.from("communities").select("*", { count: "exact" });
  if (q) query = query.ilike("name", `%${q}%`);
  if (publishState) query = query.eq("publish_state", publishState);

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as CommunityRow[], total: count ?? 0 };
}

export async function getCommunity(
  db: SupabaseClient,
  id: string,
): Promise<{ row: CommunityRow | null; error?: CmsError }> {
  const { data, error } = await db.from("communities").select("*").eq("id", id).maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as CommunityRow) ?? null };
}

export async function createCommunity(
  db: SupabaseClient,
  input: { name: string; slug?: string; description?: string | null; jurisdiction?: string | null; policy_area?: string | null; publish_state?: CommunityRow["publish_state"] },
  actor: AuditActor = {},
): Promise<CmsWriteOk<CommunityRow> | CmsWriteFail> {
  const name = input.name?.trim();
  if (!name) return { ok: false, code: "invalid", message: "name is required" };
  const slug = slugify(input.slug?.trim() || name);
  if (!slug) return { ok: false, code: "invalid", message: "slug could not be derived" };

  const payload: Record<string, unknown> = { name, slug };
  for (const optional of ["description", "jurisdiction", "policy_area"] as const) {
    if (input[optional] != null) payload[optional] = input[optional];
  }
  if (input.publish_state) payload.publish_state = input.publish_state;

  const { data, error } = await db.from("communities").insert(payload).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "a community with that slug already exists" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as CommunityRow;

  await recordAudit(
    db,
    {
      action: "create",
      entity_type: "community",
      entity_id: row.id,
      entity_label: row.name,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function updateCommunity(
  db: SupabaseClient,
  id: string,
  input: CommunityUpdate,
  actor: AuditActor = {},
): Promise<CmsWriteOk<CommunityRow> | CmsWriteFail> {
  const existing = await getCommunity(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    COMMUNITY_WRITABLE,
  );
  if (!("publish_state" in payload) && !("published_at" in payload)) {
    if (Object.keys(payload).length === 0) {
      return { ok: false, code: "invalid", message: "no editable fields supplied" };
    }
  }

  const { data, error } = await db
    .from("communities")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "a community with that slug already exists" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as CommunityRow;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "community",
      entity_id: id,
      entity_label: row.name,
      before_data: existing.row as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function deleteCommunity(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const existing = await getCommunity(db, id);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  // Channels + moderation rows cascade; the audit row keeps the before-state.
  const { error } = await db.from("communities").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "community",
      entity_id: id,
      entity_label: existing.row.name,
      summary: "Deleted community (channels cascade)",
      before_data: existing.row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true };
}

/* ------------------------------ channels ------------------------------ */

export async function listChannels(
  db: SupabaseClient,
  opts: { communityId?: string; page?: number; perPage?: number } = {},
): Promise<{ rows: ChannelRow[]; total: number; error?: CmsError }> {
  const { communityId, page = 1, perPage = 50 } = opts;
  let query = db.from("channels").select("*", { count: "exact" });
  if (communityId) query = query.eq("community_id", communityId);

  const { data, error, count } = await query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as ChannelRow[], total: count ?? 0 };
}

export async function getChannel(
  db: SupabaseClient,
  id: string,
): Promise<{ row: ChannelRow | null; error?: CmsError }> {
  const { data, error } = await db.from("channels").select("*").eq("id", id).maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as ChannelRow) ?? null };
}

export async function createChannel(
  db: SupabaseClient,
  input: {
    community_id: string;
    name: string;
    slug?: string;
    topic?: ChannelRow["topic"];
    description?: string | null;
    sort_order?: number;
  },
  actor: AuditActor = {},
): Promise<CmsWriteOk<ChannelRow> | CmsWriteFail> {
  if (!input.community_id) return { ok: false, code: "invalid", message: "community_id is required" };
  const name = input.name?.trim();
  if (!name) return { ok: false, code: "invalid", message: "name is required" };
  const slug = slugify(input.slug?.trim() || name);
  if (!slug) return { ok: false, code: "invalid", message: "slug could not be derived" };
  const topic = input.topic ?? "discussion";
  if (!["discussion", "announce", "moderation"].includes(topic)) {
    return { ok: false, code: "invalid", message: `invalid topic: ${String(topic)}` };
  }

  const payload: Record<string, unknown> = {
    community_id: input.community_id,
    name,
    slug,
    topic,
  };
  if (input.description != null) payload.description = input.description;
  if (input.sort_order != null) payload.sort_order = input.sort_order;

  const { data, error } = await db.from("channels").insert(payload).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "That channel slug is taken in this community." };
    }
    if (cmsErr.code === "invalid") {
      return { ok: false, code: "invalid", message: cmsErr.message ?? "community not found" };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as ChannelRow;

  await recordAudit(
    db,
    {
      action: "create",
      entity_type: "channel",
      entity_id: row.id,
      entity_label: row.name,
      summary: `Channel created in community ${input.community_id}`,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

export async function updateChannel(
  db: SupabaseClient,
  id: string,
  input: Partial<ChannelRow>,
  actor: AuditActor = {},
): Promise<CmsWriteOk<ChannelRow> | CmsWriteFail> {
  let before: ChannelRow | null = null;
  {
    const { data, error } = await db.from("channels").select("*").eq("id", id).maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as ChannelRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const payload = pickAllowed<Record<string, unknown>>(
    input as Record<string, unknown>,
    CHANNEL_WRITABLE,
  );
  if (!("is_active" in payload) && Object.keys(payload).length === 0) {
    return { ok: false, code: "invalid", message: "no editable fields supplied" };
  }

  const { data, error } = await db.from("channels").update(payload).eq("id", id).select("*").single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) {
    if (cmsErr.code === "conflict") {
      return { ok: false, code: "conflict", message: "That channel slug is taken in this community." };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }
  const row = data as unknown as ChannelRow;

  await recordAudit(
    db,
    {
      action: "update",
      entity_type: "channel",
      entity_id: id,
      entity_label: row.name,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}

/* ------------------------------ moderation ------------------------------ */

export interface ModerationRow {
  id: string;
  channel_id: string | null;
  target_kind: "post" | "comment" | "member";
  target_id: string | null;
  reporter_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  handled_by: string | null;
  handled_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModerateOpts {
  status?: string;
  channelId?: string;
  page?: number;
  perPage?: number;
}

export async function listModerationReports(
  db: SupabaseClient,
  opts: ModerateOpts = {},
): Promise<{ rows: ModerationRow[]; total: number; error?: CmsError }> {
  const { status, channelId, page = 1, perPage = 25 } = opts;
  let query = db.from("moderation_reports").select("*", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (channelId) query = query.eq("channel_id", channelId);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], total: 0, error: cmsErr };
  return { rows: (data ?? []) as unknown as ModerationRow[], total: count ?? 0 };
}

const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;

export async function setModerationStatus(
  db: SupabaseClient,
  id: string,
  status: (typeof REPORT_STATUSES)[number],
  actor: AuditActor & { handledBy?: string } = {},
  resolutionNote?: string,
): Promise<CmsWriteOk<ModerationRow> | CmsWriteFail> {
  if (!REPORT_STATUSES.includes(status)) {
    return { ok: false, code: "invalid", message: `unknown report status: ${String(status)}` };
  }

  let before: ModerationRow | null = null;
  {
    const { data, error } = await db.from("moderation_reports").select("*").eq("id", id).maybeSingle();
    const cmsErr = mapCmsError(error);
    if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
    before = (data as unknown as ModerationRow) ?? null;
  }
  if (!before) return { ok: false, code: "not_found" };

  const patch: Record<string, unknown> = {
    status,
    handled_by: actor.handledBy ?? actor.actorId ?? null,
    handled_at: new Date().toISOString(),
  };
  if (resolutionNote != null) patch.resolution_note = resolutionNote;

  const { data, error } = await db
    .from("moderation_reports")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as ModerationRow;

  await recordAudit(
    db,
    {
      action: `moderate:${status}`,
      entity_type: "moderation_report",
      entity_id: id,
      entity_label: before.reason,
      before_data: before as unknown as Record<string, unknown>,
      after_data: row as unknown as Record<string, unknown>,
    },
    actor,
  );
  return { ok: true, row };
}
