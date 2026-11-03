import Link from "next/link";
import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listAuditLogs } from "@/lib/cms/audit";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export const dynamic = "force-dynamic";

interface SearchParams {
  entityType?: string;
  page?: string;
}

export default async function AdminAuditPage({
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
        <h1 className="font-display text-2xl font-semibold text-navy">Audit Log</h1>
        <p className="mt-3 text-sm text-navy/70">Supabase is not configured yet — audit log is unreachable.</p>
      </div>
    );
  }

  const db = getAdminClient();
  const res = await listAuditLogs(db, {
    entity_type: params.entityType,
    page: params.page ? Number.parseInt(params.page, 10) : 1,
    perPage: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Audit Logs</h1>
          <p className="mt-1 text-sm text-navy/60">
            Immutable activity log tracking every CMS mutation with before/after state diffs
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border hairline bg-paper p-4 text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50 mr-2">Filter by entity:</span>
        {[
          "all",
          "bill",
          "sponsor",
          "category",
          "link",
          "page",
          "user_role",
          "community",
          "channel",
          "setting",
        ].map((type) => {
          const active = (type === "all" && !params.entityType) || params.entityType === type;
          const query = new URLSearchParams();
          if (type !== "all") query.set("entityType", type);
          return (
            <Link
              key={type}
              href={`/admin/audit?${query.toString()}`}
              className={`rounded px-2.5 py-1 capitalize transition ${
                active
                  ? "bg-navy text-paper"
                  : "border hairline text-navy/70 hover:bg-icy-100"
              }`}
            >
              {type.replace("_", " ")}
            </Link>
          );
        })}
      </div>

      <AuditLogViewer logs={res.rows} />
    </div>
  );
}
