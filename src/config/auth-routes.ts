/**
 * auth-routes.ts — the single source of truth for authentication navigation.
 *
 * Every redirect destination used by login, signup, verification, password
 * reset, logout and the account area lives here. Nothing else in the codebase
 * should hardcode an auth path, so that changing an approved destination later
 * is a one-file change plus the matching Supabase Dashboard allowlist entry.
 *
 * IMPORTANT — these are provisional internal destinations, NOT the final
 * approved redirect specification. The client will supply the final login,
 * registration, verification, password-reset, logout and legal navigation
 * destinations separately. Nothing here should be treated as signed-off.
 *
 * Legal URLs are deliberately `null`. We do not invent legal-page URLs or
 * legal wording; they are rendered as an explicit "not yet published" state
 * until the client provides them.
 */

export const AUTH_ROUTES = {
  /* --- entry points --- */
  login: "/login",
  signup: "/signup",

  /* --- OAuth / magic-link return --- */
  callback: "/auth/callback",

  /* --- post-auth destinations --- */
  completeProfile: "/complete-profile",
  afterFirstLogin: "/complete-profile",
  afterOnboarding: "/explore",
  afterReturningLogin: "/explore",

  /* --- password lifecycle --- */
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  /* --- exit --- */
  afterLogout: "/",

  /* --- account area --- */
  profile: "/account/profile",
  settings: "/account/settings",
  saved: "/account/saved",
  community: "/account/community",
  messages: "/account/messages",

  /* --- admin --- */
  adminIntegrations: "/admin/integrations/supabase",
  adminCustomers: "/admin/customers",

  /* --- legal: client-supplied, null until provided --- */
  privacyPolicy: null,
  termsOfService: null,
} as const;

export type AuthRouteKey = keyof typeof AUTH_ROUTES;

/** Base path above which a redirect target is considered internal. */
const INTERNAL_PREFIXES = [
  "/login",
  "/signup",
  "/auth/",
  "/complete-profile",
  "/forgot-password",
  "/reset-password",
  "/explore",
  "/account/",
  "/admin/",
  "/",
] as const;

/**
 * Resolves a route key to a concrete path, falling back to a safe default.
 * Used so a `null` legal route can never produce `href={null}` or a crash.
 */
export function authRoute(key: AuthRouteKey, fallback: string = "/"): string {
  const value = AUTH_ROUTES[key];
  return (value ?? fallback) as string;
}

/**
 * Safe internal redirect resolver.
 *
 * Accepts a candidate value (typically `?next=...` from a login form or an
 * OAuth callback) and returns a path only when it is unambiguously internal:
 *
 *  - must be a string
 *  - must start with a single `/` (rejects `//evil.com`, `\evil.com`,
 *    `https://evil.com`, `javascript:`, `data:`, and encoded variants)
 *  - must not contain a scheme, authority, or encoded traversal
 *  - must resolve to one of the known internal prefixes
 *
 * Anything else returns `fallback` instead of the raw value, so an attacker
 * cannot bounce a user to an external origin after authentication.
 */
export function safeInternalRedirect(
  candidate: unknown,
  fallback: string = AUTH_ROUTES.afterReturningLogin,
): string {
  if (typeof candidate !== "string") return fallback;
  const value = candidate.trim();
  if (!value) return fallback;

  // Reject absolute URLs, protocol-relative URLs, backslash tricks,
  // and anything carrying a scheme.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\")) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;

  // Reject encoded traversal and encoded scheme separators.
  if (/%2f%2f/i.test(value) || /%5c/i.test(value) || /%3a/i.test(value)) return fallback;
  if (value.includes("..")) return fallback;

  // Reject control characters / whitespace smuggling.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  const path = value.split(/[?#]/)[0];

  // Segment-aware allowlist match. A raw startsWith() would also accept
  // "/explore-evil" or "/loginfoo", because those strings begin with an
  // approved prefix. Matching on path-segment boundaries means a candidate
  // must be exactly an approved path, or a sub-path of one.
  const matched = INTERNAL_PREFIXES.some((prefix) => {
    if (prefix === "/") return path === "/";
    const base = prefix.replace(/\/$/, "");
    return path === base || path.startsWith(`${base}/`);
  });

  return matched ? value : fallback;
}

/**
 * Returns the legal route for a key, or `null` when the client has not yet
 * supplied one. Callers must render an explicit "not yet published" state
 * rather than a broken link or an invented URL.
 */
export function legalRoute(key: "privacyPolicy" | "termsOfService"): string | null {
  return AUTH_ROUTES[key];
}
