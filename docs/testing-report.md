# Testing Report

**Build under test:** production (`npm run build` → `next start -p 3010`), Next.js 15.5.28.
**Date:** 1 November 2026.
**Validation record:** H.R. 10905 · 119th Congress · House — "No Personal Data in Grocery Pricing Act".

---

## 1. Build & route smoke test

`npm run build` — compiled successfully, types and lint clean.

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    15.1 kB         171 kB
├ ○ /_not-found                            993 B         104 kB
├ ƒ /api/legislation                       127 B         103 kB
├ ○ /explore                               127 B         103 kB
└ ƒ /explore/bill/[...slug]              6.22 kB         159 kB
```

| Route | Status | Title |
| --- | --- | --- |
| `/` | 200 | CitizenShift — Bringing Power to the People |
| `/explore` | 200 | redirects to `/#legislation` (verified in browser) |
| `/explore/bill/119/hr/10905` | 200 | H.R. 10905 · 119th Congress — CitizenShift |
| `/explore/bill/119/hr/10905/text` | 200 | Original Text — H.R. 10905 · 119th Congress — CitizenShift |

Console: **zero errors** on the detail page and viewer.

---

## 2. Required acceptance test — results

| # | Step | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Locate H.R. 10905 in the listing | **Pass** | Not in the default curated page; search `10905` returns the card (search submits to `/api/legislation?state=US&q=10905`). |
| 2 | Click the title | **Pass** | Navigates to `/explore/bill/119/hr/10905`; `<h1>` = "No Personal Data in Grocery Pricing Act". |
| 3 | Detail page opens | **Pass** | Heading renders `H.R. 10905 · 119th Congress · House`; no error boundary. |
| 4 | Category chip works | **Pass** | Card chip "Space & Research" narrowed feed 34 → 12; dev pass on "Technology & Privacy" 34 → 3. |
| 5 | Jurisdiction accurate | **Pass** | `United States` / `Federal`, from the upstream record. |
| 6 | Sponsor accurate | **Pass (honest absence)** | Record has no sponsor field; UI says "Not included in this record" with Congress.gov bill file, House Clerk roster, Senate roster links. No sponsor invented. |
| 7 | Introduction date | **Pass** | `Oct 22, 2026` (upstream `2026-10-22T00:00:00.000Z`, formatted UTC). |
| 8 | Latest status | **Pass** | `Introduced`, matching the record. |
| 9 | Official action timeline | **Pass** | Five-step track with Introduced current (berry); remaining steps muted. Derived from status string only. Status is announced via `aria-label` on each step. |
| 10 | Official summary or absence | **Pass** | Official summary shown, labelled "Official summary", attributed to LegiScan with retrieval date. |
| 11 | Generate plain-language explanation | **Honest unavailable** | Record has no `aiSummary`; the block is labelled "CitizenShift Explanation — AI Generated · Not official text" and states none has been generated. No generation endpoint is configured, so nothing is simulated. |
| 12 | Click Contact Your Rep | **Pass** | Dialog opens with state selector + ZIP input. |
| 13 | Representative lookup workflow | **Pass (official fallback)** | Valid ZIP → `house.gov/htbin/findrep?ZIP=…`; default → official House lookup. Senate → `senate.gov/senators/senators-contactwizard.htm`. No district guessing, no send claim. |
| 14 | Click Read Original Text | **Pass** | Opens `/explore/bill/119/hr/10905/text`. |
| 15 | Exact version opens | **Pass** | Viewer title `H.R. 10905 — Introduced`, bill title beneath. |
| 16 | PDF / official document rendering | **Honest unavailable** | Source is a LegiScan HTML page that sends `X-Frame-Options: SAMEORIGIN`; viewer shows "The document source does not permit embedding" and offers open/download buttons. No placeholder or fake PDF. |
| 17 | Official download | **Pass (link)** | "Download from GovInfo ↗" → `govinfo.gov` bill search keyed to `HB10905`. |
| 18 | LegiScan reference link | **Pass** | `https://legiscan.com/US/text/HB10905/id/3463878`, labelled reference mirror, not official. |
| 19 | Browser back | **Pass** | Returns to `/` listing. (Filter/search state is in-memory and resets — expected.) |
| 20 | Mobile behaviour | **Pass** | 375 px: home, detail, viewer each `scrollWidth 365`, no horizontal overflow; timeline scrolls internally. |

---

## 3. Interaction details

**Share dialog** — opened from the detail action bar:

> No Personal Data in Grocery Pricing Act
> H.R. 10905 · FEDERAL · OCT 22, 2026
> No Personal Data in Grocery Pricing Act (H.R. 10905, Federal) — track it on CitizenShift: https://citizenshift.us

Uses `navigator.share` when present, clipboard otherwise; no navigation on click.

**Contact dialog** — verified links:

- `https://www.house.gov/representatives/find-your-representative` (no ZIP entered)
- `https://www.senate.gov/senators/senators-contactwizard.htm`
- With a 5-digit ZIP the House URL becomes `https://www.house.gov/htbin/findrep?ZIP=<zip>&ZIP4=`.

**Text viewer** — verified links:

- Congress.gov search (official)
- GovInfo search (official)
- LegiScan `…/HB10905/id/3463878` (reference)
- "← Back to H.R. 10905"

---

## 4. Responsive matrix

Tested with a 375 px iframe (media queries follow iframe width) against the production server.

| View | Viewport | `scrollWidth` | Overflow | Notes |
| --- | --- | --- | --- | --- |
| Home | 375 | 365 | none | — |
| Bill detail | 375 | 365 | none | Timeline `overflow-x` scrolls; 96 px minimum steps |
| Text viewer | 375 | 365 | none | Honest no-embed panel fits |

Earlier regression found and fixed: the timeline's implicit grid track expanded to 530 px at 375 px, and an absolutely positioned `sr-only` status span escaped the scroll container to 466 px. Fixes: explicit `grid-cols-1`, `min-w-0` on the section, `w-full max-w-full` on the list, and `aria-label` on each step in place of the hidden span.

---

## 5. Data verification

`GET /api/legislation?state=US&q=10905` returned:

| Field | Value |
| --- | --- |
| id | 2161185 |
| bill_number | HB10905 (displayed as H.R. 10905) |
| title | No Personal Data in Grocery Pricing Act |
| level / jurisdiction | Federal / United States |
| status | Introduced |
| policy_area | Technology & Privacy |
| introduced_date | 2026-10-22 |
| source | legiscan |
| source_url | https://legiscan.com/US/text/HB10905/id/3463878 |
| aiSummary | absent → honest unavailable state |

---

## 6. Known gaps (not defects)

1. No server-side AI generation endpoint; UI is honest instead of faking output.
2. No native PDF for this record; source blocks framing.
3. Sponsor absent from the upstream record; roster links provided.
4. Search/filter state does not persist across browser back.
5. No automated test suite (Playwright/Vitest) in the repo; verification was manual + scripted browser checks.
