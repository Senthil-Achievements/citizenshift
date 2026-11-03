import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { getBill } from "@/lib/cms/bills";
import { BillEditor } from "@/components/admin/BillEditor";

export const dynamic = "force-dynamic";

export default async function AdminBillEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const principal = await getCmsPrincipal();
  if (!principal) {
    return <p className="text-sm text-navy/70">Session expired. Reload the page.</p>;
  }

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8 text-sm text-navy/70">
        Supabase is not configured yet, so this record is unreachable.
      </div>
    );
  }

  const db = getAdminClient();
  const res = await getBill(db, id);
  if (res.error?.code === "table_missing") {
    return (
      <div className="border border-berry/30 bg-berry/5 p-5 text-sm text-navy/80">
        CMS tables not applied yet — run migrations 0002–0004, then re-seed.
      </div>
    );
  }
  if (res.error) {
    return (
      <div className="border border-berry/30 bg-berry/5 p-5 text-sm text-navy/80">
        Could not load the bill: {res.error.code}
      </div>
    );
  }
  if (!res.row) notFound();

  const bill = res.row;

  return (
    <div>
      <Link
        href="/admin/legislation"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50 hover:text-navy"
      >
        ← Legislation
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">
        {bill.title}
      </h1>
      <p className="mt-1 text-xs text-navy/50">
        {bill.legacy_id ? `original bill ${bill.legacy_id} · ` : ""}
        {bill.number ?? "no number"} · content{" "}
        {bill.content_source === "original_capture" ? "untouched original capture" : "edited"}
      </p>

      <div className="mt-6">
        <BillEditor bill={bill} isAdmin={principal.role === "admin"} />
      </div>
    </div>
  );
}
