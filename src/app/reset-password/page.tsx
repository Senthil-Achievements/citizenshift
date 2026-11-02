"use client";

/**
 * /reset-password — sets a new password from a recovery link.
 *
 * Supabase delivers the recovery session via the `code`/`access_token` in the
 * URL. We detect the session first, then call updateUser({ password }).
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 * Password recovery has NOT been exercised end to end.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell, AuthSubmit, AuthMessage } from "@/components/auth/AuthShell";
import { getBrowserClient } from "@/lib/supabase/client";
import { AUTH_ROUTES } from "@/config/auth-routes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const MIN_PASSWORD = 8;

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "info">("error");
  const [field, setField] = useState<"password" | "confirm" | null>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  const configured = isSupabaseConfigured();

  // Establish the recovery session from whatever the link carried.
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      setChecking(false);
      setTone("error");
      setMessage("Password reset is unavailable — Supabase is not configured.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Handles ?code= (PKCE) and hash-borne implicit recovery tokens.
        const { data, error } = await supabase.auth.getSession();
        if (!cancelled) {
          if (error) {
            setTone("error");
            setMessage("This reset link is invalid or has expired. Request a new one.");
          } else if (data.session) {
            setReady(true);
          } else {
            setTone("error");
            setMessage("This reset link is invalid or has expired. Request a new one.");
          }
        }
      } catch (err) {
        console.error("[reset-password] session:", err);
        if (!cancelled) {
          setTone("error");
          setMessage("Could not validate this reset link. Request a new one.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setField(null);

    if (password.length < MIN_PASSWORD) {
      setField("password");
      setMessage(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setField("confirm");
      setMessage("Passwords do not match.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) return;

    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setTone("error");
        setMessage(error.message ?? "Could not update your password.");
        return;
      }

      setTone("info");
      setMessage("Password updated. Signing you in…");
      router.push(AUTH_ROUTES.afterReturningLogin);
      router.refresh();
    } catch (err) {
      console.error("[reset-password]", err);
      setTone("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Choose a new password."
      subtitle="Pick something you don't use elsewhere. Your session stays active after the change."
      footer={
        <p className="text-sm text-navy/70">
          Need a new link?{" "}
          <Link
            href={AUTH_ROUTES.forgotPassword}
            className="font-semibold text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
          >
            Request another
          </Link>
        </p>
      }
    >
      {checking && (
        <p role="status" className="text-sm text-navy/60">
          Validating your reset link…
        </p>
      )}

      {message && <AuthMessage tone={tone}>{message}</AuthMessage>}

      {ready && !checking && (
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="rp-password" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
              New password
            </label>
            <input
              id="rp-password"
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
            <label htmlFor="rp-confirm" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
              Confirm new password
            </label>
            <input
              id="rp-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={field === "confirm"}
              className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none"
              placeholder="Repeat the new password"
            />
          </div>

          <AuthSubmit pending={pending}>Update password</AuthSubmit>
        </form>
      )}

      {!ready && !checking && (
        <Link
          href={AUTH_ROUTES.forgotPassword}
          className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-berry px-6 text-sm font-bold text-paper hover:bg-berry-600"
        >
          Request a new link
        </Link>
      )}

      {configured === false && null}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
