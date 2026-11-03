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

1. Client supplies the URL list → fetch each one → copy text verbatim → log in §1. *(superseded below)*
2. Any URL that fails to retrieve goes in "Not retrieved" with the real reason.
3. Diff every reproduced page against the original, character for character. *(done — see §7)*
4. Re-run all guards in §4 after each change.

---

## 7. 2026-11-02 — all 50 client URLs reproduced and verified byte-exact

### 7.1 Reproduction result

Every URL the client supplied (`https://citizenshift.vercel.app/bills/<id>`, 50 pages)
was machine-captured from the original site, stored in the protected store, and
re-rendered on this site. Verification (all run from real DOM capture of BOTH sites,
never hand transcription):

| Check | Tool | Result |
|---|---|---|
| Original content store integrity | `content/original/verify.ps1` | 62/62 OK (exit 0) |
| Lossless parse→render round-trip | `scripts/test-original-roundtrip.mjs` | 50/50, 495 links, 0 non-https |
| Rebuilt page text vs original capture | `scripts/diff-rendered-bills.mjs` | **50/50 byte-exact** |
| Rebuilt page links vs original capture | `scripts/diff-rendered-links.mjs` | **50/50 clean** — every original link preserved unchanged; only addition is the adapted internal "Back to Feed" → `/explore` (50×); 0 non-https |
| Content fidelity guards | `scripts/test-content-fidelity.mjs` | 14/14 |
| AI-over-official precedence guard | `scripts/check-ai-precedence.mjs` | PASS (70 files) |

Method note: hand transcription produced 5 errors in an early trial (missed the
late-rendering "Share / Contact Your Rep" controls; wrong emoji/policy area on one
bill). All content comes from machine DOM capture (sessionStorage + Blob download →
`files.get` → disk), and the `/bills/[id]` component mirrors the original page's box
structure so this engine's innerText — and therefore the layout — matches the
original. Rebuild captures are kept under `content/rebuild/` (write target);
`content/original/**` remains read-only and untouched.

### 7.2 Title discrepancy found in the client's list (not fixed by guessing)

The client's list pairs each URL with a title. Cross-check evidence
(`scripts/verify-client-titles.mjs`, `scripts/analyse-title-mismatch.mjs`;
site is self-consistent: API title == displayed title 50/50):

| Category | Count | Meaning |
|---|---|---|
| A. exact match | 10 | list title == site title |
| B. trailing-period only | 10 | site shows the period |
| C. different bill at the URL | 30 | list claims a different title for that URL |
| D. title absent from site | 4 | *Truth and Accountability Commission Act* (2161210), *Tell the Government Once Act* (2161207), *QUAHOGS Act of 2026…* (2161215), *Military Suicide Prevention Oversight Act* (2161217) |
| E. site title not in list | 4 | *Oxi Day* resolution (2161517), *Aquatic Restoration and Conservation Act* (2161281), *Common-Sense Cloud Security Act* (2161278), Ohio *Struthers Municipal Court judge* change (2161520) |

Applied rule: the original site's content wins; the list is stored verbatim at
`content/original/client-supplied-titles.txt` for the record. **The 30+4+4
mismatches need a client decision** — the pages at the supplied URLs are reproduced
faithfully, but the client may have wanted a different URL↔bill pairing.

### 7.3 Honest limits (updated)

1. AI generation is intentionally absent on these pages — the "Generate plain-language
   summary" control is disabled with an explanation; AI content stays separate from
   official content.
2. The 50 URLs cover bill pages only; whole-site fidelity beyond these pages remains
   out of scope pending client direction.
3. Supabase remains unconfigured; no environment or credential changes affected any
   of the checks above.
