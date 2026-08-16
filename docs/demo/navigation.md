# Building the demo mega menu

How the demo store's navbar gets filled in. Everything here is done in the **Shopify admin**, not in the theme files — a menu is store data and cannot ship with a theme.

Do this once on the demo store. A buyer never sees it; they get an empty navbar and use the Layout Explorer instead.

---

## It takes two places, not one

This is the part that catches people out. A top-level link only opens a mega menu if it is named in **both**:

| Where | What you do |
|---|---|
| **Online Store → Navigation** | Create the links and nest them |
| **Online Store → Themes → Customise → Header** | Add a **Mega menu item** block whose *Navigation link title* is that link's title |

Set up the links only and you get a plain drop-down. Add the block and the same link opens the full mega panel with its featured image or promo banner.

The title match ignores capitals and stray spaces, but the words must be the same. `Shop` in Navigation needs `Shop` (or `shop`) in the block — not `Shop All`.

---

## Step by step

### 1. Create the menu

**Online Store → Navigation → Add menu.** Call it `Demo Menu`. Shopify gives it the handle `demo-menu`.

Then **Customise → Theme settings → Header → Menu** and pick it. (Or just edit the existing *Main menu* and skip this step.)

### 2. Add the top-level items

**Add menu item** for each: `Home`, `Shop`, `Product`, `Blog`, `Pages`.

Every menu item needs a link, including parents that only exist to hold children. Point them somewhere sensible — `Shop` → the all-products collection, `Blog` → the blog. Clicking the parent then still lands somewhere real.

### 3. Add the children

Add each child as a normal menu item first, then **drag it and drop it slightly to the right, underneath its parent.** That indent is what makes it a child. Drag it right again under a child to make a third-level item.

Shopify nests three levels, which is what the tree below needs.

### 4. Paste the layout URLs

For a normal page you type a name and pick from the search dropdown. **That will not find a layout URL** — layouts are not pages, they are the same page rendered differently, so nothing comes up when you search.

Instead paste the whole address into the Link field, including your store domain:

```
https://your-store.myshopify.com/collections/all?view=list
https://your-store.myshopify.com/collections/all?view=sidebar-left
https://your-store.myshopify.com/products/silk-gown?view=wide
```

The `?view=…` part is what selects the layout. Everything before it is an ordinary page on your store.

Because these carry your domain, they work on the demo store only. That is fine — the demo store is the only place this menu exists.

---

## The menu tree

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

**The Home group needs Pages, not `?view=` URLs.** `/` only ever renders one homepage. So each design also gets a page — create a Page called `Home — Noir`, then in its Theme template dropdown choose `home-noir`. The link becomes `/pages/home-noir`. Those page templates ship with the theme; the Page records are yours to create.

---

## Which mega-menu style shows three levels

**Theme settings → Header → Mega Menu Style.**

| Style | Levels rendered | Images |
|---|---|---|
| V1 — Full-width columns + featured image | Two. Third level is not shown | One featured image beside the columns |
| V2 — Compact thumbnails grid | Two, plus a *"n styles"* count where a third level exists | Currently the **same** image on every card — see below |
| V3 — Flyout panel + promo banner | **Three.** Grandchild links render under each child | Promo banner |

So a three-level menu needs **V3** today.

### Planned for Phase F

- All three styles render three levels.
- All three gain a **text-only mode** as well as the image mode, each designed separately rather than the same layout with the picture removed.
- **Per-child images.** V2's grid takes every thumbnail from the one featured image, so all the cards show the same picture. They will instead come from the collection or product each child links to, with an optional per-child override.

Until that lands, V2 is only worth using with images off — or with a single child, where the repetition does not show.

---

## The exact link list

Filled in as each layout is built. Nothing to copy yet — the collection, product and blog layouts do not exist (see `../ROADMAP.md`). When they do, this section becomes a copy-paste table of name and URL pairs.
