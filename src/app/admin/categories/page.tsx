import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import * as cmsCategories from "@/lib/cms/categories";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  const db = isAdminClientAvailable() ? getAdminClient() : null;
  const [j, p, s, t] = db
    ? await Promise.all([
        cmsCategories.listJurisdictions(db),
        cmsCategories.listPolicyAreas(db),
        cmsCategories.listStatuses(db),
        cmsCategories.listTags(db, { perPage: 200 }),
      ])
    : [null, null, null, null];

  const missing = [j, p, s, t].some((r) => r?.error?.code === "table_missing");
  const otherError = [j, p, s, t].find((r) => r?.error && r.error.code !== "table_missing")?.error;

  if (missing) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">Categories</h1>
        <p className="mt-4 border border-berry/30 bg-berry/5 p-4 text-sm text-navy/80">
          CMS tables not applied yet (migrations 0002–0004 pending) — the category seed runs with
          the bills seed.
        </p>
      </div>
    );
  }
  if (otherError) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">Categories</h1>
        <p className="mt-4 border border-berry/30 bg-berry/5 p-4 text-sm text-navy/80">
          Could not read categories: {otherError.code}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy">Categories</h1>
      <p className="mt-1 text-sm text-navy/60">
        Labels here render on the public site — every change is audited. Hiding a category only
        affects future filtering surfaces; it never rewrites bill content.
      </p>
      <div className="mt-6">
        <CategoryManager
          jurisdictions={j?.rows ?? []}
          policyAreas={p?.rows ?? []}
          statuses={s?.rows ?? []}
          tags={t?.rows ?? []}
          isAdmin={principal.role === "admin"}
        />
      </div>
    </div>
  );
}
