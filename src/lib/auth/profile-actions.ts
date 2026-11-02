"use server";

/**
 * profile-actions.ts — server actions bridging client forms to the
 * owner-scoped profile store.
 *
 * Client components must not import `@/lib/supabase/profiles` directly: that
 * module pulls in `next/headers`, which only resolves in a Server Component
 * and breaks the client bundle. Instead, client forms call these actions.
 *
 * Every action re-verifies the caller's own session inside the server — the
 * row id always comes from the verified session, never from the request, so a
 * crafted payload cannot write to another user's profile.
 *
 * ⚠️ UNVERIFIED BUILD — no live Supabase project (docs/supabase-configuration-report.md).
 */

import {
  getOwnProfile,
  ensureOwnProfile,
  updateOwnProfile,
  completeOnboarding,
  skipOnboarding,
  ProfileWriteError,
  type ProfileRow,
  type ProfileUpdate,
} from "@/lib/supabase/profiles";

export interface ProfileActionResult {
  ok: boolean;
  /** Typed error code the UI can render honestly. */
  code?: ProfileWriteError["code"] | "load_failed";
  message?: string;
  profile?: ProfileRow | null;
  created?: boolean;
}

/** Loads the caller's own profile, creating one idempotently if missing. */
export async function loadProfileAction(): Promise<ProfileActionResult> {
  try {
    let profile = await getOwnProfile();
    if (!profile) {
      const res = await ensureOwnProfile();
      profile = res.row;
      return { ok: true, profile, created: res.created };
    }
    return { ok: true, profile, created: false };
  } catch (err) {
    console.error("[profile-action] load:", err);
    return {
      ok: false,
      code: "load_failed",
      message:
        err instanceof Error && /not configured/i.test(err.message)
          ? "Profiles are not configured yet."
          : "We couldn't load your profile.",
      profile: null,
    };
  }
}

/**
 * Saves the caller's own profile fields.
 *
 * Only the columns in the allowlisted `ProfileUpdate` shape are accepted;
 * `id`, `onboarding_*` and timestamps can never be set through this action.
 */
export async function saveProfileAction(patch: ProfileUpdate): Promise<ProfileActionResult> {
  const ALLOWED: (keyof ProfileUpdate)[] = [
    "first_name",
    "last_name",
    "username",
    "phone_number",
    "date_of_birth",
    "state",
    "zip_code",
    "street_address",
  ];

  const clean: ProfileUpdate = {};
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      clean[key] = patch[key];
    }
  }

  try {
    const profile = await updateOwnProfile(clean);
    return { ok: true, profile };
  } catch (err) {
    if (err instanceof ProfileWriteError) {
      return { ok: false, code: err.code, message: err.message };
    }
    console.error("[profile-action] save:", err);
    return { ok: false, code: "unknown", message: "Could not save your details." };
  }
}

/** Marks onboarding complete. Never invoked by the skip path. */
export async function completeOnboardingAction(): Promise<ProfileActionResult> {
  try {
    const profile = await completeOnboarding();
    if (!profile) return { ok: false, code: "load_failed", message: "Profile not found." };
    return { ok: true, profile };
  } catch (err) {
    console.error("[profile-action] complete:", err);
    return { ok: false, code: "unknown", message: "Could not mark onboarding complete." };
  }
}

/**
 * Records an explicit skip.
 *
 * Sets `onboarding_skipped_at` only — `onboarding_completed_at` is untouched,
 * so a skipped user is still reported as incomplete.
 */
export async function skipOnboardingAction(): Promise<ProfileActionResult> {
  try {
    const profile = await skipOnboarding();
    if (!profile) return { ok: false, code: "load_failed", message: "Profile not found." };
    return { ok: true, profile };
  } catch (err) {
    console.error("[profile-action] skip:", err);
    return { ok: false, code: "unknown", message: "Could not record your skip." };
  }
}

/**
 * Saves an in-progress onboarding draft.
 *
 * Failure is non-fatal: the form keeps local state and the user can continue.
 * Reported honestly so the UI can show "not saved yet".
 */
export async function saveDraftAction(patch: ProfileUpdate): Promise<ProfileActionResult> {
  return saveProfileAction(patch);
}
