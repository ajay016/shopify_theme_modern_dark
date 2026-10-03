# The build plan

**Scope comes from [BRIEF.md](BRIEF.md)** — your words, verbatim. This file is how it gets built.
**Position lives in [STATUS.md](STATUS.md)** — what is in flight right now.
**Each phase ends with [HANDOVER.md](HANDOVER.md)** — what changed and what to check.

---

## Why this file was rewritten

Three phases were reported done and were not:

1. **Phase A** was checked against what had been built, not against the brief. Its Features list was two of six.
2. **The collection page** was built and never designed — 45 of its classes had no CSS rule at all.
3. **Every page except two** still has no surface-tone setting, so it cannot follow the global colour scheme the way the homepage sections do.

Each is the same mistake: treating structure as the work, and treating styling and the colour system as something to do afterwards. The fix is not a longer task list. It is a definition of done that contains them, and a check that can be **run** rather than judged.

---

## Definition of done

**A page is not finished until all six pass. No phase is reported complete until every page it touches passes all six.**

| # | Requirement | How it is checked |
|---|---|---|
| 1 | **Every class the section renders has a CSS rule** | Script: pull every `class="…"`, look each up in `theme.css` and the section's own `<style>`. Must be zero |
| 2 | **The section exposes a Surface tone** mapped to the ladder (`--s1..s4`), like every homepage section | Script: schema contains a `scheme` select with the four options |
| 3 | **No hardcoded colour on a themed surface** — only photographic scrims and on-photo controls may be literal | Script: hex values outside the allowed list |
| 4 | **Body copy scales** with `calc(… * var(--fs-scale, 1))` | Script: every `font-size` wrapped, or governed by `--heading-scale` |
| 5 | **Contrast passes AA on all five schemes**, for body, muted and accent on every rung used | Script: relative-luminance calculation |
| 6 | **Responsive** — no horizontal scroll, no overlap, at 360 / 768 / 1024 / 1440 / 1920 | **You, in a browser.** The one I cannot verify, and will keep saying so |

Checks 1–5 run as one script, `scripts/check-page.sh`, before any phase is reported done.

---

## Where things actually stand

Measured, not remembered.

| Page section | Surface tone | Unstyled classes |
|---|---|---|
| `main-collection` | yes | 0 |
| `main-list-collections` | yes | 0 |
| `main-product` | **no** | 1 |
| `main-blog` · `main-article` | **no** | 0 |
| `main-cart` | **no** | 0 |
| `main-page` · `main-contact` | **no** | 0 |
| `main-search` · `main-404` | **no** | 0 |
| `main-account` · `main-login` · `main-register` · `main-addresses` · `main-order` | **no** | 0 |

**Styling is largely fixed. The colour system is not — 13 of 15 pages cannot follow the scheme.**

---

## Build order — revised 2026-10-03

The owner added six site-wide requirements ([BRIEF.md](BRIEF.md), *Additions*). Four of
them — fonts, corner radius, selects, motion — are **primitives every page is built
from**. Doing the product page first would mean building it on the old ones and then
restyling it. So the primitives go first, and everything after is built once.

| # | Phase | Why here |
|---|---|---|
| 1 | **F — Foundation**: radius · custom select · motion · typography | Everything below uses them |
| 2 | **F — Header and footer** | Frame every page, including the product page design |
| 3 | **0 — Colour on every page** | Restyle the remaining pages once, on the final primitives |
| 4 | **3 — Product page + quick view** | Approved requirements → Claude Design reference → build |
| 5 | **2 — Card leftovers**: carousel autoplay · media video | Small; shares media handling with the product gallery |
| 6 | **4 — Blog · 5 — Pages · 6 — Demo package** | Unchanged |

---

## Phase F — Foundation · *next*

Site-wide. Owner's additions of 2026-10-03, items 1–6.

**F1 — Corner radius** (item 6) · *done 2026-10-03*
- [x] One theme setting, *Corners & Shape*: sharp · subtle · soft (default) · rounded,
      plus button shape (follow / pill) and pagination numbers (follow / circles)
- [x] Applied through tokens (`--r-xs/sm/md/lg`, `--r-btn`, `--r-pill`, `--r-page`) to
      buttons, inputs, selects, swatches, pills, chips, badges, cards, images, toasts,
      modals, drawers (page-facing edge), dropdown panels, close buttons and pagination
- [x] Nothing keeps a hard-coded radius, except circles (dots, spinners, icon buttons,
      slider thumbs), thin progress bars, the arches in *Collection arches*, and the
      demo explorer tab
