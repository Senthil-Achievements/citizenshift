"use client";

/**
 * AuthShell — shared chrome for /login, /signup, /forgot-password,
 * /reset-password and /complete-profile.
 *
 * Deliberately plain: navy text on soft white, one berry primary action, no
 * decorative motion. The legal links render an explicit "not yet published"
 * state when the client has not supplied URLs (authRoutes.privacyPolicy is
 * null), rather than an invented href.
 */

import Link from "next/link";
import { AUTH_ROUTES, legalRoute } from "@/config/auth-routes";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const privacy = legalRoute("privacyPolicy");
  const terms = legalRoute("termsOfService");

  return (
    <div className="min-h-screen bg-icy-50">
      <header className="border-b hairline bg-paper">
        <div className="shell flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-navy">
            CitizenShift
          </Link>
          <Link
            href={AUTH_ROUTES.afterLogout}
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50 hover:text-navy"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="shell flex min-h-[calc(100vh-4rem)] items-start justify-center py-10 sm:py-16">
        <div className="w-full max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-berry">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-navy">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-sm leading-relaxed text-navy/70">{subtitle}</p>}

          <div className="mt-7 border hairline bg-paper p-6 sm:p-7">{children}</div>

          {footer && <div className="mt-5">{footer}</div>}

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/40">
            {privacy ? (
              <a href={privacy} className="hover:text-navy">Privacy Policy</a>
            ) : (
              <span title="Not yet published">Privacy Policy — not yet published</span>
            )}
            {" · "}
            {terms ? (
              <a href={terms} className="hover:text-navy">Terms of Service</a>
            ) : (
              <span title="Not yet published">Terms of Service — not yet published</span>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

/** Primary berry button, full width in forms. */
export function AuthSubmit({ children, pending }: { children: React.ReactNode; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-berry px-6 text-sm font-bold text-paper transition hover:bg-berry-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

/** Error / status banner. Never colour-only — always text. */
export function AuthMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mt-4 border px-4 py-3 text-sm leading-relaxed ${
        tone === "error"
          ? "border-berry/30 bg-berry-100 text-berry-700"
          : "border-navy/15 bg-icy-100 text-navy/80"
      }`}
    >
      {children}
    </div>
  );
}

/** Google sign-in button. Renders disabled with an honest reason when unconfigured. */
export function GoogleButton({
  onClick,
  pending,
  disabled,
  disabledReason,
}: {
  onClick: () => void;
  pending?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        aria-describedby={disabled && disabledReason ? "google-disabled-reason" : undefined}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border hairline bg-paper px-6 text-sm font-semibold text-navy transition hover:border-navy/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/>
          <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/>
        </svg>
        {pending ? "Redirecting…" : "Continue with Google"}
      </button>
      {disabled && disabledReason && (
        <p id="google-disabled-reason" className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
