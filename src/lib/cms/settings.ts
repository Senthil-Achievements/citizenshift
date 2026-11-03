/**
 * settings.ts — server-only data access for the Site Settings module.
 *
 * site_settings is admin-only content. Secrets never live here: Supabase
 * credentials, AI keys, and payment keys stay in server-only environment
 * variables. The module refuses writes that look like secrets.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SiteSettingRow } from "./types";
import { mapCmsError, type CmsError } from "./repository";
import { recordAudit, type AuditActor } from "./audit";

export type CmsWriteOk<T> = { ok: true; row: T };
export type CmsWriteFail = { ok: false; code: CmsError["code"]; message?: string };

export async function listSettings(
  db: SupabaseClient,
): Promise<{ rows: SiteSettingRow[]; error?: CmsError }> {
  const { data, error } = await db
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { rows: [], error: cmsErr };
  return { rows: (data ?? []) as unknown as SiteSettingRow[] };
}

export async function getSetting(
  db: SupabaseClient,
  key: string,
): Promise<{ row: SiteSettingRow | null; error?: CmsError }> {
  const { data, error } = await db.from("site_settings").select("*").eq("key", key).maybeSingle();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { row: null, error: cmsErr };
  return { row: (data as unknown as SiteSettingRow) ?? null };
}

const SECRET_KEY_PATTERN = /(secret|token|password|api[-_]?key|credential)/i;

function validateKind(value: unknown, kind: string): string | null {
  switch (kind) {
    case "string":
      return typeof value === "string" ? null : "value must be a string";
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? null
        : "value must be a finite number";
    case "boolean":
      return typeof value === "boolean" ? null : "value must be true or false";
    case "json":
      return null; // any JSON value
    default:
      return `unknown value kind: ${kind}`;
  }
}

export interface UpsertSettingInput {
  key: string;
  value: unknown;
  value_kind?: SiteSettingRow["value_kind"];
  description?: string | null;
}

/**
 * Creates or updates one setting. Admin-only upstream; audited with the full
 * before/after values (values here are non-secret content by policy).
 */
export async function upsertSetting(
  db: SupabaseClient,
  input: UpsertSettingInput,
  actor: AuditActor = {},
): Promise<CmsWriteOk<SiteSettingRow> | CmsWriteFail> {
  const key = input.key?.trim();
  if (!key) return { ok: false, code: "invalid", message: "key is required" };
  if (SECRET_KEY_PATTERN.test(key)) {
    return {
      ok: false,
      code: "invalid",
      message:
        "refusing to store a secret in site_settings — secrets belong in server-only environment variables",
    };
  }

  const kind = input.value_kind ?? "string";
  if (!["string", "number", "boolean", "json"].includes(kind)) {
    return { ok: false, code: "invalid", message: `unknown value kind: ${String(kind)}` };
  }
  const kindErr = validateKind(input.value, kind);
  if (kindErr) return { ok: false, code: "invalid", message: kindErr };

  const existing = await getSetting(db, key);

  const payload: Record<string, unknown> = {
    key,
    value: input.value,
    value_kind: kind,
    updated_by: actor.actorId ?? null,
  };
  if (input.description != null) payload.description = input.description;

  const { data, error } = await db
    .from("site_settings")
    .upsert(payload, { onConflict: "key" })
    .select("*")
    .single();
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };
  const row = data as unknown as SiteSettingRow;

  await recordAudit(
    db,
    {
      action: existing.row ? "update" : "create",
      entity_type: "setting",
      entity_id: key,
      entity_label: key,
      before_data: existing.row
        ? {
            value: existing.row.value,
            value_kind: existing.row.value_kind,
            description: existing.row.description,
          }
        : null,
      after_data: { value: row.value, value_kind: row.value_kind, description: row.description },
    },
    actor,
  );
  return { ok: true, row };
}

export async function deleteSetting(
  db: SupabaseClient,
  key: string,
  actor: AuditActor = {},
): Promise<{ ok: true } | CmsWriteFail> {
  const existing = await getSetting(db, key);
  if (existing.error?.code === "table_missing") return { ok: false, code: "table_missing" };
  if (existing.error) {
    return { ok: false, code: existing.error.code, message: existing.error.message };
  }
  if (!existing.row) return { ok: false, code: "not_found" };

  const { error } = await db.from("site_settings").delete().eq("key", key);
  const cmsErr = mapCmsError(error);
  if (cmsErr) return { ok: false, code: cmsErr.code, message: cmsErr.message };

  await recordAudit(
    db,
    {
      action: "delete",
      entity_type: "setting",
      entity_id: key,
      entity_label: key,
      before_data: {
        value: existing.row.value,
        value_kind: existing.row.value_kind,
        description: existing.row.description,
      },
    },
    actor,
  );
  return { ok: true };
}
