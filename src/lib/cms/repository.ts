/**
 * repository.ts — shared server-only helpers for CMS data access.
 *
 * Conventions carried over from src/lib/supabase/profiles.ts:
 *  - typed result envelopes instead of thrown client errors,
 *  - honest handling of the "migration not applied" state (42P01),
 *  - column allowlists on every write.
 */

import "server-only";

import { PostgrestError } from "@supabase/supabase-js";

export interface CmsError {
  code:
    | "not_configured"
    | "table_missing" // migration not applied yet
    | "conflict"
    | "not_found"
    | "invalid"
    | "unknown";
  message?: string;
}

/** Map a Postgres error to the honest CMS error envelope (pattern: ProfileWriteError). */
export function mapCmsError(err: unknown): CmsError | null {
  if (!err) return null;
  const e = err as PostgrestError;
  const code = (e as { code?: string }).code ?? "";

  switch (code) {
    case "23505": // unique_violation
      return { code: "conflict", message: e.details ?? undefined };
    case "23503": // foreign_key_violation
      return { code: "invalid", message: e.details ?? undefined };
    case "23514": // check_constraint_violation
      return { code: "invalid", message: e.details ?? undefined };
    case "42P01": // undefined_table — migrations not yet applied
      return { code: "table_missing" };
    case "PGRST116": // no rows from a single() read
      return { code: "not_found" };
    default:
      return { code: "unknown", message: e.message ?? String(err) };
  }
}

/**
 * Copy only the keys in `allowlist` that actually exist on the payload —
 * structured payloads are never blindly extended (pattern: profile-actions).
 */
export function pickAllowed<T extends Record<string, unknown>>(
  payload: Record<string, unknown>,
  allowlist: readonly string[],
): T {
  const out: Record<string, unknown> = {};
  for (const key of allowlist) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      out[key] = payload[key];
    }
  }
  return out as T;
}

/** Small helper for list actions: page numbers from a raw query string. */
export function pageFromParam(raw: string | undefined, perPage: number, rowCount: number): {
  page: number;
  totalPages: number;
} {
  const parsed = Number.parseInt(raw ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(rowCount / perPage));
  const page =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, totalPages) : 1;
  return { page, totalPages };
}

export type { PostgrestError };
