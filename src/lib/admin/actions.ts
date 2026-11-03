"use server";

/**
 * actions.ts — admin server actions for every CMS module.
 *
 * SECURITY CONTRACT
 *   * Every action re-resolves the acting principal server-side before doing
 *     anything (requireCmsContext / requireAdminContext) — role checks never
 *     depend on the UI, and never trust the request payload.
 *   * Editors may write CONTENT (bills, sponsors, categories, links, pages,
 *     community) but never settings, users, roles, or destructive deletes.
 *   * Only allowlist admins may administrate (settings, users, roles) and
 *     only they reach delete/publish-final/seed operations.
 *   * Results are honest typed envelopes the UI can render as-is; nothing is
 *     invented when data is missing (codes surface the real state).
 */

import { requireAdminContext, requireCmsContext, type CmsContextFailure } from "@/lib/admin/context";
import * as cmsBills from "@/lib/cms/bills";
import * as cmsSponsors from "@/lib/cms/sponsors";
import * as cmsCategories from "@/lib/cms/categories";
import * as cmsLinks from "@/lib/cms/links";
import * as cmsPages from "@/lib/cms/pages";
import * as cmsUsers from "@/lib/cms/users";
import * as cmsCommunity from "@/lib/cms/community";
import * as cmsSettings from "@/lib/cms/settings";
import * as cmsDashboard from "@/lib/cms/dashboard";
import { listAuditLogs } from "@/lib/cms/audit";
import type {
  AuditLogRow,
  BillLinkRow,
  BillRevisionRow,
  BillRow,
  BillUpdate,
  JurisdictionRow,
  PageRevisionRow,
  PolicyAreaRow,
  SiteLinkRow,
  SitePageRow,
  SitePageUpdate,
  ChannelRow,
  CommunityRow,
  CommunityUpdate,
  SiteSettingRow,
  SponsorRow,
  SponsorUpdate,
} from "@/lib/cms/types";
import type { CmsError } from "@/lib/cms/repository";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ActionOk<T> { ok: true; data: T }
export interface ActionFail { ok: false; code: CmsContextFailure | string; message?: string }
export type ActionEnvelope<T> = ActionOk<T> | ActionFail;

interface CtxShape {
  principal: { user: User; role: string };
  db: SupabaseClient;
}

function actorOf(ctx: CtxShape) {
  return { actorId: ctx.principal.user.id, actorLabel: ctx.principal.user.email ?? null };
}

function fail(err: { code?: string; message?: string } | CmsError): ActionFail {
  return { ok: false, code: err.code ?? "unknown", message: err.message };
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function getDashboardAction(): Promise<
  ActionEnvelope<cmsDashboard.DashboardResult>
> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const data = await cmsDashboard.getDashboardData(ctx.ctx.db);
  return { ok: true, data };
}

/* ------------------------------------------------------------------ */
/* Legislation                                                         */
/* ------------------------------------------------------------------ */

export interface ListBillsFilters {
  q?: string;
  publishState?: string;
  level?: string;
  page?: number;
}

export async function listBillsAction(
  filters: ListBillsFilters,
): Promise<ActionEnvelope<{ rows: BillRow[]; total: number }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.listBills(ctx.ctx.db, {
    q: filters.q,
    publishState: filters.publishState,
    level: filters.level,
    page: filters.page ?? 1,
    perPage: 25,
  });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function getBillAction(id: string): Promise<ActionEnvelope<{ row: BillRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.getBill(ctx.ctx.db, id);
  if (res.error) return fail(res.error);
  if (!res.row) return { ok: false, code: "not_found" };
  return { ok: true, data: { row: res.row } };
}

