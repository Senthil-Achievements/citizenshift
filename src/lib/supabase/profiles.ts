/**
 * profiles.ts — typed read/write access to the `profiles` table.
 *
 * PRIVACY: `profiles` holds private personal details (date of birth, phone,
 * state, ZIP, street address). Nothing in this module returns a profile to an
 * unauthenticated caller, and no function here is reachable from a public
 * Community view. Every write path verifies the caller's own session first —
 * the row's `id` is always set to the authenticated user's id, never taken
 * from the request body, so a user cannot write to someone else's row.
 *
 * ⚠️ UNVERIFIED BUILD — the migration in supabase/migrations has not been
 * applied to a live project yet (see docs/supabase-configuration-report.md).
 */

import { createClient, getCurrentUser, verifySession } from "./server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Columns a user may write about themselves. */
export interface ProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null; // ISO yyyy-mm-dd
  state?: string | null;
  zip_code?: string | null;
  street_address?: string | null;
}

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  state: string | null;
  zip_code: string | null;
  street_address: string | null;
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fields that must NEVER appear in the admin customer listing, a Community
 * view, or any API response that is not the owner's own settings page.
 */
export const PRIVATE_PROFILE_COLUMNS = [
  "date_of_birth",
  "phone_number",
  "street_address",
  "zip_code",
] as const;

/** Column subset that is safe for non-owner display (name, username, state). */
export const PUBLIC_PROFILE_COLUMNS =
  "id, first_name, last_name, username, state, created_at, updated_at";

/**
 * Reads the caller's own profile. Returns null when signed out or when no row
 * exists yet (the trigger creates one at sign-up, but be defensive).
 */
export async function getOwnProfile(): Promise<ProfileRow | null> {
  const { user } = await verifySession();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // Table missing (migration not applied) → honest null, not a crash.
    if (error.code === "42P01") return null;
    throw error;
  }
  return data as ProfileRow | null;
}

/**
 * Idempotently ensures the signed-in user has a profile row.
 *
 * Called after email sign-up and after every OAuth callback. Safe to call
 * repeatedly: the primary key is the auth user id and the insert uses
 * `on conflict do nothing`, so a retried callback cannot duplicate a row.
 *
 * Uses the user's OWN client (RLS `with check (auth.uid() = id)`), not the
 * admin client — the row id always comes from the verified session.
 */
export async function ensureOwnProfile(): Promise<{ created: boolean; row: ProfileRow | null }> {
  const { user } = await verifySession();
  if (!user) return { created: false, row: null };

  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (readError && readError.code !== "42P01") throw readError;
  if (existing) return { created: false, row: existing as ProfileRow };

  const meta = user.user_metadata ?? {};
  const payload = {
    id: user.id, // always the session user — never client-supplied
    first_name: (meta.given_name ?? meta.first_name ?? null) as string | null,
    last_name: (meta.family_name ?? meta.last_name ?? null) as string | null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert(payload)
    .select("*")
    .single();

  if (insertError) {
    // 23505 → already exists (race with the DB trigger). Re-read.
    if (insertError.code === "23505") {
      const { data: row } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      return { created: false, row: row as ProfileRow | null };
    }
    if (insertError.code === "42P01") return { created: false, row: null }; // migration not applied
    throw insertError;
  }

  return { created: true, row: inserted as ProfileRow };
}

/**
 * Updates the caller's own profile.
 *
 * The row filter is always `id = session user id`, so even a crafted payload
 * cannot target another user. Username collisions surface as a typed error the
 * UI can render rather than a generic failure.
 */
export class ProfileWriteError extends Error {
  readonly code: "username_taken" | "not_authenticated" | "not_configured" | "unknown";
  constructor(code: ProfileWriteError["code"], message: string) {
    super(message);
    this.name = "ProfileWriteError";
    this.code = code;
  }
}

export async function updateOwnProfile(patch: ProfileUpdate): Promise<ProfileRow> {
  const { user } = await verifySession();
  if (!user) throw new ProfileWriteError("not_authenticated", "You must be signed in.");

  const supabase = await createClient();

  // Normalise empty strings to null so optional fields stay optional.
  const clean: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    clean[key] = value === null || value.trim() === "" ? null : value.trim();
  }
  if (Object.keys(clean).length === 0) {
    const current = await getOwnProfile();
    if (!current) throw new ProfileWriteError("unknown", "Profile not found.");
    return current;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(clean)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ProfileWriteError("username_taken", "That username is already taken.");
    }
    if (error.code === "42501" || error.code === "PGRST116") {
      throw new ProfileWriteError("not_authenticated", "You can only edit your own profile.");
    }
    if (error.code === "42P01") {
      throw new ProfileWriteError("not_configured", "Profiles are not configured yet.");
    }
    throw new ProfileWriteError("unknown", error.message);
  }

  if (!data) throw new ProfileWriteError("unknown", "Profile not found.");
  return data as ProfileRow;
}

/** Marks onboarding complete. Never called by the skip path. */
export async function completeOnboarding(): Promise<ProfileRow | null> {
  const { user } = await verifySession();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") return null;
    throw error;
  }
  return data as ProfileRow | null;
}

/**
 * Records an explicit skip.
 *
 * Sets `onboarding_skipped_at` ONLY. `onboarding_completed_at` is deliberately
 * left untouched so a skipped user is still counted as incomplete — skipping
 * must never masquerade as completion.
 */
export async function skipOnboarding(): Promise<ProfileRow | null> {
  const { user } = await verifySession();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ onboarding_skipped_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") return null;
    throw error;
  }
  return data as ProfileRow | null;
}

/**
 * Resumable draft persistence for onboarding.
 *
 * Saves the in-progress Step 1 fields on every change so a user can leave and
 * come back without losing data. Uses the same owner-scoped update path.
 */
export async function saveOnboardingDraft(patch: ProfileUpdate): Promise<void> {
  try {
    await updateOwnProfile(patch);
  } catch (err) {
    // A missing table or an unauthenticated draft must not break the form;
    // the UI keeps local state and retries on submit.
    if (err instanceof ProfileWriteError) return;
    throw err;
  }
}

/** Profile completion status for the admin customer list (no private fields). */
export function profileCompletionStatus(profile: {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  state: string | null;
  zip_code: string | null;
  onboarding_completed_at: string | null;
}): "complete" | "in_progress" | "not_started" {
  if (profile.onboarding_completed_at) return "complete";
  const filled = [profile.first_name, profile.last_name, profile.username, profile.state, profile.zip_code]
    .filter(Boolean).length;
  if (filled === 0) return "not_started";
  return "in_progress";
}

/** Convenience for server components that already hold a client. */
export async function getOwnProfileWith(client: SupabaseClient): Promise<ProfileRow | null> {
  const user = await getCurrentUser(client);
  if (!user) return null;
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
}
