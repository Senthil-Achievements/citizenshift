# CitizenShift — Testimonials & Submission Management Implementation Report

**Module:** Testimonials, Civic Feedback & Campaign Links System  
**Status:** Complete & Production-Ready  
**Date:** November 2026  
**License/Fidelity:** Nonpartisan, strict publication consent, private PII protection.

---

## 1. Overview & Architecture

The **Testimonials & Civic Feedback Module** is a complete, production-ready system providing public testimonial discovery, a public submission pipeline (requiring no account), and an administrative moderation and distribution toolkit with campaign-specific link generation, attribution, and revocation.

### Key Capabilities

| Layer | Implementation Details |
| :--- | :--- |
| **Public Feed (`/testimonials`)** | Displays approved and published testimonials with support for both video testimonials (YouTube standard/shorts, Vimeo, MP4/WebM) and written-only stories. Features spotlight hero, category filtering (All/Video/Text), and sorting (Featured First, Newest First, Display Order). |
| **Public Submission (`/testimonials/submit`)** | Shareable form requiring no account or login. Collects full name, private email, organization, role, testimonial text, quote highlight, optional avatar photo, optional video (file upload or YouTube/Vimeo URL), and mandatory explicit publication consent. Supports campaign attribution via `?c=<slug>`. |
| **Campaign Sharing Links & Attribution** | Administrators can generate campaign-specific URLs (e.g. `/testimonials/submit?c=clean-water-2026`), track how many submissions were driven by each campaign, and revoke links when initiatives conclude. Revoked links display an honest notice and prevent revoked attribution. |
| **Multi-Channel Distribution** | Copy link, native `navigator.share`, and one-click sharing via WhatsApp, Email, X/Twitter, and LinkedIn on both the submission form and the admin dashboard. |
| **Admin Dashboard (`/admin/testimonials`)** | Two-tab interface: (1) **Submissions Review Queue** with status tabs (All, Pending, Approved, Rejected), campaign filtering, live search, video preview player, audit drawer, approve/reject with notes, publish/unpublish toggle, feature/unfeature, reordering, metadata editor, and secure deletion; (2) **Campaign Sharing Links Management** with link generation, live counters, and link revocation. |
| **Backend & Storage** | Supabase database migration (`0005_testimonials.sql`), column-level security revoking access to `email` from public roles, `public_testimonials` security view, in-memory rate limiting, file signature (magic byte) verification, and Supabase Storage bucket integration with local fallback. |

---

## 2. Security & Data Protection Guarantees

1. **Email Privacy:**
   - Email is strictly admin-only and is never rendered on public pages or returned by public queries (`listPublicTestimonials`).
   - Migration `0005_testimonials.sql` revokes `SELECT (email, moderated_by, moderated_at, moderation_notes)` from `anon` and `authenticated` roles and creates a `public_testimonials` view omitting sensitive fields.
2. **Explicit Publication Consent:**
   - Submissions require affirmative agreement to the publication consent checkbox (`consent_given: true`).
   - Server-side validation rejects any submission where consent is missing.
3. **No Automatic Publishing:**
   - Every submission enters the database in `status: 'pending'` and `publish_state: 'draft'`.
   - Only records with `status = 'approved'` AND `publish_state = 'published'` appear on the public feed.
4. **File Upload Security & Magic Number Verification:**
   - In `/api/testimonials/upload`:
     - Image MIME types: `image/jpeg`, `image/png`, `image/webp` (max 5 MB).
     - Video MIME types: `video/mp4`, `video/webm`, `video/quicktime` (max 50 MB).
     - First bytes are checked against magic numbers (e.g. `0xFF, 0xD8, 0xFF` for JPEG, `0x89, 0x50, 0x4E, 0x47` for PNG, `RIFF...WEBP` for WebP, `ftyp`/`moov` for MP4/MOV, and EBML header for WebM) to prevent executable masquerading.
     - Filenames are randomized using cryptographically secure UUIDs (`crypto.randomUUID()`).
     - IP rate limiting prevents upload abuse (max 10 uploads per IP per 10 minutes).
