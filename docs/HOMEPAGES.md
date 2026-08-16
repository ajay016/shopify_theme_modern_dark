# Homepage System

Five interchangeable homepage designs. Shopify renders `templates/index.json` at `/`; each design is kept in its own `templates/index.<name>.json`, so switching is a copy and nothing is ever lost.

For the day-to-day commands (switching, previewing, publishing) see **[README.md](../README.md)**. This file records *what the designs are made of*.

---

## The five designs

### #1 — Classic  ·  `templates/index.classic.json`  ·  10 sections

| # | Section | Shared? |
|---|---------|---------|
| 1 | `hero-banner` | **exclusive** |
| 2 | `collection-list` | **exclusive** |
| 3 | `featured-products` | **exclusive** |
| 4 | `image-with-text` | **exclusive** |
| 5 | `stats-row` | **exclusive** |
| 6 | `image-with-text` | **exclusive** |
| 7 | `brand-logos` | **exclusive** |
| 8 | `blog-posts` | **exclusive** |
| 9 | `testimonials` | **exclusive** |
| 10 | `newsletter` | **exclusive** |

### #2 — Blanc  ·  `templates/index.blanc.json`  ·  7 sections

| # | Section | Shared? |
|---|---------|---------|
| 1 | `hero-lookbook` | **exclusive** |
| 2 | `marquee` | shared |
| 3 | `editorial-rows` | **exclusive** |
| 4 | `lookbook-gallery` | **exclusive** |
| 5 | `product-showcase` | **exclusive** |
| 6 | `campaign-banner` | **exclusive** |
| 7 | `newsletter-split` | shared |

### #3 — Atelier  ·  `templates/index.atelier.json`  ·  10 sections

| # | Section | Shared? |
|---|---------|---------|
| 1 | `hero-editorial` | **exclusive** |
| 2 | `collection-arches` | **exclusive** |
| 3 | `statement-inline` | **exclusive** |
| 4 | `duo-spotlight` | **exclusive** |
| 5 | `marquee` | shared |
| 6 | `runway-strip` | **exclusive** |
| 7 | `product-rail` | **exclusive** |
| 8 | `quote-editorial` | **exclusive** |
| 9 | `social-gallery` | **exclusive** |
| 10 | `newsletter-split` | shared |

### #4 — Noir  ·  `templates/index.noir.json`  ·  8 sections

| # | Section | Shared? |
|---|---------|---------|
| 1 | `hero-noir` | **exclusive** |
| 2 | `marquee` | shared |
| 3 | `category-index` | **exclusive** |
| 4 | `product-noir` | **exclusive** |
| 5 | `campaign-noir` | **exclusive** |
| 6 | `lookbook-scroll` | **exclusive** |
| 7 | `manifesto` | **exclusive** |
| 8 | `newsletter-split` | shared |

### #5 — Lumière  ·  `templates/index.lumiere.json`  ·  10 sections

| # | Section | Shared? |
|---|---------|---------|
| 1 | `hero-lumiere` | **exclusive** |
| 2 | `marquee` | shared |
| 3 | `story-covers` | **exclusive** |
| 4 | `arrivals-lumiere` | **exclusive** |
| 5 | `product-vitrine` | **exclusive** |
| 6 | `campaign-lumiere` | **exclusive** |
| 7 | `collection-reveal` | **exclusive** |
| 8 | `shop-the-look` | **exclusive** |
| 9 | `reviews-ticker` | **exclusive** |
| 10 | `newsletter-invitation` | **exclusive** |

---

## Section reuse

Which sections appear on more than one design:

