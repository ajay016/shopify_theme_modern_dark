# Theme Roadmap — full scope

**Status: this is the plan, not the build.** Only the homepage and colour work is done. Everything on this page beyond that is specified, not implemented.

This file exists because the original brief was never recorded anywhere. It is now the source of truth for scope.

---

## Where things actually stand

| Area | State |
|---|---|
| Homepages | **5 built** (Classic, Blanc, Atelier, Noir, Lumière). #6 specified below |
| Colour system | **Done** — one global scheme drives every section (`COLOR-SYSTEM.md`) |
| Product card | **Done** — one shared card with quick view, wishlist, add-to-bag, demo fallbacks |
| Collection layouts | **Not built.** `collection.list/wide/no-sidebar.json` exist but are *identical stubs* — same bare `main-collection`, no differentiating settings |
| Product layouts | **Not built.** `product.wide/gradient/digital.json` are identical stubs |
| Blog / post layouts | **Not built.** `blog.sidebar-left/right.json` are identical stubs |
| Pages (About / Contact) | Two About variants and two Contact variants exist, lightly differentiated |
| Navbar styles | 3 exist (V1 classic, V2 centred, V3 hamburger). Mega menu exists but is not wired to a demo structure |
| Demo navigation | **Not built.** This is the piece that makes the template sellable — see below |

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

### Job 2 — the buyer's store: the Layout Explorer

Their navbar is empty, so nothing tells them the other layouts exist. Shopify has no screen that lists a theme's templates. Without help, a buyer uses one layout out of forty because they never discover the rest.

The fix is a list of the layout URLs shipped **in the theme files**, so it survives installation and works with no menus, no pages and no demo content:

- `snippets/demo-explorer.liquid`, rendered from `layout/theme.liquid` on every page
- a slim tab pinned to the screen edge; opens a drawer listing every layout, grouped exactly like the mega menu, each entry a `?view=` link
- built from a static list in the snippet — it does not read `linklists`, so nothing in the admin can empty it
- gated by a theme setting, **Theme settings → Demo → Show layout explorer**, default **on**. The merchant switches it off before launch
- it highlights the layout currently being viewed, so it doubles as "which template am I looking at?"

This is what makes ~40 layouts discoverable to someone who just bought the theme and has an empty navbar. It is not decoration; without it most of what they paid for is invisible.

### Also shipped: menu export + setup guide

So the buyer can reproduce the demo navbar rather than rebuild it by hand:

- `docs/demo/navigation.md` — the full menu tree as copy-pasteable link/URL pairs
- `docs/demo/setup.md` — install order: theme → menus → pages → products → homepage choice
- `docs/demo/settings_data.json` — the demo's theme settings, so colours and typography land correctly

### Homepages have the same problem, and a different answer

`/pages/home-noir` needs a **Page record**, which is also admin data. So on the demo store the six homepages are Pages in the menu; on a fresh install they are not. For the buyer, the Layout Explorer's Home group instead links to `/` and states which design is live, and the switcher (`scripts/use-home.sh`, documented in the README) is how they change it. Templates for the Page variants still ship, so the moment they create a page and assign the template it works.

---

## Scope

### Collection / Shop

**Layouts** — left sidebar · right sidebar · box container · wide container · list view · collections list · filter sidebar · filter hidden/toggle · drawer filter · dropdown filter · grid 2/3/4/5/6 · collection title styles 01–05

**Features** — best sellers · image banner · pagination · infinite scroll · recently viewed · full filter set (price, size, colour, availability, vendor, type, tag)

### Product card (4–5 styles)

Discount badge · price + compare-at · add to cart · wishlist · quick view on hover.
Plus: media auto · media carousel · carousel autoplay · media video · toggle quick add · popup quick add.

*Missing from the original list, worth adding:* colour-swatch preview on the card, "sold out" and "low stock" states, star rating slot, and a size-list-on-hover.

### Product detail

**Layouts** — default · box · wide · digital · default tab · accordion inner · background gradient · accordion styles for description / shipping / reviews

**Features** — size guide · compare colour · ask a question · share · pickup availability · terms · custom buy button · shipping info · special offer · inner zoom · lightbox · live visitor count · buy now · image/colour/radio/text swatches · trust badges · sticky add to cart · recently viewed

**Thumbnails** — left · right · top · bottom · none · grid 1 · grid 2 · grid mix · slider 2 · slider full-width · slider container

**Boost sale** — countdown timer · stock countdown · smart sticky · complementary products · recommendations · dynamic checkout · variant image group · image banner · popup video

### Blog

Blog: left sidebar · right sidebar · no sidebar · list · grid · masonry
Post: left sidebar · right sidebar · no sidebar · formats: gallery, video, audio

### Pages & navigation

2–3 About and Contact layouts · 2–3 navbar styles beyond the current three · mega menu supporting three levels

---

## Homepage #6

Includes the work finished after Lumière was built, which no homepage currently demonstrates:

