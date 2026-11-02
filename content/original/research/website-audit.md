# CitizenShift — public website audit

Audit date: 2026-11-01

## 1. Scope and method

This is a manual public-page review using the accessible website pages, search-indexed content, the live app's text-exposed shell, and the screenshots supplied by the client. It is **not** a completed Firecrawl crawl. The Firecrawl key shared in chat should be revoked and replaced before any authenticated crawl is attempted.

## 2. URL inventory

| URL | Page / observed behavior | Extracted content |
|---|---|---|
| `https://www.citizenshift.us/` | Home | Main hero headline, problem statement, mission, social-media-like bill-feed concept, nonpartisanship, location, contact email. The “Join the Movement” action links to the Vercel app. |
| `https://www.citizenshift.us/donate` | Donate | “Help us Strengthen Democracy.”, donation purpose and an ActBlue donation link. Includes an image described as a smartphone showing legislative bills. |
| `https://www.citizenshift.us/the-team` | The Team | Four named profiles: Erin Chouinard, Sav Perera, Ariana Warden and Governor Jim Douglas. Four image links were found. |
| `https://www.citizenshift.us/contact` | Contact | “Contact Us”, New York, NY and `erin.chouinard@citizenshift.us`. |
| `https://citizenshift.vercel.app/` | Existing legislation application | Text extraction showed a CitizenShift shell, Donate link, Sign In button and `Loading bills...`; dynamic app content did not render in the text extraction. Client screenshot shows the bill feed and controls. |
| `https://www.citizenshift.us/about` | Attempted path | Could not be verified as a standalone route. The home page itself contains the problem statement and mission; About may be a section/anchor, but this is not proven. |

### Important routing issue

The public site's three visible “Download the App” links and its “Join the Movement” CTA link to `citizenshift.vercel.app`. The rebuild requirement is one unified website under `citizenshift.us`; all navigation and app interactions must remain on that origin. No separate `app.` subdomain and no visible Vercel redirect.

## 3. Extracted public copy

### Home

Hero headline:

> Corporations, governments, and technology are becoming more powerful than ever. It’s imperative that the voice of the people does the same.

CTA: `Join the Movement`

Problem statement:

> The Problem: Legislation is complex, inaccessible, and time-consuming to understand. While thousands of bills are introduced each year, most Americans do not have the time, tools, or context to track how laws affect their lives—or to effectively communicate with their elected officials. This information gap weakens civic participation and accountability.

Mission:

> Our Mission is to increase civic engagement by making legislation more accessible, understandable, and actionable for every American.

Product description:

> We do this by bringing bills into a social-media like format personalized to every American based on geography and policy interests. We reduce barriers in communication between legislators and constituents by making it possible to contact legislators and advocate for policies with the push of a button.

Nonpartisanship declaration:

> CitizenShift does not support or oppose candidates for public office or take a stand for or against any political party.

Location: `New York, NY`

Contact: `erin.chouinard@citizenshift.us`

### Donate

Heading: `Help us Strengthen Democracy.`

Copy:

> CitizenShift aims to make legislation more accessible, understandable, and actionable for every American. One small donation goes a long way in supporting our mission.

Verified donation destination:

`https://secure.actblue.com/donate/citizenshift-1`

The ActBlue page states that the charitable contribution is received and processed by ActBlue Charities, Inc. and that contributions are subsequently given to the selected organization or cause within 30 days. Preserve the donation provider and do not imply CitizenShift directly processes the payment unless the client confirms a change.

### Contact

Heading: `Contact Us`

Location: `New York, NY`

Email: `erin.chouinard@citizenshift.us`

### The Team

**Erin Chouinard** — `Founder, Executive Director`

> Erin has worked in advocacy in local communities over the last 8 years. She brought this work to her college campus and founded an organization teaching students how to advocate on and interact with legislation. Erin has experience creating organizations from the ground up, recruiting and leading teams, and creating change.

**Sav Perera** — `Director of Technology`

