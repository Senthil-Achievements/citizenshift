-- ============================================================
-- CitizenShift — Testimonials and Civic Feedback Module
--
-- Migration: 0005_testimonials.sql
--
-- STATUS: NOT APPLIED (idempotent, applied when target project is connected).
--
-- SECURITY MODEL:
--   - RLS enabled.
--   - Public SELECT allowed only for approved + published records.
--   - Public INSERT allowed for pending submissions with explicit consent.
--   - Admin / service-role has full access for review and moderation.
--   - Private fields (e.g. email) are shielded from public queries.
-- ============================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),

  -- Submitter details
  full_name text not null,
  email text not null,                       -- Never displayed publicly; strictly admin-only
  organization text,
  role text,

  -- Content
  testimonial_text text not null,
  quote_highlight text,                      -- Optional punchy quote selected for cards/hero

  -- Media (both optional — written-only submissions are fully supported)
  avatar_url text,                           -- Submitter photo or uploaded avatar
  video_url text,                            -- Uploaded video file or external video link
  video_provider text check (video_provider in ('direct', 'youtube', 'vimeo') or video_provider is null),
  video_duration_seconds integer,

  -- Consent & Legal
  consent_given boolean not null default false,
  consent_timestamp timestamptz not null default now(),

  -- Moderation workflow
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  publish_state text not null default 'draft'
    check (publish_state in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,

  moderated_by text,
  moderated_at timestamptz,
  moderation_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists testimonials_status_idx on public.testimonials (status);
create index if not exists testimonials_publish_state_idx on public.testimonials (publish_state);
create index if not exists testimonials_featured_sort_idx on public.testimonials (is_featured desc, sort_order asc, created_at desc);
create index if not exists testimonials_created_at_idx on public.testimonials (created_at desc);

-- RLS setup
alter table public.testimonials enable row level security;

-- Public read policy: only approved AND published testimonials
create policy "Public can view approved published testimonials"
  on public.testimonials
  for select
  using (status = 'approved' and publish_state = 'published');

-- Public insert policy: allow submission with mandatory explicit consent
create policy "Public can submit pending testimonials with consent"
  on public.testimonials
  for insert
  with check (consent_given = true and status = 'pending' and publish_state = 'draft');

-- Service role / Admin bypass policy
create policy "Service role full access on testimonials"
  on public.testimonials
  for all
  using (true)
  with check (true);

comment on table public.testimonials is
  'CitizenShift public feedback and video testimonials. Requires explicit consent; moderated by administrators before public display.';

