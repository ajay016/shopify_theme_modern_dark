# Handover — latest phase

Rewritten at the end of every phase. `STATUS.md` holds the full position, `BRIEF.md` the plan verbatim.

---

# Design pass — every page that was unstyled

**Status:** done · committed · pushed
**Half-done:** nothing.

---

## What was actually wrong

The collection page rendered its whole structure — five title styles, a filter sidebar, a drawer, a dropdown bar, active-filter chips, a price range and three pagination modes — and **about forty-five of its classes carried no CSS rule at all**. It was built and never designed. That is why the title styles looked identical and the filters looked broken: there was nothing to look at.

It also had **no surface tone**, unlike every homepage section, so it could not follow the global colour scheme the way the rest of the theme does.

## Fixed

| | |
|---|---|
| **Unstyled classes** | 45 → 0 |
| **Colour scheme** | new **Surface tone** setting on the Collection section, mapped to the same ladder the homepage sections use, so the page follows the global scheme |
| **Empty sidebar** | with no filters available the layout held a blank 264px column open beside the grid; it now falls back to full width |

Now styled: all five title styles, the toolbar and filter button, the sidebar and its groups, checkboxes, counts, price range, active-filter chips, the dropdown panel, the whole drawer, the empty state, numbered pagination, load-more and the infinite-scroll spinner.

## Files changed

`assets/theme.css` · `sections/main-collection.liquid` · docs

---

## What to check, and where

| Priority | Check | Where |
|---|---|---|
| **High** | The page is styled at all — type, rules, spacing | `/collections/all` |
| **High** | Switch **Theme settings → Colors → Color scheme** and confirm the collection page repaints with it | any scheme |
| **High** | The five title styles now look different | `?view=title-1` … `title-5` |
| Med | **Collection → Surface tone** changes the page's band | section settings |
| Med | Pagination, load-more button, infinite spinner | `?view=load-more`, `?view=infinite` |
| Med | No blank sidebar column when there are no filters | `?view=sidebar-left` |
| Low | Drawer and dropdown filter panels | `?view=filter-drawer`, `?view=filter-dropdown` |

## Filters — the theme now has its own

Shopify only populates `collection.filters` when the Search & Discovery app is installed, which is why the page had none. Rather than leave that as the answer, the theme now builds its own filter set from the catalogue, so filtering works on any store with no app:

| Filter | Built from |
|---|---|
| **Availability** — in stock / out of stock | `product.available` |
| **On sale** | compare-at price above price |
| **Price** — min / max | the collection's own price span |
| **Size, Colour, Material…** | every variant option the products define — one group per option, named as the merchant named it |
| **Brand** | `product.vendor` |
| **Product type** | `product.type` |
| **Tags** | `collection.all_tags` |

Within a group values OR together (Small *or* Medium); across groups they AND (Small *and* Black *and* in stock) — how shoppers expect faceted filtering to behave. There is a live result count, a Clear all, and an empty state when nothing matches. Cards arriving from load-more or infinite scroll obey the filters already applied.

**Where Search & Discovery *is* installed, Shopify's native filters are used instead** and the built-in set never appears. Toggle in **Collection → Use built-in filters when no filter app is installed**.

**The honest limit:** the built-in filters narrow *the products on the page*, since a theme cannot re-query the catalogue without the app. Pair with a higher products-per-page value. Native filters do not have this limit.

---

## Not verified

Static analysis only. Nothing opened in a browser: the drawer's open/close classes, the dropdown panel's position, the price-range slider (markup exists, no slider behaviour is implemented yet), and the page across all five schemes.

---

## Theme-wide audit

The collection page was not the only one. Running the same class-against-CSS check over every section and snippet found **159 unstyled classes across 62 files**. Most were my regex catching Liquid variable names; the real ones were whole pages with no design behind them.

Now styled:

| Page | Was |
|---|---|
| **Cart** | grid, summary panel, quantity controls, note field, empty state — all bare |
| **Article** | content typography, meta, tags, share, comments, and the entire blog sidebar |
| **Contact** | form layout, info panel, success and error states |
| **Account** | nav, order list, headers, empty state |
| **Login / register** | the auth card itself, and the shared form field used by contact and addresses too |
| **Blog & search cards** | media, meta, title, excerpt |
| **Product page** | variant block, lightbox trigger, size-guide modal |
| **Header** | nav alignment variants, v2 logo, submenu arrow |

**Remaining: 45 flagged, almost all false positives** — Liquid string literals inside class attributes (`'portrait'`, `'left'`), and the explorer's classes, which are styled in a sibling snippet's inline `<style>` that a per-file check cannot see.

---

## Still open against the brief

**Phase A** — Collections List layout · Filter Hidden as an option distinct from Toggle · price-range slider interaction
**Phase B** — Media carousel autoplay · Media video

## Next

Those five, then **Phase C — product detail**.
