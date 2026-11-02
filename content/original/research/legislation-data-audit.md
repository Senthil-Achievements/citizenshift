# CitizenShift — legislation data audit

Audit date: 2026-11-01

## 1. What the current app exposes

The screenshot supplied by the client shows a federal bill feed with:

- Search Congress;
- All / Federal / New / Passed filters;
- Shuffle;
- category/topic tag;
- status tag such as Introduced;
- bill title and bill identifier;
- three plain-language summary bullets;
- Share and Contact Your Rep actions;
- a visible country label `United States` and a `1 of 6` indicator.

The public Vercel app currently exposes only the shell and `Loading bills...` to text-only page inspection. It does not reveal the frontend's API calls or backend/provider identity.

## 2. Existing data provider: conclusion

**The exact provider currently used by CitizenShift is not identifiable from the publicly inspectable evidence.** The two screenshot records are real 119th-Congress House bill records and match Congress / GovInfo records, so Congress.gov data is the likely canonical record family. This does not prove whether the current app directly uses the Congress.gov API, GovInfo feeds, a third-party provider, or a custom database populated from those sources.

Do not state in project docs that the old app is definitely powered by Congress.gov API until the runtime network calls, source code, or deployment configuration confirms it.

## 3. Recommended authoritative source stack for the rebuild

### Primary structured metadata and actions — Congress.gov API v3

Official documentation: `https://api.congress.gov/`

The API supports bill list and detail endpoints, actions, amendments, committees, cosponsors, related bills, subjects, summaries, text versions and titles. It also exposes law endpoints. A Data.gov API key is required.

Recommended use:

- Bill identity, titles, chamber/type, sponsors/cosponsors;
- action history and current action;
- committee referrals;
- subjects and policy metadata;
- official summaries when available;
- text-version links and bill metadata;
- enacted law records when applicable.

### Official text / status and bulk imports — GovInfo

Official developer hub: `https://www.govinfo.gov/developers`

Bulk repository: `https://www.govinfo.gov/bulkdata/`

Useful collections:

- `BILLSTATUS` — bill status XML/JSON; documented coverage from the 108th Congress onward;
- `BILLS` — congressional bill text; documented coverage from the 113th Congress onward;
- `BILLSUM` — bill summaries; documented coverage from the 113th Congress onward;
- `PLAW` / Public and Private Laws and Statutes at Large — enacted law sources.

The official bulk repository exposes XML and JSON directory views. GovInfo's separate API uses a Data.gov API key. The 119th Congress directories were listed as recently updated on 2026-10-31 during this audit.

### Geographic and state coverage gap

The current screenshot only proves a Federal filter. CitizenShift's public mission promises personalization based on geography and policy interests, but the exact state/local legislative coverage is not discoverable from the app shell. Congress.gov is the federal source; state legislation, state representatives and local measures need an explicitly selected state-level source strategy. Do not imply that federal-only records are a full U.S. geography-aware experience.

## 4. Two visible records verified

Only the two records visible in the client screenshot are included here. This is not the complete bill feed.

### Record A — H.R. 10870

Official title: `Military Domestic Violence Survivors Support Act`

- Congress: 119th Congress, 2nd Session
- Type: House bill (`H.R.`)
- Number: 10870
- Introduced: 2026-10-22
- Latest action shown: Referred to the House Committee on Armed Services (2026-10-22)
- Sponsor: Rep. Maggie Goodlander
- Committee: House Armed Services
- Policy area shown in cross-referenced data: Armed Forces and National Security
- Client app topic/status: `Unclassified` / `Introduced`
- Screenshot identifier: `HB10870`; normalize in the rebuilt interface to the official identifier `H.R. 10870`.

Plain-English explanation visible in the old app:

1. Extends Special Victims’ Counsel services to domestic violence victims in the military.
2. Amends Title 10 provisions, expanding who can receive domestic violence victim advocacy.
3. Takes effect two years after enactment and requires a briefing to Congress within one year of enactment.

Cross-check: a nonpartisan legislative summary page describes the bill as amending 10 U.S.C. §1044e, expanding the Special Victims’ Counsel program to domestic violence cases, with implementation two years after enactment and a Pentagon briefing within one year. The official Congress.gov record is linked from independent bill listings. The exact official text file was not successfully retrieved in this web pass, so the summary should be checked against the official text during data ingestion before production.

Official record link: `https://www.congress.gov/bill/119th-congress/house-bill/10870`

GovInfo package pattern: `https://www.govinfo.gov/app/details/BILLS-119hr10870ih`

