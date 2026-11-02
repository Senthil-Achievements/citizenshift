/**
 * /admin/customers — customer records from Supabase Auth.
 *
 * Runs entirely on the server. The list is produced by
 * `supabase.auth.admin.listUsers()` using the secret-key client, which is
 * constructed only after `getAuthorizedAdminClient()` re-verifies the caller
 * against the server-only allowlist. Nothing here is reachable from a browser
 * component, and no elevated key is ever returned to one.
 *
 * PRIVACY — this listing deliberately EXCLUDES date of birth, street address,
 * ZIP, phone number, race/ethnicity and political-leaning data. Only identity,
 * provider, timestamps and onboarding status are shown.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 * Customer management has NOT been confirmed against real registrations.
 */

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { checkSupabaseConfiguration } from "@/lib/supabase/env";
import { NotConfiguredNotice } from "@/components/NotConfiguredNotice";
import { AUTH_ROUTES } from "@/config/auth-routes";
import { CustomerFilters } from "@/components/admin/CustomerFilters";
import { profileCompletionStatus } from "@/lib/supabase/profiles";

export const dynamic = "force-dynamic";

/** Safety cap on how much of the Auth directory we page through for filtering. */
const MAX_USERS = 1000;
const PER_PAGE = 25;

interface SearchParams {
  q?: string;
  provider?: string;
  onboarding?: string;
  created_from?: string;
  created_to?: string;
  page?: string;
}

const DATE_FMT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", DATE_FMT);
}

