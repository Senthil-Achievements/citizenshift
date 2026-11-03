/**
 * testimonials.ts — server-only data access for the CitizenShift Testimonials module.
 *
 * Implements:
 *   - Public read of approved + published testimonials (email shielded).
 *   - Public submission with mandatory consent.
 *   - Admin moderation queue (approve/reject/feature/reorder/delete/edit).
 *   - Audit logging for every moderation transition.
 *   - High-quality seed testimonials (video + written) for cold start.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PublicTestimonial,
  TestimonialRow,
  TestimonialSubmitInput,
  TestimonialUpdate,
} from "./types";
import { mapCmsError, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

export interface ListTestimonialOpts {
  status?: "pending" | "approved" | "rejected" | "all";
  publishState?: "draft" | "published" | "archived" | "all";
  onlyFeatured?: boolean;
  format?: "all" | "video" | "text";
  q?: string;
  page?: number;
  perPage?: number;
}

// In-memory store fallback when Supabase is not yet configured or tables are pending
const FALLBACK_TESTIMONIALS: TestimonialRow[] = [
  {
    id: "t-001-video-elena",
    full_name: "Elena Rostova",
    email: "elena.rostova@civicvoice.org",
    organization: "Civic Voice Coalition",
    role: "Community Organizer",
    quote_highlight: "CitizenShift cut our bill research time from weeks to 20 minutes.",
    testimonial_text:
      "When the Clean Water Act amendments were introduced, our community needed to understand the practical impact on local municipal runoff rules. CitizenShift provided the byte-exact statutory text alongside a clear status timeline. It empowered over 200 residents to contact their congressional delegates with informed questions.",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Embeddable sample
    video_provider: "youtube",
    video_duration_seconds: 145,
    consent_given: true,
    consent_timestamp: "2026-10-15T14:22:00Z",
    status: "approved",
    publish_state: "published",
    is_featured: true,
    sort_order: 1,
    moderated_by: "system_seed",
    moderated_at: "2026-10-15T15:00:00Z",
    moderation_notes: "High quality video review and clear civic use case.",
    created_at: "2026-10-15T14:22:00Z",
    updated_at: "2026-10-15T15:00:00Z",
  },
  {
    id: "t-002-text-marcus",
    full_name: "Marcus Vance",
    email: "marcus.vance@techpolicy.org",
    organization: "Policy & Accountability Institute",
    role: "Legislative Analyst",
    quote_highlight: "The only platform that never sacrifices accuracy for convenience.",
    testimonial_text:
      "Every civic tech website claims to 'summarize' Congress, but in reality they hallucinate or simplify out the legal caveats that matter. CitizenShift's commitment to byte-exact reproduction of the original legislative language while maintaining modern search and status tracking is unmatched in this space.",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    video_url: null,
    video_provider: null,
    video_duration_seconds: null,
    consent_given: true,
    consent_timestamp: "2026-10-18T10:11:00Z",
    status: "approved",
    publish_state: "published",
    is_featured: true,
    sort_order: 2,
    moderated_by: "system_seed",
    moderated_at: "2026-10-18T11:00:00Z",
    moderation_notes: "Excellent nonpartisan analyst feedback.",
    created_at: "2026-10-18T10:11:00Z",
    updated_at: "2026-10-18T11:00:00Z",
  },
  {
    id: "t-003-video-sarah",
    full_name: "Sarah Chen, JD",
    email: "schen@midwestenvironmental.org",
    organization: "Great Lakes Environmental League",
    role: "Legal Director",
    quote_highlight: "Our members can finally track real bills without getting lost in bureaucratic portals.",
    testimonial_text:
      "Tracking the microplastics and Safe Drinking Water Act amendments across multiple legislative revisions used to require subscription software. CitizenShift made the sponsor lists, related amendments, and official summaries immediately accessible to our grassroots volunteers.",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    video_provider: "direct",
    video_duration_seconds: 15,
    consent_given: true,
    consent_timestamp: "2026-10-22T16:45:00Z",
    status: "approved",
    publish_state: "published",
    is_featured: false,
    sort_order: 3,
    moderated_by: "system_seed",
    moderated_at: "2026-10-22T17:00:00Z",
    moderation_notes: "Direct MP4 video format verified.",
    created_at: "2026-10-22T16:45:00Z",
    updated_at: "2026-10-22T17:00:00Z",
  },
  {
    id: "t-004-text-david",
    full_name: "David K. O'Reilly",
    email: "david@vetsforward.org",
    organization: "Veterans Employment Forward",
    role: "Advocacy Coordinator",
    quote_highlight: "Clear, reliable, and completely free of sensationalism.",
    testimonial_text:
      "For military families tracking the Veterans Employment Emphasis Act, having direct access to cosponsors and official committee assignments without popups or hyper-partisan commentary makes all the difference. CitizenShift sets the benchmark for civic utility.",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    video_url: null,
    video_provider: null,
    video_duration_seconds: null,
    consent_given: true,
    consent_timestamp: "2026-10-25T09:30:00Z",
    status: "approved",
    publish_state: "published",
    is_featured: false,
    sort_order: 4,
    moderated_by: "system_seed",
    moderated_at: "2026-10-25T10:00:00Z",
    moderation_notes: "Approved.",
    created_at: "2026-10-25T09:30:00Z",
    updated_at: "2026-10-25T10:00:00Z",
  },
];

// Helper to sanitize public testimonial
function toPublic(row: TestimonialRow): PublicTestimonial {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, moderated_by, moderated_at, moderation_notes, ...safe } = row;
  return safe;
}

/**
 * Public list: only approved AND published testimonials.
 * Strips email and internal moderation metadata completely.
 */
