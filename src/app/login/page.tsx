"use client";

/**
 * /login — email/password sign-in plus Google OAuth (PKCE).
 *
 * Reads `next` from the URL and passes it through safeInternalRedirect on the
 * server before any redirect happens, so a crafted `?next=https://evil.com`
 * never escapes the origin.
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

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextRaw = params.get("next");
  const providerError = params.get("error");
  const errorDescription = params.get("error_description");
  const next = safeInternalRedirect(nextRaw, AUTH_ROUTES.afterReturningLogin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [field, setField] = useState<"email" | "password" | null>(null);

  const configured = isSupabaseConfigured();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setField(null);

    if (!email.trim()) { setField("email"); setMessage("Enter your email address."); return; }
    if (!password) { setField("password"); setMessage("Enter your password."); return; }

    const supabase = getBrowserClient();
    if (!supabase) {
      setMessage("Sign-in is unavailable — Supabase is not configured for this deployment.");
      return;
    }

    setPending(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Map Supabase codes to honest, non-leaky copy.
        if (error.message?.toLowerCase().includes("invalid login")) {
          setField("password");
          setMessage("That email and password combination did not match.");
        } else if (error.message?.toLowerCase().includes("email not confirmed")) {
          setMessage("Confirm your email first — check your inbox for the confirmation link.");
        } else {
          setMessage(error.message ?? "Sign-in failed.");
        }
        return;
      }

      if (!data.session) {
        setMessage("Sign-in did not complete. Please try again.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      console.error("[login] unexpected:", err);
      setMessage("Something went wrong signing in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    const supabase = getBrowserClient();
    if (!supabase) {
      setMessage("Sign-in is unavailable — Supabase is not configured for this deployment.");
      return;
    }

    setGooglePending(true);
    try {
      const site = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Identity scopes only: openid, email, profile.
          scopes: "openid email profile",
          redirectTo: `${site}${AUTH_ROUTES.callback}?next=${encodeURIComponent(next)}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        setMessage(error.message ?? "Could not start Google sign-in.");
        setGooglePending(false);
      }
      // On success the browser navigates away; no further state needed.
    } catch (err) {
      console.error("[login] google:", err);
      setMessage("Could not start Google sign-in.");
      setGooglePending(false);
    }
  }

  const providerErrorCopy =
    providerError === "access_denied"
      ? "Google sign-in was cancelled or denied."
      : providerError === "missing_code"
        ? "The sign-in response was incomplete. Please try again."
        : providerError === "exchange_failed" || providerError === "callback_failed"
          ? "Sign-in could not be completed with the authentication service."
          : providerError
            ? errorDescription || `Sign-in failed (${providerError}).`
            : null;

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back."
      subtitle="Sign in to save bills, follow legislation and contact your representatives."
      footer={
        <p className="text-sm text-navy/70">
          No account yet?{" "}
          <Link
            href={`${AUTH_ROUTES.signup}${nextRaw ? `?next=${encodeURIComponent(nextRaw)}` : ""}`}
            className="font-semibold text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
          >
            Create one
          </Link>
        </p>
      }
    >
      {!configured && (
        <AuthMessage tone="info">
          Supabase is not configured in this deployment, so sign-in is disabled.
          Add the values from <code className="font-mono text-[12px]">.env.local</code> to enable it.
        </AuthMessage>
      )}

      {providerErrorCopy && <AuthMessage>{providerErrorCopy}</AuthMessage>}
      {message && <AuthMessage>{message}</AuthMessage>}

      <div className="space-y-3">
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
          <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
            Email
          </label>
          <input
            id="email"
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
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
              Password
            </label>
            <Link
              href={AUTH_ROUTES.forgotPassword}
              className="text-[11px] font-semibold text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={field === "password"}
            className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none"
            placeholder="Your password"
          />
        </div>

        <AuthSubmit pending={pending}>Sign in</AuthSubmit>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