- **Colour scheme switching** — the scheme selector applies across the whole page, the point being that one setting repaints everything
- **Cart notification** mode (the popover, not the drawer)
- **Base font size** scaling
- **On-photo controls** that stay legible over any product image
- Contrast-corrected badges, cart drawer and quick view

Design to come from you. It should also be the demo page that shows the colour system off, since that is the theme's strongest differentiator and nothing currently showcases it.

---

## Build order

Each phase ends shippable, so the theme is never half-broken.

| Phase | Scope | Why this order |
|---|---|---|
| **A0** | Layout Explorer panel + theme setting | Built first, not last. Every layout from Phase A onward registers itself in it, so it stays complete by construction — and it is how you test each layout without touching the admin |
| **A** | Collection layouts + filters | Biggest surface, most-judged page, unblocks the Shop menu |
| **B** | Product card styles + card features | Feeds both collection and homepage |
| **C** | Product detail layouts + thumbnails | Second most-judged page |
| **D** | Product features + boost-sale | Long tail; each is independent |
| **E** | Blog + post layouts | Smaller, self-contained |
| **F** | Pages, navbar styles, mega menu | Needs the others to exist to link to |
| **G** | Homepage #6 | Best built last so it can showcase everything |
| **H** | Demo package | Menu export, setup guide, demo products with variants, ThemeForest checklist |

**Every new section follows the conventions in `HOMEPAGES.md`** — surface-tone select mapped to the ladder, no hardcoded colour on a themed surface, `--onphoto-*` over photography, `--fs-scale` on body copy, fallback images, and `product-card` for anything product-shaped.

---

## Decisions taken

### Filters — the app is optional, the theme is not dependent on it

Storefront filtering on Shopify is **faceted filtering**: the checkbox panel on a collection page that narrows results by price, size, colour, availability, vendor, type or tag, with live counts, combinable, and reflected in the URL so a filtered view can be linked and shared.

Shopify moved this out of themes years ago. The theme reads `collection.filters`, and that object is only populated once the free first-party **Search & Discovery** app is installed and the merchant has chosen which filters to expose. No theme — Dawn included — can produce it alone.

**The theme does not depend on it.** The filter UI renders inside `{% if collection.filters.size > 0 %}`. With the app: full filter panel in whichever presentation the template picked (sidebar, drawer, dropdown, hidden/toggle). Without it: the panel is absent, sorting and pagination still work, the grid reflows to full width, nothing looks broken or empty. So a buyer who never installs the app gets a working shop; a buyer who does gets the demo. Documented in the setup guide as a recommended one-click install.

### Layout count and structure

My call, following Shopify convention: settings on one section, thin `?view=` templates, `product-card` reused everywhere. Anything that is genuinely one variable — grid column count, title style — becomes a setting rather than its own template, with a handful of `?view=` templates that preset it so the menu still has something to link to.

### Demo products — static wherever static works

The products are fake either way. The only question is *where the fake products live*.

**Static, in theme code — the default, and it covers most of the theme.** Product cards already fall back to hardcoded demo products with images when no collection is connected. That is why the homepages look finished on an empty store. It stays, and every new card style and every collection layout uses the same fallback. Collection pages, homepages, search results, recently-viewed — all static, no admin content needed.

**Typed into Shopify admin — only the product detail page, only for the demo store.** A ThemeForest Shopify demo is a live store, and a reviewer will click Add to Cart. The product page has to *behave*: choosing a size swaps the price and image, Add to Cart opens the drawer with the item in it, quantity changes update the total. Those read from Shopify's `product` object and its variants. Hardcoded HTML cannot produce them — the buttons would be dead, which reads as a broken theme.

So roughly **10 invented products** entered in the demo store's admin, each with a couple of variants and colour options. Still fake products; just fake products living in Shopify rather than in Liquid. Perhaps half an hour of typing, needed **only for Phase H**, and it changes nothing about Phases A–G.

*Rule of thumb for the rest of the build: anything that only has to be looked at is static; anything that has to respond to a click needs a real product.*

### Empty-collection fallback

Collection pages use the same hardcoded demo products the homepage cards use, so the layouts can be reviewed on a store with no products. It fires only when a collection is genuinely empty, and a theme setting turns it off before launch so a live shop never shows invented stock to a customer.

### Product card style — where the merchant picks it

One global setting in Theme settings, so every card in the shop matches by default, with a per-section override so a homepage can deliberately mix styles. This is the pattern nearly every premium theme uses.

### Layout Explorer default

Ships **on**, so a buyer sees the layouts the moment they install. A theme setting hides it before launch, and the setup guide says to do that.

### Homepage #6 — deferred by you

Waiting on your structure, after you have gone through #1–#5. Phase G is last anyway.

---

## Status: planning only

Nothing in this file has been built. **No phase starts until you say go.** The docs are current as of this line; the code has not moved past the homepages and the colour system.
