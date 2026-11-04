"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthDualCard } from "@/components/auth/AuthDualCard";
import { getBrowserClient } from "@/lib/supabase/client";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const MIN_PASSWORD = 8;

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextRaw = params.get("next");
  const next = safeInternalRedirect(nextRaw, AUTH_ROUTES.afterFirstLogin);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "info">("error");
  const [field, setField] = useState<"firstName" | "lastName" | "email" | "password" | "terms" | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const configured = isSupabaseConfigured();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setField(null);
    setNeedsConfirmation(false);

    if (!firstName.trim()) {
      setField("firstName");
      setMessage("Please enter your first name.");
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) {
      setField("email");
      setMessage("Enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setField("email");
      setMessage("Enter a valid email address.");
      return;
    }

    if (password.length < MIN_PASSWORD) {
      setField("password");
      setMessage(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    if (!agreeTerms) {
      setField("terms");
      setMessage("Please agree to the Terms & Conditions to proceed.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setMessage("Registration is currently offline — Supabase is not configured for this deployment.");
      return;
    }

    setPending(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          },
          emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "")}${AUTH_ROUTES.callback}?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setMessage(error.message ?? "Registration failed.");
        return;
      }

      if (data.session) {
        router.push(AUTH_ROUTES.afterFirstLogin);
        router.refresh();
        return;
      }

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

  return (
    <AuthDualCard
      title="Create an Account"
      subtitle={
        <span>
          Already have an account?{" "}
          <Link
            href={`${AUTH_ROUTES.login}${nextRaw ? `?next=${encodeURIComponent(nextRaw)}` : ""}`}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Log in
          </Link>
        </span>
      }
      backHref="/"
    >
      {/* Alert / status message */}
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

      <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
        {/* Name Fields: First Name & Last Name in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="su-first-name"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              First Name
            </label>
            <input
              id="su-first-name"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className={`w-full h-11 px-4 text-sm rounded-xl border bg-white text-gray-900 placeholder:text-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                field === "firstName"
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-gray-200 focus:border-blue-500 hover:border-gray-300"
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="su-last-name"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Last Name
            </label>
            <input
              id="su-last-name"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-300 transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="su-email"
            className="block text-xs font-semibold text-gray-700 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="su-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className={`w-full h-11 px-4 text-sm rounded-xl border bg-white text-gray-900 placeholder:text-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              field === "email"
                ? "border-rose-400 focus:border-rose-500"
                : "border-gray-200 focus:border-blue-500 hover:border-gray-300"
            }`}
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="su-password"
            className="block text-xs font-semibold text-gray-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="su-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full h-11 pl-4 pr-11 text-sm rounded-xl border bg-white text-gray-900 placeholder:text-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                field === "password"
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-gray-200 focus:border-blue-500 hover:border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
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

        {/* Terms and Conditions Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
            />
            <span className="text-xs text-gray-600">
              I agree to the{" "}
              <span className="font-semibold text-gray-900 hover:underline">
                Terms & Conditions
              </span>
            </span>
          </label>
        </div>

        {/* Primary Submit Button */}
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
                <span>Creating Account…</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-gray-400">
            or
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googlePending}
          className="w-full h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99] text-xs sm:text-sm font-medium text-gray-700 shadow-sm transition-all flex items-center justify-center gap-2.5"
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

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
