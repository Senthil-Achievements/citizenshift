/**
 * /account/settings — Personal Information.
 *
 * Every field maps to a real column on `public.profiles`:
 *   first_name, last_name, username, phone_number, date_of_birth,
 *   state, zip_code, street_address
 *
 * Email is displayed read-only: changing an email address is an Auth-server
 * operation with its own confirmation flow, not a profile column.
 *
 * The layout and labels follow the supplied reference screenshot. Nothing is
 * saved to a fake store — submissions call updateOwnProfile(), which scopes
 * the update to the session user's own row under RLS.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project; profiles migration not yet
 * applied (docs/supabase-configuration-report.md).
 */

import { PersonalInfoForm } from "@/components/account/PersonalInfoForm";
import { verifySession } from "@/lib/supabase/server";
import { SupabaseConfigurationError } from "@/lib/supabase/env";
import { getOwnProfile, ensureOwnProfile } from "@/lib/supabase/profiles";
import { NotConfiguredNotice } from "@/components/NotConfiguredNotice";
import type { ProfileRow } from "@/lib/supabase/profiles";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let user;
  try {
    ({ user } = await verifySession());
  } catch (err) {
    // Unconfigured deployment → honest notice instead of an unhandled 500.
    if (err instanceof SupabaseConfigurationError) {
      return <NotConfiguredNotice area="Account settings" missing={err.missing} />;
    }
    throw err;
  }

  let profile: ProfileRow | null = null;
  try {
    profile = await getOwnProfile();
    if (!profile && user) {
      const res = await ensureOwnProfile();
      profile = res.row;
    }
  } catch (err) {
    console.error("[settings] load:", err);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-berry">Settings</p>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-semibold leading-tight tracking-[-0.02em] text-navy">
          Personal Information
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/70">
          These details identify your congressional district and representatives. Fields marked
          optional are never required. Your email address is managed by the authentication
          service and cannot be edited here.
        </p>
      </header>

      <PersonalInfoForm
        email={user?.email ?? ""}
        provider={
          (user?.app_metadata?.provider as string | undefined) ??
          user?.identities?.[0]?.provider ??
          "email"
        }
        initial={{
          first_name: profile?.first_name ?? "",
          last_name: profile?.last_name ?? "",
          username: profile?.username ?? "",
          phone_number: profile?.phone_number ?? "",
          date_of_birth: profile?.date_of_birth ?? "",
          state: profile?.state ?? "",
          zip_code: profile?.zip_code ?? "",
          street_address: profile?.street_address ?? "",
        }}
        notConfigured={profile === null && user !== null}
      />
    </div>
  );
}
