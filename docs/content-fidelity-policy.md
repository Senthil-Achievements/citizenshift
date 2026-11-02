# CitizenShift — Content Fidelity Policy

Status: **BINDING** — applies to every page, component, and data transform in this repository.
Adopted: 2026-11-02

## 1. Purpose

The rebuilt CitizenShift website must reproduce the original website's content **as it is**.
This document defines the rules that make that guarantee enforceable, and the boundaries
beyond which work must stop and be reported rather than guessed at.

## 2. The rules

### 2.1 Exact reproduction

For every URL the client supplies, the rebuilt site must copy all original text exactly as
displayed. This includes, without limitation:

- bill titles, bill numbers, summaries, dates, statuses, sponsor names, descriptions;
- headings, paragraphs, labels, buttons, captions, footnotes, disclaimers;
- team bios, mission/problem/product/donation copy, contact details, nonpartisanship
  declarations (source: `content/original/content-library.json`).

### 2.2 No transformation of source text

Original text must be reproduced **without**:

| Forbidden operation | Example |
| --- | --- |
| paraphrase | rewriting a sentence in different words |
| summarise | shortening a long official summary |
| simplify | replacing plain terms with easier ones |
| translate | rendering text in another language |
| autocorrect | "fixing" the original's spelling or grammar |
| rewrite | any editorial change, however small |
| truncate | cutting text to fit a layout |
| generate | inventing replacement content when information is missing |

**Spelling, punctuation, capitalization and wording are preserved character-for-character.**
If the original contains a typo, the rebuild contains the same typo.

### 2.3 No AI modification of official legislative content

Official legislative text — bill titles, official summaries, latest actions, sponsor names,
committees, dates, statuses, and the full bill text served by the original-text viewer — must
**never** be produced, corrected, reworded or "improved" by a language model.

AI-generated material may exist on the page **only** where it is:

1. explicitly labelled as not official text (see `BillDetail.tsx`, "Not official text"), and
2. displayed **alongside** — never **instead of** — the official text.

> **Known conflict, addressed:** `billTitle()` in `src/lib/legislation.ts` previously returned
> `bill.aiSummary?.title || bill.full_title || bill.title`, giving an AI-generated title
> precedence over the official title. That ordering violates §2.3. See §5 for the fix.

### 2.4 Missing information

If content cannot be retrieved, **report it instead of guessing.** Never generate
replacement content, never leave a plausible-looking placeholder, and never let a fallback
value silently stand in for missing original text.

Reporting means: record the URL, what was expected, what happened, and surface it in the
implementation report so the client can supply the source.

### 2.5 Links

- **Internal navigation URLs** are adapted to point at the rebuilt site's routes.
  This is the *only* permitted URL change.
- **External URLs** (official sources, GovInfo, Congress.gov, LegiScan, social links,
  mailto/tel, source references) remain **unchanged**, byte-for-byte.

### 2.6 Storage and protection

Original content lives in `content/original/` and is protected as follows:

- files are stored **verbatim**, extracted from `citizenshift_research_pack.zip` with no
  reformatting, pretty-printing or line-ending normalisation;
- `content/original/SHA256SUMS.txt` records a SHA-256 checksum for every content file;
- `content/original/verify.ps1` re-checks every file and exits non-zero on any change;
- content files carry the **read-only** file attribute so they cannot be casually edited;
- any detected modification must be treated as an incident: restore from the zip, re-run
  `make-manifest.ps1` only if the source pack itself was legitimately re-issued.

The manifest is the authority. A content file whose hash is not in `SHA256SUMS.txt` is
unverified and must not be treated as original text.

### 2.7 Scope of "original content"

This repository holds **only what the research pack verified.** Per
`content/original/RESEARCH_STATUS.txt` and `research/legislation-data-audit.md`:

- only **two** bill records are verified (`H.R. 10870`, `H.R. 10905`);
- a full Firecrawl map+crawl of the original site **has not run**;
- the original app's actual data provider is **not conclusively identified**;
- state/local coverage and the dynamic feed contents are **unknown**.

Live bill data proxied from `LEGISLATION_UPSTREAM_URL` is *not* original site content and is
not covered by a verbatim guarantee — it is whatever the upstream returns. Nothing in this
repo may claim otherwise.

## 3. How fidelity is enforced in code

| Layer | Mechanism |
| --- | --- |
| Source of truth | `content/original/` + `SHA256SUMS.txt` |
| Integrity check | `content/original/verify.ps1` (exit 0 = intact) |
| Rendering | components render stored strings directly; no formatter rewrites them |
| Labels | AI material marked "Not official text"; official material marked as such |
| Links | internal hrefs adapted; external `href` values passed through unchanged |
| Verification | URL-by-URL reproduction checklist (§4) |

`src/lib/legislation.ts` normalisation (`normaliseBills`) must only guarantee an `id` and
drop structurally empty records. It must not alter any user-visible text.

## 4. URL reproduction checklist

For each URL the client provides, record:

```
URL:
Retrieved: yes / no / partial
Text copied verbatim: yes / no
Links adapted (internal only): yes / no
Deviations: (list, or "none")
Verified against original: yes / no
```

A URL that cannot be retrieved is reported in `docs/content-fidelity-report.md` with the
reason — it is **not** filled in from memory, inference, or a model.

## 5. Outstanding work

1. **`billTitle()` ordering** — official title must take precedence over
   `bill.aiSummary.title`. Must be corrected and re-verified.
2. **URLs not yet supplied** — reproduction cannot begin until the client provides the
   list. Nothing will be invented in the meantime.
3. **Full original-site crawl** — blocked pending a replacement Firecrawl key
   (see `RESEARCH_STATUS.txt`); until then the public route set beyond
   `/`, `/donate`, `/the-team`, `/contact` is unverified.
