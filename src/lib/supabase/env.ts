/**
 * env.ts — validated, typed access to the Supabase environment configuration.
 *
 * Everything reads from here so that:
 *   - a missing variable produces one clear configuration error instead of an
 *     opaque "Invalid API key" failure deep inside supabase-js;
 *   - the project reference has exactly one source of truth (the URL);
 *   - the secret key is read only by server-only modules.
 *
 * ⚠️  UNVERIFIED BUILD — no Supabase project reference existed in this
 * workspace when this file was written (see
 * docs/supabase-configuration-report.md). The code implements the documented
 * env contract from .env.example. It has NOT been exercised against a live
 * project. Do not treat a successful `npm run build` as proof that Supabase
 * is connected.
 */

/** Raised when a required variable is missing or malformed. */
export class SupabaseConfigurationError extends Error {
  readonly missing: string[];

  constructor(missing: string[], hint?: string) {
    const list = missing.map((k) => `  • ${k}`).join("\n");
    super(
      `Supabase configuration error — ${missing.length} required environment variable(s) missing or empty:\n` +
        `${list}\n\n` +
        `Fix: copy .env.example to .env.local and fill in the values, then restart the dev server.\n` +
        (hint ? `Note: ${hint}\n` : "") +
        `See docs/supabase-configuration-report.md if you do not yet have a Supabase project.`,
    );
    this.name = "SupabaseConfigurationError";
    this.missing = missing;
  }
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

function read(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Public configuration (browser-safe). Used by the browser client and by
 * server components rendering public values such as the project reference.
 */
export interface PublicSupabaseEnv {
  /** Supabase project URL, e.g. https://<ref>.supabase.co */
  url: string;
  /** Publishable (anon) key — safe to expose to the browser. */
  publishableKey: string;
  /** Site URL used for auth redirects and cookie scope. */
  siteUrl: string;
  /** Project reference, derived from `url`. Never independently editable. */
  projectRef: string;
  /** Hostname of `url`, shown read-only on the admin integrations page. */
  host: string;
}

/**
 * Server-only configuration. The secret key lives here and is never
 * re-exported from any module imported by a client component.
 */
export interface ServerSupabaseEnv extends PublicSupabaseEnv {
  /** Secret (service_role) key. SERVER ONLY. */
  secretKey: string;
  /** Supabase Auth user UUIDs granted admin access. */
  adminUserIds: string[];
}

/**
 * Derives the project reference from the project URL so there is a single
 * source of truth. Returns "" for a URL that does not look like Supabase.
 */
export function deriveProjectRef(url: string): string {
  try {
    const host = new URL(url).hostname;
    // <ref>.supabase.co  |  <ref>.supabase.in  |  regional hosts
    const first = host.split(".")[0];
    return first && first !== "supabase" ? first : "";
  } catch {
    return "";
  }
}

function requirePublic(): { url: string; publishableKey: string; siteUrl: string } {
  const url = read("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey =
    read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const siteUrl = read("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length) throw new SupabaseConfigurationError(missing);

  if (!/^https?:\/\//i.test(url)) {
    throw new SupabaseConfigurationError(
      ["NEXT_PUBLIC_SUPABASE_URL"],
      "it must be an absolute URL beginning with https://",
    );
  }
  return { url, publishableKey, siteUrl };
}

/** Browser-safe configuration. Throws `SupabaseConfigurationError` if unset. */
export function publicEnv(): PublicSupabaseEnv {
  const { url, publishableKey, siteUrl } = requirePublic();
  return {
    url,
    publishableKey,
    siteUrl,
    projectRef: deriveProjectRef(url),
    host: safeHost(url),
  };
}

/** Server-only configuration. Throws `SupabaseConfigurationError` if unset. */
export function serverEnv(): ServerSupabaseEnv {
  const base = publicEnv();
  const secretKey = read("SUPABASE_SECRET_KEY") || read("SUPABASE_SERVICE_ROLE_KEY");

  if (!secretKey) {
    throw new SupabaseConfigurationError(
      ["SUPABASE_SECRET_KEY"],
      "this value is server-only and must never be exposed to the browser",
    );
  }

  const adminUserIds = read("CITIZENSHIFT_ADMIN_USER_IDS")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return { ...base, secretKey, adminUserIds };
}

/** Hostname for display, or "" if unparseable. */
function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/* Startup validation                                                  */
/* ------------------------------------------------------------------ */

export interface ConfigCheck {
  ok: boolean;
  /** Hard failures — a Supabase client cannot be constructed. */
  errors: string[];
  /** Non-fatal issues worth surfacing to an administrator. */
  warnings: string[];
  projectRef: string;
  host: string;
  siteUrl: string;
  adminUserCount: number;
  /** Which key style the project appears to use. */
  keyStyle: "publishable/secret" | "legacy anon/service_role" | "unknown";
}

/**
 * Non-throwing configuration check used by the admin integrations page and by
 * startup logging. Never returns a key value — only names and counts.
 */
export function checkSupabaseConfiguration(): ConfigCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  const url = read("NEXT_PUBLIC_SUPABASE_URL");
  const publishable = read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const secret = read("SUPABASE_SECRET_KEY") || read("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = read("NEXT_PUBLIC_SITE_URL");
  const adminIds = read("CITIZENSHIFT_ADMIN_USER_IDS");

  if (!url) errors.push("NEXT_PUBLIC_SUPABASE_URL is not set.");
  else if (!/^https?:\/\//i.test(url)) errors.push("NEXT_PUBLIC_SUPABASE_URL is not an absolute https:// URL.");

  if (!publishable) errors.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.");
  if (!secret) errors.push("SUPABASE_SECRET_KEY is not set (server-only).");

  if (!siteUrl) {
    warnings.push("NEXT_PUBLIC_SITE_URL is not set — auth redirects will fall back to http://localhost:3000.");
  } else if (/^https?:\/\/localhost/i.test(siteUrl)) {
    warnings.push("NEXT_PUBLIC_SITE_URL points at localhost — production must use https://citizenshift.us.");
  }

  if (!adminIds) {
    warnings.push("CITIZENSHIFT_ADMIN_USER_IDS is empty — no user can access /admin.");
  }

  if (url && !deriveProjectRef(url)) {
    warnings.push("Could not derive a project reference from NEXT_PUBLIC_SUPABASE_URL.");
  }

  const keyStyle: ConfigCheck["keyStyle"] =
    publishable.startsWith("sb_publishable_") && secret.startsWith("sb_secret_")
      ? "publishable/secret"
      : publishable && secret
        ? "legacy anon/service_role"
        : "unknown";

  if (keyStyle === "legacy anon/service_role") {
    warnings.push(
      "Legacy anon/service_role keys detected. The connected project appears to predate the publishable/secret key model; legacy keys are supported as a fallback.",
    );
  }

  const projectRef = url ? deriveProjectRef(url) : "";

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    projectRef,
    host: url ? safeHost(url) : "",
    siteUrl: siteUrl || "",
    adminUserCount: adminIds
      ? adminIds.split(",").map((s) => s.trim()).filter(Boolean).length
      : 0,
    keyStyle,
  };
}

/**
 * Called once during application startup to surface configuration problems
 * early and loudly instead of at first sign-in attempt.
 */
export function assertSupabaseConfigured(): void {
  const check = checkSupabaseConfiguration();
  if (check.ok) return;
  throw new SupabaseConfigurationError(check.errors);
}

/** True when a Supabase client can be constructed without throwing. */
export function isSupabaseConfigured(): boolean {
  return checkSupabaseConfiguration().ok;
}
