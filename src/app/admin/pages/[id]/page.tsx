import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { getPage } from "@/lib/cms/pages";
import { PageEditor } from "@/components/admin/PageEditor";

export const dynamic = "force-dynamic";

export default async function AdminPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8">
        <p className="text-sm text-navy/70">Supabase is not configured yet.</p>
      </div>
    );
  }

  const db = getAdminClient();
  const res = await getPage(db, id);
  if (!res.row) notFound();

  const isAdmin = principal.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/pages"
            className="font-mono text-xs text-navy/60 hover:text-navy hover:underline"
          >
            ← Back to Pages
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold text-navy">
            {res.row.title}
          </h1>
          <p className="font-mono text-xs text-navy/50">/{res.row.slug}</p>
        </div>
      </div>

      <PageEditor page={res.row} isAdmin={isAdmin} />
    </div>
  );
}

