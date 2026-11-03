/**
 * CMS row and payload types.
 *
 * There is no generated Database schema file in this workspace yet, so rows
 * are typed by hand to mirror supabase/migrations/0002–0004 column for column
 * (same snake_case field names as the tables). When the destination project
 * exists, `supabase gen types` output can replace this file'sRowMappings all
 * at once; every call site types against these interfaces.
 */

/* ---------------------------- audit ---------------------------- */

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  summary: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  revision_no: number | null;
  created_at: string;
}

export type AuditLogInput = {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_label?: string | null;
  summary?: string | null;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  revision_no?: number | null;
};

/* ---------------------------- settings ---------------------------- */

export interface SiteSettingRow {
  key: string;
  value: unknown;
  value_kind: "string" | "number" | "boolean" | "json";
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingUpdate {
  value: unknown;
  value_kind?: "string" | "number" | "boolean" | "json";
  description?: string | null;
}

/* ---------------------------- roles ---------------------------- */

export interface CmsUserRoleRow {
  user_id: string;
  role: "editor";
  granted_by: string | null;
  granted_at: string;
  created_at: string;
  updated_at: string;
}

/* ---------------------------- categories ---------------------------- */

export interface JurisdictionRow {
  id: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyAreaRow {
  id: string;
  label: string;
  emoji: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryRow = JurisdictionRow | PolicyAreaRow;

export type JurisdictionUpdate = Partial<
  Pick<JurisdictionRow, "label" | "description" | "sort_order" | "is_active">
>;
export type PolicyAreaUpdate = Partial<
  Pick<PolicyAreaRow, "id" | "label" | "emoji" | "description" | "sort_order" | "is_active">
>;

/* ---------------------------- bills ---------------------------- */

export interface BillRow {
  id: string;
  legacy_id: number | null;
  number: string | null;
  title: string;
  summary: string | null;
  full_summary: string | null;
  source: string | null;
  source_id: string | null;
  source_url: string | null;
  original_text_url: string | null;
  level: string | null;
  jurisdiction: string | null;
  policy_area: string | null;
  emoji: string | null;
  status: string | null;
  status_date: string | null;
  introduced_date: string | null;
  progress: unknown;
  content_source: "original_capture" | "admin_edit";
  publish_state: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BillUpdate = Partial<
  Pick<
    BillRow,
    | "legacy_id"
    | "number"
    | "title"
    | "summary"
    | "full_summary"
    | "source"
    | "source_id"
    | "source_url"
    | "original_text_url"
    | "level"
    | "jurisdiction"
    | "policy_area"
    | "emoji"
    | "status"
    | "status_date"
    | "introduced_date"
    | "progress"
    | "content_source"
    | "publish_state"
    | "published_at"
  >
>;

export interface BillRevisionRow {
  id: string;
  bill_id: string;
  revision_no: number;
  data: Record<string, unknown>;
  note: string | null;
  actor_id: string | null;
  actor_label: string | null;
  created_at: string;
}

export interface BillLinkRow {
  id: string;
  bill_id: string;
  label: string;
  href: string;
  kind: "external" | "internal" | "document";
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/* ---------------------------- sponsors ---------------------------- */

export interface SponsorRow {
  id: string;
  name: string;
  initials: string | null;
  meta: string | null;
  party: string | null;
  title: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export type SponsorUpdate = Partial<
  Pick<SponsorRow, "name" | "initials" | "meta" | "party" | "title" | "source_url">
>;

/* ---------------------------- pages ---------------------------- */

export interface SitePageRow {
  id: string;
  slug: string;
  title: string;
  sections: unknown;
  publish_state: "draft" | "published" | "archived";
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SitePageUpdate = Partial<
  Pick<SitePageRow, "slug" | "title" | "sections" | "publish_state" | "published_at">
>;

export interface PageRevisionRow {
  id: string;
  page_id: string;
  revision_no: number;
  data: Record<string, unknown>;
  note: string | null;
  actor_id: string | null;
  actor_label: string | null;
  created_at: string;
}

/* ---------------------------- links ---------------------------- */

export interface SiteLinkRow {
  id: string;
  label: string;
  href: string;
  kind: "internal" | "external";
  description: string | null;
  location: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SiteLinkUpdate = Partial<
  Pick<SiteLinkRow, "label" | "href" | "kind" | "description" | "location" | "sort_order" | "is_active">
>;

/* ---------------------------- community ---------------------------- */

export interface CommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  jurisdiction: string | null;
  policy_area: string | null;
  publish_state: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CommunityUpdate = Partial<
  Pick<CommunityRow, "slug" | "name" | "description" | "jurisdiction" | "policy_area" | "publish_state" | "published_at">
>;

export interface ChannelRow {
  id: string;
  community_id: string;
  slug: string;
  name: string;
  topic: "discussion" | "announce" | "moderation";
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ChannelUpdate = Partial<
  Pick<ChannelRow, "slug" | "name" | "topic" | "description" | "is_active" | "sort_order">
>;


/* ---------------------------- testimonials ---------------------------- */

export interface TestimonialCampaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "revoked";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  submission_count?: number;
}

export interface TestimonialRow {
  id: string;
  full_name: string;
  email: string;
  organization: string | null;
  role: string | null;
  testimonial_text: string;
  quote_highlight: string | null;
  avatar_url: string | null;
  video_url: string | null;
  video_provider: "direct" | "youtube" | "vimeo" | null;
  video_duration_seconds: number | null;
  consent_given: boolean;
  consent_timestamp: string;
  status: "pending" | "approved" | "rejected";
  publish_state: "draft" | "published" | "archived";
  is_featured: boolean;
  sort_order: number;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_notes: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  created_at: string;
  updated_at: string;
}

export type PublicTestimonial = Omit<
  TestimonialRow,
  "email" | "moderated_by" | "moderated_at" | "moderation_notes"
>;

export interface TestimonialSubmitInput {
  full_name: string;
  email: string;
  organization?: string;
  role?: string;
  testimonial_text: string;
  quote_highlight?: string;
  avatar_url?: string;
  video_url?: string;
  video_provider?: "direct" | "youtube" | "vimeo" | null;
  consent_given: boolean;
  campaign_slug?: string;
}

export type TestimonialUpdate = Partial<
  Pick<
    TestimonialRow,
    | "full_name"
    | "organization"
    | "role"
    | "testimonial_text"
    | "quote_highlight"
    | "avatar_url"
    | "video_url"
    | "video_provider"
    | "status"
    | "publish_state"
    | "is_featured"
    | "sort_order"
    | "moderation_notes"
    | "campaign_id"
    | "campaign_name"
  >
>;
