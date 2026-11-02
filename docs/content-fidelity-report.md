# CitizenShift — Content Fidelity Report

Status: **NO URLS SUPPLIED YET** — reproduction has not begun.
Last updated: 2026-11-02

This is the running record for exact reproduction of the original website's content.
Rules: `docs/content-fidelity-policy.md`.

**Nothing in this file is filled in from memory, inference, or a model.** A URL that
cannot be retrieved is listed under "Not retrieved" with the actual reason.

---

## 1. URL reproduction log

| # | URL | Retrieved | Text verbatim | Links adapted | Verified against original | Notes |
|---|-----|-----------|---------------|---------------|---------------------------|-------|
| — | *(none supplied)* | — | — | — | — | awaiting client URL list |

**Not retrieved:** *(none attempted)*

---

## 2. Original content store

Location: `content/original/` — 9 files, verbatim from `citizenshift_research_pack.zip`.

| File | Purpose | Status |
|------|---------|--------|
| `content/content-library.json` | Public site copy (mission, problem, product, donate, contact, team, nonpartisanship) | read-only, hash-verified |
| `content/verified-example-bills.json` | The **only** two verified bill records (H.R. 10870, H.R. 10905) | read-only, hash-verified |
| `research/website-audit.md` | Original site route/CTA audit | read-only, hash-verified |
| `research/legislation-data-audit.md` | Data-provider audit + known limits | read-only, hash-verified |
| `RESEARCH_STATUS.txt` | What is and is not verified | read-only, hash-verified |
| `PACK-README.md` | Pack provenance | read-only, hash-verified |
| `brand-design-system.md`, `brand-design-tokens.json`, `assets-manifest.json` | Brand + assets | read-only, hash-verified |

Integrity: `content/original/SHA256SUMS.txt` (SHA-256 per file).
Verify: `powershell -ExecutionPolicy Bypass -File content/original/verify.ps1` → exit 0.
Protection: read-only file attribute (write attempt blocked — tested).

---

## 3. Fidelity defects found and fixed

| # | Location | Defect | Fix | Test |
|---|----------|--------|-----|------|
| 1 | `src/lib/legislation.ts` `billTitle()` | `aiSummary.title` took precedence over the official title | Official title first: `full_title \|\| title \|\| aiSummary.title \|\| ""` | `scripts/test-content-fidelity.mjs` |
| 2 | `src/lib/legislation.ts` `billBullets()` | `aiSummary.summaryBullets` took precedence over official bullets | Official bullets first | `scripts/test-content-fidelity.mjs` |
| 3 | `src/components/site/legislation/BillCard.tsx` | Card rendered `aiSummary.summary \|\| summary` — AI stood in for the official summary, unlabelled | `full_summary \|\| summary \|\| aiSummary.summary` | `scripts/check-ai-precedence.mjs` |

**Verified correct as-is (no change needed):**

- `BillDetail.tsx` Summary section renders `full_summary || summary` verbatim, labelled
  "Official summary".
- `BillDetail.tsx` AI explanation is fenced inside its own block labelled
  "CitizenShift explanation — AI generated" + chip "Not official text", and explicitly
  states it is "never as a stand-in for official text".
- `BillDetail.tsx` renders `{bill.full_summary || bill.summary}` with no transformation.

---

## 4. Guards in place

| Guard | Command | Result |
|-------|---------|--------|
| Official-text precedence (behaviour) | `cmd /c "node scripts/test-content-fidelity.mjs"` | **14/14 pass** |
| AI-over-official pattern (source scan, 66 files) | `cmd /c "node scripts/check-ai-precedence.mjs"` | **PASS** |
| Original content integrity (SHA-256) | `powershell -ExecutionPolicy Bypass -File content/original/verify.ps1` | **9/9 intact, exit 0** |
| Original content write protection | `powershell -ExecutionPolicy Bypass -File scripts/test-content-protection.ps1` | **PASS — write blocked** |
| Production build | `cmd /c "npm run build"` | **exit 0, 19 routes** |

The source-scan guard was self-tested against a deliberately-bad fixture: it reported
2 violations and exited 1, then passed clean after the fixture was removed.

---

## 5. Honest limits

1. **No URLs supplied yet.** Nothing has been reproduced from the original site in this
   pass. Reproduction cannot start until the client provides the URL list.
2. **Only two bill records are verified** (`H.R. 10870`, `H.R. 10905`) per
   `content/original/RESEARCH_STATUS.txt`. All other bill data shown by the app comes
   live from `LEGISLATION_UPSTREAM_URL` and is *not* covered by a verbatim guarantee.
3. **A full crawl of the original site has not run** — blocked pending a replacement
   Firecrawl key. Beyond `/`, `/donate`, `/the-team`, `/contact`, the original route set
   is unverified.
4. **The original app's actual data provider is not conclusively identified** — see
   `content/original/research/legislation-data-audit.md`. Congress.gov API must not be
   claimed as confirmed.
5. **Card summary uses CSS `line-clamp-3`.** The full official text remains in the DOM
   (not deleted or rewritten) and the detail page shows it unclamped; this is a display
   limit only, and will be reviewed against the original card design once URLs arrive.
6. **Supabase is still unconfigured** (no `.env.local`), so account/admin surfaces remain
   UNVERIFIED — unrelated to content fidelity, tracked separately.

---

## 6. Next actions

1. Client supplies the URL list → fetch each one → copy text verbatim → log in §1.
2. Any URL that fails to retrieve goes in "Not retrieved" with the real reason.
3. Diff every reproduced page against the original, character for character.
4. Re-run all guards in §4 after each change.
