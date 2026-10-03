# Claude Design prompt — product page, navbar, footer

Copy everything below the line into Claude Design. Written from
[PRODUCT-PAGE.md](../PRODUCT-PAGE.md) and the owner's instructions of 2026-10-03.
Nothing from the product page requirements is left out.

---

Design the product details page, the navbar and the footer for **Maison Noir**, a
luxury fashion Shopify theme sold on ThemeForest. It has to look current, refined and
expensive, at the level of the best fashion houses' own sites, and **every part must
be modern**. Nothing should look like a template from a few years ago.

Deliver **HTML and CSS** (vanilla, no framework), with small amounts of plain
JavaScript wherever an interaction needs to be seen working. It will be ported into
Shopify Liquid, so:

- define every colour, font, size, radius, spacing and duration as a CSS custom
  property named by role (for example `--bg`, `--fg`, `--muted`, `--accent`,
  `--radius-sm`), not by value
- give components clear class names
- add a short spec panel or annotation layer listing the fonts, sizes, weights,
  letter-spacing, line heights and spacing you used

Use real fashion content throughout, never lorem ipsum. Example product: **Washed
Silk Slip Dress**, by Maison Noir, $890 (was $1,120), in Black, Ivory, Champagne and
Bordeaux, sizes XS–XL with L sold out, 4.8 stars from 126 reviews, 100% mulberry silk,
made in Italy.

## 1. Typography: choose a modern font pairing

**Choose the font pairing yourself.** Pick one that suits modern fashion pages and
looks contemporary. It must work for:

- the product title and page headings
- section headings ("Complete the look", "You may also like")
- normal paragraph text (description, shipping, reviews)
- small interface text: labels, prices, size buttons, badges, filters, the navbar
- **the product titles under each product card** (in the recommendations,
  complementary products and recently viewed rows). These must read cleanly at small
  sizes. Avoid faces whose thin strokes become hairlines next to heavy strokes at
  card size.

The type serves the page. Choosing fonts must never come at the expense of the
product page design. Show the pairing at work across the whole page, not in a
separate specimen.

## 2. Design system the page must fit

**Five colour schemes**, each a four-step tonal ladder: base, soft, deep and an
inverted contrast band. Design primarily in **Light / Ivory**, which is the active
store scheme, and show the page in **Dark Luxury** too. Every element must work in
all five with readable contrast.

| Scheme | Base | Text | Soft | Deep | Contrast band | Accent | Sale |
|---|---|---|---|---|---|---|---|
| Light / Ivory | #FFFFFF | #1A1A1A | #F7F4EE | #EDE8DD | #1A1A1A | #9B7B3F | #8B1A1A |
| Ivory / Wine | #FFFFFF | #11110F | #F6F5F1 | #E6E3DB | #11110F | #762B36 | #8B1A1A |
| Dark Luxury | #0A0A0A | #F5F0E8 | #131313 | #1A1714 | #F5F0E8 | #C8A96E | #FFBABA |
| Warm Taupe | #1C1410 | #EDE0CC | #241A14 | #2E2219 | #EDE0CC | #D2A166 | #FFBABA |
| Custom | merchant's own colours | | | | | | |

**Corners.** The theme has a corner setting: sharp, subtle, soft and rounded. Design
at **soft**: 4px on badges, 8px on buttons, fields and selects, 12px on cards,
dropdowns and images, 16px on modals and drawers. Buttons may also be pill-shaped.

**Selects.** No browser-default `<select>` anywhere. The variant dropdown, quantity,
country and language selectors all use one custom, animated select.

**Motion.** Everything that opens, closes or appears moves: drawers slide, modals
rise and settle, accordions and tabs animate their height, dropdowns pop, swatches
and buttons respond to the pointer, and sections fade in on scroll. Keep it smooth
and quick, never showy. Show these interactions working, and include a
reduced-motion version where nothing moves.

**Product cards** (for the rows on this page) show: image with a second image on
hover, badges (New, Sale −20%, Sold out, Low stock), wishlist and quick view buttons,
add to cart, brand and rating on one line, title, price with the compare-at price
struck through, colour swatches, and sizes with sold-out sizes struck through.

## 3. Navbar

The header sits above every page, with an **announcement bar** above it. The bar is
in one of three modes: a scrolling ticker, rotating messages, or static text.

Design **four header styles**:

1. **Classic**: logo left, menu centred, icons right
2. **Centred**: logo centred above a full-width menu row, with a search field on the
   left
3. **Minimal**: a menu button and label on the left, logo centred, icons right; the
   menu opens as a drawer at every screen size
4. **Floating**: the Classic layout in a rounded bar inset from the screen edges

All four have:

- icons for search, account, wishlist with a count, and cart with a count
- a transparent version over the homepage hero that turns solid on scroll
- a compact state once scrolled
- an option to hide while scrolling down and return when scrolling up

Design **three mega menu layouts**, each **with images and without images**:

1. **Columns**: each submenu is a column heading with its own links (three levels:
   menu → submenu → sub-submenu), plus a featured image card
2. **Visual**: one tile per submenu, with the collection image (or a text tile when
   images are off) and the submenu's own links underneath
3. **Flyout**: a compact panel under the menu item; submenus are listed on the left,
   the hovered submenu's links appear beside them, with a promo image card

Also design:

- the **search overlay**: a large field with predictive results (products with image,
  title and price, plus collections and pages)
- the **mobile header** at 390px wide
- the **mobile menu drawer**: all three menu levels as animated accordions, a "View
  all" link per level, account link, social links and the country/language selector

Show hover, open and keyboard-focus states.

## 4. Product details page

### 4.1 Page anatomy, top to bottom

1. Breadcrumb
2. **Media gallery**: images, video and 3D, with zoom, lightbox and thumbnails
3. **Product information column**:
   - Vendor / brand · title · star rating with review count
   - Price, compare-at price, discount percentage, unit price, tax and shipping note
   - Badges: New · Sale · Sold out · Low stock
   - Countdown timer · stock countdown · real-time visitors
   - **Variant pickers**: one per option, each in one of four swatch types (see 4.4)
   - Size guide link · compare colour link
   - Quantity selector
   - Terms & conditions checkbox (optional, blocks purchase until ticked)
   - Add to cart (custom buy button) · Buy now · dynamic checkout buttons
   - Pickup availability
   - Special offer · shipping information · trust badges
   - Ask a question · share
   - Description / shipping / reviews as tabs or accordions
4. **Below the fold**: complementary products ("Complete the look") · product
   recommendations ("You may also like") · image banner · recently viewed
5. **Always available**: sticky add-to-cart bar · popup video · lightbox · size guide ·
   compare colour · ask a question, as drawers or modals

Every block in the information column can be reordered, added or removed, so each
block must look complete on its own.

### 4.2 Eight layouts. Design every one

| Layout | What it means |
|---|---|
| **Default layout** | Gallery left, information right, within the container |
| **Box container** | The same, held to a narrower container with generous margins |
| **Wide container** | The same, at a wider maximum width for large imagery |
| **Digital products** | No shipping, pickup or size guide; shows format, file size, licence and delivery method instead |
| **Default tab** | Description, shipping and reviews as horizontal tabs below the gallery and information |
| **Tab accordion inner** | The same content as accordions inside the information column |
| **Background gradient** | Page background is a gradient drawn from the active colour scheme |
| **Accordion tab styles** | Description, shipping and reviews each set independently to tabs, accordion or open text |

### 4.3 Gallery: eleven thumbnail positions. Design every one

| Position | What it means |
|---|---|
| **Left thumbnails** | Vertical strip to the left of the main image |
| **Right thumbnails** | Vertical strip to the right |
| **Top thumbnails** | Horizontal strip above the main image |
| **Bottom thumbnails** | Horizontal strip below |
| **No thumbnails** | Main image only, with arrows and progress dots |
| **Grid 1 column** | Every image stacked full width; the information column stays sticky beside them |
| **Grid 2 columns** | Images in a two-column grid |
| **Grid mix** *(HOT)* | First image full width, then alternating pairs and singles |
| **Slider 2 columns** *(NEW)* | Two images visible at once, swiping sideways |
| **Slider full-width** | Edge-to-edge slider above the information |
| **Slider container** | The same slider held inside the container |

Media behaviour in every position:

- **Inner zoom**: hover magnifies inside the image frame
- **Lightbox**: full-screen gallery with swipe, arrows, keyboard and pinch-zoom on phones
- **Variant image group**: choosing a colour shows only that colour's images
- **Video**: Shopify-hosted, YouTube or Vimeo, inline or in a popup
- **3D models**: Shopify's model viewer where the product has one
- **On phones** every position becomes a swipeable slider with thumbnails or dots

