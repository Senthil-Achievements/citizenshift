/**
 * middleware.ts — session refresh for Next.js 15.5.
 *
 * (Next 16 renames this file to proxy.ts; this project is on 15.5.28, so
 * middleware.ts is the correct implementation.)
 *
 * Runs on every matched request and does exactly one job: keep the Supabase
 * auth cookie valid by calling `supabase.auth.getUser()`, which refreshes an
 * expired access token and persists the new session cookies.
 *
 * It performs NO authorization decisions. Protected pages and API routes must
 * authorize independently via `requireUser()` / `requireAdmin()` — middleware
 * only guarantees that a valid session is present in the request cookies.
 *
 * When Supabase is not configured, middleware exits quietly so the public site
 * keeps working instead of throwing on every navigation.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_ROUTES, safeInternalRedirect } from "@/config/auth-routes";

/** Paths that never need a session refresh. */
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"];

/** Paths that require an authenticated user. */
const PROTECTED_PREFIXES = ["/account", "/admin", "/complete-profile"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Unconfigured deployment: let the request through untouched.
  if (!url || !key) return NextResponse.next({ request });

  const { pathname, search } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: "citizenshift-auth",
    },
  });

  // Refresh the session if the access token is stale. getUser() validates with
  // the Auth server rather than trusting the cookie payload.
  try {
    await supabase.auth.getUser();
  } catch {
    // A failed refresh must not block navigation; the protected-route guard
    // will reject the request downstream if the session is genuinely invalid.
  }

  // --- redirect sanitisation -------------------------------------
  // Any `?next=` reaching a protected route is validated before it can be
  // used as a post-login destination.
  if (isProtected(pathname)) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = AUTH_ROUTES.login;
      loginUrl.search = "";
      // Preserve the attempted destination through a sanitised `next` param.
      const attempted = `${pathname}${search}`;
      const safe = safeInternalRedirect(attempted, AUTH_ROUTES.afterReturningLogin);
      loginUrl.searchParams.set("next", safe);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes additionally require the server-only allowlist. Middleware
    // cannot read SUPABASE_SECRET_KEY (edge runtime), so the definitive 403
    // is issued inside the route handler by `requireAdmin()`.
  }

  // Signed-in users do not need the sign-in screens.
  if (isPublic(pathname)) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && (pathname === "/login" || pathname === "/signup")) {
      const next = request.nextUrl.searchParams.get("next");
      const dest = safeInternalRedirect(next, AUTH_ROUTES.afterReturningLogin);
      const home = request.nextUrl.clone();
      home.pathname = dest;
      home.search = "";
      return NextResponse.redirect(home);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    // Always run for API routes.
    "/api/:path*",
  ],
};