- [x] Product card image radius gained *Follow corner radius*, now its default
- [x] Test: `scripts/radius-check.py` + `scripts/radius-test.js` — tokens and computed
      radius of each component at all six values

**F2 — Custom select** (item 5) · *done 2026-10-03*
- [x] One component replacing every native `<select>` — today: collection sort,
      collections-list sort, address country and province; any select added later
      (quick view, cart, a re-rendered section) is enhanced as it arrives
- [x] Animated open and close (fade, lift, staggered options, chevron turn; flips up
      near the bottom of the screen and right-aligns near the edge); keyboard (arrows,
      Home/End, Page Up/Down, type-ahead, Enter, Escape, Tab); combobox/listbox roles
      for screen readers; touch
- [x] The native select stays underneath as the value source, so forms, inline
      `onchange` handlers and Shopify's own scripts keep working; setting `.value` or
      rewriting the options from script updates the custom control
- [x] Test: `scripts/custom-select-test.js` — 18 checks, zero visible browser-default
      selects
- [x] Found on the way: address forms never filled the province list or preselected a
      saved country. Fixed (`initAddressForms` in `theme.js`).
- [ ] Variant dropdown and quantity on the product page use it — built with Phase 3

**F3 — Motion** (item 3) · *done 2026-10-03*
- [x] Shared duration and easing tokens (`--dur-1…4`, `--ease-std`, `--ease-emph`), and a
      *Motion* setting — expressive · subtle · off — under *Theme settings → Animations*
- [x] Height-animated open and close for filter groups, the top panel and mobile
      submenus (`slide()` in `theme.js`); the hidden sidebar already animated its column
- [x] Enter and leave for drawers (contents stagger in), quick view (rises and settles),
      size guide, dropdown filters (pop open, animated close), custom selects, the
      search overlay, mega menu, toasts and the cart notification; blurred overlays
- [x] Micro-interactions: checks pop, swatches lift, pills and buttons press, filter
      plus/minus turns, grid fades on grid/list switch, cards fade back when a filter
      brings them back
- [x] Scroll reveal for every section after the first, items stagger; opt out with
      `data-no-reveal`. The old failsafe showed everything 600ms after load, so nothing
      below the fold ever animated — fixed
- [x] `prefers-reduced-motion` respected everywhere; Motion: Off stops everything
- [x] Test: `scripts/motion-test.js` — 14 checks
- [ ] Product page tabs, accordions, lightbox, sticky bar and gallery — built with Phase 3
      on these tokens

**F4 — Typography** (item 1) · *done 2026-10-03*
- [x] Shopify's font picker for headings and body: Font Pairing → *Custom*, so merchants
      can choose from the font library rather than a fixed list
- [x] Four modern pairings added: Instrument Serif + Inter Tight (recommended),
      Inter Tight alone, Bodoni Moda + Jost, Fraunces + Plus Jakarta Sans
- [x] Heading weight and tracking now follow the pairing (`--fw-display`,
      `--ls-display`); headings were fixed at 300, a weight only Cormorant has
- [x] Side-by-side specimen for the owner: https://claude.ai/artifact/Vg9REFjFCD1Er4GUnZFVnN
- [x] Owner's decision (2026-10-03): none of the four new pairings; **DM Serif Display +
      DM Sans stays** as the store font and is now the schema default. The new pairings
      and Custom stay available as options for buyers
- [x] Type scale: chrome fixed in px (Phase 1), content scaling with the body-size setting