5. **Spam Protection & Submission Rate Limiting:**
   - Hidden honeypot field (`hp_website`) drops automated bot spam silently.
   - Sliding-window rate limiter prevents flooding (max 5 submissions per 10 minutes per IP/email).

---

## 3. Database Schema & Migration (`0005_testimonials.sql`)

```sql
-- Campaigns Table
create table if not exists public.testimonial_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by text
);

-- Testimonials Table
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,                       -- Never displayed publicly
  organization text,
  role text,
  testimonial_text text not null,
  quote_highlight text,
  avatar_url text,                           -- Submitter photo or uploaded avatar
  video_url text,                            -- Uploaded video file or external video link
  video_provider text check (video_provider in ('direct', 'youtube', 'vimeo') or video_provider is null),
  video_duration_seconds integer,
  consent_given boolean not null default false,
  consent_timestamp timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  publish_state text not null default 'draft' check (publish_state in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  moderated_by text,
  moderated_at timestamptz,
  moderation_notes text,
  campaign_id uuid references public.testimonial_campaigns(id) on delete set null,
  campaign_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 4. Modified & Created Files

| File | Type | Purpose |
| :--- | :--- | :--- |
| `supabase/migrations/0005_testimonials.sql` | Migration | Database schema, campaign links table, RLS policies, column revocation, public view, and storage bucket configuration. |
| `src/app/testimonials/layout.tsx` | Page Layout | Chrome wrapping `/testimonials` and `/testimonials/submit` with site Header, Footer, and Reveal observer. |
| `src/app/testimonials/page.tsx` | Public Page | Public feed displaying approved video & text testimonials with filter tabs, sort dropdown, and featured spotlight. |
| `src/app/testimonials/submit/page.tsx` | Public Page | Public shareable submission form route supporting `?c=<slug>` campaign validation & notice banner. |
| `src/components/site/TestimonialFeed.tsx` | Component | Filterable and sortable testimonial feed, responsive grid, video embed (YouTube, Vimeo, MP4), and author badges. |
| `src/components/site/TestimonialSubmitForm.tsx` | Component | Client form with zero-auth required, campaign awareness, avatar/video uploads, previews, explicit consent, and social sharing links. |
| `src/app/admin/testimonials/page.tsx` | Admin Page | Admin testimonials route fetching both testimonials and campaigns, guarded by `getCmsPrincipal()`. |
| `src/components/admin/TestimonialManager.tsx` | Component | Admin moderation center: review queue, video modal, history drawer, approve, reject, publish toggle, reorder, edit, delete, plus campaign link generator and revocation manager. |
| `src/app/api/testimonials/upload/route.ts` | API Route | Secure media upload handler with rate limiting, magic numbers check, UUID naming, and Supabase Storage + local fallback. |
| `src/lib/cms/testimonials.ts` | Server Lib | Data access layer for public list, admin list, campaign management, submission, status moderation, publish toggling, and fallback store. |
| `src/lib/admin/actions.ts` | Server Actions | Server actions for public submissions, campaign creation/revocation, moderation transitions, publish toggling, and deletion. |
| `src/lib/cms/types.ts` | Types | TypeScript interfaces for `TestimonialRow`, `TestimonialCampaign`, `PublicTestimonial`, `TestimonialSubmitInput`, and `TestimonialUpdate`. |
| `src/lib/cms/dashboard.ts` | Server Lib | Aggregates testimonial counts (`total`, `pending`, `approved`) for admin dashboard overview. |
| `src/app/admin/page.tsx` | Admin Page | Dashboard stat card for Testimonials. |
| `src/components/site/Header.tsx` | Component | Added "Stories" link and root-relative path resolution for anchor links. |
| `src/components/site/Footer.tsx` | Component | Added "Stories & Testimonials" link to footer navigation. |
| `src/config/auth-routes.ts` | Config | Registered `/testimonials` in internal redirect allowlist. |
