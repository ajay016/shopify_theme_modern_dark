# Product page — requirements

**Status:** approved by the owner 2026-10-03 ("do not exclude any details"). Claude Design prompt: [design/PDP-PROMPT.md](design/PDP-PROMPT.md).
**Source:** the *Product Details Pages* part of [BRIEF.md](BRIEF.md), verbatim, plus the
site-wide additions of 2026-10-03 that apply to this page.
**Next after approval:** a Claude Design prompt for this page, written from this file.

Every item below has a plain-language definition, so "done" can be checked against
something written down rather than remembered.

---

## 1. What the page holds, top to bottom

1. Breadcrumb
2. **Media gallery** — images, video, 3D; zoom, lightbox, thumbnails (section 3)
3. **Product information column**
   - Vendor / brand · title · star rating with review count
   - Price, compare-at price, discount percentage, unit price, tax/shipping note
   - Badges — New · Sale · Sold out · Low stock
   - Countdown timer · stock countdown · real-time visitors (section 6)
   - **Variant pickers** — one per option, each in one of four swatch types (section 4)
   - Size guide link · compare colour link
   - Quantity selector
   - Terms & conditions checkbox (optional, blocks purchase until ticked)
   - Add to cart (custom buy button) · Buy now · dynamic checkout buttons
   - Pickup availability
   - Special offer · shipping information · trust badges
   - Ask a question · share
   - Description / shipping / reviews — as tabs or accordions (section 2)
4. **Below the fold** — complementary products · recommendations · image banner ·
   recently viewed
5. **Always available** — sticky add-to-cart bar (smart product sticky) · popup video ·
   lightbox · size guide · compare colour · ask a question (as drawers or modals)

Every block in the information column can be reordered, added or removed in the theme
editor, as on the collection page.

---

## 2. Layouts — 8

| Layout | What it means |
|---|---|
| **Default layout** | Gallery left, information right, within the theme's container |
| **Box container** | Same, held to a narrower container with generous margins |
| **Wide container** | Same, at a wider maximum width for large imagery |
| **Digital products** | No shipping, pickup or size guide; shows format, file size, licence and delivery method instead. Its own template, `product.digital` |
| **Default tab** | Description, shipping and reviews as horizontal tabs below the gallery and information |
| **Tab accordion inner** | The same content as accordions inside the information column |
| **Background gradient** | Page background is a gradient drawn from the active colour scheme |
| **Accordion tab styles** | Description, shipping and reviews can each be set independently to tabs, accordion or open text |

Every layout works in all five colour schemes and at phone width.

---

## 3. Gallery — 11 thumbnail positions, plus media behaviour

| Position | What it means |
|---|---|
| **Left thumbnails** | Vertical strip to the left of the main image |
| **Right thumbnails** | Vertical strip to the right |
| **Top thumbnails** | Horizontal strip above the main image |
| **Bottom thumbnails** | Horizontal strip below |
| **No thumbnails** | Main image only, with arrows and progress dots |
| **Grid 1 column** | Every image stacked full width; information column stays sticky beside them |
| **Grid 2 columns** | Images in a two-column grid |
| **Grid mix** *(HOT)* | First image full width, then alternating pairs and singles |
| **Slider 2 columns** *(NEW)* | Two images visible at once, swiping sideways |
| **Slider full-width** | Edge-to-edge slider above the information |
| **Slider container** | The same slider held inside the container |

**Media behaviour, all positions**

- **Inner zoom** — hover magnifies inside the image frame
- **Lightbox** — full-screen gallery; swipe, arrows, keyboard, pinch-zoom on phones
- **Variant image group** — choosing a colour shows only that colour's images
- **Video** — Shopify-hosted, YouTube or Vimeo, inline or in a popup
- **3D models** — Shopify's model viewer where the product has one
- **On phones** every position becomes a swipeable slider with thumbnails or dots

---

## 4. Variant pickers — 4 swatch types

Chosen per option (Colour, Size, Material…), not once for the whole product.

| Type | What it shows |
|---|---|
| **Image swatch** | A small crop of the variant's own photo |
| **Colour swatch** | A colour chip, using the same colour resolution as the collection filters |
| **Radio swatch** | A labelled radio button per value |
| **Text swatch** | Pills carrying the value's name — typical for sizes |

Plus a **dropdown** as a fifth option for long lists. It uses the custom select, never the
browser's default (see section 8).

All types: sold-out values shown struck through and still selectable for notify-me;
unavailable combinations disabled; the price, images, stock and URL update without a
reload.

---

## 5. Product features — 20

| Feature | What it does | Data it needs |
|---|---|---|
| **Size guide** | Opens a drawer with the size chart | A page or metafield per product, a default for the store |
| **Compare colour** | Shows the colourways side by side to compare | The product's colour variants and their images |
| **Ask a question** | Contact form in a modal, pre-filled with the product | Shopify's contact form |
| **Share products** | Copy link and share to social / messaging | — |
| **Pickup available** | In-store pickup status per location for the selected variant | Shopify local pickup |
| **Terms & conditions** | A checkbox that must be ticked before buying | Text and link set in the editor |
| **Buy button custom** *(HOT)* | Add-to-cart button with configurable label, icon, colours and animation | Editor settings |
| **Shipping information** | Delivery estimate as a date range, plus returns note | Editor settings; optional metafield per product |
| **Special offer** | Highlighted promotion, e.g. "Buy two, save 10%" | Metafield per product, default in the editor |
| **Product inner zoom** | See section 3 | — |
| **Product lightbox image** | See section 3 | — |
| **Real-time visitor** | "N people viewing this" | **See note below** |
| **Buy now button** | Skips the cart and goes straight to checkout | — |
| **Image swatch** | See section 4 | Variant images |
| **Colour swatch** | See section 4 | Colour names, optional swatch metafield |
| **Radio swatch** | See section 4 | — |
| **Text swatch** | See section 4 | — |
| **Trust badge** | Payment icons and guarantee badges | Editor settings |
| **Sticky add to cart** | Bar that appears once the main button scrolls out of view | — |
| **Product recently viewed** | Strip of products this shopper viewed | Stored in the shopper's browser |

