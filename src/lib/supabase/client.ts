"use client";

/**
 * client.ts — the single browser Supabase client.
 *
 * Uses @supabase/ssr `createBrowserClient`, which reads and writes the auth
 * session to cookies so the server components and middleware can see it.
 *
 * A module-level singleton keeps exactly one client per page load: creating
 * clients ad hoc inside components causes duplicate realtime subscriptions,
 * duplicated token refresh timers, and lost sessions.
 *
 * This module must never import `env.ts`'s `serverEnv()` or reference
 * SUPABASE_SECRET_KEY — doing so would pull the secret into the client bundle.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv, SupabaseConfigurationError } from "./env";

let client: SupabaseClient | null = null;

/**
 * Returns the shared browser client.
 *
 * Returns `null` instead of throwing when configuration is missing, so an
 * unconfigured build still renders the public site and shows an honest
 * "sign-in unavailable" state rather than crashing the whole page.
 */
export function getBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (client) return client;

  try {
    const env = publicEnv();
    client = createBrowserClient(env.url, env.publishableKey, {
      auth: {
        // PKCE is the flow used by /auth/callback's exchangeCodeForSession().
        flowType: "pkce",
        // The refresh timer is owned by the client; let supabase-js manage it.
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Never store tokens in localStorage — @supabase/ssr uses cookies.
        storageKey: "citizenshift-auth",
      },
    });
    return client;
  } catch (err) {
    if (err instanceof SupabaseConfigurationError) {
      // Configuration is absent in this deployment — degrade honestly.
      console.error("[supabase] browser client unavailable:", err.message);
      return null;
    }
    throw err;
  }
}