### 4.4 Variant pickers: four swatch types plus a dropdown

Chosen per option (Colour, Size, Material), not once for the whole product.

| Type | What it shows |
|---|---|
| **Image swatch** | A small crop of the variant's own photo |
| **Colour swatch** | A colour chip |
| **Radio swatch** | A labelled radio button per value |
| **Text swatch** | Pills carrying the value's name, typical for sizes |
| **Dropdown** | The custom animated select, for long lists |

For every type: sold-out values are struck through and still selectable for
notify-me; unavailable combinations are disabled; and the price, images, stock and
URL update without a reload. Show the selected, hover, sold-out and unavailable
states.

### 4.5 Product features: all twenty

| Feature | What it does |
|---|---|
| **Size guide** | Opens a drawer with the size chart, with a measuring guide and a cm/in switch |
| **Compare colour** | Shows the colourways side by side to compare |
| **Ask a question** | A contact form in a modal, pre-filled with the product |
| **Share products** | Copy link, and share to social and messaging |
| **Pickup available** | In-store pickup status per location for the selected variant, with a drawer of locations |
| **Terms & conditions** | A checkbox that must be ticked before buying |
| **Buy button custom** *(HOT)* | Add-to-cart button with configurable label, icon, colours and animation, with loading and added states |
| **Shipping information** | Delivery estimate as a date range, plus a returns note |
| **Special offer** | A highlighted promotion, for example "Buy two, save 10%" |
| **Product inner zoom** | See 4.3 |
| **Product lightbox image** | See 4.3 |
| **Real-time visitor** | "N people viewing this" (simulated, off by default) |
| **Buy now button** | Skips the cart and goes straight to checkout |
| **Image swatch** | See 4.4 |
| **Colour swatch** | See 4.4 |
| **Radio swatch** | See 4.4 |
| **Text swatch** | See 4.4 |
| **Trust badge** | Payment icons and guarantee badges |
| **Sticky add to cart** | A bar that appears once the main button scrolls out of view |
| **Product recently viewed** | A row of products this shopper viewed |

### 4.6 Boost sale: all nine

| Feature | What it does |
|---|---|
| **Countdown timers** | A live countdown to an end date |
| **Stock countdown** | "Only 4 left" with a bar, from real inventory |
| **Smart product sticky** | The sticky bar carries image, title, the selected variant, price and add to cart, and lets the shopper change variant from it |
| **Product complementary** | "Complete the look" products |
| **Product recommendations** | Related products |
| **Dynamic checkout buttons** | Shop Pay, Apple Pay, Google Pay and PayPal express buttons |
| **Variant image group** | See 4.3 |
| **Image banner** | A promotional banner section on the product page |
| **Popup video** | A play button on the gallery that opens the product video in a modal |

### 4.7 Quick view modal

Opened from a product card. It uses the **same** variant pickers, swatch types, price
block and buy buttons as the product page, laid out for a modal: gallery with
thumbnails, information, variants, quantity, add to cart, buy now, and "View full
details". Redesign its layout to be modern. Show it at desktop and phone width (as a
bottom sheet on phones).

### 4.8 States to show

- sale price with the compare-at price and discount
- a sold-out size; an unavailable combination
- low stock with the countdown bar; the countdown timer running
- add to cart: default, loading and added (with the cart drawer or notification opening)
- terms unticked blocking purchase, then ticked
- the sticky bar visible after scrolling
- the size guide drawer, compare colour modal, ask a question modal, share menu, pickup
  drawer, lightbox and popup video, each open
- description, shipping and reviews in tabs and in accordions; the reviews block
  with a rating summary, rating bars, and a few written reviews with photos

## 5. Footer

Design **three footer styles**:

1. **Columns**: brand, description, newsletter signup and social icons on the left;
   link columns on the right
2. **Statement**: a large newsletter band on top, then the link columns, then an
   oversized wordmark spanning the full width
3. **Minimal**: everything centred, with logo, one row of links, a compact newsletter
   field and social icons

All three have a bottom bar with copyright, country/currency and language selectors
(custom selects), payment icons and a back-to-top button. Each must work on four
surfaces from the scheme ladder: base, soft, deep and inverted contrast. On phones
the link columns fold into animated accordions.

## 6. Widths

Show every page and component at **1440px** and **390px**, and the product page also
at **1024px**. No sideways scrolling at any width.
