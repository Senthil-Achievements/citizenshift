---
version: alpha
name: "Florist template by 8B"
description: "Florist website in blush, chocolate, hot pink and magenta with a wide black wordmark, uppercase serif headings and thin script lines; Free HTML template by 8B, MIT."
colors:
  primary: "#331917"
  secondary: "#a0146c"
  tertiary: "#fc72c4"
  surface: "#eecbc0"
  on-surface: "#331917"
typography:
  wordmark:
    fontFamily: TikTok Sans
    fontSize: 114px
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: -0.02em
  display-hour:
    fontFamily: TikTok Sans
    fontSize: 220px
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Brygada 1918
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Brygada 1918
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.01em
  script-display:
    fontFamily: Playwrite US Trad
    fontSize: 165px
    fontWeight: 200
    lineHeight: 1.75
  body-md:
    fontFamily: TikTok Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: TikTok Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.01em
  label:
    fontFamily: TikTok Sans
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.06em
  button:
    fontFamily: TikTok Sans
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: 0.01em
rounded:
  none: 0px
  full: 999px
spacing:
  gutter: 28px
  gutter-min: 16px
  section-top: 170px
  section-bottom: 140px
  nav-height: 60px
  photo-gap: 8px
  column-gap: 72px
  order-card-max: 1040px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 0 22px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 0 22px
    height: 48px
  nav-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    height: 60px
  icon-square:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    width: 30px
    height: 30px
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: 32px
  distance-pin:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 30px
    width: 84px
  input-field:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 6px 0
    height: 40px
---

## Overview

This is a website template for a florist that delivers in the evening: seasonal stems, arrangements, weekly standing orders, event flowers, growers by distance, evening workshops and a letters column. The one idea is dusk. The page opens on a blush hero with a very wide black wordmark, the chocolate night rises over it, and the delivery section darkens panel by panel from five to nine. Square edges, hairlines and an uppercase serif keep it editorial, while big thin script lines in hot pink and magenta add handwriting. It should feel intimate and a little theatrical.

## Colors

Four colours; the contrast between the light and dark pair does most of the work.

