"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthDualCard } from "@/components/auth/AuthDualCard";
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [field, setField] = useState<"email" | "password" | null>(null);

  const configured = isSupabaseConfigured();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setField(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setField("email");
      setMessage("Enter your email address.");
      return;
    }
    if (!password) {
      setField("password");
      setMessage("Enter your password.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setMessage("Sign-in is currently unavailable — Supabase is not configured for this deployment.");
      return;
    }

    setPending(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (error) {
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
          scopes: "openid email profile",
          redirectTo: `${site}${AUTH_ROUTES.callback}?next=${encodeURIComponent(next)}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        setMessage(error.message ?? "Could not start Google sign-in.");
        setGooglePending(false);
      }
    } catch (err) {
      console.error("[login] google:", err);
      setMessage("Could not start Google sign-in.");
      setGooglePending(false);
    }
  }

  return (
    <AuthDualCard
      eyebrow="CITIZENSHIFT · CIVIC ACCESS"
      title="Welcome Back"
      subtitle={
        <span>
          Don&apos;t have an account?{" "}
          <Link
            href={`${AUTH_ROUTES.signup}${nextRaw ? `?next=${encodeURIComponent(nextRaw)}` : ""}`}
            className="font-medium text-berry hover:underline transition-colors"
          >
            Create an account
          </Link>
        </span>
      }
      backHref="/"
    >
      {/* Provider / OAuth error from URL */}
      {providerError && (
        <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs sm:text-sm font-medium text-rose-800 border border-rose-200">
          {errorDescription ?? "Sign-in with Google did not succeed. Please try again."}
        </div>
      )}

      {/* Alert / status message */}
      {message && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs sm:text-sm font-medium text-rose-800 border border-rose-200"
        >
          {message}
        </div>
      )}

      {!configured && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800 border border-amber-200">
          Supabase credentials are not connected yet. Form runs in preview mode.
        </div>
      )}

      <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
        {/* Email Address */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-mono uppercase tracking-[0.16em] text-navy/60 mb-1.5 font-semibold"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full h-11 px-4 text-sm rounded-xl border bg-white text-navy placeholder:text-navy/35 transition-all focus:outline-none focus:ring-2 focus:ring-berry/20 ${
              field === "email"
                ? "border-rose-400 focus:border-rose-500"
                : "border-navy/15 focus:border-berry hover:border-navy/30"
            }`}
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-mono uppercase tracking-[0.16em] text-navy/60 mb-1.5 font-semibold"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`w-full h-11 pl-4 pr-11 text-sm rounded-xl border bg-white text-navy placeholder:text-navy/35 transition-all focus:outline-none focus:ring-2 focus:ring-berry/20 ${
                field === "password"
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-navy/15 focus:border-berry hover:border-navy/30"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between pt-1 select-none">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-berry focus:ring-berry accent-berry cursor-pointer"
            />
            <span className="text-xs text-navy/70">Remember me</span>
          </label>
          <Link
            href={AUTH_ROUTES.forgotPassword}
            className="text-xs font-semibold text-berry hover:underline transition"
          >
            Forgot password?
          </Link>
        </div>

        {/* Primary CitizenShift Berry Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-xl bg-berry hover:bg-berry-600 active:scale-[0.99] text-paper text-sm font-semibold tracking-wide shadow-md shadow-berry/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {pending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-paper" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Logging in…</span>
              </>
            ) : (
              "Log In"
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-navy/10" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-mono uppercase tracking-wider text-navy/40">
            or
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googlePending}
          className="w-full h-11 rounded-xl border border-navy/15 bg-white hover:bg-icy-50 active:scale-[0.99] text-xs sm:text-sm font-medium text-navy shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>
    </AuthDualCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
