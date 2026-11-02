# Design System

CitizenShift's visual language: editorial, civic, high-contrast. The site reads like a serious publication, not a dashboard. This document records the tokens and rules already implemented in `src/app/globals.css`; it is descriptive, not aspirational.

---

## 1. Colour

Defined in `@theme` (Tailwind CSS 4). Use token classes (`bg-berry`, `text-navy`), never raw hex.

| Token | Value | Role |
| --- | --- | --- |
| `icy` | `#B3E5FC` | Brand field, chips, supporting surfaces, highlights |
| `icy-50` | `#F2F9FD` | Page/section wash behind detail content |
| `icy-100` | `#E3F3FC` | Hover surfaces, rails |
| `icy-200` | `#C8E8FA` | Borders on icy surfaces |
| `berry` | `#C2121F` | Primary action, active milestone, emphasis |
| `berry-600` | `#A80E1A` | Hover for primary actions |
| `berry-700` | `#8C0B15` | Active/pressed |
| `berry-100` | `#F8E3E4` | Quiet error/alert wash |
| `navy` | `#173B57` | Text, controls, completed milestones |
| `navy-600` | `#12314A` | Hover for navy controls |
| `navy-800` / `navy-900` | `#0D2334` / `#081724` | Dark hero layers |
| `paper` | `#F8FBFD` | Reading surface |

**Distribution:** approx. 60 % icy/soft-white fields, 30 % navy structure and type, 10 % berry action. Berry is never used for body copy or large fills.

**Contrast:** navy on paper and paper on navy both exceed 7:1. Berry on paper is used at semibold/bold sizes only. Upcoming milestone text at `navy/35` is intentionally muted but remains legible against paper; status is also exposed to assistive tech via `aria-label`.

---

## 2. Typography

Loaded with `next/font` in `src/app/layout.tsx` and exposed as CSS variables.

| Family | Variable | Use |
| --- | --- | --- |
| **Fraunces** (variable, `opsz`/`SOFT`/`WONK`) | `--font-fraunces` / `font-display` | Headings, bill titles, editorial statements |
| **Manrope** | `--font-manrope` / `font-sans` | Body copy, controls |
| **IBM Plex Mono** (400/500/600) | `--font-plex` / `font-mono` | Eyebrows, chips, metadata, dates, bill numbers |

Rules:
- Display headings use tight tracking (`tracking-[-0.02em]`) and leading near `1.05`.
- Eyebrows: 11 px, uppercase, `0.22em` tracking, mono. Defined as `.eyebrow`.
- Metadata rows: 10–11 px mono, uppercase, `0.14–0.18em` tracking, usually `text-navy/50`.
- Body copy 15–16 px with `leading-relaxed`; avoid long measures — cap at `max-w-2xl`/`max-w-3xl`.
- Bill numbers are always mono and semibold so they read as identifiers.

---

## 3. Layout & spacing

- `.shell`: max width 1240 px, inline padding `clamp(1.25rem, 4vw, 3.5rem)`.
- Page sections stack on a 12-column grid on `lg`; detail modules span 12 or split 5/7.
- Spacing follows a 4 px base; cards use 24 px (`p-6`) interiors, 16 px (`p-4`) for compact list items.
- Borders are 1 px hairlines: `.hairline` = navy at 14 % opacity, `.hairline-light` = white at 16 %.
- Corners: **squared** for content modules (sharp civic/document feel). Pills (`rounded-full`) are reserved for chips and primary buttons. Avoid rounded cards.

---

## 4. Core components

### Chip
`.chip` — pill, mono 10 px uppercase, `0.14em` tracking, 1 px border, `0.25rem 0.625rem` padding, `white-space: nowrap`. Variants: icy fill + navy text (status), berry text on paper (policy), navy outline (jurisdiction). Interactive chips are `<button>` with `aria-pressed`.

### Primary button
Berry fill, paper text, `rounded-full`, 48 px height, bold 14 px, `hover:bg-berry-600`. One per module maximum.

### Secondary button
Transparent/paper with hairline border, navy text, same height. Use for "open official source" style actions.

### Module
`border hairline bg-paper` with a `border-b` header strip (`px-6 py-4`, display font, 18 px). Content padding 24 px. No shadows.

### Timeline
Horizontal `<ol>` with a clipped scroll container (`overflow-x-auto no-scrollbar`), 96 px minimum step width. Node: 32 px circle — navy filled (completed), berry filled (current), paper with faded border (upcoming). Labels 10 px mono uppercase; status is announced via `aria-label` on the `<li>`.

### Dialog
`src/components/ui/Modal.tsx` — focus trap, Escape to close, `role="dialog"` with label, backdrop at navy/60, paper panel.

---

## 5. Motion

Minimal by design and **unchanged from the approved build**:

- `[data-reveal]` elements start at `opacity: 0`, `translateY(12–28px)` and reveal on intersection via `RevealObserver` (mounted in `src/app/explore/layout.tsx`).
- Easing: `--ease-out-expo` = `cubic-bezier(0.16, 1, 0.3, 1)`; 0.9 s; staggered with `--reveal-delay`.
- `.u-link` underline wipes left-to-right on hover/focus.
- No motion is applied to legislative facts; the timeline does not animate progress because that would imply a status change.
- `prefers-reduced-motion` disables reveals, ticker, and scroll effects.

---

## 6. Responsive rules

| Breakpoint | Behaviour |
| --- | --- |
| ≥ 1024 px | Two-column metadata + sponsor; timeline in one row; 12-column modules |
| 640–1023 px | Modules stack; spacing compresses; actions wrap but stay 44 px+ tall |
| ≤ 639 px | Single column; full-width primary actions; metadata `dl` becomes 2-up; timeline scrolls horizontally inside its own container; no page-level horizontal overflow |

Verified targets: 375, 768, 1280, 1920 px. The detail page, viewer, and home all report `scrollWidth ≤ viewport`.

---

## 7. Accessibility

- Global `:focus-visible` outline: 2 px berry, 3 px offset.
- All interactive elements are native `<button>` / `<a>`; no `div` click handlers; no nested interactive content.
- Cards use a heading-level link for the title only.
- Dialogs use `role="dialog"`, labelled, Escape-dismissable, focus-managed.
- Status is always conveyed in text, not colour alone (timeline `aria-label`, chips carry words).
- Decorative icons are `aria-hidden`; external links announce the destination and open in a new tab.
- Reduced-motion support is global.

---

## 8. Voice

Direct, neutral, nonpartisan. Explain what a bill does, never how to vote. When data is missing, say so plainly ("An official summary is not available for this bill yet"). Never simulate authority: AI text is labelled, mirrors are labelled, and no action is reported as complete unless it happened.
