-- ============================================================
-- CitizenShift — profiles table, RLS, and automatic profile creation
--
-- Migration: 0001_create_profiles.sql
--
-- STATUS: NOT APPLIED.
-- This workspace had no Supabase project, no `supabase/` directory and no
-- migration history when this file was written (see
-- docs/supabase-configuration-report.md). It is written to be applied with
--   supabase db push
-- or pasted into the SQL Editor of the *intended* project after that project
-- is confirmed. Run it only against the verified destination project.
--
-- IDEMPOTENT: every statement uses IF NOT EXISTS / OR REPLACE, so re-running
-- it will not reset or duplicate existing user records.
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  first_name text,
  last_name text,
  username text,

  phone_number text,
  date_of_birth date,

  state text,
  zip_code text,
  street_address text,

  onboarding_completed_at timestamptz,
  onboarding_skipped_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Private per-user profile. The primary key is always the corresponding auth.users.id.';

comment on column public.profiles.username is
  'Optional display handle. Uniqueness is enforced case-insensitively.';

comment on column public.profiles.onboarding_completed_at is
  'Set only when the user actually finishes onboarding. A skip must NOT set this.';

comment on column public.profiles.onboarding_skipped_at is
  'Set when the user explicitly chooses "Skip for now". Onboarding remains incomplete.';

-- ------------------------------------------------------------
-- 2. Case-insensitive unique username (partial index)
-- ------------------------------------------------------------
create unique index if not exists
  profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

-- Common lookup indexes (safe to re-run).
create index if not exists profiles_state_idx on public.profiles (state);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- ------------------------------------------------------------
-- 3. updated_at maintenance
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. Automatic, idempotent profile creation for BOTH auth methods
--
-- Fires on any new auth.users row — Google OAuth, email/password, and any
-- future provider — so no user is ever left without a profile.
--
-- Because the insert is `on conflict (id) do nothing`, a retried OAuth
-- callback (or a re-confirmed email) cannot create a duplicate row.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'given_name', new.raw_user_meta_data ->> 'first_name'),
    coalesce(new.raw_user_meta_data ->> 'family_name', new.raw_user_meta_data ->> 'last_name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 5. Row Level Security
--
-- Owners may read/insert/update ONLY their own row. There is deliberately no
-- SELECT policy that grants access to other users' rows: private personal
-- details (DOB, phone, state, ZIP, street address) must never be readable by
-- other members or by any public Community view.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No DELETE policy: profile rows are removed by cascading from auth.users,
-- not by the user at runtime.

-- ------------------------------------------------------------
-- 6. Privacy note
--
-- Deliberately NOT created in this migration:
--   • race / ethnicity fields
--   • political leaning / affiliation fields
-- These require an approved privacy notice, stated purpose, consent
-- mechanism and retention rules before any schema is added. Sensitive
-- demographic details must never be mandatory.
--
-- No view, RPC or policy exposes profiles to anonymous users.
-- ------------------------------------------------------------

-- ============================================================
-- Post-apply verification (run manually, report results):
--   select id, username, onboarding_completed_at from public.profiles limit 5;
--   select relname, relrowsecurity from pg_class
--     where relname = 'profiles';
--   -- expect relrowsecurity = true
--   supabase db advisors --link <verified-project-ref>
-- ============================================================
