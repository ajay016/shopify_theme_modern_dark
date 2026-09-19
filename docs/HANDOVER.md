# Handover — latest phase

Rewritten at the end of every phase. This is the short version meant to be read in a spare five minutes; `STATUS.md` holds the full position and `ROADMAP.md` the plan.

---

# Phase B — Product card styles and features

**Status:** done · committed · pushed to `main` and `claude/maison-noir-shopify-theme-2cxtip`
**Half-done:** nothing. Working tree clean.

---

## Fixed

Two settings had existed in the theme editor since the card was written, and **nothing read them** — switching them on did nothing at all. Same class of defect as Phase A.

| Setting | Was | Now |
|---|---|---|
| *Show sizes on hover* | dead | Size strip over the image on hover; each size links to that variant; out-of-stock sizes struck through rather than hidden |
| *Show material/subtitle* | dead | Renders from the `custom.material` metafield |

## Added

| Feature | Where it comes from | Behaviour when absent |
|---|---|---|
| **Colour swatches** | the product's Color / Colour option | no option, no swatches |
| **Star rating** | standard `reviews.rating` metafields | no metafield, nothing rendered — an empty grey row looks worse than none |
| **"Only N left" badge** | real inventory, only where Shopify is tracking it | untracked variants report null, so they never claim low stock |
| **Plaque card style** | a fifth style — info on a raised panel that lifts over the image edge | — |
| **Low stock threshold** | new setting, default 5 | — |

## Files changed

`snippets/product-card.liquid` · `assets/theme.css` · `assets/theme.js` · `config/settings_schema.json` · `docs/STATUS.md` · `docs/ROADMAP.md` · `docs/HANDOVER.md`

---

## What to check, and where

Everything below is in **Theme settings → Product Cards**, and shows on any collection or homepage product grid.

| Priority | Check | Where |
|---|---|---|
| **High** | Hover a card — sizes appear over the image | any product grid |
| **High** | Colour swatches under the price; hover one to preview that colour's image | a product with a Color option |
| **High** | Try the new **Plaque** card style | Theme settings → Product Cards → Default Card Style |
| Med | Sizes sit *above* the Add to Bag button, not behind it | with Add to Cart Display = "slide up" |
| Med | Out-of-stock sizes appear struck through | a product with a sold-out size |
| Med | "Only N left" badge | a product with tracked inventory under 5 |
| Low | Star rating | needs a reviews app writing the metafield |
| Low | Material subtitle | needs a `custom.material` metafield |

**Needs real products with variants.** Swatches, sizes and low stock all read variant data, so the demo fallback cards on an empty store show none of them — that is correct, not a bug.

---

## Not verified

Static analysis only. **Nothing here has been opened in a browser.** Specifically: the size strip's position against the slide-up button, swatch hover image swapping, the plaque style at narrow widths, and all of it across the five colour schemes.

---

## Next

**Phase C — product detail layouts and thumbnails.**

Remaining after that: **D** product features and boost-sale · **E** blog · **F** pages, navbar styles, mega-menu rebuild · **H** demo package.
