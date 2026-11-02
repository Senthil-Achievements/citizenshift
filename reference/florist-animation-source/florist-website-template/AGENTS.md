# AGENTS.md: florist website template

Website for a florist or flower shop with delivery, standing orders, events and workshops. One file, `index.html`, with inline CSS and scripts, no JavaScript libraries: the scroll motion is CSS scroll-driven animations plus a small inline motion kit; no build step, and none is needed for copy, colour or photo edits. A GSAP build of the same page is `index.gsap.html` (GSAP 3.13.0, ScrollTrigger, Lenis 1.3.4 from jsDelivr): edit one of the two, not both.

## Files
Edit these files, not a page fetched by URL (that arrives as a summary).
```bash
curl -LO https://raw.githubusercontent.com/8bsite/florist-website-template/main/index.html
curl -LO https://raw.githubusercontent.com/8bsite/florist-website-template/main/AGENTS.md
curl -LO https://raw.githubusercontent.com/8bsite/florist-website-template/main/LICENSE
curl -LO https://raw.githubusercontent.com/8bsite/florist-website-template/main/CREDITS.md
```
Upload `index.html`, LICENSE and CREDITS.md; not this file, README.md or `previews/`.

## Keep
- Every `id`, `data-8b-section`, `data-8b-motion` and `data-8b-part` (`section:<id>` styles, `scene:<id>` animation).
- The motion parts `motion-gate` (head: sets `data-8b-live` on `<html>` only with scroll-driven animation support and no reduced motion), `motion-kit` and `motion`, and every other `data-8b-*` attribute (`data-8b-items` groups, `data-8b-off`, `data-8b-enter`): the CSS and the kit read them. Items ordered by `--i` follow their group; counts the CSS fixes are listed under Known limits (`data-8b-fixed` marks such a group).
- Selectors the scripts use:
  - `section-script:navigation`: `.nav__menu` `.menu__close` `.menu__links`
  - `section-script:opening`: `.op__hold`
  - `section-script:contact`: `.ct__form` `.ct__done`
- `style="--len:N"` = characters in that display line, spaces included: `Moth and Marigold` is 17, `after five` is 10, `rooms in bloom` is 14, `goodnight` is 9, `dear marigold` is 13.
- The brand marks in the nav and the footer are drawn from simple shapes (an inline SVG and three CSS blocks), not images: recolour them through the CSS variables, or replace them with your logo.
- Colours and fonts are variables in `:root` (`data-8b-part="tokens"`): `--color-1` #eecbc0 (blush page background and cards), `--color-2` #331917 (chocolate text and dark sections), `--color-3` #fc72c4 (hot pink script lines and button hover), `--color-4` #a0146c (magenta workshop band, distance pins and second script colour); body text needs 4.5:1 contrast.
- With reduced motion the page must read in full.
- Keep the header comment and `<meta name="generator">`. Keep the "Design: 8B" footer link unless the site owner asks to remove it.

## Replace
- `data-8b-placeholder` (og-image, favicon, phone, social, email, form): real value in, attribute out; no value, remove the row (no image: drop `og:image`, set `twitter:card` to `summary`).
- Order for tonight buttons in the nav, the phone menu and the first screen: now #contact; owner's target: your online shop or order page URL (or keep the order form in contact).
- Build a bouquet from the bench (under the stem list): now #contact; owner's target: your shop's product page or order form URL.
- Start the Jar / Start the Mantel / Ask about the Lobby in standing orders: now #contact; owner's target: the sign-up or subscription checkout URL of each order.
- Plan an event buttons (first screen and events): now #events and #contact; owner's target: your event enquiry form or booking URL.
- Save a seat in the workshops section: now #contact; owner's target: your workshop booking or ticket URL.
- See every arrangement (row link under arrangements) and Instagram in the footer: now https://www.instagram.com/; owner's target: your Instagram profile or portfolio URL.
- The form in `#contact` (fields `name`, `contact`, `date`, `budget`, `note`) sends nothing; `section-script:contact` handles its submit in the page (read it before you connect a service). Formspree: `action="https://formspree.io/f/<id>"` and `fetch` POST `new FormData(form)` first. Netlify: `data-netlify="true"` and a hidden `form-name`. Or delete it and the script.
- The name Moth & Marigold (any letter case); the favicon letter and colours in `<link rel="icon">`.
- Photos (27, Unsplash: opening 1, season 6, work 6, dusk 5, events 6, school 1, notes 1, contact 1): `src`, no `srcset`/`sizes`, `width`/`height` to the ratio, `alt`, CREDITS.md.
- `<title>`, meta description, og tags.

