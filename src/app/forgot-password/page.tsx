"use client";

/**
 * /forgot-password — sends a Supabase password-recovery email.
 *
 * The email's redirect URL points at /reset-password through the central
 * AUTH_ROUTES config, so the destination is never hardcoded here.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 */

import { useState } from "react";
import Link from "next/link";
import { AuthShell, AuthSubmit, AuthMessage } from "@/components/auth/AuthShell";
import { getBrowserClient } from "@/lib/supabase/client";
import { AUTH_ROUTES } from "@/config/auth-routes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "info">("error");
  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setTone("error");
      setMessage("Enter a valid email address.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setTone("error");
      setMessage("Password recovery is unavailable — Supabase is not configured.");
      return;
    }

    setPending(true);
    try {
      const site = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${site}${AUTH_ROUTES.resetPassword}`,
      });

      if (error) {
        setTone("error");
        setMessage(error.message ?? "Could not send the reset email.");
        return;
      }

      // Always the same message regardless of whether the address exists —
      // never leak which emails are registered.
      setSent(true);
      setTone("info");
      setMessage(`If ${trimmed} has an account, a reset link is on its way.`);
    } catch (err) {
      console.error("[forgot-password]", err);
      setTone("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Reset your password."
      subtitle="Enter the email on your account and we'll send a secure reset link."
      footer={
        <p className="text-sm text-navy/70">
          Remembered it?{" "}
          <Link
            href={AUTH_ROUTES.login}
            className="font-semibold text-berry underline decoration-berry/30 underline-offset-2 hover:decoration-berry"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      {!configured && (
        <AuthMessage tone="info">Supabase is not configured in this deployment.</AuthMessage>
      )}

      {message && <AuthMessage tone={tone}>{message}</AuthMessage>}

      {!sent && (
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="fp-email" className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">
              Email
            </label>
            <input
              id="fp-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border hairline bg-paper px-4 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <AuthSubmit pending={pending}>Send reset link</AuthSubmit>
        </form>
      )}

      {sent && (
        <p className="mt-4 text-sm leading-relaxed text-navy/70">
          The link expires shortly. If it doesn't arrive, check spam, then try again.
        </p>
      )}
    </AuthShell>
  );
}