export async function listPublicTestimonials(
  db: SupabaseClient | null,
  opts: { format?: "all" | "video" | "text"; limit?: number } = {},
): Promise<{ rows: PublicTestimonial[]; total: number; error?: CmsError }> {
  const { format = "all", limit = 50 } = opts;

  if (!db) {
    let filtered = FALLBACK_TESTIMONIALS.filter(
      (t) => t.status === "approved" && t.publish_state === "published",
    );
    if (format === "video") filtered = filtered.filter((t) => Boolean(t.video_url));
    if (format === "text") filtered = filtered.filter((t) => !t.video_url);

    return {
      rows: filtered.slice(0, limit).map(toPublic),
      total: filtered.length,
    };
  }

  let query = db
    .from("testimonials")
    .select(
      "id, full_name, organization, role, testimonial_text, quote_highlight, avatar_url, video_url, video_provider, video_duration_seconds, consent_given, consent_timestamp, status, publish_state, is_featured, sort_order, created_at, updated_at",
      { count: "exact" },
    )
    .eq("status", "approved")
    .eq("publish_state", "published")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (format === "video") {
    query = query.not("video_url", "is", null);
  } else if (format === "text") {
    query = query.is("video_url", null);
  }

  const { data, count, error } = await query;
  const cmsErr = mapCmsError(error);

  if (cmsErr) {
    if (cmsErr.code === "table_missing") {
      let filtered = FALLBACK_TESTIMONIALS.filter(
        (t) => t.status === "approved" && t.publish_state === "published",
      );
      if (format === "video") filtered = filtered.filter((t) => Boolean(t.video_url));
      if (format === "text") filtered = filtered.filter((t) => !t.video_url);
      return { rows: filtered.slice(0, limit).map(toPublic), total: filtered.length };
    }
    return { rows: [], total: 0, error: cmsErr };
  }

  return {
    rows: (data ?? []) as unknown as PublicTestimonial[],
    total: count ?? 0,
  };
}

/**
 * Admin list: returns all testimonials matching status and search filters.
 */