> **Note on real-time visitors.** Shopify has no live visitor data without an app, so this
> number is generated within a range the merchant sets. Several markets treat invented
> urgency as a misleading practice. The theme should ship it **off by default**, labelled
> in the editor as simulated, with the option to connect a real source later.

---

## 6. Boost sale — 9

| Feature | What it does |
|---|---|
| **Countdown timers** | Live countdown to an end date — per product by metafield, or one store-wide date |
| **Stock countdown** | "Only 4 left" with a bar, from real inventory |
| **Smart product sticky** | The sticky bar carries image, title, the selected variant, price and add to cart, and lets the shopper change variant from it |
| **Product complementary** | "Complete the look" products, from Shopify's complementary recommendations |
| **Product recommendations** | Related products, from Shopify's recommendations |
| **Dynamic checkout buttons** | Shop Pay, Apple Pay, Google Pay and PayPal express buttons |
| **Variant image group** | See section 3 |
| **Image banner** | A promotional banner section placed on the product page |
| **Popup video** | A play button on the gallery that opens the product video in a modal |

---

## 7. Quick view modal

Uses the **same** variant pickers, swatch types, price block and buy buttons as this page,
so the two never drift apart. Its layout is redesigned with this page rather than
separately. (Owner's addition, 2026-10-03, item 4.)

---

## 8. Site-wide requirements this page must meet

From the owner's additions of 2026-10-03 (recorded in [BRIEF.md](BRIEF.md)). These are
built first, as the foundation, so the product page is built once on the final base.

- **Typography** — the site's new modern fonts and type scale
- **Corner radius** — buttons, inputs, selects, swatches, modals, drawers and pagination
  follow the store's radius setting
- **Custom selects** — no browser-default `<select>` anywhere; the variant dropdown and
  quantity use the theme's own animated select
- **Motion** — tabs, accordions, drawers, modals, the lightbox, the sticky bar and the
  gallery all open, close and move with the theme's motion system, and respect the
  shopper's reduced-motion setting
- **Colour** — all five schemes, with the surface-tone setting, and readable contrast
- **Navigation and footer** — the redesigned header and footer frame the page

---

## 9. How it will be checked

The same standard the collection page now meets. Each one is a test, not a judgement:

1. Every setting and block changes what is rendered — settings audit, one case per value
2. Every control still works after the theme editor re-renders the section
3. Every layout and gallery position at 390px wide
4. Every layout in all five colour schemes, with contrast checked
5. Sticky elements clear the header, and drawers and modals open above it
6. No browser-default select on the page
7. Variant changes update price, images, stock, URL and buy buttons without a reload
8. Keyboard and screen-reader use: focus is trapped in modals and returned on close

---

## 10. Where it stands today

16 of the 48 items exist in some form, none of them tested. 32 are not built.

| Area | Exists (untested) | Not built |
|---|---|---|
| Layouts | default · wide · digital template · default tab · gradient template | box container · tab accordion inner · accordion tab styles |
| Thumbnails | left · right · bottom · none | top · grid 1 · grid 2 · grid mix · slider 2 col · slider full-width · slider container |
| Features | size guide · share · inner zoom · lightbox · real-time visitor · trust badge · sticky add to cart · recently viewed | compare colour · ask a question · pickup · terms & conditions · custom buy button · shipping info · special offer · buy now · all four swatch types |
| Boost sale | countdown · stock countdown · recommendations · *smart sticky (basic only)* | complementary · dynamic checkout · variant image group · image banner · popup video |

The section, `main-product`, will be rebuilt rather than patched. It has 8 settings and a
variants block with none, so most of this is new structure, and patching it would repeat
what happened on the collection page.

---

## 11. Notes for the Claude Design prompt (owner, 2026-10-03)

To be written into the prompt when the owner approves this file. Recorded so they are
not lost.

- **Ask Claude Design to choose a modern font pairing itself**, one that suits modern
  fashion pages. **Do not name any font or pairing in the prompt.** Two rounds of fonts
  chosen by Claude Code (12 pairings) were all rejected.
- The design must show the pairing at work: **product titles, headings, normal
  paragraph text**, and **the titles under each product card** (recommendations,
  complementary products, recently viewed), so the owner can judge the type in
  context.
- The font choice must **not** come at the expense of the product page design. The
  page is the subject; the type serves it.
- **The font pairing is optional.** The owner finds the current fonts acceptable,
  especially the collection filter text. If the Claude Design pairing is not liked,
  **keep the current fonts and make them look modern**: tighter heading tracking,
  adjusted weights and line heights, refined size steps, cleaner uppercase labels.
- Product card titles already moved to the text font (2026-10-03): the owner disliked
  the display face there ("one side of the letters too thin, the other too thick").
- **The navbar and footer are in the Claude Design prompt as well** (owner,
  2026-10-03); the F5/F6 builds get re-skinned to that design when it comes back.
- **Colour gaps are Claude Code's job** (owner, 2026-10-03). The design was briefed
  with each scheme's main colours only. When porting it, map every colour to the
  theme's tokens and fill in whatever it leaves out: all five schemes, all four ladder
  steps (base, soft, deep, contrast), muted text, borders, hover, focus, sale, badge,
  low-stock and success states. Check contrast on every scheme.
