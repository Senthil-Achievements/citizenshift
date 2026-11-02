/**
 * /admin/integrations/supabase — read-only view of the connected Supabase
 * project.
 *
 * Everything shown here is DERIVED from the server environment at request
 * time. There is no editable project-reference field, because a form that
 * "switches" the backend would be a lie: the reference comes from
 * NEXT_PUBLIC_SUPABASE_URL and changing it means changing the deployment
 * environment and redeploying.
 *
 * Never returns a secret key. Never reads from a settings table.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 */

import { checkSupabaseConfiguration } from "@/lib/supabase/env";
import { probeSupabase, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { ProjectChangeWorkflow } from "@/components/admin/ProjectChangeWorkflow";

export const dynamic = "force-dynamic";

/** In-memory record of the last successful probe for this server process. */
let lastSuccess: { at: string; latencyMs: number } | null = null;

function StatusDot({ ok, unknown }: { ok: boolean | null; unknown?: boolean }) {
  const tone = unknown ? "bg-navy/30" : ok ? "bg-emerald-600" : "bg-berry";
  return (
    <span aria-hidden="true" className={`inline-block size-2.5 shrink-0 rounded-full ${tone}`} />
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b hairline px-5 py-3.5 last:border-b-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">{label}</dt>
      <dd className="text-right text-sm text-navy">{children}</dd>
    </div>
  );
}

export default async function SupabaseIntegrationsPage() {
  const config = checkSupabaseConfiguration();

  // Health probe — only attempted when the admin client can exist.
  const probe = isAdminClientAvailable()
    ? await probeSupabase()
    : { authReachable: false, databaseReachable: false, latencyMs: 0, error: "Not configured" };

  if (probe.authReachable && probe.databaseReachable) {
    lastSuccess = { at: new Date().toISOString(), latencyMs: probe.latencyMs };
  }

  // Provider status: read from the Auth server, never hardcoded.
  const admin = await getAuthorizedAdminClient();
  let providerSummary = "Unavailable";
  let emailEnabled: boolean | null = null;
  let googleEnabled: boolean | null = null;

  if (admin) {
    try {
      // listUsers with 1 row is the cheapest authenticated Auth-server call we
      // can make to prove Auth is answering; provider config itself lives in
      // the Supabase Dashboard and is not exposed by the JS admin API.
      const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (!error) {
        providerSummary = "Auth server reachable — see Dashboard for provider toggles";
      }
    } catch {
      /* reported via probe */
    }
  }

  const connected = config.ok && probe.authReachable;

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">
          Integrations
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-semibold leading-tight tracking-[-0.02em] text-navy">
          Supabase
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/70">
          Read-only status of the connected Supabase project. Values below are derived from
          the server environment on every request — this page cannot change them.
        </p>
      </header>

      {/* ---- configuration ---- */}
      <section className="border hairline bg-paper">
        <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
          Project
        </h2>

        {!config.ok && (
          <div className="border-b hairline bg-berry-100 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-berry-700">
              Configuration incomplete
            </p>
            <ul className="mt-2 space-y-1 text-sm text-berry-700">
              {config.errors.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-berry-700">
              Copy <code className="font-mono">.env.example</code> to{' '}
              <code className="font-mono">.env.local</code> and restart the deployment.
            </p>
          </div>
        )}

        <dl>
          <Row label="Project reference (read-only)">
            <span className="font-mono text-[13px] font-semibold">
              {config.projectRef || "— not configured —"}
            </span>
          </Row>
          <Row label="Project URL host">
            <span className="font-mono text-[13px]">{config.host || "— not configured —"}</span>
          </Row>
          <Row label="Key style">
            <span className="font-mono text-[13px]">
              {config.keyStyle === "publishable/secret"
                ? "publishable / secret"
                : config.keyStyle === "legacy anon/service_role"
                  ? "legacy anon / service_role (fallback supported)"
                  : "unknown"}
            </span>
          </Row>
          <Row label="Site URL">
            <span className="font-mono text-[13px]">{config.siteUrl || "— not set —"}</span>
          </Row>
          <Row label="Admin allowlist entries">
            <span className="font-mono text-[13px]">{config.adminUserCount}</span>
          </Row>
        </dl>
      </section>

      {/* ---- health ---- */}
      <section className="border hairline bg-paper">
        <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
          Connection health
        </h2>
        <dl>
          <Row label="Overall">
            <span className="inline-flex items-center gap-2">
              <StatusDot ok={connected} unknown={!config.ok} />
              {connected ? "Connected" : config.ok ? "Not reachable" : "Not configured"}
            </span>
          </Row>
          <Row label="Authentication service">
            <span className="inline-flex items-center gap-2">
              <StatusDot ok={probe.authReachable} unknown={!config.ok} />
              {probe.authReachable ? "Reachable" : "Unavailable"}
            </span>
          </Row>
          <Row label="Database (profiles)">
            <span className="inline-flex items-center gap-2">
              <StatusDot ok={probe.databaseReachable} unknown={!config.ok} />
              {probe.databaseReachable
                ? "Reachable"
                : probe.error && /relation|does not exist/i.test(probe.error)
                  ? "Table missing — run supabase/migrations"
                  : "Unavailable"}
            </span>
          </Row>
          <Row label="Latency">
            <span className="font-mono text-[13px]">
              {probe.latencyMs ? `${probe.latencyMs} ms` : "—"}
            </span>
          </Row>
          <Row label="Last successful health check">
            <span className="font-mono text-[13px]">
              {lastSuccess
                ? `${new Date(lastSuccess.at).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  })} (${lastSuccess.latencyMs} ms)`
                : "None in this server process"}
            </span>
          </Row>
          <Row label="Authentication providers">
            <span className="text-[13px]">{providerSummary}</span>
          </Row>
          <Row label="Email / Google enabled">
            <span className="font-mono text-[13px]">
              {emailEnabled === null && googleEnabled === null
                ? "Not exposed by the admin API — check Dashboard → Authentication → Providers"
                : `${emailEnabled ? "on" : "off"} / ${googleEnabled ? "on" : "off"}`}
            </span>
          </Row>
        </dl>
        {probe.error && (
          <p className="border-t hairline bg-icy-50 px-5 py-3 font-mono text-[11px] text-navy/60">
            Last error: {probe.error}
          </p>
        )}
      </section>

      {/* ---- warnings ---- */}
      <section className="border hairline bg-paper">
        <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
          Configuration warnings
        </h2>
        {config.warnings.length === 0 ? (
          <p className="px-5 py-4 text-sm text-navy/70">No warnings.</p>
        ) : (
          <ul className="divide-y hairline">
            {config.warnings.map((w) => (
              <li key={w} className="flex gap-3 px-5 py-3.5 text-sm leading-relaxed text-navy/80">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-berry" />
                {w}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- project change workflow ---- */}
      <ProjectChangeWorkflow />

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
        Secret keys are never returned to the browser and are never stored in a settings table.
      </p>
    </div>
  );
}