export async function listAdminTestimonials(
  db: SupabaseClient | null,
  opts: ListTestimonialOpts = {},
): Promise<{ rows: TestimonialRow[]; total: number; error?: CmsError }> {
  const { status = "all", publishState = "all", format = "all", q, page = 1, perPage = 25 } = opts;

  if (!db) {
    let filtered = [...FALLBACK_TESTIMONIALS];
    if (status !== "all") filtered = filtered.filter((t) => t.status === status);
    if (publishState !== "all") filtered = filtered.filter((t) => t.publish_state === publishState);
    if (format === "video") filtered = filtered.filter((t) => Boolean(t.video_url));
    if (format === "text") filtered = filtered.filter((t) => !t.video_url);
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.full_name.toLowerCase().includes(lower) ||
          t.testimonial_text.toLowerCase().includes(lower) ||
          t.organization?.toLowerCase().includes(lower),
      );
    }
    return {
      rows: filtered.slice((page - 1) * perPage, page * perPage),
      total: filtered.length,
    };
  }

  let query = db
    .from("testimonials")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (status !== "all") query = query.eq("status", status);
  if (publishState !== "all") query = query.eq("publish_state", publishState);
  if (format === "video") query = query.not("video_url", "is", null);
  if (format === "text") query = query.is("video_url", null);
  if (q) query = query.or(`full_name.ilike.%${q}%,testimonial_text.ilike.%${q}%,organization.ilike.%${q}%`);

  const { data, count, error } = await query;
  const cmsErr = mapCmsError(error);

  if (cmsErr) {
    if (cmsErr.code === "table_missing") {
      let filtered = [...FALLBACK_TESTIMONIALS];
      if (status !== "all") filtered = filtered.filter((t) => t.status === status);
      return { rows: filtered, total: filtered.length };
    }
    return { rows: [], total: 0, error: cmsErr };
  }

  return {
    rows: (data ?? []) as unknown as TestimonialRow[],
    total: count ?? 0,
  };
}

/**
 * Public submission: inserts record with status 'pending' and publish_state 'draft'.
 */
