-- ============================================================
-- CitizenShift — Admin CMS content domain: pages, revisions,
-- links, communities and channels
--
-- Migration: 0004_cms_content.sql
--
-- STATUS: NOT APPLIED. Same rules as 0001–0003 (idempotent; apply only to
-- the verified destination project).
--
-- SECURITY MODEL: RLS enabled with no policies everywhere — access flows
-- only through server-only, admin-verified service-role actions.
-- ============================================================

-- ------------------------------------------------------------
-- 1. site_pages — editable page sections
-- ------------------------------------------------------------
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),

  slug text not null,                 -- e.g. 'home', 'donate', 'the-team', 'contact', 'bills.index'
  title text not null,

  sections jsonb not null default '[]'::jsonb,
  -- Ordered array of configurable page sections. Each section is an object
  -- { "kind": ..., ...fields }; structure is data, never code. Initial
  -- content for these pages is the ORIGINAL site copy
  -- (content/original/content/content-library.json, protected) — seeded
  -- verbatim where it corresponds, and never destructive there.

  publish_state text not null default 'draft'
    check (publish_state in ('draft', 'published', 'archived')),
  published_at timestamptz,

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_pages_slug_unique on public.site_pages (slug);
create index if not exists site_pages_publish_state_idx on public.site_pages (publish_state);
create index if not exists site_pages_updated_at_idx on public.site_pages (updated_at desc);

comment on table public.site_pages is
  'CMS-managed pages with ordered, typed sections. Original site copy is seeded verbatim from the protected store; edits are audited and revisioned.';

-- ------------------------------------------------------------
-- 2. site_page_revisions — every change keeps the previous version
-- ------------------------------------------------------------
create table if not exists public.site_page_revisions (
  id uuid primary key default gen_random_uuid(),

  page_id uuid not null references public.site_pages(id) on delete cascade,

  revision_no integer not null,
  data jsonb not null,                -- full row snapshot (title + sections) before the change
  note text,

  actor_id uuid,
  actor_label text,

  created_at timestamptz not null default now(),

  unique (page_id, revision_no)
);

create index if not exists site_page_revisions_page_idx
  on public.site_page_revisions (page_id, revision_no desc);

create or replace function public.snapshot_page_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_no integer;
begin
  select coalesce(max(revision_no), 0) + 1 into next_no
  from public.site_page_revisions where page_id = old.id;

  insert into public.site_page_revisions (page_id, revision_no, data)
  values (old.id, next_no, to_jsonb(old));

  return new;
end;
$$;

drop trigger if exists site_pages_revision_snapshot on public.site_pages;
create trigger site_pages_revision_snapshot
  after update on public.site_pages
  for each row execute function public.snapshot_page_revision();

comment on table public.site_page_revisions is
  'Full before-image of every page update, enabling revision history and rollback from the Admin CMS.';

-- ------------------------------------------------------------
-- 3. site_links — internal routes and external source URLs
-- ------------------------------------------------------------
create table if not exists public.site_links (
  id uuid primary key default gen_random_uuid(),

  label text not null,
  href text not null,                 -- external URLs must remain unchanged
  kind text not null default 'external'
    check (kind in ('internal', 'external')),

  description text,                   -- where this link appears / what it is for
  location text,                      -- e.g. 'header', 'footer', 'legislation.filters'
  sort_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_links_kind_idx on public.site_links (kind, sort_order);
create index if not exists site_links_location_idx on public.site_links (location, sort_order);

comment on table public.site_links is
  'Site-wide link registry. Internal links may be adapted when routes change; external links must be preserved exactly.';

-- ------------------------------------------------------------
-- 4. communities and channels
-- ------------------------------------------------------------
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),

  slug text not null,
  name text not null,
  description text,

  jurisdiction text,                  -- optional focus (state/district)
  policy_area text,                   -- optional focus

  publish_state text not null default 'draft'
    check (publish_state in ('draft', 'published', 'archived')),
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists communities_slug_unique on public.communities (lower(slug));
create index if not exists communities_publish_state_idx on public.communities (publish_state);

comment on table public.communities is
  'Manageable community spaces. The public community experience is a pending milestone; this table is the CMS backing for it.';

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),

  community_id uuid not null references public.communities(id) on delete cascade,

  slug text not null,
  name text not null,
  topic text not null default 'discussion'
    check (topic in ('discussion', 'announce', 'moderation')),
  description text,

  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists channels_community_slug_unique
  on public.channels (community_id, lower(slug));
create index if not exists channels_community_idx on public.channels (community_id, sort_order);

comment on table public.channels is 'Channels inside a community, with topic rules for moderation.';

-- ------------------------------------------------------------
-- 5. moderation reports — user flag queue for community management
-- ------------------------------------------------------------
create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),

  channel_id uuid references public.channels(id) on delete set null,
  target_kind text not null default 'post'
    check (target_kind in ('post', 'comment', 'member')),
  target_id text,                     -- id of the reported item, when the source data provides one

  reporter_id uuid,                   -- auth.users.id of the reporter (nullable for anonymous flags)
  reason text not null,
  details text,

  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  handled_by uuid,
  handled_at timestamptz,
  resolution_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moderation_reports_status_idx on public.moderation_reports (status, created_at desc);
create index if not exists moderation_reports_channel_idx on public.moderation_reports (channel_id);

comment on table public.moderation_reports is
  'The moderation queue backing Community Management. Status transitions are audited.';

-- ------------------------------------------------------------
-- 6. updated_at maintenance
-- ------------------------------------------------------------
drop trigger if exists site_pages_set_updated_at on public.site_pages;
create trigger site_pages_set_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

drop trigger if exists site_links_set_updated_at on public.site_links;
create trigger site_links_set_updated_at
  before update on public.site_links
  for each row execute function public.set_updated_at();

drop trigger if exists communities_set_updated_at on public.communities;
create trigger communities_set_updated_at
  before update on public.communities
  for each row execute function public.set_updated_at();

drop trigger if exists channels_set_updated_at on public.channels;
create trigger channels_set_updated_at
  before update on public.channels
  for each row execute function public.set_updated_at();

drop trigger if exists moderation_reports_set_updated_at on public.moderation_reports;
create trigger moderation_reports_set_updated_at
  before update on public.moderation_reports
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 7. Row Level Security — deny everyone except the service role
-- ------------------------------------------------------------
alter table public.site_pages            enable row level security;
alter table public.site_page_revisions   enable row level security;
alter table public.site_links            enable row level security;
alter table public.communities           enable row level security;
alter table public.channels              enable row level security;
alter table public.moderation_reports    enable row level security;

-- No policies: all traffic flows through server-only, admin-verified actions.