function providerOf(user: { identities?: Array<{ provider?: string }> | null; app_metadata?: Record<string, unknown> }): string {
  const fromMeta = typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null;
  if (fromMeta) return fromMeta;
  const providers = (user.identities ?? []).map((i) => i.provider).filter(Boolean);
  return providers[0] ?? "email";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Distinguish "not configured" from "not authorized" — an unconfigured
  // deployment must not masquerade as a permissions failure.
  const config = checkSupabaseConfiguration();
  if (!config.ok) {
    return <NotConfiguredNotice area="Admin · Customers" missing={config.errors} />;
  }

  // Re-verify authorization before touching the elevated client.
  const admin = await getAuthorizedAdminClient();
  if (!admin) {
    // The layout already renders 403; this guards direct route access too.
    return (
      <div className="border hairline bg-paper p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">403 — Forbidden</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-navy">Not authorized.</h1>
        <p className="mt-3 text-sm text-navy/70">This account is not on the admin allowlist.</p>
      </div>
    );
  }

  /* ---------------- fetch the Auth directory ---------------- */
  let allUsers: User[] = [];
  let fetchError: string | null = null;
  let capped = false;

  try {
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) { fetchError = error.message; break; }
      allUsers = allUsers.concat(data.users);
      if (data.users.length < 100 || allUsers.length >= MAX_USERS) {
        if (allUsers.length >= MAX_USERS) capped = true;
        break;
      }
      page += 1;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load users";
  }

  /* ---------------- fetch profiles for onboarding status ---------------- */
  const profileById = new Map<
    string,
    {
      first_name: string | null;
      last_name: string | null;
      username: string | null;
      onboarding_completed_at: string | null;
      state: string | null;
      zip_code: string | null;
    }
  >();

  if (!fetchError && allUsers.length) {
    try {
      const ids = allUsers.map((u) => u.id);
      const { data: profiles } = await admin
        .from("profiles")
        .select(
          "id, first_name, last_name, username, onboarding_completed_at, state, zip_code",
        )
        .in("id", ids);

      for (const p of profiles ?? []) {
        profileById.set(p.id as string, {
          first_name: (p.first_name as string | null) ?? null,
          last_name: (p.last_name as string | null) ?? null,
          username: (p.username as string | null) ?? null,
          onboarding_completed_at: (p.onboarding_completed_at as string | null) ?? null,
          state: (p.state as string | null) ?? null,
          zip_code: (p.zip_code as string | null) ?? null,
        });
      }
    } catch {
      // Missing profiles table → every row reports "not started" honestly.
    }
  }

  /* ---------------- filters ---------------- */
  const q = (params.q ?? "").trim().toLowerCase();
  const providerFilter = (params.provider ?? "").trim().toLowerCase();
  const onboardingFilter = (params.onboarding ?? "").trim();
  const createdFrom = params.created_from ? new Date(params.created_from) : null;
  const createdTo = params.created_to ? new Date(params.created_to) : null;

  type Row = {
    id: string;
    name: string;
    email: string;
    provider: string;
    createdAt: string;
    lastSignIn: string | null;
    completion: "complete" | "in_progress" | "not_started";
    username: string | null;
  };

  const rows: Row[] = allUsers.map((u) => {
    const profile = profileById.get(u.id);
    const email = u.email ?? "—";
    const name = profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"
      : "—";

    return {
      id: u.id,
      name,
      email,
      provider: providerOf(u),
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      completion: profile
        ? profileCompletionStatus(profile)
        : "not_started",
      username: profile?.username ?? null,
    };
  });

  const filtered = rows.filter((r) => {
    if (q && !r.email.toLowerCase().includes(q) && !(r.username ?? "").toLowerCase().includes(q) && !r.name.toLowerCase().includes(q)) {
      return false;
    }
    if (providerFilter && r.provider.toLowerCase() !== providerFilter) return false;
    if (onboardingFilter && r.completion !== onboardingFilter) return false;
    if (createdFrom && new Date(r.createdAt) < createdFrom) return false;
    if (createdTo) {
      const end = new Date(createdTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(r.createdAt) > end) return false;
    }
    return true;
  });

  filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  /* ---------------- pagination ---------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, requestedPage), totalPages)
    : 1;
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const providerOptions = [...new Set(rows.map((r) => r.provider))].sort();

  const baseUrl = AUTH_ROUTES.adminCustomers;

  function withParams(next: Record<string, string | undefined>): string {
    const sp = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      q: params.q,
      provider: params.provider,
      onboarding: params.onboarding,
      created_from: params.created_from,
      created_to: params.created_to,
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `${baseUrl}?${s}` : baseUrl;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">Customers</p>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-semibold leading-tight tracking-[-0.02em] text-navy">
          Customer records
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/70">
          Live from Supabase Auth via the server-side admin API. Personal details such as date
          of birth and street address are intentionally not shown here.
        </p>
      </header>

      <CustomerFilters
        action={baseUrl}
        initial={{
          q: params.q ?? "",
          provider: params.provider ?? "",
          onboarding: params.onboarding ?? "",
          created_from: params.created_from ?? "",
          created_to: params.created_to ?? "",
        }}
        providerOptions={providerOptions}
      />

      {fetchError && (
        <div className="border border-berry/30 bg-berry-100 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-berry-700">
            Could not load customers
          </p>
          <p className="mt-1 text-sm text-berry-700">{fetchError}</p>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
        <span>
          {filtered.length} matching · {rows.length} loaded
          {capped ? ` · capped at ${MAX_USERS}` : ""}
        </span>
        <span>
          Page {page} of {totalPages}
        </span>
      </div>

      <div className="overflow-x-auto border hairline bg-paper">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b hairline">
              {["Customer UUID", "Name", "Email", "Provider", "Registered", "Last sign-in", "Profile"].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-navy/60">
                  {fetchError
                    ? "No data — see the error above."
                    : rows.length === 0
                      ? "No customers yet. Register an account to see it appear here."
                      : "No customers match these filters."}
                </td>
              </tr>
            )}
            {slice.map((r) => (
              <tr key={r.id} className="border-b hairline last:border-b-0 hover:bg-icy-50">
                <td className="px-4 py-3">
                  <Link
                    href={`${baseUrl}/${r.id}`}
                    className="font-mono text-[12px] text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
                  >
                    {r.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-navy">
                  {r.name}
                  {r.username && (
                    <span className="ml-2 font-mono text-[11px] text-navy/45">@{r.username}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-navy/80">{r.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-navy/70">
                    {r.provider === "google" ? "Google" : r.provider === "email" ? "Email" : r.provider}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-navy/70">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-navy/70">{formatDate(r.lastSignIn)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                      r.completion === "complete"
                        ? "text-navy"
                        : r.completion === "in_progress"
                          ? "text-berry"
                          : "text-navy/45"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${
                        r.completion === "complete"
                          ? "bg-navy"
                          : r.completion === "in_progress"
                            ? "bg-berry"
                            : "bg-navy/30"
                      }`}
                    />
                    {r.completion === "complete"
                      ? "Complete"
                      : r.completion === "in_progress"
                        ? "In progress"
                        : "Not started"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Customer pages" className="flex items-center gap-3">
          {page > 1 ? (
            <Link
              href={withParams({ page: String(page - 1) })}
              className="rounded-full border hairline bg-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-navy hover:border-navy/40"
            >
              ← Previous
            </Link>
          ) : (
            <span className="rounded-full border hairline bg-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/30">
              ← Previous
            </span>
          )}
          {page < totalPages ? (
            <Link
              href={withParams({ page: String(page + 1) })}
              className="rounded-full border hairline bg-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-navy hover:border-navy/40"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-full border hairline bg-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/30">
              Next →
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