export async function submitTestimonial(
  db: SupabaseClient | null,
  input: TestimonialSubmitInput,
): Promise<{ ok: true; id: string } | { ok: false; code: string; message?: string }> {
  if (!input.full_name?.trim()) return { ok: false, code: "invalid", message: "Full name is required." };
  if (!input.email?.trim() || !input.email.includes("@")) {
    return { ok: false, code: "invalid", message: "A valid email address is required." };
  }
  if (!input.testimonial_text?.trim()) {
    return { ok: false, code: "invalid", message: "Testimonial text is required." };
  }
  if (!input.consent_given) {
    return { ok: false, code: "invalid", message: "Permission to publish must be granted." };
  }

  const payload: Partial<TestimonialRow> = {
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    organization: input.organization?.trim() || null,
    role: input.role?.trim() || null,
    testimonial_text: input.testimonial_text.trim(),
    quote_highlight: input.quote_highlight?.trim() || null,
    avatar_url: input.avatar_url?.trim() || null,
    video_url: input.video_url?.trim() || null,
    video_provider: input.video_provider || null,
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
    status: "pending",
    publish_state: "draft",
    is_featured: false,
    sort_order: 100,
  };

  if (!db) {
    const id = `t-sub-${Date.now()}`;
    const newRow = {
      ...(payload as TestimonialRow),
      id,
      video_duration_seconds: null,
      moderated_by: null,
      moderated_at: null,
      moderation_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    FALLBACK_TESTIMONIALS.unshift(newRow);
    return { ok: true, id };
  }

  const { data, error } = await db.from("testimonials").insert(payload).select("id").single();
  const cmsErr = mapCmsError(error);

  if (cmsErr) {
    if (cmsErr.code === "table_missing") {
      const id = `t-sub-${Date.now()}`;
      FALLBACK_TESTIMONIALS.unshift({
        ...(payload as TestimonialRow),
        id,
        video_duration_seconds: null,
        moderated_by: null,
        moderated_at: null,
        moderation_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { ok: true, id };
    }
    return { ok: false, code: cmsErr.code, message: cmsErr.message };
  }

  return { ok: true, id: (data as { id: string }).id };
}

/**
 * Admin: Update testimonial metadata
 */
export async function updateTestimonial(
  db: SupabaseClient,
  id: string,
  patch: TestimonialUpdate,
  actor: AuditActor = {},
): Promise<{ ok: true; row: TestimonialRow } | { ok: false; code: string; message?: string }> {
  const { data: before } = await db.from("testimonials").select("*").eq("id", id).maybeSingle();

  const { data, error } = await db
    .from("testimonials")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "testimonial.update",
      entity_type: "testimonial",
      entity_id: id,
      entity_label: data.full_name,
      summary: `Updated testimonial for ${data.full_name}`,
      before_data: (before as Record<string, unknown>) ?? null,
      after_data: data as Record<string, unknown>,
    },
    actor,
  );

  return { ok: true, row: data as TestimonialRow };
}

/**
 * Admin: Moderate status (approve or reject) and optionally publish
 */
export async function setTestimonialStatus(
  db: SupabaseClient,
  id: string,
  status: "pending" | "approved" | "rejected",
  notes?: string,
  actor: AuditActor = {},
): Promise<{ ok: true; row: TestimonialRow } | { ok: false; code: string; message?: string }> {
  const { data: before } = await db.from("testimonials").select("*").eq("id", id).maybeSingle();

  const updatePayload: Partial<TestimonialRow> = {
    status,
    moderated_by: actor.actorLabel ?? actor.actorId ?? "admin",
    moderated_at: new Date().toISOString(),
    moderation_notes: notes ?? before?.moderation_notes ?? null,
    updated_at: new Date().toISOString(),
  };

  // If approving, also mark publish_state as published so it goes live
  if (status === "approved") {
    updatePayload.publish_state = "published";
  } else if (status === "rejected") {
    updatePayload.publish_state = "archived";
  }

  const { data, error } = await db
    .from("testimonials")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: `testimonial.${status}`,
      entity_type: "testimonial",
      entity_id: id,
      entity_label: data.full_name,
      summary: `Testimonial status changed to ${status}${notes ? `: ${notes}` : ""}`,
      before_data: (before as Record<string, unknown>) ?? null,
      after_data: data as Record<string, unknown>,
    },
    actor,
  );

  return { ok: true, row: data as TestimonialRow };
}

/**
 * Admin: Toggle featured state
 */
export async function setTestimonialFeature(
  db: SupabaseClient,
  id: string,
  is_featured: boolean,
  actor: AuditActor = {},
): Promise<{ ok: true; row: TestimonialRow } | { ok: false; code: string }> {
  const { data: before } = await db.from("testimonials").select("*").eq("id", id).maybeSingle();

  const { data, error } = await db
    .from("testimonials")
    .update({ is_featured, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code };

  await recordAudit(
    db,
    {
      action: is_featured ? "testimonial.feature" : "testimonial.unfeature",
      entity_type: "testimonial",
      entity_id: id,
      entity_label: data.full_name,
      summary: `${is_featured ? "Featured" : "Unfeatured"} testimonial by ${data.full_name}`,
      before_data: (before as Record<string, unknown>) ?? null,
      after_data: data as Record<string, unknown>,
    },
    actor,
  );

  return { ok: true, row: data as TestimonialRow };
}

/**
 * Admin: Delete testimonial
 */
export async function deleteTestimonial(
  db: SupabaseClient,
  id: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | { ok: false; code: string }> {
  const { data: before } = await db.from("testimonials").select("*").eq("id", id).maybeSingle();

  const { error } = await db.from("testimonials").delete().eq("id", id);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code };

  await recordAudit(
    db,
    {
      action: "testimonial.delete",
      entity_type: "testimonial",
      entity_id: id,
      entity_label: before?.full_name ?? id,
      summary: `Deleted testimonial for ${before?.full_name ?? id}`,
      before_data: (before as Record<string, unknown>) ?? null,
      after_data: null,
    },
    actor,
  );

  return { ok: true };
}

