/**
 * dashboard.ts — server-only aggregation for the /admin landing page:
 * module counts plus the latest audit activity. Every query is honest about
 * the "migration not applied yet" state (table_missing) instead of crashing.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditLogRow } from "./types";
import { mapCmsError, type CmsError } from "./repository";

export interface ModuleCounts {
  bills: { total: number; published: number; draft: number; archived: number } | null;
  sponsors: number | null;
  pages: { total: number; published: number } | null;
  communities: { total: number; published: number } | null;
  moderationOpen: number | null;
  editors: number | null;
  links: { billLinks: number; siteLinks: number } | null;
  testimonials: { total: number; pending: number; approved: number } | null;
}

export interface DashboardResult {
  counts: ModuleCounts;
  recentActivity: AuditLogRow[];
  /** the CMS tables cannot be reached yet (migrations pending) */
  tableMissing: boolean;
  error?: CmsError;
}

async function countOf(
  db: SupabaseClient,
  table: string,
  filters: { column: string; value: string }[] = [],
): Promise<number | { missing: true }> {
  let query = db.from(table).select("*", { count: "exact", head: true });
  for (const f of filters) query = query.eq(f.column, f.value);
  const { count, error } = await query;
  const cmsErr = mapCmsError(error);
  if (cmsErr?.code === "table_missing") return { missing: true };
  if (cmsErr) return 0;
  return count ?? 0;
}

export async function getDashboardData(db: SupabaseClient): Promise<DashboardResult> {
  const [
    billsTotal,
    billsPublished,
    billsDraft,
    billsArchived,
    sponsors,
    pagesTotal,
    pagesPublished,
    communitiesTotal,
    communitiesPublished,
    moderationOpen,
    editors,
    billLinks,
    siteLinks,
    testimonialsTotal,
    testimonialsPending,
    testimonialsApproved,
  ] = await Promise.all([
    countOf(db, "bills"),
    countOf(db, "bills", [{ column: "publish_state", value: "published" }]),
    countOf(db, "bills", [{ column: "publish_state", value: "draft" }]),
    countOf(db, "bills", [{ column: "publish_state", value: "archived" }]),
    countOf(db, "sponsors"),
    countOf(db, "site_pages"),
    countOf(db, "site_pages", [{ column: "publish_state", value: "published" }]),
    countOf(db, "communities"),
    countOf(db, "communities", [{ column: "publish_state", value: "published" }]),
    countOf(db, "moderation_reports", [{ column: "status", value: "open" }]),
    countOf(db, "cms_user_roles", [{ column: "role", value: "editor" }]),
    countOf(db, "bill_links"),
    countOf(db, "site_links"),
    countOf(db, "testimonials"),
    countOf(db, "testimonials", [{ column: "status", value: "pending" }]),
    countOf(db, "testimonials", [{ column: "status", value: "approved" }]),
  ]);

  const numbers = [
    billsTotal, billsPublished, billsDraft, billsArchived, sponsors,
    pagesTotal, pagesPublished, communitiesTotal, communitiesPublished,
    moderationOpen, editors, billLinks, siteLinks,
    testimonialsTotal, testimonialsPending, testimonialsApproved,
  ];
  const isMissing = numbers.some((v) => typeof v === "object" && v !== null && "missing" in v);
  const num = (v: number | { missing: true }): number | null =>
    typeof v === "number" ? v : null;

  const counts: ModuleCounts = {
    bills: isMissing
      ? null
      : {
          total: num(billsTotal) ?? 0,
          published: num(billsPublished) ?? 0,
          draft: num(billsDraft) ?? 0,
          archived: num(billsArchived) ?? 0,
        },
    sponsors: num(sponsors),
    pages: isMissing
      ? null
      : { total: num(pagesTotal) ?? 0, published: num(pagesPublished) ?? 0 },
    communities: isMissing
      ? null
      : { total: num(communitiesTotal) ?? 0, published: num(communitiesPublished) ?? 0 },
    moderationOpen: num(moderationOpen),
    editors: num(editors),
    links: isMissing ? null : { billLinks: num(billLinks) ?? 0, siteLinks: num(siteLinks) ?? 0 },
    testimonials: isMissing
      ? null
      : {
          total: num(testimonialsTotal) ?? 0,
          pending: num(testimonialsPending) ?? 0,
          approved: num(testimonialsApproved) ?? 0,
        },
  };
      : { total: num(communitiesTotal) ?? 0, published: num(communitiesPublished) ?? 0 },
    moderationOpen: num(moderationOpen),
    editors: num(editors),
    links: isMissing ? null : { billLinks: num(billLinks) ?? 0, siteLinks: num(siteLinks) ?? 0 },
  };

  // Recent audit activity (may itself be missing until migrations run).
  let recentActivity: AuditLogRow[] = [];
  let error: CmsError | undefined;
  {
    const { data, error: auditErr } = await db
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, 9);
    const cmsErr = mapCmsError(auditErr);
    if (cmsErr?.code === "table_missing") {
      // counts already reflect the missing state; audit just stays empty
    } else if (cmsErr) {
      error = cmsErr;
    } else {
      recentActivity = (data ?? []) as unknown as AuditLogRow[];
    }
  }

  return { counts, recentActivity, tableMissing: isMissing, error };
}
