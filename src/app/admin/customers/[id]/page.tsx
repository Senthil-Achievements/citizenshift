/**
 * /admin/customers/[id] — single customer detail.
 *
 * Server-side only. Re-verifies admin authorization before constructing the
 * elevated client, then combines the Auth user record with the non-sensitive
 * profile columns.
 *
 * PRIVACY — shows identity, provider, timestamps, profile completion and the
 * presence (not the values) of optional contact fields. Deliberately excluded:
 * date of birth, street address, ZIP code, phone number, race/ethnicity and
 * political-leaning data.
 *
 * ⚠️ UNVERIFIED BUILD — see docs/supabase-configuration-report.md.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { checkSupabaseConfiguration } from "@/lib/supabase/env";
import { NotConfiguredNotice } from "@/components/NotConfiguredNotice";
import { AUTH_ROUTES } from "@/config/auth-routes";

export const dynamic = "force-dynamic";

const DATE_FMT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

function fmt(v: string | number | Date | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-US", DATE_FMT);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b hairline px-5 py-3.5 last:border-b-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">{label}</dt>
      <dd className="mt-1 break-words text-sm text-navy">{children}</dd>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Distinguish "not configured" from "not authorized".
  const config = checkSupabaseConfiguration();
  if (!config.ok) {
    return <NotConfiguredNotice area="Admin · Customer detail" missing={config.errors} />;
  }

  const admin = await getAuthorizedAdminClient();
  if (!admin) {
    return (
      <div className="border hairline bg-paper p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">403 — Forbidden</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-navy">Not authorized.</h1>
      </div>
    );
  }

  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data?.user) notFound();

  const user = data.user;

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "first_name, last_name, username, state, onboarding_completed_at, onboarding_skipped_at, created_at, updated_at, phone_number, date_of_birth, street_address, zip_code",
    )
    .eq("id", id)
    .maybeSingle();

  const p = profile as
    | {
        first_name?: string | null;
        last_name?: string | null;
        username?: string | null;
        state?: string | null;
        onboarding_completed_at?: string | null;
        onboarding_skipped_at?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        phone_number?: string | null;
        date_of_birth?: string | null;
        street_address?: string | null;
        zip_code?: string | null;
      }
    | null
    | undefined;

  const providers = [...new Set((user.identities ?? []).map((i) => i.provider))];
  const appProvider =
    typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null;

  const displayName =
    [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—";

  const completion = p
    ? p.onboarding_completed_at
      ? "complete"
      : [p.first_name, p.last_name, p.username, p.state, p.zip_code].filter(Boolean).length > 0
        ? "in_progress"
        : "not_started"
    : "not_started";

  // Presence flags only — the values themselves are not rendered here.
  const hasContact = Boolean(p?.phone_number || p?.street_address || p?.zip_code || p?.date_of_birth);

  return (
    <div className="space-y-6">
      <nav className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
        <Link href={AUTH_ROUTES.adminCustomers} className="hover:text-navy">
          ← Customers
        </Link>
      </nav>

      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">Customer detail</p>
        <h1 className="mt-2 font-display text-[clamp(1.5rem,3.5vw,2.2rem)] font-semibold leading-tight tracking-[-0.02em] text-navy">
          {displayName}
        </h1>
        <p className="mt-1 font-mono text-[13px] text-navy/60">{user.email ?? "—"}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border hairline bg-paper">
          <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
            Authentication
          </h2>
          <dl>
            <Field label="Customer UUID">
              <span className="font-mono text-[12px]">{user.id}</span>
            </Field>
            <Field label="Email">
              {user.email ?? "—"}
              {!user.email_confirmed_at && (
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-berry">
                  unconfirmed
                </span>
              )}
            </Field>
            <Field label="Authentication provider">
              <span className="font-mono text-[12px]">
                {[...(appProvider ? [appProvider] : []), ...providers]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(", ") || "—"}
              </span>
            </Field>
            <Field label="Registered">{fmt(user.created_at)}</Field>
            <Field label="Last sign-in">{fmt(user.last_sign_in_at)}</Field>
            <Field label="Role">
              <span className="font-mono text-[12px]">{(user.role as string) ?? "authenticated"}</span>
            </Field>
          </dl>
        </section>

        <section className="border hairline bg-paper">
          <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
            Profile
          </h2>
          <dl>
            <Field label="Profile status">
              <span
                className={`font-mono text-[12px] uppercase tracking-[0.12em] ${
                  completion === "complete"
                    ? "text-navy"
                    : completion === "in_progress"
                      ? "text-berry"
                      : "text-navy/50"
                }`}
              >
                {completion === "complete"
                  ? "Complete"
                  : completion === "in_progress"
                    ? "In progress"
                    : "Not started"}
              </span>
            </Field>
            <Field label="Username">{p?.username ? `@${p.username}` : "—"}</Field>
            <Field label="State">{p?.state ?? "—"}</Field>
            <Field label="Onboarding completed">
              {p?.onboarding_completed_at ? fmt(p.onboarding_completed_at) : "No"}
            </Field>
            <Field label="Onboarding skipped">
              {p?.onboarding_skipped_at ? fmt(p.onboarding_skipped_at) : "No"}
            </Field>
            <Field label="Profile created">{fmt(p?.created_at)}</Field>
            <Field label="Profile updated">{fmt(p?.updated_at)}</Field>
          </dl>
        </section>
      </div>

      <section className="border hairline bg-icy-50 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
          Restricted personal data
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy/75">
          Date of birth, phone number, street address and ZIP code are held in the profiles
          table but are not displayed in the customer list or this detail view —{" "}
          {hasContact
            ? "some of these fields are populated for this customer."
            : "none of these fields are populated for this customer."}{" "}
          Race/ethnicity and political-leaning data are not collected at all. To inspect or
          delete a specific field, use the Supabase Dashboard under the owner's own account
          or a documented data-request process.
        </p>
      </section>
    </div>
  );
}
