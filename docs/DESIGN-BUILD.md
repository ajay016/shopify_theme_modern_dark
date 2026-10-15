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

Each phase is built, tested, pushed and reported on its own (owner's instruction,
2026-10-04: "make a plan, do it in phases and push, then tell me what you did, what
is left and what I need to check").

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
- [x] **D4 Cart** — `sections/cart-drawer.liquid` in the design markup (`#ov-cart`
      drawer + `#cartNotify` card), rendered by Shopify and re-rendered through the Section
      Rendering API on every add / change (`MN.cart` in `assets/mn.js`: one request at a
      time, optimistic stepper with one request per burst, stock cap, animated remove,
      only new lines animate in, count bump, `cart:updated` event, bfcache refresh).
      Theme settings → Cart → cart type: drawer / notification / page; free shipping bar.
      Line properties, selling plans, line and cart discounts, taxes-included note.
      Prices always come from Liquid; `formatMoney` now follows `shop.money_format`.
      Old drawer / notification / toast JS and CSS removed; `MaisonNoir.addToCart`,
      `showToast`, `showCartNotification` kept as wrappers. Test `scripts/cart-check.py` +
      `scripts/cart-test.js` (24 checks, mocked Ajax API).
      For D7: the cart page's steppers / remove have no script yet, and
      `cart_show_recommendations` does not gate the cart page upsell.
- [x] **D5 Product card, compare, wishlist** — `snippets/product-card.liquid` is the
      design's `.card` everywhere (collection, search, cart, recommendations, homepages),
      keeping the filter facets, quick-view JSON and wishlist hooks. Every Product cards
      setting maps onto it: style (atelier = the design; minimal, editorial, bordered,
      plaque), ratio, radius, hover (second image = the design, zoom, carousel, none), add
      to bag display, alignment, title font, brand, rating, swatches, sizes, category,
      material, number, low stock, sale. New: Show compare button. Defaults and the
      store's saved values moved to the design card (brand + rating on, sizes on,
      second-image hover, material / number / category off). Compare tray + table
      (`snippets/mn-compare.liquid`, `MN.compare`) and a wishlist drawer
      (`snippets/mn-wishlist.liquid`, `MN.wish`; the heart had no view before) read
      `templates/product.mn-data.liquid`; recently viewed now renders real cards through
      `templates/product.mn-card.liquid` (it called an endpoint that does not exist).
      Old `.pcard` CSS removed. Test `scripts/card-check.py` + `scripts/card-test.js`
      (42 checks). **Quick view moves to D6**: it is built from the product page's
      pickers, price and buy button, so it lands with them; until then the card opens
      the existing quick view.
- [x] **D6 Product page + quick view** — `sections/main-product.liquid` in the design's
      markup. Every option in the design's "Product page" and "Buy button" panels is a
      section setting (Online Store → Customize → a product → Product): layout (8),
      gallery (11), image height, video popup / inline, zoom, colour-only images, colour
      option type (5), size option type (3), details style (9) and placement (4) with
      per-section modes, quantity style (3), button label / style / icon / hover, after
      adding (drawer / notification), smart sticky bar, sticky info column, low-stock and
      stock-bar levels, size guide (page or chart with cm/in), compare-colours and ask
      notes. The 15 information blocks are section blocks (reorder, hide, settings each):
      vendor/title/rating, price + notes, short description, badges, countdown/stock/
      visitors, pickers, quantity, terms, buy buttons (+ Shopify dynamic checkout,
      back-in-stock form), pickup (Shopify store availability), offer, shipping (live
      delivery dates), trust + payments, ask/compare/share, details; plus Custom Liquid
      and app blocks. Drawers / modals: size guide, compare colours, ask a question
      (contact form), pickup stores, lightbox, video, details drawer. Behaviour:
      `assets/mn-product.js`. Quick view (`templates/product.mn-quick.liquid`, Theme
      settings → Quick View) uses the same pickers and buy button; the old quick view is
      removed. Below the product: `mn-complete-look` (hotspots, add, add all),
      `product-recommendations` and `recently-viewed` in the design's markup,
      `mn-banner`. Product templates rewritten (default, digital, gradient, wide).
      Colours: the design's palette is the fixed default scheme "Olive"; floating header
      and rounded corners set as in the owner's screenshot. Test `scripts/pdp-check.py` +
      `scripts/pdp-test.js` (81 checks).
      Needs the store: a countdown end date (block setting), a reviews app widget for the
      review list (section setting), pickup locations, product videos / 3D, and the
      custom.material / origin / care / summary metafields where wanted.
