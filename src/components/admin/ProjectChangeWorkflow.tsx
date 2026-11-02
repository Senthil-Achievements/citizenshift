/**
 * ProjectChangeWorkflow — administrator-facing explanation of how to move the
 * application to a different Supabase project.
 *
 * This is deliberately static copy, not a form. A UI that let an admin type a
 * new project reference would imply that switching the field switches the
 * Auth backend; it does not. The reference is derived from the deployment
 * environment, so a change is a deploy-time operation with a checklist.
 *
 * It also states plainly that changing a URL does NOT migrate customers.
 */

export function ProjectChangeWorkflow() {
  const steps = [
    {
      n: 1,
      title: "Verify the destination project",
      body: "Confirm the target project reference in the Supabase Dashboard before touching anything. Migrating to the wrong project is not self-correcting.",
    },
    {
      n: 2,
      title: "Configure environment variables",
      body: "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, NEXT_PUBLIC_SITE_URL and CITIZENSHIFT_ADMIN_USER_IDS in the deployment environment (for example Vercel → Project → Settings → Environment Variables).",
    },
    {
      n: 3,
      title: "Configure the Google OAuth provider",
      body: "Enable Google under Authentication → Providers in the destination project and supply the OAuth client ID and secret created for CitizenShift.",
    },
    {
      n: 4,
      title: "Set Site URL and the redirect allowlist",
      body: "Site URL must be https://citizenshift.us in production. Add the /auth/callback path to the redirect allowlist so the PKCE exchange is accepted.",
    },
    {
      n: 5,
      title: "Apply compatible schema migrations",
      body: "Run supabase/migrations against the destination (supabase db push) and confirm the profiles table, its indexes and its RLS policies exist.",
    },
    {
      n: 6,
      title: "Verify Auth and database access",
      body: "Check this page shows Connected for both Authentication and Database, then run a real sign-in.",
    },
    {
      n: 7,
      title: "Deploy with the new configuration",
      body: "Redeploy so the new environment variables are picked up. Environment changes do not take effect until the next build.",
    },
    {
      n: 8,
      title: "Verify the customer database",
      body: "Open Customers and confirm the expected accounts appear. If they do not, you are pointed at the wrong project — stop and re-check step 1.",
    },
  ];

  return (
    <section className="border hairline bg-paper">
      <h2 className="border-b hairline px-5 py-4 font-display text-lg font-semibold text-navy">
        Changing the connected Supabase project
      </h2>

      <div className="border-b hairline bg-icy-50 px-5 py-4">
        <p className="text-sm leading-relaxed text-navy/80">
          <strong className="font-semibold text-navy">Changing the project URL does not
          transfer customer accounts or passwords.</strong>{" "}
          Authentication identities live in the destination project's own Auth schema. Moving
          between projects requires a separate, planned customer migration — export, transform
          and re-import of users and profiles — which is out of scope for a configuration change.
        </p>
      </div>

      <ol className="divide-y hairline">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4 px-5 py-4">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full border border-navy/20 font-mono text-[11px] font-bold text-navy"
            >
              {s.n}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy/70">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="border-t hairline px-5 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/45">
        There is intentionally no form on this page — the project reference is derived from the
        environment and cannot be switched from the browser.
      </p>
    </section>
  );
}