| Section | Used by |
|---------|---------|
| `marquee` | Blanc, Atelier, Noir, Lumière |
| `newsletter-split` | Blanc, Atelier, Noir |
| `arrivals-lumiere` | Lumière |
| `blog-posts` | Classic |
| `brand-logos` | Classic |
| `campaign-banner` | Blanc |
| `campaign-lumiere` | Lumière |
| `campaign-noir` | Noir |
| `category-index` | Noir |
| `collection-arches` | Atelier |
| `collection-list` | Classic |
| `collection-reveal` | Lumière |
| `duo-spotlight` | Atelier |
| `editorial-rows` | Blanc |
| `featured-products` | Classic |
| `hero-banner` | Classic |
| `hero-editorial` | Atelier |
| `hero-lookbook` | Blanc |
| `hero-lumiere` | Lumière |
| `hero-noir` | Noir |
| `image-with-text` | Classic |
| `lookbook-gallery` | Blanc |
| `lookbook-scroll` | Noir |
| `manifesto` | Noir |
| `newsletter` | Classic |
| `newsletter-invitation` | Lumière |
| `product-noir` | Noir |
| `product-rail` | Atelier |
| `product-showcase` | Blanc |
| `product-vitrine` | Lumière |
| `quote-editorial` | Atelier |
| `reviews-ticker` | Lumière |
| `runway-strip` | Atelier |
| `shop-the-look` | Lumière |
| `social-gallery` | Atelier |
| `statement-inline` | Atelier |
| `stats-row` | Classic |
| `story-covers` | Lumière |
| `testimonials` | Classic |
---

## Switching designs

`scripts/use-home.sh <name>` copies `templates/index.<name>.json` over `templates/index.json`.

It does three things beyond a plain `cp`:

1. **Normalises the banner.** Shopify writes an auto-generated comment at the top of `index.json`. The script strips whatever banner the source carries and writes a fresh one, so the result is identical regardless of which variant it came from.
2. **Validates before installing.** It parses the JSON and checks that every id in `order` resolves to a real file in `sections/`. A typo cannot leave a blank homepage — it aborts and leaves the current homepage untouched.
3. **`--push` (optional).** Commits the switch, pulls with `--rebase` so the push cannot be rejected, then pushes to `main`. Only needed to change the *published* store; `shopify theme dev` needs no push at all.

New variant files are picked up automatically — the script lists whatever matches `templates/index.*.json`.

---

## Adding a sixth design

1. Build any new sections in `sections/`, or reuse the ones above.
2. Create `templates/index.<yourname>.json`:

```json
{
  "sections": {
    "hero":       { "type": "hero-noir",        "settings": { "scheme": "theme" } },
    "products":   { "type": "product-noir",     "settings": { "scheme": "light" } },
    "newsletter": { "type": "newsletter-split", "settings": {} }
  },
  "order": ["hero", "products", "newsletter"]
}
```

- Keys in `sections` are arbitrary; `type` must match a filename in `sections/` without `.liquid`.
- `order` sets the sequence and may only reference keys present in `sections`.
3. `./scripts/use-home.sh <yourname>`.

### Conventions any new section should follow

These are what make a section behave correctly across the whole theme — see **[COLOR-SYSTEM.md](COLOR-SYSTEM.md)** for the reasoning:

- **Surface tone select.** Expose `scheme` with values `theme` / `light` / `warm` / `dark`, and map them to the tonal ladder (`--s1-*` … `--s3-*`) rather than to fixed colours.
- **Never hardcode a colour that sits on a themed surface.** Use the ladder tokens so the section follows the global scheme.
- **Do the opposite over photography.** Anything drawn on top of an image uses `--onphoto-*` or `--on-image*`, which are deliberately scheme-independent — a token that follows the page surface will vanish on a pale photo.
- **Scale body copy** with `calc(<size> * var(--fs-scale, 1))`; leave headings on `--heading-scale`.
- **Ship a fallback image** so the section looks complete before the merchant adds content.
- **Render `product-card`** for anything product-shaped, so it inherits quick view, wishlist, add-to-bag and the demo-product fallbacks.

---

## Sections not used by any design

`sections/hero-modern.liquid` and `sections/featured-collection-slider.liquid` are working sections left over from an earlier homepage that was removed. They are still addable from the theme editor and may be useful for a future design.