- **Surface (#eecbc0):** blush. The page ground, the nav bar, the hero, cards, and text on dark bands.
- **Primary (#331917):** chocolate. Text, button fill, and the dark bands (the night panel, arrangements, events, letters, the order section, the footer, the last delivery panel).
- **Tertiary (#fc72c4):** hot pink. Script lines on dark, the button hover fill, hover fills on icon squares and one delivery panel.
- **Secondary (#a0146c):** magenta. The workshop band, the distance pins, the second script colour, and the active stem name. One delivery panel is mixed from 42 percent magenta and chocolate, a dark plum, without being a separate token.
- Hot pink is for large script and fills; on blush use magenta for script, and keep small text chocolate.

## Typography

Three faces with clear jobs. **TikTok Sans** is the wordmark (black weight 900, stretched to 125 percent width, uppercase, set so it fills the screen width, about 114px on a 1440px screen), and it is also the body, labels and buttons: body 16px, small text 14px at 78 percent opacity, labels 13px medium uppercase with 0.06em tracking, buttons and links 15px medium. **Brygada 1918** is an uppercase serif for section headings (34px to 64px), stem names (up to 62px), prices and questions (20px to 30px), always regular weight and lightly tightened; stem names turn semibold when active. **Playwrite US Trad** is a thin handwritten script (weight 200) set as large as a headline and never for running text: its size is calculated from the line's character count (`--len`) so the line fits the width, up to 19vw. The delivery hours use the black wordmark face at up to 220px.

## Layout

There is no max-width wrapper: pages run edge to edge with small gutters (16px to 28px) and large vertical padding (up to 170px above and 140px below each section). Sections head with a two-column grid (7/5, or 6/6 on events), or are centred when they carry a script ribbon. Typical compositions: a sticky photo beside a list (stems, workshops, letter), a 3-column grid of arrangements with 8px between columns (2 on phones), a 4-column board of event photos in an irregular arrangement, a table with five columns for standing orders, and a 0 to 200 mile scale with one row per grower. The delivery section is five full-screen panels. The order card sits over a full-screen shop photo, 1040px wide at most. Below 1080px nav links hide, below 860px the table becomes stacked rows, below 760px most grids become a single column (arrangements and events keep two), and the order card overlaps the photo by 72px.

## Elevation & Depth

There are no shadows. Depth is made by layering colour fields: the chocolate night rises over the sticky blush hero as an expanding dome, sticky photo frames stack and slide away to reveal the next one, and the hero photo darkens as the night arrives. Section colours alternate between blush and chocolate, with one magenta band. Structure is 1px hairlines (solid or in mixed opacity) that draw in from the left.

## Shapes

Everything is square (0px radius): buttons, cards, photos and the icon squares (30px with a 1px border). The only curves are the pill-shaped distance pins (84 by 30px, fully rounded) and the dome in the footer mark, which is a block, a half-ellipse dome and a thin bar built from CSS. The brand mark in the nav is a small inline SVG. Photos are plain rectangles, mostly 4 by 5 (arrangements, delivery panels, workshop) or squares and tall cells on the events board.

## Components

- **Nav bar:** 60px, blush, slides away on scroll down and returns on scroll up.
- **Primary button:** chocolate with a blush label, square, 48px high. On hover a hot pink dome rises from the bottom edge to fill it in 0.5s and the label turns chocolate.
- **Link:** 15px medium with a 1px underline that redraws on hover; secondary links draw their underline in on hover.
- **Row link:** a hairline above, a label and an arrow square whose arrow nudges 3px on hover.
- **Icon square:** 30px, thin border, fills hot pink on hover.
- **Surface card:** blush, square, no border, no shadow.
- **Input field:** an underline only; labels are 13px uppercase.
- **Distance pin:** a magenta pill with the mileage, positioned along the scale.

## Motion

The page loads no animation library. Scroll motion is CSS scroll-driven animation (`animation-timeline: view()` and named view timelines), written per section in `<style data-8b-part="scene:...">` blocks. A small inline motion kit at the end of the body numbers list items into `--i`, adds `is-in` to `data-8b-motion` elements as they arrive, pauses endless loops off screen, and smooths the mouse wheel (fine pointers only; touch scrolls natively). A gate script in the head sets `data-8b-live` on the root only when the browser supports `animation-timeline` and the visitor has no reduced-motion preference; every scroll rule is scoped to it. The motion idea is a day turning to night: dark rises, panels slide sideways, hairlines draw, and photos open like windows.

- **Opening:** on load (CSS keyframes) the wordmark's two words rise in, the script "and" pops in and then slowly thickens and thins (weight 200 to 340, 5.5s), the photo opens from its inset edges and drifts 40px sideways on a 9s loop, paused off screen. The first screen is CSS sticky; on scroll the night dome grows until it fills the screen, the photo darkens and zooms, the words move apart and the "and" scales up.
- **Headings:** most section headings lift out of a clip when they come into view (1s). Script ribbons slide sideways with scroll. Hairlines draw left to right over 1.1s.
- **Stems:** in a sticky frame, the front photo slides away left as each row passes, revealing the next, while the active name turns magenta and semibold.
- **Arrangements:** the columns start at different heights and settle into line.
- **Delivery:** the stage sticks to the top (CSS `position: sticky`) while five hour panels slide sideways from blush to chocolate, the hour numeral and the photo moving at their own speeds.
- **Events:** six photos start in a tilted pile near the top centre of the board and spread out.
- **Growers:** each pin slides from zero along the mile scale to its distance, drawing a line behind it.
- **Workshops, letters, order, footer:** the workshop photo opens like a window; the tall letter photo slides to show its lower part; the order card slides in from the right with a 4 degree tilt while the shop photo zooms out; the footer mark assembles (block from the left, dome from below, then the bar).

With reduced motion, and in browsers without CSS scroll-driven animations (Firefox today), `data-8b-live` is not set: the smooth wheel, the heading lifts, the ribbons, the hairline draws, the window reveal and all scroll animations are off, scrolling is the browser's own, and every section shows its finished layout. The night band then scrolls over the sticky first screen without the dome, the stem frame keeps the first photo on top, and the delivery panels become a normal stacked section. The opening's load-in, the photo drift and the breathing "and" are CSS keyframes under `prefers-reduced-motion: no-preference`, so they still play in Firefox and stop with reduced motion. Hover effects remain in both cases.

## Do's and Don'ts

- Do keep every corner square; the only curves are the pins and the footer dome.
- Do use only blush, chocolate, hot pink and magenta; no extra accent.
- Do set the wordmark in black-weight, extra-wide uppercase and fit it to the width.
- Do use the script for short thin lines, mostly as large as headlines, never for body text.
- Don't set small text in hot pink or put hot pink script on blush; use magenta.
- Do keep headings, stem names and prices in the uppercase serif; add no other serif or display face.
- Don't add cards with fills, borders or shadows; separate rows with 1px hairlines.
- Do keep photos as plain rectangles in sticky frames beside lists.
- Do keep six stems with six photos, five hour panels and six event photos, or adjust their numbered rules in the motion CSS; the scroll animations are written for these counts.
- Do build new motion as CSS scroll-driven animations scoped to `[data-8b-live]`, with the inline kit for measurements; keep the gate script, `data-8b-section` and `data-8b-motion`.
- Don't add GSAP, Lenis or any other animation library.
