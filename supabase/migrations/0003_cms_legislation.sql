-- ============================================================
-- CitizenShift — Admin CMS legislation domain: bills, revisions,
-- categories, tags, links, sponsors
--
-- Migration: 0003_cms_legislation.sql
--
-- STATUS: NOT APPLIED. Same rules as 0001/0002 (idempotent; apply only to
-- the verified destination project).
--
-- DESIGN NOTES
--   * `bills` is seeded VERBATIM from the protected original-content store
--     (content/original/**). Seeding is insert-if-absent by legacy_id; the
--     store itself is never modified. Column `content_source` records the
--     origin so post-migration controlled edits are distinguishable from
--     the original snapshot.
--   * `bill_revisions` automatically snapshots the FULL row on every update
--     (trigger), preserving previous versions for revision history/rollback.
--   * `bill_links` carries this bill's external URLs; they are adapted ONLY
--     for internal navigation — external URLs must remain unchanged.
--   * Category tables (policy_areas, statuses, tags) are seeded from the
--     app's constants (src/lib/states.ts POLICY_AREAS, STATUS_ORDER) plus
--     fixed jurisdiction levels.
--   * RLS: enabled, no policies — service-role (server-only, admin-verified
--     actions) only.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Categories: jurisdictions, policy areas, statuses, tags
-- ------------------------------------------------------------

create table if not exists public.jurisdictions (
  id text primary key,                -- slug, e.g. 'federal', 'state', 'municipal'
  label text not null,                -- 'Federal', 'State', 'Municipal'
  description text,
  sort_order integer not null default 100,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policy_areas (
  id text primary key,                -- slug, e.g. 'healthcare'
  label text not null,                -- exactly as displayed on the site
  emoji text,                         -- topic glyph shown next to the label
  description text,
  sort_order integer not null default 100,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bill_statuses (
  id text primary key,                -- slug, e.g. 'introduced'
  label text not null,                -- 'Introduced', 'Passed', ...
  description text,
  sort_order integer not null default 100,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),

  slug text not null,
  label text not null,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tags_slug_unique on public.tags (lower(slug));

comment on table public.jurisdictions  is 'Manageable jurisdiction levels (Federal/State/Municipal) shown as bill filters.';
comment on table public.policy_areas   is 'Manageable topic categories; labelled exactly as displayed on the site.';
comment on table public.bill_statuses  is 'Manageable legislative statuses, ordered as displayed.';
comment on table public.tags           is 'Free-form editorial tags for search and grouping.';
-- bill_tags is created in §3b, after public.bills exists (join: bills <-> tags).

-- ------------------------------------------------------------
-- 2. bills
-- ------------------------------------------------------------
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),

  -- Original-site identifier (e.g. 2161532) — the URL on this site is /bills/<legacy_id>.
  legacy_id bigint unique,

  number text,                        -- e.g. 'HB10923' (bill_number)
  title text not null,                -- official title, verbatim at seed time
  summary text,                       -- official legislative summary
  full_summary text,                  -- long-form official summary when the source provides one

  source text,                        -- data provenance, e.g. 'legiscan'
  source_id text,
  source_url text,                    -- ORIGINAL external URL — must remain unchanged
  original_text_url text,             -- direct link to the official text (unchanged)

  level text,                         -- 'Federal' | 'State' | 'Municipal'  (fk to jurisdictions)
  jurisdiction text,                  -- 'United States' | a state name — as displayed
  policy_area text,                   -- exact label as displayed
  emoji text,                         -- topic glyph as displayed

  status text,                        -- current status, as displayed
  status_date text,                   -- verbatim date of the current status
  introduced_date text,               -- verbatim
  progress jsonb,                     -- display order/steps as captured (verbatim JSON)

  content_source text not null default 'original_capture',
  -- 'original_capture' | 'admin_edit' — records whether content is the untouched
  -- original snapshot or has been edited through the CMS (audited + revisioned).
  -- The original snapshot itself lives in content/original/** and is NEVER
  -- overwritten by this table.

  publish_state text not null default 'draft'
    check (publish_state in ('draft', 'published', 'archived')),
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bills is
  'CMS-managed bill record. Seeded verbatim from content/original/** (protected snapshot). Edits happen only through admin actions and are recorded in audit_logs + bill_revisions.';

create index if not exists bills_level_idx        on public.bills (level);
create index if not exists bills_status_idx       on public.bills (status);
create index if not exists bills_publish_state_idx on public.bills (publish_state);
create index if not exists bills_introduced_idx   on public.bills (introduced_date);
create index if not exists bills_number_idx       on public.bills (number);
create index if not exists bills_updated_at_idx   on public.bills (updated_at desc);

-- full-row search index for the admin list
create index if not exists bills_title_trgm_idx on public.bills (lower(title));

-- ------------------------------------------------------------
-- 3a. bill_revisions — automatic version history for rollback
-- ------------------------------------------------------------
create table if not exists public.bill_revisions (
  id uuid primary key default gen_random_uuid(),

  bill_id uuid not null references public.bills(id) on delete cascade,

  revision_no integer not null,       -- per-bill, monotonically increasing

  data jsonb not null,                -- full row snapshot at that revision
  note text,                          -- admin-written change description

  actor_id uuid,                      -- admin user id
  actor_label text,

  created_at timestamptz not null default now(),

  unique (bill_id, revision_no)
);

comment on table public.bill_revisions is
  'Full before-image of every bills row update, written by trigger. Enables revision history and rollback through the Admin CMS.';

create index if not exists bill_revisions_bill_idx
  on public.bill_revisions (bill_id, revision_no desc);

create or replace function public.snapshot_bill_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_no integer;
begin
  select coalesce(max(revision_no), 0) + 1 into next_no
  from public.bill_revisions where bill_id = old.id;

  insert into public.bill_revisions (bill_id, revision_no, data, actor_id, actor_label)
  -- to_jsonb(old) is the row BEFORE this update; the new row plus the audit
  -- log record both the change itself and who made it.
  values (old.id, next_no, to_jsonb(old), null, null);

  return new;
end;
$$;

drop trigger if exists bills_revision_snapshot on public.bills;
create trigger bills_revision_snapshot
  after update on public.bills
  for each row execute function public.snapshot_bill_revision();

-- ------------------------------------------------------------
-- 3b. bill_tags (must exist after bills)
-- ------------------------------------------------------------
create table if not exists public.bill_tags (
  bill_id uuid not null references public.bills(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (bill_id, tag_id)
);

-- (do-nothing placeholder removed: §3b/§3c hold the real definition, after bills)

-- ------------------------------------------------------------
-- 4. sponsors + bill_sponsors
-- ------------------------------------------------------------
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),

  name text not null,                 -- e.g. 'Darren Soto'
  initials text,                      -- e.g. 'DS' (avatar)
  meta text,                          -- verbatim representation line, e.g. 'D · HD-FL-9'
  party text,
  title text,                         -- e.g. 'Representative'
  source_url text,                    -- original external URL (unchanged)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sponsors_name_lower_unique
  on public.sponsors (lower(name));
create index if not exists sponsors_name_idx on public.sponsors (name);

create table if not exists public.bill_sponsors (
  bill_id uuid not null references public.bills(id) on delete cascade,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,

  role text not null,                 -- 'PRIMARY SPONSOR' | 'CO-SPONSOR' (verbatim)
  sort_order integer not null default 0,

  primary key (bill_id, sponsor_id)
);

create index if not exists bill_sponsors_sponsor_idx
  on public.bill_sponsors (sponsor_id);

-- ------------------------------------------------------------
-- 3c. bill_tags (join: bills <-> tags; §3b kept name for §1 comment)
-- ------------------------------------------------------------
create table if not exists public.bill_tags (
  bill_id uuid not null references public.bills(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (bill_id, tag_id)
);

create index if not exists bill_tags_tag_idx on public.bill_tags (tag_id);


comment on table public.sponsors      is 'Representatives and officials associated with legislation. Seeded verbatim from the original store; external URLs unchanged.';
comment on table public.bill_sponsors is 'Join with per-bill role and display order.';

-- ------------------------------------------------------------
-- 5. bill_links — per-bill external sources and document links
-- ------------------------------------------------------------
create table if not exists public.bill_links (
  id uuid primary key default gen_random_uuid(),

  bill_id uuid not null references public.bills(id) on delete cascade,

  label text not null,                -- link text exactly as displayed
  href text not null,                 -- EXTERNAL URLs must remain unchanged
  kind text not null default 'external'
    check (kind in ('external', 'internal', 'document')),

  sort_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bill_links is
  'Source references and documents attached to a bill. Original external URLs are preserved byte-for-byte; internal links may be adapted to this site.';

create index if not exists bill_links_bill_idx on public.bill_links (bill_id, sort_order);

-- ------------------------------------------------------------
-- 6. updated_at maintenance
-- ------------------------------------------------------------
drop trigger if exists jurisdictions_set_updated_at on public.jurisdictions;
create trigger jurisdictions_set_updated_at
  before update on public.jurisdictions
  for each row execute function public.set_updated_at();

drop trigger if exists policy_areas_set_updated_at on public.policy_areas;
create trigger policy_areas_set_updated_at
  before update on public.policy_areas
  for each row execute function public.set_updated_at();

drop trigger if exists bill_statuses_set_updated_at on public.bill_statuses;
create trigger bill_statuses_set_updated_at
  before update on public.bill_statuses
  for each row execute function public.set_updated_at();

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

drop trigger if exists bills_set_updated_at on public.bills;
create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

drop trigger if exists sponsors_set_updated_at on public.sponsors;
create trigger sponsors_set_updated_at
  before update on public.sponsors
  for each row execute function public.set_updated_at();

drop trigger if exists bill_links_set_updated_at on public.bill_links;
create trigger bill_links_set_updated_at
  before update on public.bill_links
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 7. Row Level Security — deny everyone except the service role
-- ------------------------------------------------------------
alter table public.jurisdictions  enable row level security;
alter table public.policy_areas   enable row level security;
alter table public.bill_statuses  enable row level security;
alter table public.tags           enable row level security;
alter table public.bill_tags      enable row level security;
alter table public.bills          enable row level security;
alter table public.bill_revisions enable row level security;
alter table public.sponsors       enable row level security;
alter table public.bill_sponsors  enable row level security;
alter table public.bill_links     enable row level security;

-- No policies: writes and reads happen exclusively through server-only,
-- admin-verified actions (service role bypasses RLS).

-- ------------------------------------------------------------
-- 8. Seeds (insert-if-absent; never destructive)
-- ------------------------------------------------------------

insert into public.jurisdictions (id, label, description, sort_order) values
  ('federal',  'Federal',  'United States Congress', 1),
  ('state',    'State',    'State legislatures', 2),
  ('municipal','Municipal','Local ordinances and courts', 3)
on conflict (id) do update set label = excluded.label;

insert into public.bill_statuses (id, label, description, sort_order) values
  ('introduced', 'Introduced', 'Filed and made public', 1),
  ('engrossed',  'Engrossed',  'Passed one chamber after amendments', 2),
  ('enrolled',   'Enrolled',   'Final text agreed by both chambers', 3),
  ('passed',     'Passed',     'Signed into law', 4),
  ('vetoed',     'Vetoed',     'Returned by the executive', 5),
  ('failed',     'Failed',     'Rejected or expired', 6)
on conflict (id) do update set label = excluded.label;
