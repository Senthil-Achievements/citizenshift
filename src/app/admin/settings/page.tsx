import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listSettings } from "@/lib/cms/settings";
import { SettingsManager } from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  // Site settings is admin-only per AUTH_ROUTES and guard policy
  if (principal.role !== "admin") {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">Forbidden</h1>
        <p className="mt-2 text-sm text-navy/70">Only administrators can manage site settings.</p>
      </div>
    );
  }

  if (!isAdminClientAvailable()) {
    return (
      <div className="border hairline bg-paper p-8">
        <h1 className="font-display text-2xl font-semibold text-navy">Site Settings</h1>
        <p className="mt-3 text-sm text-navy/70">Supabase is not configured yet — site settings are unreachable.</p>
      </div>
    );
  }

  const db = getAdminClient();
  const res = await listSettings(db);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Site Settings</h1>
          <p className="mt-1 text-sm text-navy/60">
            Configure global website behavior, flags and copy without editing code
          </p>
        </div>
      </div>

      <SettingsManager settings={res.rows} isAdmin={true} />
    </div>
  );
}

