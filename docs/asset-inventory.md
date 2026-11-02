# Asset Inventory

All files below are local to this repository. Sizes are rounded. **No licence, credit, or permission record for any photograph, logo, or team portrait was found anywhere in the repo** (no `CREDITS.md`, `LICENSE` alongside images, or metadata). This must be resolved before public launch.

> The only licence file present is `reference/florist-animation-source/florist-website-template/LICENSE` (MIT, © 2026 8B). It covers that unrelated reference template only — not CitizenShift imagery.

---

## 1. Site imagery (`public/photo/`)

| File | Dimensions | Size | Used in | Licence status |
| --- | --- | --- | --- | --- |
| `hero.jpg` | 1920×963 | 255 KB | `Hero.tsx` backdrop; Open Graph / Twitter card (`layout.tsx`) | **Unverified** |
| `hearing.jpg` | 1920×1278 | 395 KB | `Pillars.tsx` (first pillar) | **Unverified** |
| `crowd.jpg` | 1920×1275 | 643 KB | `Pillars.tsx` (second pillar) | **Unverified** |
| `dome.jpg` | 1920×2429 | 925 KB | `Pillars.tsx` (third pillar) | **Unverified** |
| `townhall.jpg` | 1920×1274 | 476 KB | `About.tsx` | **Unverified** |

Notes:
- These read as professional stock photography (Capitol, town hall, crowd, hearing room). No source, photographer, or licence is recorded in the repository.
- `dome.jpg` is portrait-oriented and tall; it is only used inside a cropped pillar card.
- All five are served unoptimised from `public/` via CSS backgrounds or `<img>`. Next.js image optimisation is not used for these.

**Action required:** obtain the licence/receipt for each image from the client or original supplier, or replace with licensed equivalents. Do not launch on an assumption of fair use.

---

## 2. Team portraits (`public/team/`)

| File | Dimensions | Size | Person | Licence status |
| --- | --- | --- | --- | --- |
| `erin-chouinard.jpg` | 800×800 | 71 KB | Erin Chouinard | **Unverified** |
| `sav-perera.jpg` | 800×800 | 95 KB | Sav Perera | **Unverified** |
| `ariana-warden.jpg` | 408×408 | 27 KB | Ariana Warden | **Unverified** |
| `james-douglas.jpg` | 680×760 | 40 KB | James Douglas | **Unverified** |

Referenced in `src/components/site/Team.tsx`. These appear to be supplied portraits of named individuals.

**Action required:** written consent from each person for public use, plus photographer credit/licence where applicable. `ariana-warden.jpg` is low resolution (408 px) for a portrait card and may need a higher-resolution replacement.

### Research duplicates (`assets-research/team/`)

| File | Size | Matches |
| --- | --- | --- |
| `erin.jpg` | 71 KB | `public/team/erin-chouinard.jpg` |
| `sav.jpg` | 95 KB | `public/team/sav-perera.jpg` |
| `ariana.jpg` | 27 KB | `public/team/ariana-warden.jpg` |
| `douglas.jpg` | 40 KB | `public/team/james-douglas.jpg` |

These are staging copies of the same portraits, not used at runtime. They can be deleted once the `public/team/` set is confirmed, or kept as the original source of record.

---

## 3. Brand marks

| File | Dimensions | Size | Used in | Status |
| --- | --- | --- | --- | --- |
| `public/brand/logo.png` | 1254×1254 | 1.28 MB | Header, footer, favicon/apple icon (`layout.tsx`) | Client-supplied mark; ownership assumed, not documented |
| `public/brand/logo.svg` | vector | 119 KB | Not referenced in code | Client-supplied mark; unused duplicate |
| `Logo.png` (repo root) | 1254×1254 | 1.28 MB | Not served | Duplicate of `public/brand/logo.png` |
| `Logo.svg` (repo root) | vector | 119 KB | Not served | Duplicate of `public/brand/logo.svg` |

Notes:
- `logo.png` is 1.28 MB and is used as a 36–44 px element plus favicon. It should be resized/optimised (e.g. 512 px PNG + 32/180 px icons) before launch.
- The two root-level copies are redundant and are not part of the build output. Safe to archive/remove after confirming with the client.

**Action required:** confirm the logo is owned by CitizenShift and get the vector source if available.

---

## 4. Non-served media & archives

| Path | Size | Description | Status |
| --- | --- | --- | --- |
| `3e6dac6d3a69b88dc7161bcb0b864224.mp4` | 180 KB | Unreferenced video file at repo root | Unknown origin — do not publish without verification |
| `citizenshift_research_pack.zip` | 9.6 MB | Research archive | Internal research, not served |
| `sitepeel-assets.zip` | 450 KB | Exported site assets | Internal, not served |
| `florist-website-template.zip` | 63 KB | Third-party template archive | MIT (see `reference/…/LICENSE`) |
| `reference/florist-animation-source/` | — | Unrelated 8B florist template used as an animation reference | MIT, © 2026 8B. Not part of the CitizenShift build. |

None of these are imported by `src/` and none ship in `.next`. They should not be deployed. The florist template is a **reference only**; no code from it is used in the current build (the motion work was reverted).

---

## 5. Icons & graphics

- Interface icons are inline SVG in components (`BillCard`, `BillDetail`, `ContactRepDialog`, `Hero`, etc.). No icon package dependency.
- Film-grain texture is an inline SVG data URI in `globals.css`.
- No third-party illustration or icon-font assets are used.

---

## 6. Summary checklist before launch

- [ ] Licence/receipt on file for all five `public/photo/` images.
- [ ] Written consent + photographer licence for all four team portraits.
- [ ] Confirm logo ownership; optimise `logo.png`; add favicon sizes.
- [ ] Decide whether to keep or delete `assets-research/team/`, root `Logo.*`, and the unreferenced `.mp4`.
- [ ] Keep `reference/` and the research `.zip` files out of the deployed artifact.
