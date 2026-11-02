# CitizenShift research and pre-build pack

Prepared: 2026-11-01

This pack contains the externally verifiable content and visual materials gathered for the CitizenShift rebuild. It is a **research handoff**, not a claim that a Firecrawl crawl or the full dynamic legislative feed has been completed.

## Status at handoff

- Public page content manually inspected: `/`, `/donate`, `/the-team`, `/contact`.
- Public app inspected through available text extraction: only the app shell and `Loading bills...` were exposed. The supplied dashboard screenshot supplied the two bill examples documented here.
- The actual upstream provider used by the existing app is **not proven** from public output. The two displayed examples match official federal bill records. The recommended canonical sources for the rebuild are Congress.gov API + GovInfo bulk data.
- Two visible bill examples have been cross-checked. This is not a complete import of all bills in the original app.
- Firecrawl full crawl: **not run**. The API credential posted in chat must be revoked and replaced before using Firecrawl. Do not place credentials in prompts, frontend files, source control, or this pack.
- Design tokens and proposed component direction are included. They should be treated as the working design system pending client approval.

## Pack structure

- `research/website-audit.md` — pages, content, navigation, findings and blockers.
- `research/legislation-data-audit.md` — provider assessment, official-source recommendations, verified examples, schema and outstanding checks.
- `content/content-library.json` — public copy and team content extracted from accessible site pages.
- `content/verified-example-bills.json` — normalized examples from the client dashboard screenshot, with source links and verification notes.
- `brand/design-system.md` — direction and UI principles, including the 60/30/10 palette and THERUINS visual-quality reference.
- `brand/design-tokens.json` — proposed tokens.
- `assets/assets-manifest.json` — local and externally hosted assets, usage notes and restrictions.
- `assets/` — logo and generated civic imagery.
- `reference/` — supplied screenshots and carousel reference montage.

## Important production cautions

1. Keep the actual CitizenShift logo as the production mark until the client approves a vector redraw. `logo-upscale-emblem-concept.png` is an AI-generated emblem-only concept, not a verified exact recreation of the original wordmark.
2. AI-generated civic images are illustrative campaign visuals, not documentary photos. Do not caption them as real events or actual people.
3. The early design concept board contains fabricated names and metrics. It is reference-only and must not be used as live site content.
4. Keep official bill metadata, official bill text, and CitizenShift plain-language explanations in separate fields. Never make a generated explanation look like an official CRS summary.
5. H.R. 10870 and H.R. 10905 are **bills**, not enacted laws, in the records checked here. Label them as proposed legislation / bills until an official enactment record exists.
