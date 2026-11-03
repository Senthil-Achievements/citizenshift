import Link from "next/link";
import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listPages } from "@/lib/cms/pages";
import { PageCreateForm } from "@/components/admin/PageCreateForm";
import { CmsSeedButtons } from "@/components/admin/CmsSeedButtons";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  state?: string;
}

const STATE_BADGE: Record<string, string> = {
  published: "bg-berry/10 text-berry",
  draft: "bg-navy/10 text-navy",
  archived: "bg-navy/5 text-navy/50",
};

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">Page Management</h1>
        <p className="mt-3 text-sm text-navy/70">
          Supabase is not configured yet — the pages registry is unreachable.
        </p>
      </div>
    );
  }

  const db = getAdminClient();
  const res = await listPages(db, {
    q: params.q,
    publishState: params.state,
    perPage: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Pages</h1>
          <p className="mt-1 text-sm text-navy/60">
            {res.rows.length} {res.rows.length === 1 ? "page" : "pages"} registered · Manage website content sections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CmsSeedButtons />
          <PageCreateForm />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border hairline bg-paper p-4">
        <form method="get" className="flex flex-1 items-center gap-2">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search pages by title or slug..."
            className="w-full max-w-sm rounded border hairline bg-paper px-3 py-1.5 text-xs text-navy focus:border-navy focus:outline-none"
          />
          {params.state ? <input type="hidden" name="state" value={params.state} /> : null}
          <button
            type="submit"
            className="rounded bg-navy px-3 py-1.5 text-xs font-semibold text-paper hover:bg-navy-600"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50 mr-2">Filter:</span>
          {(["all", "published", "draft", "archived"] as const).map((s) => {
            const active = (s === "all" && !params.state) || params.state === s;
            const query = new URLSearchParams();
            if (params.q) query.set("q", params.q);
            if (s !== "all") query.set("state", s);
            return (
              <Link
                key={s}
                href={`/admin/pages?${query.toString()}`}
                className={`rounded px-2.5 py-1 capitalize transition ${
                  active
                    ? "bg-navy text-paper"
                    : "border hairline text-navy/70 hover:bg-icy-100"
                }`}
              >
                {s}
              </Link>
            );
          })}
        </div>
      </div>

      {res.rows.length === 0 ? (
        <div className="border hairline bg-paper p-8 text-center">
          <p className="text-sm text-navy/60">No pages found matching criteria.</p>
          <p className="mt-1 text-xs text-navy/40">You can seed default site copy from the original content library using the button above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border hairline bg-paper">
          <table className="w-full text-left text-sm text-navy">
            <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
              <tr>
                <th className="px-4 py-3">Title & Slug</th>
                <th className="px-4 py-3">Sections</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Modified</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y hairline">
              {res.rows.map((p) => {
                const sectionsCount = Array.isArray(p.sections) ? p.sections.length : 0;
                return (
                  <tr key={p.id} className="transition hover:bg-icy-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{p.title}</div>
                      <div className="font-mono text-xs text-navy/50">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-navy/70">
                      {sectionsCount} {sectionsCount === 1 ? "section" : "sections"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                          STATE_BADGE[p.publish_state] ?? "bg-navy/10 text-navy"
                        }`}
                      >
                        {p.publish_state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-navy/60">
                      {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/pages/${p.id}`}
                        className="rounded border hairline bg-paper px-3 py-1 text-xs font-medium text-navy transition hover:bg-icy-100"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

