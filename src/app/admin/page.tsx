import Link from "next/link";

import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { getDashboardData } from "@/lib/cms/dashboard";
import { CmsSeedButtons } from "@/components/admin/CmsSeedButtons";

export const dynamic = "force-dynamic";

/**
 * /admin — CMS dashboard: module counts and the latest audit activity.
 * Data comes from the same server-only modules the actions use, so the
 * "migrations not applied yet" state renders honestly instead of crashing.
 */

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <div className="border hairline bg-paper p-5 transition hover:border-navy/40">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-navy">{value}</p>
      {sub ? <p className="mt-1 text-xs text-navy/60">{sub}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminDashboardPage() {
  const principal = await getCmsPrincipal();
  // The layout already guarantees a principal; this is defense in depth.
  if (!principal) {
    return <p className="text-sm text-navy/70">Session expired. Reload the page.</p>;
  }
  const isAdmin = principal.role === "admin";

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">CMS</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/70">
          Supabase is not configured in this deployment yet, so the CMS tables are
          unreachable. Configure the destination project (apply migrations 0001–0004)
          and this dashboard will come alive.
        </p>
      </div>
    );
  }

  const db = getAdminClient();
  const { counts, recentActivity, tableMissing } = await getDashboardData(db);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy">Content management</h1>
      <p className="mt-2 text-sm text-navy/70">
        Signed in as {principal.user.email ?? principal.user.id} · role{" "}
        <span className="font-semibold text-navy">{principal.role}</span>
      </p>

      {tableMissing ? (
        <div className="mt-6 border border-berry/30 bg-berry/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-berry">
            Migrations pending
          </p>
          <p className="mt-2 text-sm leading-relaxed text-navy/80">
            The CMS tables (0002–0004) have not been applied to this Supabase project yet.
            Apply them via <code className="font-mono text-xs">supabase db push</code> or the SQL
            editor, then refresh. Nothing here is reachable for editing until then.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bills"
          value={counts.bills?.total ?? "—"}
          sub={
            counts.bills
              ? `${counts.bills.published} published · ${counts.bills.draft} draft · ${counts.bills.archived} archived`
              : undefined
          }
          href="/admin/legislation"
        />
        <StatCard label="Sponsors" value={counts.sponsors ?? "—"} href="/admin/sponsors" />
        <StatCard
          label="Pages"
          value={counts.pages?.total ?? "—"}
          sub={counts.pages ? `${counts.pages.published} published` : undefined}
          href="/admin/pages"
        />
        <StatCard
          label="Testimonials"
          value={counts.testimonials?.total ?? "—"}
          sub={
            counts.testimonials
              ? `${counts.testimonials.pending} pending · ${counts.testimonials.approved} approved`
              : undefined
          }
          href="/admin/testimonials"
        />
        <StatCard
          label="Communities"
          value={counts.communities?.total ?? "—"}
          sub={counts.communities ? `${counts.communities.published} published` : undefined}
          href="/admin/community"
        />
        <StatCard
          label="Open moderation"
          value={counts.moderationOpen ?? "—"}
          href="/admin/community"
        />
        <StatCard label="Editors" value={counts.editors ?? "—"} href="/admin/users" />
        <StatCard
          label="Links"
          value={counts.links ? `${counts.links.billLinks + counts.links.siteLinks}` : "—"}
          sub={
            counts.links
              ? `${counts.links.billLinks} bill · ${counts.links.siteLinks} site`
              : undefined
          }
          href="/admin/links"
        />
        <StatCard label="Audit entries" value={recentActivity.length >= 10 ? "10+" : recentActivity.length} href="/admin/audit" />
      </div>

      {isAdmin ? (
        <div className="mt-6 border hairline bg-paper p-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">
            Maintenance
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <CmsSeedButtons disabled={tableMissing} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-navy/60">
            Seeding is insert-if-absent from the protected original content store
            (content/original/**) — it never overwrites and never deletes.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">
          Recent activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-navy/60">No activity recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y hairline border hairline bg-paper">
            {recentActivity.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-berry">
                  {row.action}
                </span>{" "}
                <span className="text-navy">{row.entity_label ?? row.entity_id ?? row.entity_type}</span>
                {row.summary ? <span className="text-navy/60"> — {row.summary}</span> : null}
                <span className="block text-xs text-navy/45">
                  {new Date(row.created_at).toLocaleString("en-US")} · {row.actor_label ?? "system"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
