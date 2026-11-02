# CitizenShift

Nonpartisan civic platform: discover legislation → open a bill → understand its status → read the original text → contact a representative.

Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · TypeScript.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run start -p 3010
```

> On this Windows machine, run npm through `cmd /c` (PowerShell blocks `npm.ps1`).
> Never run `next dev` and `next start` against the same `.next` directory — it corrupts the build manifest.

### Environment

Copy `.env.example` to `.env.local` and set what you need:

| Variable | Required | Purpose |
| --- | --- | --- |
| `LEGISLATION_UPSTREAM_URL` | no | Server-side bill service the app proxies. Defaults to `https://citizenshift.vercel.app`. |
| `FIRECRAWL_API_KEY` | no | Research tooling only. Never sent to the browser. |

No government API keys are present in this repo, and no secret is exposed to the client bundle. All upstream calls happen in the route handler.

---

## Routes

| Route | Rendering | Description |
| --- | --- | --- |
| `/` | static | Marketing home. `#legislation` is the Explore Legislation feed. |
| `/explore` | static | Redirects to `/#legislation`. |
| `/explore/bill/[...slug]` | dynamic | Bill detail. Canonical form `/explore/bill/119/hr/10905`; `/explore/bill/id/2161185` is the fallback for unparseable numbers. |
| `/explore/bill/[...slug]/text` | dynamic | Original-text viewer for the same record. |
| `/api/legislation` | dynamic | Server-side proxy for the upstream bill service. |

### Detail route shape

`/explore/bill/<congress>/<billType>/<billNumber>` — e.g. `119/hr/10905`.

`<billType>` is the canonical lowercase key (`hr`, `s`, `hjres`, `sjres`, `hconres`, `sconres`, `hres`, `sres`). Routes are matched client-side against the fetched record so a wrong-but-plausible slug never renders another bill's data.

---

## Data flow

```
Browser
  └─ /api/legislation?state=US&q=10905
        └─ LEGISLATION_UPSTREAM_URL/api/bills/search?state=US&q=10905
              (or /api/recommendations?state=US when no query)
```

1. `src/app/api/legislation/route.ts` proxies upstream with a 30 s timeout, `no-store`, and never forwards credentials.
2. `normaliseBills()` (`src/lib/legislation.ts`) guarantees ids, trims empties, caps volume.
3. `BillDetail.tsx` resolves the slug: it searches `state=US&q=<number>`, then `state=FL&q=<number>`, then the unfiltered lists, and matches on parsed type/number/congress or id/source_id.
4. If nothing matches, the page shows a "Document unavailable" state instead of inventing a record.

### Data honesty rules

- No bill, sponsor, summary, status, or date is fabricated.
- Official summary is labelled **Official summary** and attributed to the source that supplied it.
- AI text is separately labelled **CitizenShift explanation — AI generated** with a **Not official text** chip. If no explanation exists, the page says so.
- Progress is derived only from the record's status string (`deriveProgress`). Passage of time never advances a milestone.
- Official text links are ranked GovInfo → Congress.gov → LegiScan. LegiScan is explicitly labelled a **reference mirror, not an official government source**.
- Retrieval timestamps are shown wherever data is presented as verified.

### Known limitations

- **AI generation is read-only.** The UI renders `aiSummary` when the upstream record provides one and otherwise shows an honest "not generated yet" state. There is no generation endpoint or model key in this deployment, so the button is not faked.
- **Contact Your Rep uses official lookup channels**, not a bundled district database. A 5-digit ZIP produces a House.gov lookup URL; the Senate contact wizard follows. The app never claims a message was sent.
- **Embedded document view** is enabled only for genuine `.pdf` URLs. LegiScan and most legislative portals send `X-Frame-Options: SAMEORIGIN`, so the viewer shows a clear "source does not permit embedding" panel with open/download links instead of a broken frame or placeholder PDF.
- **No persistent database.** Upstream is the source of truth; nothing is cached beyond the request.

---

## Project structure

```
src/
  app/
    layout.tsx                     fonts, metadata, JSON-LD
    page.tsx                       home (Hero, Pillars, Legislation, About, Team, …)
    explore/page.tsx               redirect to /#legislation
    explore/layout.tsx             explore chrome + RevealObserver
    explore/bill/[...slug]/page.tsx  detail + /text route
    api/legislation/route.ts       server proxy
    globals.css                    brand tokens, reveal states, reduced motion
  components/
    site/                          marketing sections
    site/legislation/
      LegislationExplorer.tsx      feed, filters, search, sort
      BillCard.tsx                 interactive card
      ShareDialog.tsx              Web Share + clipboard fallback
      ContactRepDialog.tsx         official representative lookup
      BillDetail.tsx               detail page, timeline, summaries, viewer
    motion/                        SmoothScroll, RevealObserver
    ui/Modal.tsx                   accessible dialog primitive
  lib/
    legislation.ts                 types, parsing, routes, official URLs, progress
    legislation-upstream.ts        upstream response types
    states.ts                      US state names/codes
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Production build + type/lint checks. |
| `npm run start` | Serve the production build. |

---

## Documentation

- [`docs/implementation-report.md`](docs/implementation-report.md) — what was built, phase by phase, and the decisions behind it.
- [`docs/design-system.md`](docs/design-system.md) — brand tokens, typography, components, responsive rules.
- [`docs/testing-report.md`](docs/testing-report.md) — acceptance test results for H.R. 10905.
- [`docs/asset-inventory.md`](docs/asset-inventory.md) — every image in the repo and its licensing status.

---

## Brand

Icy Blue `#B3E5FC` · Berry Red `#C2121F` · Navy `#173B57` · Soft White `#F8FBFD`.

Navy text and controls on soft-white reading surfaces, berry reserved for primary actions and the active milestone, icy blue for supporting sections.
