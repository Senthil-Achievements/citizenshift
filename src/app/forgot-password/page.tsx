"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthDualCard } from "@/components/auth/AuthDualCard";
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

      setSent(true);
      setTone("info");
      setMessage("If an account exists for that email, we've sent password reset instructions.");
    } catch (err) {
      console.error("[forgot-password] unexpected:", err);
      setTone("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthDualCard
      title="Reset Password"
      subtitle={
        <span>
          Remember your password?{" "}
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Log in
          </Link>
        </span>
      }
      backHref={AUTH_ROUTES.login}
    >
      {message && (
        <div
          role="status"
          className={`mb-4 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium transition ${
            tone === "error"
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      {!configured && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800 border border-amber-200">
          Supabase credentials are not connected yet. Form runs in preview mode.
        </div>
      )}

      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Check your inbox for a link to reset your password. If it doesn&apos;t appear within a few minutes, check your spam folder.
          </p>
          <Link
            href={AUTH_ROUTES.login}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black text-sm font-semibold text-white hover:bg-neutral-800 transition"
          >
            Back to Log In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="fp-email"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-300 transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full h-12 rounded-xl bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-md shadow-black/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Sending…</span>
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>
        </form>
      )}
    </AuthDualCard>
  );
}
