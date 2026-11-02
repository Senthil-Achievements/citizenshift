/**
 * /account/profile — the signed-in customer's profile view.
 *
 * Reads the real Auth user plus the owner's own profile row. Nothing here is
 * fabricated: where a value is absent the page says so.
 *
 * Features outside this authentication milestone (saved bills, community
 * activity, messages, voting history) are shown as explicitly pending rather
 * than populated with fake data.
 *
 * ⚠️ UNVERIFIED BUILD — see docs/supabase-configuration-report.md.
 */

import Link from "next/link";
import { verifySession } from "@/lib/supabase/server";
import { SupabaseConfigurationError } from "@/lib/supabase/env";
import { getOwnProfile, ensureOwnProfile } from "@/lib/supabase/profiles";
import { AUTH_ROUTES } from "@/config/auth-routes";
import { NotConfiguredNotice } from "@/components/NotConfiguredNotice";
import type { ProfileRow } from "@/lib/supabase/profiles";

export const dynamic = "force-dynamic";

const DATE_FMT: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

function initials(first?: string | null, last?: string | null): string {
  const a = (first ?? "").trim().charAt(0);
  const b = (last ?? "").trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border hairline bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b hairline py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">{label}</p>
      <p className="mt-1 text-sm text-navy">{value}</p>
    </div>
  );
}

function Pending({ note }: { note: string }) {
  return (
    <div className="border-l-2 border-icy pl-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">Pending</p>
      <p className="mt-1 text-sm leading-relaxed text-navy/70">{note}</p>
    </div>
  );
}

export default async function ProfilePage() {
  let user;
  try {
    ({ user } = await verifySession());
  } catch (err) {
    // Unconfigured deployment → honest notice instead of an unhandled 500.
    if (err instanceof SupabaseConfigurationError) {
      return <NotConfiguredNotice area="Account profile" missing={err.missing} />;
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
    console.error("[profile] load:", err);
  }

  const firstName = profile?.first_name ?? (user?.user_metadata?.given_name as string | undefined) ?? null;
  const lastName = profile?.last_name ?? (user?.user_metadata?.family_name as string | undefined) ?? null;
  const provider =
    (user?.app_metadata?.provider as string | undefined) ??
    user?.identities?.[0]?.provider ??
    "email";

  const incomplete =
    profile && !profile.onboarding_completed_at;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-navy font-display text-xl font-semibold text-paper"
          >
            {initials(firstName, lastName)}
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-berry">Your profile</p>
            <h1 className="mt-1 font-display text-[clamp(1.5rem,3.5vw,2.2rem)] font-semibold leading-tight tracking-[-0.02em] text-navy">
              {[firstName, lastName].filter(Boolean).join(" ") || "Set up your profile"}
            </h1>
            <p className="mt-1 text-sm text-navy/65">{user?.email ?? "—"}</p>
          </div>
        </div>

        <Link
          href={AUTH_ROUTES.settings}
          className="flex h-11 items-center rounded-full bg-berry px-6 text-sm font-bold text-paper hover:bg-berry-600"
        >
          Edit personal information
        </Link>
      </header>

      {incomplete && (
        <div className="border hairline bg-icy-100 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/60">
            Profile incomplete
          </p>
          <p className="mt-1 text-sm text-navy/80">
            Finish onboarding so we can match you to the right representatives.{" "}
            <Link
              href={AUTH_ROUTES.completeProfile}
              className="font-semibold text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
            >
              Continue setup
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Profile information"
          action={
            <Link
              href={AUTH_ROUTES.settings}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-berry underline underline-offset-4"
            >
              Edit
            </Link>
          }
        >
          <Item label="First name" value={profile?.first_name || "— not set —"} />
          <Item label="Last name" value={profile?.last_name || "— not set —"} />
          <Item label="Username" value={profile?.username ? `@${profile.username}` : "— not set —"} />
          <Item label="Email" value={<>{user?.email ?? "—"} <span className="text-navy/45">(read-only)</span></>} />
          <Item
            label="Authentication provider"
            value={<span className="font-mono text-[12px]">{provider === "google" ? "Google" : provider === "email" ? "Email" : provider}</span>}
          />
          <Item
            label="Member since"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", DATE_FMT) : "—"}
          />
        </Section>

        <Section title="Location details">
          <Item label="State" value={profile?.state || "— not set —"} />
          <Item label="ZIP code" value={profile?.zip_code || "— not set —"} />
          <Item
            label="Street address"
            value={
              <>
                {profile?.street_address || "— not set —"}{" "}
                {profile?.street_address && <span className="text-navy/45">(private)</span>}
              </>
            }
          />
          <div className="pt-3">
            <p className="text-[13px] leading-relaxed text-navy/65">
              District details are derived from your state and ZIP. Your street address, date of
              birth and phone number are private and never appear in public views.
            </p>
          </div>
        </Section>

        <Section title="Policy interests">
          <Pending note="Policy-interest selection ships with the next milestone. No interests are recorded yet, so none are shown." />
        </Section>

        <Section title="Representative lookup">
          <Pending note="Representative matching activates once your location details are saved. Until then use Contact Your Rep on any bill — it opens the official House and Senate lookup channels." />
        </Section>

        <Section title="Voting activity">
          <Pending note="Your votes on legislation will appear here. Nothing is recorded yet." />
        </Section>

        <Section title="Saved bills">
          <Pending note="Saved bills arrive with the next milestone. The list is empty because nothing has been saved." />
        </Section>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
        Profile status:{" "}
        {profile?.onboarding_completed_at
          ? "onboarding complete"
          : profile?.onboarding_skipped_at
            ? "onboarding skipped — still incomplete"
            : "onboarding not completed"}
      </p>
    </div>
  );
}