### Record B — H.R. 10905

Official title: `No Personal Data in Grocery Pricing Act`

- Congress: 119th Congress, 2nd Session
- Type: House bill (`H.R.`)
- Number: 10905
- Introduced: 2026-10-22
- Sponsor: Rep. Eugene Simon Vindman
- Latest action shown: Referred to the House Committee on Energy and Commerce (2026-10-22)
- Committee: House Energy and Commerce
- Official policy area in retrieved data: not assigned / blank in the record retrieved
- Client app topic/status: `Technology & Privacy` / `Introduced`
- Screenshot identifier: `HB10905`; normalize in the rebuilt interface to the official identifier `H.R. 10905`.

Verified against the official introduced bill text on GovInfo. The bill would prohibit covered retail food operators and online platforms from engaging in individualized pricing, using facial recognition or biometric data to set item prices, and engaging in dynamic pricing. It includes defined exceptions for permitted discounts/practices, including coupons, voluntary loyalty programs, specified eligibility discounts, certain markdowns, service fees and complaint resolutions. The bill assigns enforcement to the Federal Trade Commission and permits state attorneys general to bring civil actions under stated conditions. It preserves stronger state consumer-protection rules and would take effect one year after enactment.

Official PDF: `https://www.govinfo.gov/content/pkg/BILLS-119hr10905ih/pdf/BILLS-119hr10905ih.pdf`

Official record: `https://www.congress.gov/bill/119th-congress/house-bill/10905`

### Data-model observation

The screenshot labels these identifiers `HB10870` / `HB10905`. These are not the preferred federal display format. GovInfo defines `H.R.` as a House bill and `S.` as a Senate bill. The rebuilt site should show `H.R. 10870` and `H.R. 10905`, while storing normalized fields (`congress=119`, `bill_type=hr`, `bill_number=10870/10905`).

### Official vs editorial categories

The old app's `Technology & Privacy` and `Unclassified` labels may be CitizenShift's own topic taxonomy. They must not overwrite official policy-area metadata. Store two fields:

- `official_policy_area` — from Congress.gov or official metadata, nullable;
- `citizenshift_topics` — editorial/platform topic tags, with a documented taxonomy.

The current evidence for H.R. 10905 shows no official policy area value in one retrieved dataset, while the old app assigned `Technology & Privacy`.

## 5. Recommended storage schema

Store at least:

- stable bill ID (`congress-billType-billNumber`);
- congress and session;
- bill type, bill number, official formatted number;
- chamber;
- official title and short title;
- introduced date;
- latest action date and verbatim latest action;
- full action history;
- sponsor and cosponsor records;
- committee references;
- official policy area and subjects;
- versioned official text URLs / package IDs;
- official CRS summary text and source/version if available;
- separate CitizenShift plain-English explanation, author/reviewer and provenance;
- status (`introduced`, `referred`, `reported`, `passed_house`, `passed_senate`, `enrolled`, `presented`, `signed`, `vetoed`, etc. as supported by authoritative action data);
- enacted-law/public-law reference when present;
- state/jurisdiction if a state data feed is later added;
- source system, source URL, import timestamp, last verified timestamp and content hash.

Never store only the display card copy. Keep raw official source fields and generated editorial text separately.

## 6. Summary-generation / verification rules

- Prefer an official CRS summary when one exists.
- If no official summary exists, create a clearly labelled CitizenShift explanation from the current official bill text; do not present it as an official Congressional summary.
- Keep explanations short and neutral; describe what the bill would do, not what it will do.
- For every statement about enforcement, exceptions, timing, effective date or eligibility, keep a passage/section reference to the bill text.
- Always label a bill as a proposal until an enacted public/private law reference is present.
- Show the official source link next to the editorial explanation.
- Record the version date because bill text can be amended.

## 7. Remaining data-extraction work

- Obtain a rotated Firecrawl key and complete the actual public-site crawl.
- Run a JS-capable browser session on the Vercel app after bill data finishes loading; capture all rendered feed items, visible filters, routes and network requests.
- Identify whether the old app calls Congress.gov directly, GovInfo, a third-party API, or its own database.
- If the old provider remains unknowable, use Congress.gov + GovInfo as the replacement data pipeline.
- Import the full agreed scope (e.g. all current 119th-Congress bills and resolutions, or a narrower feed); the full scope must be agreed before claiming all records are extracted.
- Cross-check every imported record's type, number, title, actions, status and text-version link.
- Decide whether state legislative data is in scope and select official state-source coverage separately.