export async function createBillAction(
  input: BillUpdate & { title: string },
): Promise<ActionEnvelope<{ row: BillRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.createBill(ctx.ctx.db, input, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function updateBillAction(
  id: string,
  patch: BillUpdate,
  note?: string,
): Promise<ActionEnvelope<{ row: BillRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.updateBill(ctx.ctx.db, id, patch, actorOf(ctx.ctx), note);
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function setBillPublishStateAction(
  id: string,
  state: BillRow["publish_state"],
): Promise<ActionEnvelope<{ row: BillRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.setBillPublishState(ctx.ctx.db, id, state, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

/** Deletion is admin-only: content history must survive editor mistakes. */
export async function deleteBillAction(id: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.deleteBill(ctx.ctx.db, id, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

export async function listBillRevisionsAction(
  billId: string,
): Promise<ActionEnvelope<{ rows: BillRevisionRow[] }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.listBillRevisions(ctx.ctx.db, billId);
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows } };
}

export async function rollbackBillAction(
  id: string,
  revisionNo: number,
): Promise<ActionEnvelope<{ row: BillRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.rollbackBill(ctx.ctx.db, id, revisionNo, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

/** Seed the CMS from the protected original store. Admin-only, insert-if-absent. */
export async function seedBillsAction(): Promise<ActionEnvelope<{ stats: cmsBills.SeedStats }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsBills.seedBillsFromOriginalStore(ctx.ctx.db, actorOf(ctx.ctx));
  if (res.tableMissing) {
    return {
      ok: false,
      code: "table_missing",
      message: "CMS tables are not applied yet in the destination project.",
    };
  }
  if (!res.stats) return fail(res.error ?? { code: "unknown" });
  return { ok: true, data: { stats: res.stats } };
}

/* ------------------------------------------------------------------ */
/* Sponsors                                                            */
/* ------------------------------------------------------------------ */

export async function listSponsorsAction(
  opts: { q?: string; page?: number } = {},
): Promise<ActionEnvelope<{ rows: SponsorRow[]; total: number }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsSponsors.listSponsors(ctx.ctx.db, {
    q: opts.q,
    page: opts.page ?? 1,
    perPage: 25,
  });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function upsertSponsorAction(
  id: string | null,
  patch: SponsorUpdate,
): Promise<ActionEnvelope<{ row: SponsorRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = id
    ? await cmsSponsors.updateSponsor(ctx.ctx.db, id, patch, actorOf(ctx.ctx))
    : await cmsSponsors.createSponsor(
        ctx.ctx.db,
        patch as SponsorUpdate & { name: string },
        actorOf(ctx.ctx),
      );
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function deleteSponsorAction(id: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsSponsors.deleteSponsor(ctx.ctx.db, id, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export interface CategoriesBundle {
  jurisdictions: JurisdictionRow[];
  policyAreas: PolicyAreaRow[];
  statuses: cmsCategories.StatusRow[];
  tags: cmsCategories.TagRow[];
}

export async function listCategoriesAction(): Promise<ActionEnvelope<CategoriesBundle>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const [jurisdictions, policyAreas, statuses, tags] = await Promise.all([
    cmsCategories.listJurisdictions(ctx.ctx.db),
    cmsCategories.listPolicyAreas(ctx.ctx.db),
    cmsCategories.listStatuses(ctx.ctx.db),
    cmsCategories.listTags(ctx.ctx.db, { perPage: 200 }),
  ]);
  const err = jurisdictions.error ?? policyAreas.error ?? statuses.error ?? tags.error;
  if (err) return fail(err);
  return {
    ok: true,
    data: {
      jurisdictions: jurisdictions.rows,
      policyAreas: policyAreas.rows,
      statuses: statuses.rows,
      tags: tags.rows,
    },
  };
}

export async function updateJurisdictionAction(
  id: string,
  patch: Partial<JurisdictionRow>,
): Promise<ActionEnvelope<{ row: JurisdictionRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCategories.updateJurisdiction(ctx.ctx.db, id, patch, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function updatePolicyAreaAction(
  id: string,
  patch: Partial<PolicyAreaRow>,
): Promise<ActionEnvelope<{ row: PolicyAreaRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCategories.updatePolicyArea(ctx.ctx.db, id, patch, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function updateStatusAction(
  id: string,
  patch: Partial<cmsCategories.StatusRow>,
): Promise<ActionEnvelope<{ row: cmsCategories.StatusRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCategories.updateStatus(ctx.ctx.db, id, patch, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function createTagAction(
  input: { label: string; slug?: string; description?: string | null },
): Promise<ActionEnvelope<{ row: cmsCategories.TagRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCategories.createTag(ctx.ctx.db, input, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function deleteTagAction(id: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCategories.deleteTag(ctx.ctx.db, id, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

export async function listBillLinksAction(
  billId: string,
): Promise<ActionEnvelope<{ rows: BillLinkRow[] }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsLinks.listBillLinks(ctx.ctx.db, { billId });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows } };
}

export async function upsertBillLinkAction(
  id: string | null,
  patch: {
    bill_id: string;
    label: string;
    href: string;
    kind?: BillLinkRow["kind"];
    sort_order?: number;
    is_active?: boolean;
  },
): Promise<ActionEnvelope<{ row: BillLinkRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = id
    ? await cmsLinks.updateBillLink(ctx.ctx.db, id, patch, actorOf(ctx.ctx))
    : await cmsLinks.createBillLink(ctx.ctx.db, patch, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function deleteBillLinkAction(id: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsLinks.deleteBillLink(ctx.ctx.db, id, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

export async function listSiteLinksAction(
  filters: { location?: string; kind?: string; page?: number } = {},
): Promise<ActionEnvelope<{ rows: SiteLinkRow[]; total: number }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsLinks.listSiteLinks(ctx.ctx.db, {
    location: filters.location,
    kind: filters.kind,
    page: filters.page ?? 1,
    perPage: 25,
  });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function upsertSiteLinkAction(
  id: string | null,
  patch: Partial<SiteLinkRow> & { label?: string; href?: string; kind?: SiteLinkRow["kind"] },
): Promise<ActionEnvelope<{ row: SiteLinkRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = id
    ? await cmsLinks.updateSiteLink(ctx.ctx.db, id, patch, actorOf(ctx.ctx))
    : await cmsLinks.createSiteLink(
        ctx.ctx.db,
        patch as { label: string; href: string; kind?: SiteLinkRow["kind"] },
        actorOf(ctx.ctx),
      );
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function deleteSiteLinkAction(id: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsLinks.deleteSiteLink(ctx.ctx.db, id, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export async function listPagesAction(
  filters: { q?: string; publishState?: string; page?: number } = {},
): Promise<ActionEnvelope<{ rows: SitePageRow[]; total: number }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.listPages(ctx.ctx.db, {
    q: filters.q,
    publishState: filters.publishState,
    page: filters.page ?? 1,
    perPage: 25,
  });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function getPageAction(id: string): Promise<ActionEnvelope<{ row: SitePageRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.getPage(ctx.ctx.db, id);
  if (res.error) return fail(res.error);
  if (!res.row) return { ok: false, code: "not_found" };
  return { ok: true, data: { row: res.row } };
}

export async function updatePageAction(
  id: string,
  patch: SitePageUpdate & { note?: string },
): Promise<ActionEnvelope<{ row: SitePageRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.updatePage(ctx.ctx.db, id, patch, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function setPagePublishStateAction(
  id: string,
  state: SitePageRow["publish_state"],
): Promise<ActionEnvelope<{ row: SitePageRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.setPagePublishState(ctx.ctx.db, id, state, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function deletePageAction(id: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.deletePage(ctx.ctx.db, id, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

export async function listPageRevisionsAction(
  pageId: string,
): Promise<ActionEnvelope<{ rows: PageRevisionRow[] }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.listPageRevisions(ctx.ctx.db, pageId);
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows } };
}

export async function rollbackPageAction(
  id: string,
  revisionNo: number,
): Promise<ActionEnvelope<{ row: SitePageRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.rollbackPage(ctx.ctx.db, id, revisionNo, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function seedPagesAction(): Promise<
  ActionEnvelope<{ seeded: number; skipped: number }>
> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsPages.seedPagesFromOriginalLibrary(ctx.ctx.db, actorOf(ctx.ctx));
  if (res.tableMissing) {
    return {
      ok: false,
      code: "table_missing",
      message: "CMS tables are not applied yet in the destination project.",
    };
  }
  if (!res.ok) return fail(res.error ?? { code: "unknown" });
  return { ok: true, data: { seeded: res.seeded, skipped: res.skipped } };
}

/* ------------------------------------------------------------------ */
/* Users & roles (admin only)                                          */
/* ------------------------------------------------------------------ */

export async function listUsersAction(
  filters: { q?: string; page?: number } = {},
): Promise<ActionEnvelope<{ rows: cmsUsers.AdminUserRow[]; total: number }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsUsers.listUsers({ q: filters.q, page: filters.page ?? 1, perPage: 25 });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function grantEditorAction(userId: string): Promise<ActionEnvelope<{ granted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsUsers.grantEditorRole(ctx.ctx.principal.user.id, userId, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { granted: true } };
}

export async function revokeEditorAction(userId: string): Promise<ActionEnvelope<{ revoked: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsUsers.revokeEditorRole(ctx.ctx.principal.user.id, userId, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { revoked: true } };
}

/* ------------------------------------------------------------------ */
/* Community                                                           */
/* ------------------------------------------------------------------ */

export async function listCommunitiesAction(
  filters: { q?: string; publishState?: string; page?: number } = {},
): Promise<ActionEnvelope<{ rows: CommunityRow[]; total: number }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCommunity.listCommunities(ctx.ctx.db, {
    q: filters.q,
    publishState: filters.publishState,
    page: filters.page ?? 1,
    perPage: 25,
  });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function upsertCommunityAction(
  id: string | null,
  patch: CommunityUpdate,
): Promise<ActionEnvelope<{ row: CommunityRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = id
    ? await cmsCommunity.updateCommunity(ctx.ctx.db, id, patch, actorOf(ctx.ctx))
    : await cmsCommunity.createCommunity(
        ctx.ctx.db,
        patch as { name: string; slug?: string },
        actorOf(ctx.ctx),
      );
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function deleteCommunityAction(id: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCommunity.deleteCommunity(ctx.ctx.db, id, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

export async function listChannelsAction(
  communityId: string,
): Promise<ActionEnvelope<{ rows: ChannelRow[]; total: number }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCommunity.listChannels(ctx.ctx.db, { communityId });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function upsertChannelAction(
  id: string | null,
  patch: {
    community_id: string;
    name: string;
    slug?: string;
    topic?: ChannelRow["topic"];
    description?: string | null;
    sort_order?: number;
    is_active?: boolean;
  },
): Promise<ActionEnvelope<{ row: ChannelRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = id
    ? await cmsCommunity.updateChannel(ctx.ctx.db, id, patch, actorOf(ctx.ctx))
    : await cmsCommunity.createChannel(ctx.ctx.db, patch, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function listModerationAction(
  filters: { status?: string; page?: number } = {},
): Promise<ActionEnvelope<{ rows: cmsCommunity.ModerationRow[]; total: number }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCommunity.listModerationReports(ctx.ctx.db, {
    status: filters.status,
    page: filters.page ?? 1,
    perPage: 25,
  });
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows, total: res.total } };
}

export async function setModerationStatusAction(
  id: string,
  status: "open" | "reviewing" | "resolved" | "dismissed",
  resolutionNote?: string,
): Promise<ActionEnvelope<{ row: cmsCommunity.ModerationRow }>> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsCommunity.setModerationStatus(
    ctx.ctx.db,
    id,
    status,
    {
      actorId: ctx.ctx.principal.user.id,
      actorLabel: ctx.ctx.principal.user.email ?? null,
      handledBy: ctx.ctx.principal.user.id,
    },
    resolutionNote,
  );
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

/* ------------------------------------------------------------------ */
/* Settings (admin only)                                               */
/* ------------------------------------------------------------------ */

export async function listSettingsAction(): Promise<ActionEnvelope<{ rows: SiteSettingRow[] }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsSettings.listSettings(ctx.ctx.db);
  if (res.error) return fail(res.error);
  return { ok: true, data: { rows: res.rows } };
}

export async function upsertSettingAction(
  input: cmsSettings.UpsertSettingInput,
): Promise<ActionEnvelope<{ row: SiteSettingRow }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsSettings.upsertSetting(ctx.ctx.db, input, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { row: res.row } };
}

export async function deleteSettingAction(key: string): Promise<ActionEnvelope<{ deleted: true }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const res = await cmsSettings.deleteSetting(ctx.ctx.db, key, actorOf(ctx.ctx));
  if (!res.ok) return fail(res);
  return { ok: true, data: { deleted: true } };
}

/* ------------------------------------------------------------------ */
/* Audit log (admin only)                                              */
/* ------------------------------------------------------------------ */

export async function listAuditLogsAction(
  filters: { entityType?: string; actorId?: string; page?: number } = {},
): Promise<ActionEnvelope<{ rows: AuditLogRow[]; total: number }>> {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const page = filters.page ?? 1;
  const res = await listAuditLogs(ctx.ctx.db, {
    entity_type: filters.entityType,
    actor_id: filters.actorId,
    page,
    perPage: 25,
  });
  if (res.error) return fail(res.error);

  // Total comes from a second exact-count query so the pager is honest.
  let total = res.rows.length;
  {
    let countQuery = ctx.ctx.db.from("audit_logs").select("*", { count: "exact", head: true });
    if (filters.entityType) countQuery = countQuery.eq("entity_type", filters.entityType);
    if (filters.actorId) countQuery = countQuery.eq("actor_id", filters.actorId);
    const { count, error } = await countQuery;
    if (!error && typeof count === "number") total = count;
  }

  return { ok: true, data: { rows: res.rows, total } };
}

/** Diagnostics: returns the acting role or an honest denial. */
export async function whoAmIAction(): Promise<
  ActionEnvelope<{ role: string; email: string | null }>
> {
  const ctx = await requireCmsContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  return {
    ok: true,
    data: {
      role: ctx.ctx.principal.role,
      email: ctx.ctx.principal.user.email ?? null,
    },
  };
}
