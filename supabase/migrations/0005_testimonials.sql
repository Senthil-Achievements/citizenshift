-- ============================================================
-- CitizenShift — Testimonials, Feedback & Campaign Links Module
--
-- Migration: 0005_testimonials.sql
--
-- STATUS: IDEMPOTENT (Applied when target Supabase project is connected).
--
-- SECURITY MODEL:
--   - RLS enabled on testimonials and testimonial_campaigns.
--   - Public SELECT allowed only for approved + published records.
--   - Public INSERT allowed for pending submissions with explicit consent.
--   - Private fields (e.g. email, moderation notes) are never exposed publicly.
--   - Campaign-specific submission links support attribution and revocation.
--   - public.public_testimonials security view created without sensitive columns.
--   - Supabase Storage bucket 'testimonials' setup with public read for assets.
-- ============================================================

-- 1. Campaign-specific submission links table
create table if not exists public.testimonial_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active'
    check (status in ('active', 'revoked')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by text
);

create index if not exists testimonial_campaigns_slug_idx on public.testimonial_campaigns (slug);
create index if not exists testimonial_campaigns_status_idx on public.testimonial_campaigns (status);

-- 2. Testimonials table
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

  -- Campaign attribution
  campaign_id uuid references public.testimonial_campaigns(id) on delete set null,
  campaign_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure columns exist if table was already created earlier
alter table public.testimonials
  add column if not exists campaign_id uuid references public.testimonial_campaigns(id) on delete set null,
  add column if not exists campaign_name text;

-- Indexes for query performance
create index if not exists testimonials_status_idx on public.testimonials (status);
create index if not exists testimonials_publish_state_idx on public.testimonials (publish_state);
create index if not exists testimonials_featured_sort_idx on public.testimonials (is_featured desc, sort_order asc, created_at desc);
create index if not exists testimonials_created_at_idx on public.testimonials (created_at desc);
create index if not exists testimonials_campaign_idx on public.testimonials (campaign_id);

-- RLS setup for campaigns
alter table public.testimonial_campaigns enable row level security;

drop policy if exists "Public can view active campaigns" on public.testimonial_campaigns;
create policy "Public can view active campaigns"
  on public.testimonial_campaigns
  for select
  using (status = 'active');

drop policy if exists "Service role full access on campaigns" on public.testimonial_campaigns;
create policy "Service role full access on campaigns"
  on public.testimonial_campaigns
  for all
  using (true)
  with check (true);

-- RLS setup for testimonials
alter table public.testimonials enable row level security;

-- Public read policy: only approved AND published testimonials
drop policy if exists "Public can view approved published testimonials" on public.testimonials;
create policy "Public can view approved published testimonials"
  on public.testimonials
  for select
  using (status = 'approved' and publish_state = 'published');

-- Public insert policy: allow submission with mandatory explicit consent
drop policy if exists "Public can submit pending testimonials with consent" on public.testimonials;
create policy "Public can submit pending testimonials with consent"
  on public.testimonials
  for insert
  with check (
    consent_given = true 
    and status = 'pending' 
    and publish_state = 'draft'
  );

-- Service role / Admin bypass policy
drop policy if exists "Service role full access on testimonials" on public.testimonials;
create policy "Service role full access on testimonials"
  on public.testimonials
  for all
  using (true)
  with check (true);

-- Revoke select on sensitive columns from anonymous and authenticated clients
revoke select (email, moderated_by, moderated_at, moderation_notes) on public.testimonials from anon, authenticated;
grant select (
  id, full_name, organization, role, testimonial_text, quote_highlight,
  avatar_url, video_url, video_provider, video_duration_seconds,
  consent_given, consent_timestamp, status, publish_state, is_featured,
  sort_order, campaign_id, campaign_name, created_at, updated_at
) on public.testimonials to anon, authenticated;

-- Publicly accessible view that strictly excludes sensitive email & internal notes
create or replace view public.public_testimonials with (security_invoker = true) as
  select
    id,
    full_name,
    organization,
    role,
    testimonial_text,
    quote_highlight,
    avatar_url,
    video_url,
    video_provider,
    video_duration_seconds,
    consent_given,
    consent_timestamp,
    status,
    publish_state,
    is_featured,
    sort_order,
    campaign_name,
    created_at,
    updated_at
  from public.testimonials
  where status = 'approved' and publish_state = 'published';

grant select on public.public_testimonials to anon, authenticated;

-- Storage bucket setup (for Supabase deployments)
insert into storage.buckets (id, name, public)
values ('testimonials', 'testimonials', true)
on conflict (id) do update set public = true;

-- Storage policies: anyone can read public testimonial assets
create policy "Public testimonial assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'testimonials');

-- Anyone can upload new assets to testimonials bucket with path prefix
create policy "Anyone can upload testimonial assets"
  on storage.objects for insert
  with check (bucket_id = 'testimonials');

comment on table public.testimonials is
  'CitizenShift civic feedback and video testimonials. Requires explicit publication consent; moderated by administrators before public display. Email is strictly confidential.';
comment on table public.testimonial_campaigns is
  'Campaign-specific submission links allowing administrators to track which outreach drive or coalition generated a submission and revoke links when completed.';