- [x] **D7a Cart page** — `sections/main-cart.liquid` in the design's language: the drawer's
      lines (image, vendor, title, options, properties, discounts, unit price, stepper,
      remove), shipping progress, a summary panel (items, cart discounts, subtotal, taxes
      note, order note that saves itself, checkout, express checkout buttons, payment
      methods) and an empty state. Quantity and remove now work (they never had a script):
      MN.cart re-renders the page and the drawer together, also with Cart type = page.
      Recommendations from the first item, behind both the section setting and Theme
      settings → Cart → Show product recommendations in cart. Tests in
      `scripts/cart-check.py` + `scripts/cart-test.js` (34 checks).
- [x] **D7b Collection + search** — `assets/mn-collection.css` points the collection's
      colour, type and shape tokens at the design system (it carried its own dark-gold
      palette), and restyles the parts the design has a component for: breadcrumb and
      display title on all five title styles, toolbar buttons, sort as the design select,
      grid / list as the design's segmented control, checkbox rows as `.check`, size pills
      as `.sw-text`, colour chips with the outline ring, price slider and fields, active
      filters as `.chip`, the filter drawer / dropdown bar / top panel, round pagination
      (`snippets/mn-pagination.liquid`, shared), load more and the empty state. The
      section's colour setting now maps to the design surfaces (soft / deep / inverted).
      Filter behaviour is unchanged. `sections/main-search.liquid` rewritten: eyebrow +
      display title with the query, the design field and button, type tabs, design cards,
      journal / page rows, and a no-results state with suggestion chips (menu setting) and
      products from a chosen collection. Test `scripts/collection-check.py` +
      `scripts/collection-test.js` (40 checks).
