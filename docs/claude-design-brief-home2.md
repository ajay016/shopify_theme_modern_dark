# Brief for Claude Design: Maison Noir, homepage 2

Paste everything below the line into Claude Design.

---

Design a **new homepage** for **Maison Noir**, a luxury fashion house (womenswear, tailoring, silk, knitwear, leather goods, fine jewellery). It must look **elegant, modern and unique**: unlike a template, unlike the usual luxury-store homepage, and unlike the existing Maison Noir homepages. Restraint and confidence over decoration. Every section should have its own layout idea. No two sections should look like the same grid with different photos.

## Colour: your choice
Choose your own colour palette for this homepage: one that makes it feel modern, elegant and distinctive for a luxury fashion house. It is your decision; commit to it fully.

So it does not repeat the store's existing schemes, avoid these families:
- olive green with ivory
- wine or burgundy with white
- dark brown or taupe with gold
- black with gold
- plain white with gold

Keep every text and background combination at WCAG AA (4.5:1 for body text, 3:1 for large text and buttons).

Colour rules, so the palette can be added to the theme later:
- Define the palette once on `:root` as a small set of tokens: `--c-base` (page background), `--c-soft` and `--c-deep` (alternate backgrounds), `--c-text`, `--c-muted`, `--c-contrast` (dark or strong bands), `--c-on-contrast` (text on those bands), `--c-accent`, `--c-accent-ink` (accent for small text, if the accent is too light), `--c-sale`. Add one or two more only if the design truly needs them.
- Use only these tokens everywhere: no other hex or rgb values in the CSS, except pure white or black on photos.
- Derived shades (borders, hovers, overlays) use `color-mix()` from these tokens.
- Use both light and strong bands down the page, so the palette shows both ways.

## Type
Keep the store's fonts so the header and footer still match: **Newsreader** (display, including italics), **Geist** (body and interface) and **Geist Mono** (small labels and numbers), all from Google Fonts. Make it unique through scale, rhythm and layout, not new fonts.

## Sections: a full, rich homepage, at least 14
1. **Hero:** full-height and striking (a split, a layered collage or a cropped editorial frame), with a headline, short text, two buttons and a small detail such as "Collection 03 / 05".
2. **Thin ticker or marquee:** values or seasonal message.
3. **Shop by category:** an unconventional layout (offset tiles, a large list with a hover image preview, or arches), with 4–6 categories.
4. **New arrivals (required):** 8 product cards with tabs (All / Ready-to-wear / Accessories), image swap on hover, quick add, wishlist heart, colour dots and a "View all" link.
5. **Editorial campaign:** a big image with a short story and one link, on a strong band.
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
16. **Newsletter:** on a strong band, with an email field, a button and a small privacy note.

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
The finished homepage, as `index.html`, `styles.css` and `script.js`, plus the palette: each token with its final value and one line on why you chose it.
