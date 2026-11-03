import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listSiteLinks, listBillLinks } from "@/lib/cms/links";
import { getBill, getBillByLegacyId } from "@/lib/cms/bills";
import { SiteLinksManager, BillLinksManager } from "@/components/admin/LinkManager";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ bill?: string }>;
}) {
  const params = await searchParams;
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  if (!isAdminClientAvailable()) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">Links</h1>
        <p className="mt-4 border border-berry/30 bg-berry/5 p-4 text-sm text-navy/80">
          Supabase is not configured yet — the link registry is unreachable.
        </p>
      </div>
    );
  }

  const db = getAdminClient();
  const site = await listSiteLinks(db, { perPage: 100 });

  // Optional focus on one bill's links via ?bill=<legacy id>
  let billLinks: Awaited<ReturnType<typeof listBillLinks>> | null = null;
  let billTitle: string | null = null;
  if (params.bill) {
    const legacy = Number.parseInt(params.bill, 10);
    if (Number.isFinite(legacy)) {
      const lookedUp = await getBill(db, params.bill).then((byId) =>
        byId.row
          ? Promise.resolve(byId)
          : Number.isFinite(Number(params.bill)) && byId.row === null
            ? getBillByLegacyId(db, legacy)
            : Promise.resolve(byId),
      );
      if (lookedUp.row) {
        billTitle = lookedUp.row.title;
        billLinks = await listBillLinks(db, { billId: lookedUp.row.id });
      }
    }
  }

  const missing = site.error?.code === "table_missing";

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy">Links</h1>
      <p className="mt-1 text-sm text-navy/60">
        Original external URLs must be preserved byte-for-byte; internal links may be adapted.
      </p>

      <form method="get" className="mt-4 flex gap-2">
        <input
          name="bill"
          defaultValue={params.bill ?? ""}
          placeholder="Focus a bill by legacy id (e.g. 2161200)"
          className="h-9 w-72 rounded-full border hairline bg-paper px-4 text-sm text-navy"
        />
        <button type="submit" className="h-9 rounded-full border hairline bg-paper px-4 text-xs font-medium text-navy">
          Find bill links
        </button>
      </form>

      {missing ? (
        <p className="mt-6 border border-berry/30 bg-berry/5 p-4 text-sm text-navy/80">
          CMS tables not applied yet (migrations 0002–0004 pending).
        </p>
      ) : (
        <div className="mt-6 grid gap-6">
          {billLinks && billTitle ? (
            <BillLinksManager
              billId={params.bill ?? ""}
              rows={billLinks.rows}
              isAdmin={principal.role === "admin"}
            />
          ) : null}
          <SiteLinksManager rows={site.rows} isAdmin={principal.role === "admin"} />
        </div>
      )}
      {billTitle ? (
        <p className="mt-2 text-xs text-navy/50">Focused bill: {billTitle}</p>
      ) : params.bill ? (
        <p className="mt-2 text-xs text-navy/50">No bill found for that id.</p>
      ) : null}
    </div>
  );
}
