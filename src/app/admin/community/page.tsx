import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listCommunities } from "@/lib/cms/community";
import { CommunityManager } from "@/components/admin/CommunityManager";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  const params = await searchParams;
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">Community Management</h1>
        <p className="mt-3 text-sm text-navy/70">Supabase is not configured yet — community registry is unreachable.</p>
      </div>
    );
  }

  const db = getAdminClient();
  const res = await listCommunities(db, {
    q: params.q,
    publishState: params.state,
    perPage: 100,
  });

  const isAdmin = principal.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Community Management</h1>
          <p className="mt-1 text-sm text-navy/60">
            {res.rows.length} {res.rows.length === 1 ? "community" : "communities"} registered · Manage civic spaces and channels
          </p>
        </div>
      </div>

      <CommunityManager communities={res.rows} isAdmin={isAdmin} />
    </div>
  );
}