- [x] **D7c Account** — every customer page rewritten in the design's language
      (`assets/mn-pages.css`): sign in with a new-customer side panel (heading, three
      benefits, optional image), password reset on the same page (`/account/login#recover`,
      which had no form before, so "Forgot password?" did nothing), guest checkout when the
      store allows it, password show / hide; create account with newsletter opt-in and
      small print; **new** activate-account and reset-password templates (the links in
      Shopify's customer emails had no template); account overview with greeting,
      navigation (orders, addresses, wishlist, log out), order history as a table that
      becomes cards on phones, default address and a help card; one order with the cart
      page's lines, tracking, discounts, summary, addresses, note and a cancelled notice;
      addresses as cards with add / edit forms that open in place (and stay open on
      errors), country → province, delete confirmation. Address fields now read the
      saved values (`form.first_name`, not the non-existent `form.value.first_name`, which
      left every edit form empty). Test `scripts/account-check.py` +
      `scripts/account-test.js` (51 checks).
- [x] **D7d Content pages** — journal (`main-blog`: grid / list / masonry, featured
      first post, topic chips from the tags, image shape, sidebar with search and recent;
      cards in `snippets/mn-article-card.liquid`), article (breadcrumb, display title,
      excerpt, byline with reading time, hero, `.mn-prose` reading column, tags, share with
      copy link, previous / next, comments with moderation note, "keep reading"; sidebar
      none / left / right, reading width), page (standard / editorial; the templates'
      `layout` setting now exists), contact (split / centred, detail blocks with links and
      notes, subject and order fields, thank-you state), 404 (outlined numerals, search,
      products), **password page** (there was no `templates/password.json`, so the page
      had no password form; now logo, heading, store message, newsletter sign-up tagged
      "password page", password form that opens in place, optional image) and **gift
      card** (`{% layout none %}` was missing, so the card was wrapped in the full store
      layout; the QR code was an `<img>` pointing at the card's identifier and never
      showed: now Shopify's QR script, Apple Wallet, copy code, balance, expiry). The
      `<html>` attributes and fonts are shared snippets (`mn-html-attrs`, `mn-fonts`), so
      the password and gift card pages follow the theme's scheme and fonts. Invalid saved
      settings fixed in `page.about-v2`, `page.contact`, `page.contact-v2`,
      `index.classic`: `scripts/schema-check.py` reports 0 problems. Test
      `scripts/content-check.py` + `scripts/content-test.js` (46 checks).
- [x] **D7e Homepages** — all 7 homepage templates (54 sections) brought to the design's
      details. Every section's own styles were rewritten by role: buttons and links in
      sentence case at the design's size and tracking, with the design's radius (43
      rules); eyebrows, kickers, tags and labels at the design's 11px / .14em, medium,
      eyebrows muted rather than accent (90); section headings out of capitals (12, the
      two hero lockups kept). The theme's original `.btn`, `.eyebrow`, `.section-link`
      (Classic homepage) follow the same components (`assets/mn-home.css`). Fixes:
      primary buttons on the Olive / Custom scheme were olive with near-black text,
      now the design's text-on-page button; rail product cards had no width and were
      squeezed to slivers; Lumière "The stories" pushed the phone page to 411px; the
      Classic newsletter on a dark band kept dark text; category tile titles on the dark
      scrim were dark; image-with-text buttons had their label stuck to the top.
      Test `scripts/home-check.py` (renders each template as saved) +
      `scripts/home-test.js` (51 checks).
- [x] **D7 Other pages** — collection, cart page, search, account, blog, pages,
      homepages: same tokens, type, buttons, fields, cards and motion (D7a–D7e).
- [x] **Clean-up + Theme Check** — Theme Check errors 7 → 0: the theme's four scripts load
      with `defer` (no inline script calls them while the page parses; all three wait for
      DOMContentLoaded, which still fires after deferred scripts), the demo card image and
      the lightbox images have sizes (the lightbox now gets a responsive srcset). Hardcoded
      `/collections/all` links use `routes.all_products_collection_url` (11 places), a
      stray `block` reference in `blog-posts` removed, the 13 old `icon-*` snippets nothing
      rendered deleted (the design's sprite replaced them). Dead CSS removed with
      `scripts/css-prune.py` (a rule goes only when one of its classes appears in no
      template, snippet, script or setting; Shopify- and app-generated classes are kept):
      `theme.css` 2349 → 1879 lines (old cart page, blog, contact, account, quick view,
      drawers, search overlay, mobile menu), plus leftovers in `mn-shopify.css` and
      `mn-collection.css`. Bug found doing it: the custom cursor's "hide the normal
      pointer" class was never set, so both pointers showed; it is now set when the
      setting is on. The four homepage sections no template uses (still in Add section)
      got the same button / eyebrow treatment as the other 54.
- [x] **About pages + collections list** — `stats-row` and `team-grid` rewritten in the
      design's language (display numerals with muted labels; portrait cards with an
      initial when there is no photo, name, role, bio, social icons only when a link is
      set; eyebrow / heading / intro, alignment and background surface settings). Both
      About templates shipped with no blocks, so the stats row and the team grid
      rendered empty; they now carry four figures and four people to edit. The
      collections list's tiles take the design's card radius; its "Limit to a menu"
      check no longer depends on how an empty setting compares. `scripts/home-check.py`
      now also renders the About and collections-list templates (`home-test.js`, 110
      checks).
- [x] **D8a Automated verification** — four new sweeps over the harness output:
      `scripts/scheme-sweep.py` + `scheme-test.js` (every page type in all six colour
      schemes with the store's real CSS variables, at 1440 and 390: WCAG text contrast,
      text over photos skipped; 913 checks), `editor-test.js` (the theme editor's
      unload / swap / re-run scripts / load, twice, on the product, collection, header,
      homepage tabs and countdown, addresses, and every section of every homepage, About
      and collections-list template: 32 checks), `motion-sweep.js` (Motion Off, Strict and
      Gentle with the device's reduced-motion switch: 28 checks), plus a static audit
      that every one of the 114 theme settings and 796 section / block settings is read
      somewhere. Fixes from it: Classic hero's italic line was pale accent on the page
      colour (1.9:1); Light scheme's legacy `--gold` text (3.96:1) is a step deeper and its
      primary button is the design's dark button; Olive / Custom muted text on the deep
      surface raised (4.17 → passes); Motion Off and Strict left section reveals hidden
      until scrolled, and Gentle still slid them in — both now as the settings describe;
      the countdown added another timer on every editor re-render; the product page's
      restart now also accepts the product root itself.
- [ ] **D8b Visual comparison** — screenshots of the product page, header variants, cart
      drawer and footer at 390 / 1024 / 1440 next to the reference; fix what differs.

---

## Next: review fixes and homepage 2 (planned 2026-10-15)

### Codex review (2026-10-15): all six points checked against the code: all valid

| # | Point | Cause found |
|---|---|---|
| 1 | Size guide opens an almost empty panel | `templates/product.json` saved the size-guide *page* setting as `""`; an empty string is truthy in Liquid, so the panel renders that (empty) page instead of the size chart that is configured. |
| 2 | Summary flattens the description and its measurement table above the buy button | The Summary block falls back to the whole description, strips the HTML (table included) and cuts at 40 words. |
| 3 | Homepage product names and images don't match; links go to /collections/all | The New arrivals tabs have no collection chosen, so they show built-in demo cards whose names and photos are paired arbitrarily ("No. 03 Soft Bag" with a shoe photo), all linking to the catalogue. Same pattern in Complete the look and the empty-collection demo. |
| 4 | Floating Layouts tab overlaps mobile controls | The demo layout explorer is on by default for every visitor, fixed to the right edge, with no way to hide it. |
| 5 | Add to bag disabled until terms are accepted | The product template includes the Terms block and the buy button waits for it; there is no setting to make it optional. |
| 6 | Season / promotion copy mismatched | Announcement says "SS 2025 Collection Now Live", hero says "Summer 2026" over a coat image, the "for a week only" countdown runs to 31 December (~77 days). |

### Phases (each built, tested, pushed and reported on its own)

- [ ] **R1 Product page fixes** (points 1, 2, 5)
      Size guide: show the configured chart unless a page with real content is chosen;
      hide the link when neither exists. Summary: the `custom.summary` metafield, else the
      description's first paragraph only, never tables or lists; the full description and
      measurements stay in Details and the size guide. Terms: new block setting "Required
      before adding to bag", off by default (shown as a note when off); removed from the
      demo product template for a simpler purchase flow.
- [ ] **R2 Demo content and copy** (points 3, 4, 6)
      Homepage product sections point at real collections so real products, images and
      links show. Every built-in demo card gets a name and photo that match and a link to
      search for that piece, not the catalogue. Season copy aligned to Autumn / Winter
      2026 across announcement, hero and promotion; the private-sale countdown copy matches
      its date. Layouts tab: off for shoppers by default (a theme setting), compact
      bottom pill on phones, dismissible and remembered.
- [ ] **H0 Receive the design** — the owner pushes Claude Design's homepage 2 files
      (`index.html`, `styles.css`, `script.js`, palette list) to
      `docs/claude_design_ref_home2/`.
- [ ] **H1 Foundation** — read the design; section-by-section mapping table (design
      section → Shopify section, settings, blocks); its palette as tokens scoped to the
      new homepage only (`data-palette` on its sections), so other pages and homepages
      keep their colours; `assets/mn-home2.css` + `assets/mn-home2.js` ported from the
      design with only Shopify-required changes (as for D1); a pixel-diff harness that
      renders the design and our template at 390 / 1024 / 1440 and compares section by
      section (header, footer, product cards and quick view excluded: those stay the
      store's own, as instructed).
- [ ] **H2 Sections, part 1** — hero, ticker, shop by category, new arrivals.
- [ ] **H3 Sections, part 2** — campaign, best sellers, shop the look, limited drop,
      collection spotlight.
- [ ] **H4 Sections, part 3** — craft story, lookbook, press, journal, social grid,
      services, newsletter (and any extra sections the design has).
- [ ] **H5 Template and verification** — `templates/index.<name>.json` with every
      section in the design's order; default images chosen for this palette and
      checked one by one (subject matches its label, not the usual stock set); pixel
      diff within tolerance at all three widths; editor re-render, motion, contrast and
      phone sweeps; other homepages and pages unchanged (their tests still pass).
- [ ] **H6 Palette as a theme scheme** (only if the owner likes it) — add the new
      palette to Theme settings → Colors as a scheme for the whole store.
- [ ] **D8b Visual comparison** (above), last.