## Ask the owner for
All demo text, never to be invented:
- Address and city: "418 Whitaker Street, Savannah, GA 31401" (phone menu, contact, footer), "Whitaker Street" (opening statement and closing line, on the bench intro, dusk delivery "The last cut", growers scale), Savannah in the title, meta description and "© 2026 Moth & Marigold, Savannah" (footer).
- Opening hours: "Tue-Sat, 11 am to 9 pm" (phone menu, contact, footer); collection "any time from eleven to nine", ready "an hour after you place them" (FAQ).
- Phone (912) 000-0000 and emails orders@ / marigold@mothandmarigold.example (menu, notes, contact, footer), placeholders.
- Delivery window and rules: delivered between five and nine (opening taglines, dusk heading, standing orders footnote, meta description); order by three in the afternoon, Tuesday to Saturday (dusk intro, FAQ); "we text ten minutes ahead", flowers left in the shade with water (dusk); "two vans, eleven neighbourhoods", Midtown first, islands last (dusk); the islands on Fridays (standing orders, FAQ); delivery $12, free on standing orders (FAQ); the neighbourhoods Historic District, Ardsley Park, Thunderbolt, the Southside, Tybee (FAQ).
- Sourcing claims: "grown within two hundred miles" (opening, growers heading, meta description), "nothing flies in" (growers), growers' trucks every Tuesday (on the bench intro), foraging "with permission" on the Isle of Hope (growers).
- Grower names, towns and distances: Ogeechee Flower Co., Richmond Hill, 22 mi; Bluff Road Farm, Ridgeland, 38 mi; Three Pines Growers, Statesboro, 64 mi; Sand Hill Nursery, Aiken, 128 mi; Ocmulgee River Farm, Macon, 168 mi; Isle of Hope, 9 mi; our own beds, 0 mi (on the bench, growers). They are invented names that may match real farms.
- Stem prices: $6, $3, $5, $8 a branch, $7 and $6 a length (on the bench).
- Standing orders: The Jar $45 a week, twelve to fifteen stems, weekly or every other week, jar refills; The Mantel $85 a week; The Lobby from $240 a week, twice a week, vessels on loan; Tuesday or Friday; skip or pause with a text (standing orders).
- Events: weddings from $4,500, six months ahead; dinners and openings from $1,200, three weeks ahead; installations quoted after a site visit (events); six months for April to June and October, three months otherwise, at most two weddings a weekend (FAQ); build on site, strike after the last guest, compost (events).
- Clients and past work: "The Mercer dinner" (forty feet of table, Jones Street, September), a kitchen in Ardsley Park ("every Friday since 2023"), "The Collins wedding" (twelve bouquets, Tybee Island, May), "The Drayton lobby" (twice a week, Drayton Street), a mantel in Gordonston (December), a memorial on the Isle of Hope (March) (arrangements).
- Workshops: Thursdays, eight seats, two hours, "a glass of something cold"; dates Thu 15 Oct, 22 Oct, 5 Nov, 19 Nov (2026 in the datetime attributes), prices $85, $95, $110, $90, seats left 3, 5, 8, 6 (night school).
- Care column: post dates "3 October", "19 September", "5 September", the reader "Wilting, in Thunderbolt", the signature "Marigold" (notes).
- Promises and methods: "one pair of hands makes each order", "never cellophane, never foam", cards written in ink (dusk delivery); no floral foam, everything reused or composted (FAQ); flowers last five to ten days, a care card with every order (FAQ); sympathy flowers the same day (FAQ); "a person answers" the phone (FAQ); "we'll call before five" (contact form thank-you message).
- Budget options $60, $90, $150 in the contact form.

## Known limits
- Without JavaScript the phone menu button cannot open the overlay; the links stay reachable in the footer.
- Long words in the width-filling wordmark need the --len value updated, or the line overflows or looks small.
- The motion is timed in the CSS for six stems with six photos on the bench, five dusk panels, six event photos and seven growers: a different count needs the nth-of-type rules, the --panels value and the animation ranges of that scene updated, or the frames, the track and the markers fall out of step.
- Without CSS scroll-driven animations (Firefox today) or with reduced motion on, the dusk panels stand as a vertical stack instead of a sideways track, and every other section shows its finished layout.

## Check
375 and 1440 px, reduced motion on, a browser without scroll-driven animations (Firefox: the finished static layout), console clean; `data-8b-placeholder` and Moth & Marigold left only in class names.
