# Brief for Claude Design — Maison Noir, homepage 2

Paste everything below the line into Claude Design.

---

Design a **new homepage** for **Maison Noir**, a luxury fashion house (womenswear, tailoring, silk, knitwear, leather goods, fine jewellery). It must look **elegant, modern and unique**: unlike a template, unlike the usual luxury-store homepage, and unlike the existing Maison Noir homepage (an olive / ivory palette). Restraint and confidence over decoration. Every section should have its own layout idea. No two sections should look like the same grid with different photos.

## Colour: "Cocoa & Butter"

Base the page on deep chocolate and mocha browns with a soft butter-yellow accent. You may refine the exact values, but stay in this family and keep every combination at WCAG AA (4.5:1 for body text, 3:1 for large text and buttons).

| Token | Role | Starting value |
|---|---|---|
| `--c-base` | page background | `#F5EFE6` (warm bone) |
| `--c-soft` | alternate section background | `#EDE3D6` |
| `--c-deep` | stronger section background | `#E0D1BF` |
| `--c-text` | text on light backgrounds | `#2B1D17` (dark cocoa) |
| `--c-muted` | secondary text | about 68% of `--c-text` |
| `--c-contrast` | dark bands (hero, campaign, newsletter) | `#3A2620` (cocoa) |
| `--c-on-contrast` | text on dark bands | `#F5EFE6` |
| `--c-accent` | fills, large type, rules, highlights | `#A47864` (mocha) |
| `--c-accent-ink` | accent used for small text | `#7A4E3A` |
| `--c-highlight` | butter accent, mainly on dark bands | `#E9D79B` |
| `--c-sale` | sale prices | `#8E2B2B` |

**Colour rules, so the palette can be added to the theme later:**
- Define the tokens **once on `:root`**.
- Use **only these tokens** everywhere: no other hex or rgb values in the CSS, except pure white or black on photos.
- Derived shades (borders, hovers, overlays) use `color-mix()` from these tokens.
- Alternate light and dark bands down the page so the scheme shows both ways.

## Type
Keep the store's fonts so the header and footer still match: **Newsreader** (display, including italics), **Geist** (body and interface) and **Geist Mono** (small labels and numbers), all from Google Fonts. Make it unique through scale, rhythm and layout, not new fonts.

## Sections: a full, rich homepage, at least 14
1. **Hero:** full-height and striking (a split, a layered collage or a cropped editorial frame), with a headline, short text, two buttons and a small detail such as "Collection 03 / 05".
2. **Thin ticker or marquee:** values or seasonal message.
3. **Shop by category:** an unconventional layout (offset tiles, a large list with a hover image preview, or arches), with 4–6 categories.
4. **New arrivals (required):** 8 product cards with tabs (All / Ready-to-wear / Accessories), image swap on hover, quick add, wishlist heart, colour dots and a "View all" link.
5. **Editorial campaign:** a big image with a short story and one link, on a dark cocoa band.
6. **Best sellers:** a horizontal rail with arrows and numbered cards (01, 02…).
7. **Shop the look:** a styled photo with 3 hotspots, each linked to a product card beside it, plus "Add all".
8. **Limited drop:** a countdown, a short text, a product or image and a button.
9. **Collection spotlight:** one collection told as a sequence (sticky text with scrolling images, or a split that changes as you scroll).
10. **Craft / atelier story:** a manifesto line, 3–4 figures (founded, artisans, countries) and a portrait image.
11. **Lookbook strip:** draggable horizontal frames with captions.
12. **Press / testimonials:** quotes and press names, quietly styled.
13. **Journal:** 3 articles with date, title and "Read".
14. **Social / community grid:** a 6-image mosaic and a follow link.
15. **Services strip:** delivery, returns, appointments and gift wrap, with small icons.
16. **Newsletter:** on the dark band, with an email field, a button and a small privacy note.

You may add sections, but don't drop any of these.

## Built so it converts exactly (it will be rebuilt as a Shopify theme)
- **Files:** one `index.html`, one `styles.css`, one `script.js`. Plain HTML, CSS and vanilla JS: no Tailwind, no frameworks, no build step, no canvas or WebGL.
- **Section markup:** each section is a separate `<section data-section="new-arrivals">` with its own class prefix (for example `.na-…`). Its CSS is grouped under a comment with the section name.
- **Repeated items:** cards, tiles, slides, quotes and hotspots are each one self-contained element, so each can become an editable block.
- **One product card:** a single card component, reused in New arrivals, Best sellers and Shop the look (image, second image, brand, title, price, compare-at price, colour dots, badges, quick add, heart).
- **Script:** each section has its own init function that takes the section element, `initNewArrivals(sectionEl)`, and touches nothing outside it. No global state. Event listeners attach inside the section.
- **Images:** placeholders or stock photos with a fixed `aspect-ratio`, and no text inside images. All text is real, editable HTML.
- **Header and footer:** include them so the page looks complete. They will be replaced by the store's existing header and footer, so keep them simple and don't put key design ideas there.
- **Responsive at 390, 1024 and 1440 px,** with no sideways scrolling on phones. Show the phone layout of each section.
- **Motion:** subtle reveals and hovers only. Respect `prefers-reduced-motion`: fade only, nothing slides or loops.
- **Accessibility:** real buttons and links, alt text, visible focus states, AA contrast.

## Deliverable
The finished homepage, as `index.html`, `styles.css` and `script.js`, plus a short list of the colour tokens with their final values.
