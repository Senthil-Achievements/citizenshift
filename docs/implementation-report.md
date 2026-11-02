# Implementation Report — Legislation Detail Experience

**Record used for end-to-end validation:** H.R. 10905, 119th Congress ("No Personal Data in Grocery Pricing Act").
**Scope:** bill-card navigation, bill detail page, original-text viewer, representative contact, documentation.
**Constraint honoured:** the previously approved visual design was preserved. The motion-extraction work was reverted; there is no new animation system.

---

## 1. Bill card navigation

`src/components/site/legislation/BillCard.tsx`

- The **title is the link** to `/explore/bill/<congress>/<type>/<number>`. The card itself is not a click target, so there are no nested interactive elements.
- **Jurisdiction chip** → level filter, **policy chip** → topic filter, **status badge** → status filter. All are real `<button>` elements wired through `LegislationExplorer`.
- **Share** opens `ShareDialog` and **Contact Your Rep** opens `ContactRepDialog`; neither navigates.
- Focus states come from the global `:focus-visible` berry outline; chip buttons expose `aria-pressed`.
- Display numbers are normalised: the upstream `HB10905` renders as **H.R. 10905** in cards, headings, share text, and the viewer. The raw value is kept for source lookups.

`src/components/site/legislation/LegislationExplorer.tsx` owns filter state. Clicking a chip applies and narrows the feed. Verified: choosing *Technology & Privacy* on the H.R. 10905 card reduced 34 cards to 3, all in that topic.

---

## 2. Detail page

`src/components/site/legislation/BillDetail.tsx` (client component; data fetched from `/api/legislation`).

### Heading
Jurisdiction chip, policy chip, status chip, official title, and `H.R. 10905 · 119th Congress · House`. Strong editorial display type, navy on soft white.

### Action bar
Share and Contact Your Rep. Share uses `navigator.share` where available and falls back to clipboard; the dialog reports which path was taken. It never claims a send that did not happen.

### Bill information + sponsor
Two-column area on desktop, stacked on mobile:
- Left: jurisdiction, introduction date (UTC-formatted to avoid off-by-one), current status, chamber.
- Right: sponsor card. When the record carries a sponsor, it renders name, state/district, party, primary-sponsor designation, an initials avatar (never a stock photo), and a Congress.gov profile link. When the record has **no** sponsor field — as with the upstream H.R. 10905 record — it says "Not included in this record" and links to the official Congress.gov bill file, House Clerk roster, and Senate roster. No sponsor is invented.

### Legislative progress
`ProgressTimeline` + `deriveProgress()` in `src/lib/legislation.ts`.

- Milestones are shown in a horizontal track: completed = navy, current = berry, upcoming = muted navy.
- Status is derived **only** from the record's status string. No time-based inference. If the status is not one the model recognises, the component shows the official status and source links instead of a progress bar.
- Each `<li>` carries an `aria-label` (`"Introduced — current"`); the visually hidden span that previously escaped the scroll container was removed.
- Mobile: the track scrolls horizontally inside its own container. Explicit `grid-cols-1` on the parent and `min-w-0` on the section keep the page from widening.

### Summaries
- **Official summary** is rendered under that exact label, attributed to the source service with a retrieval date. If absent, the page states that no official summary is available and does not fabricate one.
- **CitizenShift Explanation — AI Generated** is a separate block with a *Not official text* chip, separated by a rule. When the record has no `aiSummary`, it shows an honest "not generated yet" message.

### Original Bill Text
Shows display number, version/status, format, source, and retrieval date. Format is stated truthfully: `source page (HTML)` for the LegiScan mirror rather than claiming a PDF.

Source priority list, always in this order:
1. **GovInfo** — official congressional bill text & status collections.
2. **Congress.gov** — official legislative record and text links.
3. **LegiScan** — labelled *reference mirror, not an official government source*. Each record uses its own `source_url` when it is a LegiScan URL; the pinned `HB10905` map only backs the supplied validation sample.

A missing link renders a disabled "search the source by bill number" card rather than a dead or guessed URL.

