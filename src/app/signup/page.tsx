"use client";

/**
 * /signup — email registration with confirmation, plus Google OAuth.
 *
 * After signUp() with email confirmation enabled, Supabase returns a session
 * only when auto-confirm is on. We therefore never pretend the account is
 * ready: if there is no session, the user is told to check their inbox.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell, AuthSubmit, AuthMessage, GoogleButton } from "@/components/auth/AuthShell";
import { getBrowserClient } from "@/lib/supabase/client";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const MIN_PASSWORD = 8;

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextRaw = params.get("next");
  const next = safeInternalRedirect(nextRaw, AUTH_ROUTES.afterFirstLogin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "info">("error");
  const [field, setField] = useState<"email" | "password" | "confirm" | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const configured = isSupabaseConfigured();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setField(null);
    setNeedsConfirmation(false);

    const trimmed = email.trim();
    if (!trimmed) { setField("email"); setMessage("Enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setField("email"); setMessage("Enter a valid email address."); return;
    }
    if (password.length < MIN_PASSWORD) {
      setField("password"); setMessage(`Password must be at least ${MIN_PASSWORD} characters.`); return;
    }
    if (password !== confirm) {
      setField("confirm"); setMessage("Passwords do not match."); return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setMessage("Registration is unavailable — Supabase is not configured for this deployment.");
      return;
    }

    setPending(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "")}${AUTH_ROUTES.callback}?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setMessage(error.message ?? "Registration failed.");
        return;
      }

      // A session means auto-confirm is enabled → go straight to onboarding.
      if (data.session) {
        router.push(AUTH_ROUTES.afterFirstLogin);
        router.refresh();
        return;
      }

      // Otherwise an email confirmation is required. Say so plainly.
      setNeedsConfirmation(true);
      setTone("info");
      setMessage(`Check ${trimmed} for a confirmation link to finish creating your account.`);
    } catch (err) {
      console.error("[signup] unexpected:", err);
      setMessage("Something went wrong creating your account. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    const supabase = getBrowserClient();
    if (!supabase) {
      setMessage("Registration is unavailable — Supabase is not configured for this deployment.");
      return;
    }

    setGooglePending(true);
    try {
      const site = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "openid email profile",
          redirectTo: `${site}${AUTH_ROUTES.callback}?next=${encodeURIComponent(AUTH_ROUTES.afterFirstLogin)}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        setMessage(error.message ?? "Could not start Google sign-up.");
        setGooglePending(false);
      }
    } catch (err) {
      console.error("[signup] google:", err);
      setMessage("Could not start Google sign-up.");
      setGooglePending(false);
    }
  }

  async function resendConfirmation() {
    const supabase = getBrowserClient();
    if (!supabase || !email.trim()) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "")}${AUTH_ROUTES.callback}?next=${encodeURIComponent(next)}`,
      },
    });
    setTone("info");
    setMessage(error ? `Could not resend: ${error.message}` : "Confirmation email sent again.");
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Join CitizenShift."
      subtitle="Track legislation, save bills and reach your representatives — free and nonpartisan."
      footer={
        <p className="text-sm text-navy/70">
          Already have an account?{" "}
          <Link
            href={`${AUTH_ROUTES.login}${nextRaw ? `?next=${encodeURIComponent(nextRaw)}` : ""}`}
            className="font-semibold text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {!configured && (
        <AuthMessage tone="info">
          Supabase is not configured in this deployment, so registration is disabled.
        </AuthMessage>
      )}

      {message && <AuthMessage tone={tone}>{message}</AuthMessage>}

      {needsConfirmation && (
        <button
          type="button"
          onClick={resendConfirmation}
          className="mt-3 text-[11px] font-semibold text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
        >
          Resend confirmation email
        </button>
      )}

      <div className="mt-4 space-y-3">
        <GoogleButton
          onClick={handleGoogle}
          pending={googlePending}
          disabled={!configured}
          disabledReason={!configured ? "Requires Supabase configuration" : undefined}
        />
      </div>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-navy/15" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/40">or</span>
        <span className="h-px flex-1 bg-navy/15" />
      </div>

      <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="su-email" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
            Email
          </label>
          <input
            id="su-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={field === "email"}
            className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="su-password" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
            Password
          </label>
          <input
            id="su-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={field === "password"}
            className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none"
            placeholder={`At least ${MIN_PASSWORD} characters`}
          />
        </div>

        <div>
          <label htmlFor="su-confirm" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
            Confirm password
          </label>
          <input
            id="su-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={field === "confirm"}
            className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none"
            placeholder="Repeat your password"
          />
        </div>

        <AuthSubmit pending={pending}>Create account</AuthSubmit>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
