-- ============================================================
-- CitizenShift — Admin CMS core: audit logs, site settings, admin roles
--
-- Migration: 0002_cms_core.sql
--
-- STATUS: NOT APPLIED (same as 0001; apply after the destination project is
-- confirmed, via `supabase db push` or the SQL Editor).
--
-- IDEMPOTENT: every statement uses IF NOT EXISTS / OR REPLACE.
--
-- SECURITY MODEL
--   * Every table here has RLS ENABLED and NO policies, so ordinary
--     authenticated users and anonymous visitors can neither read nor write
--     them. Only the service-role key (server-only, never exposed to the
--     browser) can act on them — all access flows through server-only
--     server actions that re-verify the admin allowlist first.
--   * The root of trust for administrator status is the server-only env
--     allowlist CITIZENSHIFT_ADMIN_USER_IDS (docs/final-implementation-report.md);
--     cms_user_roles only grants the weaker "editor" level and can only be
--     written through the service role. No user can grant themselves admin.
-- ============================================================

-- ------------------------------------------------------------
-- 1. audit_logs — who changed what, when, with before/after payloads
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  actor_id uuid,                      -- auth.users.id of the acting admin (null = system)
  actor_label text,                   -- e.g. the admin's email at the time of the action

  action text not null,               -- create | update | delete | publish | unpublish
                                      -- | archive | restore | revise | rollback | seed
  entity_type text not null,          -- 'bill' | 'sponsor' | 'category' | 'link' | 'page'
                                      -- | 'user' | 'community' | 'channel' | 'setting' | ...
  entity_id text,                     -- the affected row's id (text to fit any key type)
  entity_label text,                  -- human-readable name at the time (titles are mutable)

  summary text,                       -- short, human-written description of the change

  before_data jsonb,                  -- full row state before (null on create)
  after_data jsonb,                   -- full row state after (null on delete)

  revision_no integer,                -- link to bill_revisions/blog-revision number, when applicable

  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Immutable change log written exclusively by server-only code. Rows are insert-only; there are no update/delete paths.';

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

-- ------------------------------------------------------------
-- 2. site_settings — non-secret, editable website configuration
-- ------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,

  value jsonb,                        -- arbitrary JSON value; secrets are NEVER stored here
  -- 'string' | 'number' | 'boolean' | 'json'
  value_kind text not null default 'string',

  description text,                   -- what this setting controls (for the admin UI)

  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is
  'Editable website configuration (site tagline, contact links, feature switches). Never stores secrets: integration keys and Supabase credentials stay in environment variables only.';

create index if not exists site_settings_updated_at_idx on public.site_settings (updated_at desc);

-- ------------------------------------------------------------
-- 3. cms_user_roles — the weaker "editor" role, granted by admins
-- ------------------------------------------------------------
create table if not exists public.cms_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  role text not null default 'editor'
    check (role in ('editor')),       -- the allowlist env var grants 'admin'; this table only adds editors

  granted_by uuid,                    -- admin user id that granted it
  granted_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cms_user_roles is
  'Content-editor grants for the Admin CMS. Administrators come from the server-only env allowlist (never this table). Ordinary users cannot elevate themselves: writes happen only via the server-only service role after an admin re-verification.';

create index if not exists cms_user_roles_role_idx on public.cms_user_roles (role);

-- ------------------------------------------------------------
-- 4. updated_at maintenance (shared trigger)
-- ------------------------------------------------------------
-- public.set_updated_at() is created by 0001_create_profiles.sql; recreate it
-- here defensively so this migration is self-sufficient too.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists cms_user_roles_set_updated_at on public.cms_user_roles;
create trigger cms_user_roles_set_updated_at
  before update on public.cms_user_roles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Row Level Security — deny everyone except the service role
-- ------------------------------------------------------------
alter table public.audit_logs    enable row level security;
alter table public.site_settings enable row level security;
alter table public.cms_user_roles enable row level security;

-- No policies are created: with RLS enabled and no policies, anon and
-- authenticated roles have no access at all. The service role bypasses RLS,
-- so every read/write goes through the server-side, admin-verified action
-- layer in src/lib/cms/ and src/lib/admin/.
