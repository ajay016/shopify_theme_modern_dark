# Theme Roadmap — full scope

**Status: mostly plan, not build.** The homepages and the colour system are done. Everything else on this page is specified, not implemented — the collection, product and blog layouts do not exist yet.

This file exists because the original brief was never recorded anywhere. It is now the source of truth for scope.

**For where the work actually stands right now — mid-phase included — see [STATUS.md](STATUS.md).** This file is the plan; that one is the position.

---

## Where things actually stand

| Area | State |
|---|---|
| Homepages | **6 built** (Classic, Blanc, Atelier, Noir, Lumière, Aureline) |
| Colour system | **Done** — five schemes, one global setting drives every section (`COLOR-SYSTEM.md`) |
| Product card | **Done** — one shared card with quick view, wishlist, add-to-bag, demo fallbacks |
| Collection layouts | **Not built.** `collection.list/wide/no-sidebar.json` exist but are *identical stubs* — same bare `main-collection`, no differentiating settings |
| Product layouts | **Not built.** `product.wide/gradient/digital.json` are identical stubs |
| Blog / post layouts | **Not built.** `blog.sidebar-left/right.json` are identical stubs |
| Pages (About / Contact) | Two About variants and two Contact variants exist, lightly differentiated |
| Navbar styles | 3 exist (V1 classic, V2 centred, V3 hamburger). Mega menu exists but is not wired to a demo structure |
| Demo navigation | **Half done.** The Layout Explorer ships (Phase A0). The demo-store mega menu is admin work and the menu export is Phase H |

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

2–3 About and Contact layouts · 2–3 navbar styles beyond the current three

### Mega menu — three modern layouts, each with and without images

Three designs, and every one of them must work in two modes: **with imagery** and **text-only**. Six presentations from three layouts.

**Text-only is a designed mode, not the same layout with the pictures deleted.** Dropping an image out of a layout built around one leaves a hole where it was. So each style specifies its own text-only composition — the panel narrows, the columns re-flow to fill the width, and the type does the work the image was doing.

| Style | With images | Text-only |
|---|---|---|
| **V1** — full-width columns | Column list plus a large featured image panel on one side | Panel narrows to the columns' own width; columns re-flow to use the space; a lead column carries a short heading and description |
| **V2** — thumbnail grid | Each child is a card: image, title, and its third-level links underneath | Cards become type-only tiles with a rule and hover accent, tighter grid, more per row |
| **V3** — flyout + promo | Vertical child list with grandchildren, plus a promo banner | Flyout only, at reduced width, promo replaced by an optional text call-to-action |

**Controls.** `mega_menu_style` stays global. A new **Show images in mega menu** setting sets the default; each *Mega menu item* block can override it, so `Shop` can be visual while `Pages` is plain text.

**All three must render three levels.** Today only V3 does — V1 stops at two, V2 shows a *"n styles"* count where grandchildren exist.

**Per-child images are missing and must be fixed.** `snippets/mega-menu.liquid:92` assigns `child_img` from `block.settings.featured_image` — the single image belonging to the whole menu, so V2's grid renders the *same* picture on every card. A thumbnail grid of identical thumbnails looks broken. The fix: take each child's image from the collection or product it links to, with an optional per-child override block on the header for links that point somewhere without an image.

Also required, since these are the buyer's first impression: keyboard navigation and focus trapping, sensible behaviour when a menu has only two or three children rather than twelve, and correct rendering on the light, warm and custom colour schemes.

---

## Homepage #6 — built

`index.aureline.json`, 11 sections, on the **Ivory / Wine** scheme. Built from a reference design you supplied rather than from the speculative spec that used to sit here.

It is the only commerce-led homepage — service bar, tabbed product grid, countdown offer, complete-the-look trio — where the other five are editorial. Full section list in [HOMEPAGES.md](HOMEPAGES.md).

**Still not demonstrated by any homepage**, and worth a dedicated section when the demo is assembled: live colour-scheme switching, the cart *notification* mode as distinct from the drawer, and base-font-size scaling. These are theme settings rather than page content, so they show up only when a visitor changes them — which a demo visitor never will.

---

## Build order

Each phase ends shippable, so the theme is never half-broken.

| Phase | Scope | Why this order |
|---|---|---|
| ~~**A0**~~ | ~~Layout Explorer panel + theme setting~~ | **Done.** Built first so every later layout registers itself in it. Stub entries carry a *Not yet styled* badge, which each phase flips as it makes a layout real |
| **A** | Collection layouts + filters | Biggest surface, most-judged page, unblocks the Shop menu |
| **B** | Product card styles + card features | Feeds both collection and homepage |
| **C** | Product detail layouts + thumbnails | Second most-judged page |
| **D** | Product features + boost-sale | Long tail; each is independent |
| **E** | Blog + post layouts | Smaller, self-contained |
| **F** | Pages, navbar styles, mega menu | Needs the others to exist to link to |
| ~~**G**~~ | ~~Homepage #6~~ | **Done, out of order.** Built from a supplied reference design with the new Ivory / Wine scheme |
| **H** | Demo package | Menu export, setup guide, ThemeForest checklist |

**Demo store content runs alongside, not at the end.** The ~10–15 invented products with variants should exist as soon as you can add them: they make Phase A–C reviews realistic, and the demo store is not presentable without them. Nothing in the build waits on them.

**Every new section follows the conventions in `HOMEPAGES.md`** — surface-tone select mapped to the ladder, no hardcoded colour on a themed surface, `--onphoto-*` over photography, `--fs-scale` on body copy, fallback images, and `product-card` for anything product-shaped.

---

## Decisions taken

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

## Status

Built: the six homepages, the five colour schemes, the shared product card and quick view.

Not built: every phase in the build order except **A0** and **G**. Phase A is next.

Fine-grained position, including anything half-finished, lives in [STATUS.md](STATUS.md).
