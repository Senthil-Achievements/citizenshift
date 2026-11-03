import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listSponsors } from "@/lib/cms/sponsors";
import { SponsorManager } from "@/components/admin/SponsorManager";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  const db = isAdminClientAvailable() ? getAdminClient() : null;
  const res = db ? await listSponsors(db, { q: params.q, perPage: 50 }) : null;

  const tableMissing =
    res?.error?.code === "table_missing"
      ? "CMS tables not applied yet (migrations 0002–0004 pending)."
      : res?.error
        ? `Could not read sponsors: ${res.error.code}`
        : null;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy">Sponsors</h1>
      <p className="mt-1 text-sm text-navy/60">
        {res ? `${res.total} sponsor${res.total === 1 ? "" : "s"}` : "—"}
      </p>

      <form method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search names…"
          className="h-9 w-64 rounded-full border hairline bg-paper px-4 text-sm text-navy"
        />
        <button type="submit" className="h-9 rounded-full border hairline bg-paper px-4 text-xs font-medium text-navy">
          Filter
        </button>
      </form>

      <div className="mt-4">
        <SponsorManager
          rows={res?.rows ?? []}
          isAdmin={principal.role === "admin"}
          tableMissing={tableMissing}
        />
      </div>
    </div>
  );
}