> Sav is a software engineer and is pursuing his master's degree in ML specialization at the Georgia Institute of Technology. He has had experience developing frontend solutions across multiple organizations, working with React, TypeScript, Python, C++, and Java to build and improve web applications. His work has spanned performance optimization, feature development, and UI enhancements across a variety of projects.

**Ariana Warden** — page sequence associates her with `Director of Finance`; her bio begins “Ariana (Director of Finance)...”

> Ariana (Director of Finance) is a financial analyst who has worked in Equities Research for three years. She has also worked at various startups in Business Development and Operations Strategy roles. Ariana graduated from Cornell University with a degree in Operations Research and Information Engineering.

**Governor Jim Douglas** — the page labels the section `Advisory Director`; the bio calls him an `Advisory Board Member`.

> James Douglas (Advisory Board Member) was the 80th governor of Vermont from 2003 to 2011 and serves as a political expert on the board.

### Role-label check needed

The extracted order suggests Sav = Director of Technology, Ariana = Director of Finance, and Jim Douglas = Advisory Director / Advisory Board Member. The exact labels should be client-confirmed before publishing because the page layout places some labels immediately before the following profile heading.

## 4. Navigation and functionality observed

### Public website screenshot

- CitizenShift logo at upper left.
- Navigation labels: About, Donate, The Team, Contact.
- Large centered editorial headline.
- Berry-red “Join the Movement” CTA.

### Existing dashboard screenshot

- Brand bar with CitizenShift mark and Sign In.
- Search Congress input, Search button and Shuffle button.
- Filters: All, Federal, New, Passed.
- Bill cards showing Federal badge, category/topic tag, legislative status, progress dots / “1 of 6”, country label, title, bill identifier, bullet summary.
- Share action and Contact Your Rep action.

The app's screenshot shows two bill examples. The `1 of 6` indicator is visible, but the exact meaning of the six-step/progress element is not confirmed.

## 5. Asset inventory from public pages

### Team image source URLs

- Erin Chouinard: `https://images.squarespace-cdn.com/content/v1/69264d5e4e00141d9198b545/03ca31b3-74bb-405d-b578-6d04e19817a9/Erin%2BHeadshot.jpeg`
- Sav Perera: `https://images.squarespace-cdn.com/content/v1/69264d5e4e00141d9198b545/9759e2ba-0383-4fd3-99cb-d3456a0344df/1749823320826.jpeg`
- Ariana Warden: `https://images.squarespace-cdn.com/content/v1/69264d5e4e00141d9198b545/1f0b4943-8d3e-4d01-8625-d2b5e411e394/1688480681094.jpeg`
- Jim Douglas: `https://images.squarespace-cdn.com/content/v1/69264d5e4e00141d9198b545/2fbca534-cb4e-4b9f-8d85-fcdfa8f14930/James-Douglas_Headshot.jpg`

These are source URLs found on the live team page. Their continued use should be confirmed with the client.

### Donate page image

The page exposes an image alt description: “Smartphone displaying legislative bills related to state laws and regulations, with a blurred background showing a website page titled 'Legislative Feed' and search bar.” The image URL fetch timed out during this review, so it is inventoried but not locally captured.

## 6. SEO / technical audit status

- Page titles were available from indexed results: home, donate, team and contact.
- `robots.txt` and `sitemap.xml` could not be inspected through the available fetch path.
- The public website's team images are hosted on `images.squarespace-cdn.com`; this identifies the image CDN, not definitive proof of the site's CMS/platform.
- No public source repository was provided or found through the accessible public results.
- The app's dynamic bill list, authentication implementation, data API and network requests remain uninspected.

## 7. Required Firecrawl completion

To complete the actual Firecrawl audit, use a **newly rotated** `FIRECRAWL_API_KEY` as a server-side secret. Crawl the four public routes and map both public origins. For the Vercel app, use a JS-capable browser/crawl mode and capture the rendered page after bills load. Firecrawl crawl output alone may still not reveal all client-side XHR/API details; inspect browser network requests or the app deployment/configuration if the upstream provider must be conclusively identified.