**F5 — Header** (item 2; also the brief's "2–3 navbar styles")
- [ ] 2–3 modern header styles
- [ ] Mega menu in 3 layouts, with and without images
- [ ] Menu → submenu → sub-submenu, animated

**F6 — Footer** (item 2)
- [ ] 2–3 modern footer styles

**F7 — Quick view** (item 4) — redesigned with the product page in Phase 3, because it
shares the variant pickers and buy buttons.

---

## Phase 0 — the colour system reaches every page

Before any new feature. This is the complaint that keeps recurring, and it is mechanical work rather than design work.

- [ ] Surface tone select on all 13 remaining `main-*` sections
- [ ] Each page's CSS driven through a per-page token block off the ladder, as `main-collection` does
- [ ] Legacy aliases re-pointed so nothing sits on a fixed colour
- [ ] `scripts/check-page.sh` written, and checks 1–5 green on every page
- [ ] Contrast audited on all five schemes, every page

---

## Phase 1 — Collection / Shop · **done**

Every line of the brief, ticked individually.

**Layouts** — done: left sidebar · right sidebar · box container · wide container · list view · collections list · filter sidebar · drawer sidebar filter · dropdown sidebar filter · grid 2 · 3 · 4 · 5 · 6 · title styles 01–05.
**Filter styles — six:** sidebar always open · sidebar groups collapsed · sidebar hidden until opened · drawer · dropdown bar · top panel. "Filter hidden" shipped as its own style on 2026-09-28. Every style falls back to the drawer on phones.
**Verified by script** (`scripts/settings-audit.py` and the browser tests in `scripts/`): every setting changes the output; controls survive the theme editor re-rendering the section; toolbar and grid share both edges; sticky elements clear the header.

**Features** — done: best seller products · image banner · pagination page · infinite scrolling · product recently viewed.

**"All sorts of filters"** — done: availability · on sale · price slider · price presets · colour swatches · size pills · every other variant option · brand · product type · tags · in-stock-only modifier · discount tiers · new in · rating.

---

## Phase 2 — Product card · **nearly done**

**Styles** — done: five (atelier, minimal, editorial overlay, bordered, plaque).
**Basics** — done: discount badge · price + compare-at · add to cart · wishlist · quick view on hover.

**Card features** — done: media auto · media carousel · toggle quick add · popup quick add.
**Outstanding: media carousel autoplay (NEW) · media video (NEW)** — both flagged NEW in the brief.

**Beyond the brief** — colour swatches · sizes on hover · star rating · low stock · sold out.

---

## Phase 3 — Product detail

The largest phase in the brief. Full requirements, with a definition for every item and
how each will be checked: **[PRODUCT-PAGE.md](PRODUCT-PAGE.md)** — awaiting the owner's
approval. After approval: a Claude Design reference, then the build. The quick view
modal is redesigned in this phase. `main-product` is rebuilt rather than patched.

**Layouts** — [ ] default · [ ] box container · [ ] wide container · [ ] digital products · [ ] default tab · [ ] tab accordion inner · [ ] background gradient · [ ] separate accordion styles for description / shipping / customer reviews

**Thumbnail positions** — [ ] left · [ ] right · [ ] top · [ ] bottom · [ ] none · [ ] grid 1 column · [ ] grid 2 columns · [ ] grid mix · [ ] slider 2 columns · [ ] slider full-width · [ ] slider container

**Features** — [ ] size guide · [ ] compare colour · [ ] ask a question · [ ] share products · [ ] pickup available · [ ] terms & conditions · [ ] custom buy button · [ ] shipping information · [ ] special offer · [ ] inner zoom · [ ] lightbox image · [ ] real-time visitor · [ ] buy now · [ ] image swatch · [ ] colour swatch · [ ] radio swatch · [ ] text swatch · [ ] trust badge · [ ] sticky add to cart · [ ] recently viewed

**Boost sale** — [ ] countdown timer · [ ] stock countdown · [ ] smart product sticky · [ ] complementary products · [ ] recommendations · [ ] dynamic checkout buttons · [ ] variant image group · [ ] image banner · [ ] popup video

---

## Phase 4 — Blog

Four groups, not two.

**Blog layout** — [ ] left sidebar · [ ] right sidebar · [ ] without sidebar
**Post layout** — [ ] left sidebar · [ ] right sidebar · [ ] without sidebar
**Blog style** — [ ] list · [ ] grid · [ ] masonry
**Post format** — [ ] gallery · [ ] video · [ ] audio

---

## Phase 5 — Pages and navigation

- [ ] 2–3 About layouts
- [ ] 2–3 Contact layouts
- [ ] 2–3 navbar styles beyond the current three
- [ ] Mega menu — three layouts, each **with images and text-only**, all rendering three levels, with per-child images

---

## Phase 6 — Demo package

- [ ] Menu export — the full tree as copy-paste link/URL pairs
- [ ] Setup guide — install order
- [ ] `settings_data.json` for the demo store
- [ ] ThemeForest submission checklist

---

## Standing rules

- **Work continues phase by phase** without waiting for review.
- **Bugs jump the queue.** Anything reported is fixed before the next phase resumes, and logged in `STATUS.md` whether fixed or deferred.
- **Every phase ends with a handover** — what changed, what to check, where.
- **Static analysis is not verification.** Everything handed over is unopened in a browser unless it says otherwise.

---

## The architecture decision

**One section per page type, driven by settings. Many thin template files that configure it. Navigation by URL.**

Not one file per layout with duplicated markup — that would be ~40 near-identical files to maintain.

### How Shopify makes this work

Shopify supports **alternate templates** addressed by a `?view=` parameter:

```
/collections/all              → templates/collection.json
/collections/all?view=list    → templates/collection.list.json
/collections/all?view=grid-5  → templates/collection.grid-5.json
/products/silk-gown?view=wide → templates/product.wide.json
```

So each layout is a **small JSON file** that renders the same `main-collection` section with different settings. No duplicated Liquid, no duplicated CSS, and every layout gets a real URL a visitor can navigate to.

This is why the answer to "will you create separate pages for each layout?" is: **separate template files, yes — separate sections, no.** The template files are ~15 lines each.

### Homepages are the exception

`/` only ever renders `index.json`. For a demo where a visitor browses all six homepages, each one also gets a **Page**:

```
/pages/home-noir → page.home-noir.json → the same sections as index.noir.json
```

The merchant still publishes their chosen homepage to `/` with `scripts/use-home.sh`.

---

## Demo navigation

The mega menu is the product. A ThemeForest buyer judges the theme by clicking through it.

```
Home ▾            Shop ▾                    Product ▾              Blog ▾        Pages ▾
├ Classic         ├ Layouts ▸               ├ Layouts ▸            ├ List        ├ About v1
├ Blanc           │  ├ Left sidebar         │  ├ Default           ├ Grid        ├ About v2
├ Atelier         │  ├ Right sidebar        │  ├ Box container     ├ Masonry     ├ Contact v1
├ Noir            │  ├ Box / Wide           │  ├ Wide              ├ Sidebar L   ├ Contact v2
├ Lumière         │  ├ List view            │  ├ Digital           ├ Sidebar R   └ 404
└ #6              │  └ Collections list     │  └ Gradient          └ No sidebar
                  ├ Filters ▸               ├ Thumbnails ▸
                  │  ├ Sidebar / Hidden     │  ├ Left / Right
                  │  ├ Drawer / Dropdown    │  ├ Top / Bottom
                  ├ Grid ▸ 2/3/4/5/6 cols   │  ├ None / Grid / Slider
                  └ Titles ▸ style 01–05    └ Features ▸ swatches, sticky ATC, …
```

Three sub-levels, which Shopify's link lists support. Every leaf is a `?view=` URL.

**A menu is store data, not a theme file.** It is saved in the store's admin under Navigation, and Shopify gives a theme no way to install one. So the same theme shows a full navbar on the demo store and an empty navbar on a buyer's store. Nothing can be added to the theme files to change that; it is how every Shopify theme on ThemeForest behaves.

Two separate jobs follow from that.

### Job 1 — the demo store: build the mega menu in the admin

What a ThemeForest visitor clicks. Built once, exactly as the tree above, every leaf a `?view=` URL. This works without qualification and is the browsing experience the buyer is judging.

Step-by-step instructions are in **[demo/navigation.md](demo/navigation.md)**. Two findings from writing them:

- A top-level link needs entries in **two** places — Navigation for the links, and a **Mega menu item** block in the Header section for the panel. Links alone give a plain drop-down.
- Only mega-menu **style V3** renders the third level. V1 shows two levels, V2 shows two plus a count. Extending V1 and V2 to three levels is Phase F work, alongside the with-images / text-only modes specified under Scope.

### Job 2 — the buyer's store: the Layout Explorer

Their navbar is empty, so nothing tells them the other layouts exist. Shopify has no screen that lists a theme's templates. Without help, a buyer uses one layout out of forty because they never discover the rest.

**Built in Phase A0.** A list of the layout URLs shipped **in the theme files**, so it survives installation and works with no menus, no pages and no demo content:

- `snippets/demo-explorer.liquid` + `snippets/demo-explorer-group.liquid`, rendered from `layout/theme.liquid` on every page
- a slim tab pinned to the screen edge; opens a drawer listing every layout, grouped like the mega menu, each entry a `?view=` link
- built from a static list in the snippet — it does not read `linklists`, so nothing in the admin can empty it
- gated by **Theme settings → Demo → Show layout explorer**, default **on**. The merchant switches it off before launch
- highlights the layout currently being viewed, using Shopify's `template.suffix` rather than the URL, since Liquid cannot read a query string
- sits at `--z-explorer: 300` — above the header, below the cart drawer and quick view, so it never covers a real interaction
- groups self-hide when their target does not exist, so no entry can 404

This is what makes ~40 layouts discoverable to someone who just bought the theme and has an empty navbar. It is not decoration; without it most of what they paid for is invisible.

### Also shipped: menu export + setup guide

So the buyer can reproduce the demo navbar rather than rebuild it by hand:

- `docs/demo/navigation.md` — the full menu tree as copy-pasteable link/URL pairs
- `docs/demo/setup.md` — install order: theme → menus → pages → products → homepage choice
- `docs/demo/settings_data.json` — the demo's theme settings, so colours and typography land correctly

### Homepages have the same problem, and a different answer

`/pages/home-noir` needs a **Page record**, which is also admin data. So on the demo store the six homepages are Pages in the menu; on a fresh install they are not. For the buyer, the Layout Explorer's Home group instead links to `/` and states which design is live, and the switcher (`scripts/use-home.sh`, documented in the README) is how they change it. Templates for the Page variants still ship, so the moment they create a page and assign the template it works.

---

---\n\n## Decisions taken

### Filters — the app is optional, the theme is not dependent on it

Storefront filtering on Shopify is **faceted filtering**: the checkbox panel on a collection page that narrows results by price, size, colour, availability, vendor, type or tag, with live counts, combinable, and reflected in the URL so a filtered view can be linked and shared.

Shopify moved this out of themes years ago. The theme reads `collection.filters`, and that object is only populated once the free first-party **Search & Discovery** app is installed and the merchant has chosen which filters to expose. No theme — Dawn included — can produce it alone.

**The theme does not depend on it.** The filter UI renders inside `{% if collection.filters.size > 0 %}`. With the app: full filter panel in whichever presentation the template picked (sidebar, drawer, dropdown, hidden/toggle). Without it: the panel is absent, sorting and pagination still work, the grid reflows to full width, nothing looks broken or empty. So a buyer who never installs the app gets a working shop; a buyer who does gets the demo. Documented in the setup guide as a recommended one-click install.

### Layout count and structure

My call, following Shopify convention: settings on one section, thin `?view=` templates, `product-card` reused everywhere. Anything that is genuinely one variable — grid column count, title style — becomes a setting rather than its own template, with a handful of `?view=` templates that preset it so the menu still has something to link to.

### Demo products — the fallback is for the buyer, not for the demo

The products are invented either way. The question is *where they live*, and the answer is different for the two audiences.

**The buyer's freshly installed store — static, in theme code.** Product cards fall back to hardcoded demo products with images when no collection is connected, which is why the homepages look finished on a store with nothing in it. That stays, and every new card style and collection layout uses the same fallback.

**The ThemeForest demo store — real products, entered in the admin.** Corrected after checking a live competitor demo: on Ella's demo store, clicking a product on the homepage opens its product page. Ours would not. `snippets/product-card.liquid` gives a fallback card `demo_url`, defaulting to `/collections/all`, so a reviewer clicking a homepage product lands on a collection listing — a visible dead end on the most-looked-at page of the demo.

A static card also cannot demonstrate anything interactive: choosing a size and watching price and image change, Add to Cart opening the drawer with the item in it, quantity updating the total, swatches, stock countdown. All of that reads from Shopify's `product` object and its variants.

So the demo store needs roughly **10–15 invented products** with a couple of variants and colour options each, and real collections connected to the homepage sections. Still fake merchandise; just fake merchandise living in Shopify rather than in Liquid.

**This is needed earlier than first written.** It is not a Phase H detail — the demo store is not presentable without it, and it also makes reviewing the collection and product layouts realistic. It does not block building Phases A–G, which is why no phase waits on it.

*Rule of thumb: the static fallback exists so an empty store never looks broken. It is not a substitute for content on the demo store.*

### Empty-collection fallback

Collection pages use the same hardcoded demo products the homepage cards use, so the layouts can be reviewed on a store with no products. It fires only when a collection is genuinely empty, and a theme setting turns it off before launch so a live shop never shows invented stock to a customer.

### Product card style — where the merchant picks it

One global setting in Theme settings, so every card in the shop matches by default, with a per-section override so a homepage can deliberately mix styles. This is the pattern nearly every premium theme uses.

### Layout Explorer default

Ships **on**, so a buyer sees the layouts the moment they install. A theme setting hides it before launch, and the setup guide says to do that.

### Homepage #6 — built

You supplied a reference design instead of waiting for #1–#5 review, so Phase G ran early. Built as `index.aureline.json` on the new Ivory / Wine scheme.

---

