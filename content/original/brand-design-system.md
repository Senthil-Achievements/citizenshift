# CitizenShift — proposed design system

Status: working design direction, pending client approval.

## Brand equation

**THERUINS-level art direction and engineering quality; CitizenShift's own identity, mission and color palette.** Take cues from the THERUINS website for cinematic presentation, bold editorial hierarchy, carefully engineered motion, asymmetry, premium detail and confident composition. Do not copy THERUINS black/gold colors, logo, messaging or brand assets.

## Color system

Client palette is authoritative:

- Icy Blue — `#B3E5FC`
- Berry Red — `#C2121F`
- Navy — `#173B57`
- Soft White — `#F8FBFD`

Use an approximate 60/30/10 *visual balance*: 60% split between icy-blue surfaces / light atmosphere, 30% berry-red emphasis or section blocks, 10% navy anchors and high-contrast UI. Soft White is a supporting neutral for cards, text surfaces and breathing room. Do not interpret the ratio as a strict count of page pixels or force every component into a tricolor.

## Typography (proposal)

- Display: Space Grotesk, 500–700; bold condensed-feeling headings and strong line breaks.
- Body/UI: Inter, 400–600; clear reading at small sizes, especially for bill metadata.
- Use editorial scale contrast: very large hero/display; restrained labels; readable 16–18 px body.
- Never use decorative typography for full legal text or status information.

## Composition

- 12-column desktop grid; 8-column tablet; 4-column mobile.
- Spacious hero with large type and one cinematic civic photograph.
- Alternating icy-blue and berry-red section fields; navy for navigation, high-priority UI and information contrast.
- Precise 1 px borders, restrained shadows and simple card geometry; avoid excessive pill shapes.
- Use asymmetry and layered typography in brand/story sections; keep legislation data surfaces more structured and scannable.
- Make the active legislation card a visual focus, but retain a searchable/filterable directory below it. The carousel is discovery, not the only way to navigate a large catalogue.

## Motion language

- GSAP + ScrollTrigger for hero and scroll-linked transitions.
- Lenis for controlled smooth scrolling (respect reduced-motion and avoid overriding native touch behavior).
- Staggered text reveals, image parallax, soft clip-path reveals, restrained card transitions and clear selected-state feedback.
- The supplied Pinterest video montage is a horizontal destination-card carousel reference. Adapt that interaction to featured legislation: large active item, side cards visible, swipe/drag/arrow input, active card change transitions and concise metadata. Do not copy its travel imagery, destination labels or brand.
- `prefers-reduced-motion` must disable or shorten nonessential motion.
- Do not use motion to hide data, delay reading, or disrupt keyboard focus.

## Page architecture

One unified same-origin experience under `citizenshift.us`:

1. Header / navigation (Home, Explore, About, Donate, Team, Contact, Sign in where implemented).
2. Hero — current mission statement / “Bringing power to the people” narrative.
3. Civic participation value proposition.
4. Featured legislation carousel inspired by the supplied video reference.
5. Full searchable legislation directory with filters and card/detail view.
6. About / mission / nonpartisanship.
7. Team using real approved portraits and bios.
8. Donation module wired to the existing verified ActBlue destination unless client changes it.
9. Contact and footer.

Do not make the app a separate subdomain or redirect to `citizenshift.vercel.app`.

## Legislation card hierarchy

- Bill identifier (`H.R. 10905`, not `HB10905`).
- Status (`Introduced`, `In Committee`, `Passed House`, `Enacted`, etc. based on official record).
- Official policy area / clearly labelled CitizenShift topic tag.
- Official title.
- Short neutral “What it would do” explanation.
- Introduced date / latest action.
- View details, source citation, Share, Contact Your Rep.

Use “bill” or “legislation” for proposals. Reserve “law” for enacted measures.

## Interaction requirements

- Search by number/title/keyword.
- Filter All / Federal / New / Passed and topic tags; filter should reflect defined semantics.
- Carousel arrows, touch swipe, drag, keyboard arrow navigation, dots, and card activation.
- Selecting a bill opens a detail drawer/modal or expands a panel with official source links, status history, sponsors, committees, text versions and a clearly attributed explanation.
- Shuffle may surface another record but should respect active filter conditions.
- Share uses Web Share API with clipboard fallback.
- Contact Your Rep should only use a verified representative lookup and correct constituent matching; no fake contact form.
- Auth, donation, representative lookup and forms must use working backend/service integrations, not no-op stubs.

## Technical implementation proposal

- Next.js App Router + TypeScript + Tailwind CSS.
- GSAP/ScrollTrigger and Lenis for motion/scroll.
- Server-side data access and secret management.
- Responsive, keyboard-accessible React UI.
- Official records and editorial summaries stored separately with provenance and timestamps.
