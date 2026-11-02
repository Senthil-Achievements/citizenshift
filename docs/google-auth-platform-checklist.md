# Phase 12 — Google Auth Platform & Domain Configuration Checklist

**Project:** CitizenShift
**Status:** ☐ **Not yet configured.** Every item below is a manual action in Google Cloud / Supabase Dashboard. Nothing here has been performed by the application, and **no Google verification status is claimed** — OAuth has not been tested end to end (see `docs/supabase-configuration-report.md` and `docs/final-implementation-report.md`).

---

## 1. Google Cloud Console — OAuth consent screen

| # | Field | Value | Status |
| --- | --- | --- | --- |
| 1 | App name | `CitizenShift` | ☐ pending |
| 2 | User support email | Client-supplied (project owner address) | ☐ pending |
| 3 | App logo | The actual CitizenShift logo — `public/brand/logo.png` (source: `Logo.png` / `Logo.svg` in project root) | ☐ pending |
| 4 | App homepage | `https://citizenshift.us` | ☐ pending |
| 5 | Privacy policy URL | **Client-supplied** — do not invent; leave blank until provided | ☐ pending |
| 6 | Terms of service URL | **Client-supplied** — do not invent; leave blank until provided | ☐ pending |
| 7 | Authorized domains | `citizenshift.us` (+ `localhost` for development) | ☐ pending |
| 8 | Scopes requested | `openid`, `email`, `profile` **only** | ✅ implemented in code (`src/lib/auth/auth-actions.ts`, `signInWithOAuth` options) |
| 9 | Test / publishing status | Report honestly — no status is claimed here | ☐ pending |

> The application already requests **only** the three identity scopes. Do not add Drive, Calendar, or any other scope — the brief forbids unnecessary scopes.

---

## 2. Google Cloud Console — OAuth client

| # | Item | Value | Status |
| --- | --- | --- | --- |
| 1 | Application type | Web application | ☐ pending |
| 2 | Name | `CitizenShift` | ☐ pending |
| 3 | Authorized JavaScript origins | `http://localhost:3000` (dev), `https://citizenshift.us` (prod) | ☐ pending |
| 4 | Authorized redirect URIs | `https://citizenshift.us/auth/callback` | ☐ pending |
| 5 | Dev redirect URI | `http://localhost:3000/auth/callback` | ☐ pending |
| 6 | Client ID | → goes into Supabase Dashboard (not into the app) | ☐ pending |
| 7 | Client secret | → goes into Supabase Dashboard (never into the repo or `.env.local`) | ☐ pending |

The callback path `/auth/callback` comes from `AUTH_ROUTES.callback` in `src/config/auth-routes.ts` — the single source of truth. If the path ever changes, update it there **and** in both allowlists above.

---

## 3. Supabase Dashboard — Auth provider (the connected project)

> ⚠️ Must be done against the **verified destination project**. There is currently no confirmed project reference in this workspace.

| # | Setting | Value | Status |
| --- | --- | --- | --- |
| 1 | Authentication → Providers → **Google** | Enabled | ☐ pending |
| 2 | Client ID | From §2 | ☐ pending |
| 3 | Client secret | From §2 | ☐ pending |
| 4 | Scopes | `openid email profile` (the default — do not extend) | ☐ pending |
| 5 | Authentication → **Email** provider | Enabled (confirm password sign-up + confirmation) | ☐ pending |
| 6 | Site URL | `https://citizenshift.us` (dev: `http://localhost:3000`) | ☐ pending |
| 7 | Redirect URLs allowlist | `https://citizenshift.us/auth/callback` `http://localhost:3000/auth/callback` `https://citizenshift.us/reset-password` `http://localhost:3000/reset-password` | ☐ pending |
| 8 | Email confirmation | Enabled (unless the client explicitly opts out) | ☐ pending |

Both redirect URIs above are derived from `AUTH_ROUTES.callback` and `AUTH_ROUTES.resetPassword`, built against `NEXT_PUBLIC_SITE_URL` by `callbackUrl()` in `src/lib/auth/auth-actions.ts` — so the app and the allowlist cannot silently drift apart.

---

## 4. Optional — custom authentication domain

| # | Item | Value | Status |
| --- | --- | --- | --- |
| 1 | Custom domain | `auth.citizenshift.us` | ☐ optional — not configured |
| 2 | DNS | CNAME from `auth.citizenshift.us` → Supabase auth domain, per Dashboard instructions | ☐ optional |
| 3 | HTTPS certificate | Issued by Supabase once DNS propagates | ☐ optional |
| 4 | App change | If adopted, set the auth URL in the Supabase client config — **not** a separate project reference | ☐ optional |

This is explicitly optional. The application works with the default `*.supabase.co` auth domain; nothing in the code assumes the custom domain exists.

---

## 5. Production domain

| # | Item | Value | Status |
| --- | --- | --- | --- |
| 1 | Production Site URL | `https://citizenshift.us` | ☐ to set in `NEXT_PUBLIC_SITE_URL` at deploy time |
| 2 | DNS for `citizenshift.us` | Points at the deployment (Vercel or otherwise) | ☐ pending |
| 3 | `www` handling | Redirect to apex (or vice versa) — **one** canonical origin, so cookies and redirects stay single-origin | ☐ pending |
| 4 | HTTPS | Enforced; no HTTP fallback for auth routes | ☐ pending |

---

## 6. What is already implemented in code (no dashboard action)

- Google sign-in / sign-up via `signInWithOAuth({ provider: "google" })` with `flowType: "pkce"` — authorization-code + PKCE.
- `openid email profile` scopes only.
- Server-side code exchange at `/auth/callback` using `exchangeCodeForSession()`.
- Centralized destinations in `src/config/auth-routes.ts`; `safeInternalRedirect()` rejects external/arbitrary URLs (`//evil.com`, schemes, encoded traversal, control characters).
- Email registration, confirmation, password login, forgot/reset password, resend confirmation, and global sign-out.

---

## 7. Explicitly NOT claimed

- ❌ Google OAuth is **not** reported as working — no live OAuth round trip has been performed.
- ❌ No Google "verified" or "unverified" app status is asserted; the consent-screen state has not been inspected.
- ❌ No privacy-policy or terms-of-service URL is invented; both stay `null` in `AUTH_ROUTES` until the client supplies them.
- ❌ `auth.citizenshift.us` is **not** configured.
