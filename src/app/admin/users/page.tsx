import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listUsers } from "@/lib/cms/users";
import { UserManager } from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  // User management is admin-only per AUTH_ROUTES and guard policy
  if (principal.role !== "admin") {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">Forbidden</h1>
        <p className="mt-2 text-sm text-navy/70">Only administrators can manage users and roles.</p>
      </div>
    );
  }

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">User Management</h1>
        <p className="mt-3 text-sm text-navy/70">Supabase is not configured yet — user registry is unreachable.</p>
      </div>
    );
  }

  const db = getAdminClient();
  const res = await listUsers({ q: params.q, perPage: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">User Management</h1>
          <p className="mt-1 text-sm text-navy/60">
            {res.rows.length} accounts found · Manage administrative and editor roles
          </p>
        </div>
      </div>

      <div className="border hairline bg-paper p-4">
        <form method="get" className="flex max-w-md items-center gap-2">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search users by email or name..."
            className="w-full rounded border hairline bg-paper px-3 py-1.5 text-xs text-navy focus:border-navy focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-navy px-3 py-1.5 text-xs font-semibold text-paper hover:bg-navy-600"
          >
            Search
          </button>
        </form>
      </div>

      <UserManager users={res.rows} isAdmin={true} />
    </div>
  );
}
