"use server";

/**
 * auth-actions.ts — server actions for email/password and Google sign-in.
 *
 * All Supabase calls happen server-side here or in the client component that
 * owns the form; this module owns the redirect resolution so no destination
 * path is hardcoded outside src/config/auth-routes.ts.
 *
 * Google uses the authorization-code + PKCE flow: signInWithOAuth() sends the
 * browser to Google, /auth/callback exchanges the code. Only the identity
 * scopes (openid, email, profile) are requested — no drive, no calendar, no
 * anything else.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project or Google OAuth client was
 * available. Nothing here has been exercised end to end.
 */

import { redirect } from "next/navigation";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";

/** Google identity scopes only. Deliberately minimal. */
const GOOGLE_SCOPES = ["openid", "email", "profile"].join(" ");

export interface AuthFormState {
  status: "idle" | "error" | "success";
  message?: string;
  /** Which field to focus, when the error is field-specific. */
  field?: "email" | "password" | "username" | "confirm";
}

/**
 * Resolves the `next` value posted by a form into a safe internal path.
 * Exported so client components can preview where a submit will land without
 * duplicating the sanitisation rules.
 */
export function resolveNext(next: unknown): string {
  return safeInternalRedirect(next, AUTH_ROUTES.afterReturningLogin);
}

/**
 * Returns the OAuth callback URL for the current deployment.
 *
 * Built from NEXT_PUBLIC_SITE_URL so the Supabase Dashboard redirect
 * allowlist entry and this value stay in agreement — a mismatch here is the
 * single most common cause of "redirect_uri_mismatch".
 */
export function callbackUrl(): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${site}${AUTH_ROUTES.callback}`;
}

/**
 * Kicks off Google sign-in.
 *
 * Called as a server action so the redirect target (the PKCE callback URL) is
 * computed on the server and never assembled from user input.
 */
export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const next = resolveNext(formData.get("next"));

  // The provider redirect itself is performed by the browser client inside the
  // calling component; this action only validates and returns the destination
  // so the client can construct a well-formed redirectTo.
  //
  // Kept as a server action for future server-side provider configuration.
  redirect(`${AUTH_ROUTES.login}?next=${encodeURIComponent(next)}&provider=google&scopes=${encodeURIComponent(GOOGLE_SCOPES)}`);
}

/** Google OAuth option object shared by the client-side sign-in button. */
export const GOOGLE_OAUTH_OPTIONS = {
  scopes: GOOGLE_SCOPES,
  queryParams: {
    access_type: "offline",
    prompt: "consent",
  },
} as const;
