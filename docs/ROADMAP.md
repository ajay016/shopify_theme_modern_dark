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

**This menu is data, not code** — it lives in the Shopify admin (Navigation), so it ships as part of the demo content, not the theme files. The theme must therefore also provide a **menu JSON export** and setup instructions, or the buyer gets an empty navbar.

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
| **A** | Collection layouts + filters | Biggest surface, most-judged page, unblocks the Shop menu |
| **B** | Product card styles + card features | Feeds both collection and homepage |
| **C** | Product detail layouts + thumbnails | Second most-judged page |
| **D** | Product features + boost-sale | Long tail; each is independent |
| **E** | Blog + post layouts | Smaller, self-contained |
| **F** | Pages, navbar styles, mega menu | Needs the others to exist to link to |
| **G** | Homepage #6 | Best built last so it can showcase everything |
| **H** | Demo package | Menu export, setup guide, demo content, ThemeForest checklist |

**Every new section follows the conventions in `HOMEPAGES.md`** — surface-tone select mapped to the ladder, no hardcoded colour on a themed surface, `--onphoto-*` over photography, `--fs-scale` on body copy, fallback images, and `product-card` for anything product-shaped.

---

## Open questions

1. **Filters** — Shopify's native filtering needs the Search & Discovery app and only works on collection/search pages. Confirm you're happy depending on it; the alternative is a custom tag-based filter that behaves worse.
2. **Sub-sub-menus** — Shopify link lists nest three levels, but the *admin UI* only builds two comfortably. Third level usually comes from the mega-menu section's own block settings. Fine, just worth knowing.
3. **Layout count** — the full list above is roughly **40 template files**. All are thin, but each needs checking in the browser. Worth deciding whether every one earns its place or whether some collapse into a setting on a single template.
4. **Demo content** — products with real images, multiple variants and swatches make or break the demo. Needed before Phase H.
