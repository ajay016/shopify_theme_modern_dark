# Building the Claude Design reference into the theme

**Source:** `docs/claude_design_ref/` (Product Page.html, Widths.html, `mn/*.css`,
`mn/*.js`), pushed by the owner 2026-10-04.
**Owner's instruction:** the whole design built *exactly* as given: the different
navbars, the cart slider, the footer, the product page, and its fonts (Newsreader +
Geist + Geist Mono). Built for Shopify, with every product page setting working. Other
pages restyled to stay consistent with it.

This file is the plan and the record. Update the checkboxes as phases land.

---

## How "exactly" is achieved

1. **The design's CSS is ported nearly verbatim** into theme assets, with the design's
   own class names used in the Liquid markup. The look then matches by construction,
   not by imitation.
   - `assets/mn-core.css` ← `mn/theme.css` (tokens, base, buttons, fields, select,
     accordion, tabs, overlays, stars, price, card, reveal, toast, table)
   - `assets/mn-header.css` ← `mn/header.css`
   - `assets/mn-product.css` ← `mn/product.css`
   - `assets/mn-footer.css` ← `mn/footer.css` (minus the editor-only settings panel and
     spec sheet)
   - `assets/mn-motion.css` ← `mn/motion.css`
2. **Only three kinds of change** are made to that CSS, each for a Shopify reason:
   - `html[data-…]` selectors for *section* settings (layout, gallery, media size, ATC
     animation) become `[data-…]` on the section's root element, so a section can carry
     its own settings and the theme editor can re-render it.
   - The design's `--header-h` / `--header-h-compact` (a row height) are renamed
     `--hdr-row-h` / `--hdr-row-h-compact`: the theme's JS already measures
     `--header-h` for sticky offsets, and the two would fight.
   - z-index values are lifted where the theme has other layers (demo explorer,
     collection filter drawer).
3. **The design's JS is ported** into `assets/mn.js` with the demo data replaced by
   Shopify data: product JSON, the Ajax Cart API, predictive search, Section Rendering
   for recommendations and pickup, `/products/{handle}.js` for quick view and compare.

## Settings mapping (design panel → Shopify)

| Design setting | Shopify |
|---|---|
| scheme light / wine / dark / warm / custom | Theme settings → Colors → `color_scheme` (light / ivory-wine / dark / warm / custom) → `html[data-scheme]` |
| corners sharp / subtle / soft / rounded | Corners & Shape → `corner_radius` → `html[data-corners]` |
| buttons default / pill | `button_shape` match / pill → `html[data-buttons]` |
| motion full / reduced / system | Animations → `motion_level` + reduce mode → `html[data-motion]` |
| header classic / centred / minimal / floating | Header → `header_style` v1 / v2 / v3 / v4 → `html[data-header]` |
| announce ticker / rotate / static | Announcement Bar → style → `html[data-announce]` |
| mega columns / visual / flyout, images on/off | Header → `mega_menu_style`, `mega_menu_images` |
| hero (transparent header) | Header → `header_transparent_home` (homepage only) |
| hide while scrolling down | Header → `header_hide_on_scroll` |
| layout (8), gallery (11), image height, video, colour/size option type, details style / placement / per-section, qty style, ATC label / style / icon / hover, after adding, terms, countdown, visitors | **Product section settings** (main-product), so each product template can differ |
| information blocks: order, hide/show | **Section blocks** in the theme editor: drag to reorder, eye to hide |
| footer style, surface | Footer → `footer_style`, `footer_tone` (base / soft / deep / contrast→invert) |

## Phases

- [x] **D1 Foundation** (6b32c83) — fonts (Newsreader + Geist + Geist Mono as a pairing, made the
      store font), tokens, schemes and surfaces, radius and motion mapped from settings,
      core components, icon sprite, overlay / accordion / tabs / select / qty / toast /
      reveal runtime. Old theme tokens aliased so other pages follow.
- [x] **D2 Header** — `sections/header.liquid`, `sections/announcement-bar.liquid`,
      `snippets/mn-mega.liquid`, `mn-social`, `mn-localization`; behaviour in `assets/mn.js`;
      test `scripts/header-check.py` + `scripts/header-test.js` (41 checks). Old header JS and
      CSS removed; the header is sticky in the page flow, so content no longer needs a
      top offset.
      Earlier plan line: — announcement bar (3 modes), 4 header styles, transparent over hero,
      compact and hide-on-scroll, 3 mega menu layouts ± images, search overlay with
      predictive results, menu drawer (3 levels).
- [x] **D3 Footer** — `sections/footer.liquid` in the design markup: 3 styles (columns /
      statement / minimal) × 4 surfaces (base / soft / deep / inverted), newsletter (band
      variant for Statement), fitted wordmark, localization selects, payment pills, back
      to top, phone accordions. New Theme settings: band title, newsletter note and
      thank-you, fourth menu, copyright, YouTube. Test `scripts/footer-check.py` +
      `scripts/footer-test.js` (46 checks: parts per style, contrast on every surface and
      scheme, no overflow at 390). Selects now right-align while closed too, so a hidden
      list never widens the page on phones.
- [ ] **D4 Cart** — cart drawer (shipping progress, steppers, remove), cart notification,
      toast, Ajax cart, header count bump.
- [ ] **D5 Product card, quick view, compare** — the design card everywhere, quick view
      modal / bottom sheet with the same pickers, compare tray and table.
- [ ] **D6 Product page** — 8 layouts, 11 gallery positions, media (image, video, 3D,
      zoom, lightbox, popup video), 15 reorderable blocks, all picker types, qty styles,
      custom buy button states, terms, notify-me, buy now, dynamic checkout, pickup,
      offer, shipping, trust, ask / compare / share, details styles and placements,
      sticky info column, smart sticky bar, size guide, compare colours, ask a question,
      pickup drawer; sections below (complete the look, recommendations, banner,
      recently viewed).
- [ ] **D7 Other pages** — collection, cart page, search, account, blog, pages,
      homepages: same tokens, type, buttons, fields, cards and motion.
- [ ] **D8 Verification** — every setting renders and works (audit), editor re-render,
      390 / 1024 / 1440, all schemes, reduced motion, screenshots against the reference.