---

## 3. Original-text viewer

Route: `/explore/bill/119/hr/10905/text` (`TextViewer` in the same file).

- Back link to the bill, title, version, and a source line identifying the mirror status.
- **Embed rule:** only genuine `.pdf` URLs are framed. LegiScan and similar portals send `X-Frame-Options: SAMEORIGIN`, so for this record the viewer shows a plain explanation — "The document source does not permit embedding" — with **Open official source**, **Download from GovInfo**, and **Open LegiScan reference** buttons.
- No placeholder PDF, no fabricated HTML rendering of bill text, no simulated reader. If a real PDF URL is later supplied by the upstream record, the same panel embeds it natively.

---

## 4. Contact Your Rep

`src/components/site/legislation/ContactRepDialog.tsx`

- State selector + 5-digit ZIP input (digits only, validated).
- With a valid ZIP, **Find your U.S. Representative** links to `house.gov/htbin/findrep?ZIP=…`; without one it links to the official House lookup page. **Contact your two U.S. Senators** links to the Senate contact wizard.
- Includes short guidance for calling (identify as a constituent, cite the bill number, state a position) and an explicit statement that CitizenShift does not compose messages and that representatives are verified on official House/Senate pages only.
- No district is guessed from a ZIP, and no delivery is claimed. This is the honest fallback the brief permits when no authoritative district service is configured.

---

## 5. Data model & sources

`src/lib/legislation.ts` defines the shared `Bill` type and all identity/routing helpers: `parseBillNumber`, `congressForYear`, `billDetailSlug/Href`, `billViewerHref`, `billDisplayNumber`, `congressGovSearchUrl`, `govInfoSearchUrl`, `legiscanBillUrl`, `legiscanTextRefUrl`, `deriveProgress`, `slugToMetaTitle`.

- Upstream responses stay separate from display normalisation (`normaliseBills` only adds ids/limits volume; it does not invent fields).
- `source`, `source_id`, and `source_url` are preserved for provenance.
- Congress.gov and GovInfo API integrations are not enabled in this deployment; the app links to their official search endpoints keyed by bill number. Adding API keys and a normaliser would slot behind the same `Bill` interface without changing the UI.
- `generateMetadata` is server-rendered and imports `slugToMetaTitle` from `src/lib/legislation.ts`. This fixed a production crash caused by calling a `"use client"` export from a server component (digest `539579257`).

---

## 6. Design & responsive behaviour

- Design tokens and typography unchanged from the approved site (see `docs/design-system.md`).
- Desktop: two-column metadata/sponsor, full-width timeline and summaries.
- Mobile 375 px: single column, stacked metadata, internally scrollable timeline, full-width primary action. Verified `scrollWidth 365` (no horizontal overflow) on home, detail, and viewer.
- Reveals are the existing minimal CSS `[data-reveal]` transitions; `RevealObserver` is mounted in `src/app/explore/layout.tsx`. `prefers-reduced-motion` disables them.

---

## 7. Deviations & follow-ups

| Item | Status | Note |
| --- | --- | --- |
| GSAP/ScrollTrigger scene animations | **Not implemented** | Explicitly reverted at the client's request; previous design restored. |
| Server-side AI plain-language generation | **Not wired** | No model key or endpoint exists in this deployment. UI is honest about it. Recommended next step: `/api/explain` that accepts a bill id, calls the model server-side, stores `generatedAt` + source version, and sets `aiSummary`. |
| Congress.gov / GovInfo API ingestion | **Not wired** | Currently official *links*, not ingested official records. Next step behind the same interface. |
| District lookup from ZIP | **Deliberately delegated** | Uses House.gov lookup to avoid split-ZIP errors. |
| Native PDF embed for this record | **Unavailable** | Source is an HTML page that blocks framing; viewer explains and links out. |

---

## 8. Acceptance summary

All 20 steps of the required test pass except where the source itself has no data (official summary absent, AI summary absent, PDF unavailable) — in each case the UI shows an explicit honest state. Details and evidence: `docs/testing-report.md`.
