import Link from "next/link";

import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listBills } from "@/lib/cms/bills";
import { pageFromParam } from "@/lib/cms/repository";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  state?: string;
  level?: string;
  page?: string;
}

const PER_PAGE = 25;

const STATE_BADGE: Record<string, string> = {
  published: "bg-berry/10 text-berry",
  draft: "bg-navy/10 text-navy",
  archived: "bg-navy/5 text-navy/50",
};

export default async function AdminLegislationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const principal = await getCmsPrincipal();
  if (!principal) {
    return <p className="text-sm text-navy/70">Session expired. Reload the page.</p>;
  }

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">Legislation</h1>
        <p className="mt-3 text-sm text-navy/70">
          Supabase is not configured yet, so the CMS tables are unreachable.
        </p>
      </div>
    );
  }

  const db = getAdminClient();
  // Count first so the pager is honest, then fetch the requested page.
  let total = 0;
  let listError: string | null = null;
  {
    let countQuery = db.from("bills").select("*", { count: "exact", head: true });
    if (params.q) countQuery = countQuery.or(`title.ilike.%${params.q}%,number.ilike.%${params.q}%`);
    if (params.state) countQuery = countQuery.eq("publish_state", params.state);
    if (params.level) countQuery = countQuery.eq("level", params.level);
    const { count, error } = await countQuery;
    if (error) listError = error.message;
    else total = count ?? 0;
  }
  const { page, totalPages } = pageFromParam(params.page, PER_PAGE, total);
  const res = await listBills(db, {
    q: params.q,
    publishState: params.state,
    level: params.level,
    page,
    perPage: PER_PAGE,
  });
  const effectiveTotal = res.total || total;

  function pageHref(p: number): string {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.state) sp.set("state", params.state);
    if (params.level) sp.set("level", params.level);
    sp.set("page", String(p));
    return `/admin/legislation?${sp.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Legislation</h1>
          <p className="mt-1 text-sm text-navy/60">
            {effectiveTotal} record{effectiveTotal === 1 ? "" : "s"} · seeded from the protected original store
          </p>
        </div>
        <Link
          href="/admin/legislation/new"
          className="inline-flex h-9 items-center rounded-full bg-navy px-4 text-xs font-semibold text-paper transition hover:bg-navy-600"
        >
          New bill
        </Link>
      </div>

      {res.error ? (
        <div className="mt-6 border border-berry/30 bg-berry/5 p-4 text-sm text-navy/80">
          {res.error.code === "table_missing"
            ? "CMS tables not applied yet (migrations 0002–0004 pending) — lists will populate after they run."
            : `Could not read bills: ${res.error.code}${res.error.message ? ` — ${res.error.message}` : ""}`}
        </div>
      ) : null}

      <form method="get" className="mt-6 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search title or number…"
          className="h-9 w-64 rounded-full border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/40"
        />
        <select
          name="state"
          defaultValue={params.state ?? ""}
          className="h-9 rounded-full border hairline bg-paper px-3 text-sm text-navy"
        >
          <option value="">All states</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="level"
          defaultValue={params.level ?? ""}
          className="h-9 rounded-full border hairline bg-paper px-3 text-sm text-navy"
        >
          <option value="">All levels</option>
          <option value="Federal">Federal</option>
          <option value="State">State</option>
          <option value="Municipal">Municipal</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-full border hairline bg-paper px-4 text-xs font-medium text-navy transition hover:border-navy/40"
        >
          Filter
        </button>
        {params.q || params.state || params.level ? (
          <Link
            href="/admin/legislation"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50 hover:text-navy"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-4 overflow-x-auto border hairline bg-paper">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
              <th className="px-4 py-3">Legacy</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Content</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {res.rows.map((b) => (
              <tr key={b.id} className="border-b hairline last:border-0 hover:bg-icy-50">
                <td className="px-4 py-3 font-mono text-xs text-navy/60">
                  {b.legacy_id ? (
                    <Link href={`/admin/legislation/${b.id}`} className="hover:underline">
                      {b.legacy_id}
                    </Link>
                  ) : (
                    <Link href={`/admin/legislation/${b.id}`} className="hover:underline">
                      {b.number ?? "—"}
                    </Link>
                  )}
                </td>
                <td className="max-w-[420px] px-4 py-3">
                  <Link href={`/admin/legislation/${b.id}`} className="text-navy hover:underline">
                    {b.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-navy/70">{b.level ?? "—"}</td>
                <td className="px-4 py-3 text-navy/70">{b.status ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                      STATE_BADGE[b.publish_state] ?? "bg-navy/5 text-navy/60"
                    }`}
                  >
                    {b.publish_state}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-navy/50">
                  {b.content_source === "original_capture" ? "original" : "edited"}
                </td>
                <td className="px-4 py-3 text-xs text-navy/50">
                  {new Date(b.updated_at).toLocaleDateString("en-US")}
                </td>
              </tr>
            ))}
            {res.rows.length === 0 && !res.error ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-navy/60">
                  No bills match. Run “Seed bills from original store” on the dashboard.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-navy/70">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="hover:underline">
              ← Previous
            </Link>
          ) : null}
          <span className="font-mono text-xs">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="hover:underline">
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
