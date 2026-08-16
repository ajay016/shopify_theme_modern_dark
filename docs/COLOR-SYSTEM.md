# Color System & Theme Settings Overhaul

**Status:** Complete for all five homepages and global components. Inner pages not yet audited — see "What's left".
**Last verified:** after Phase 13 — every count in this document re-checked against the repository.
**Related:** [HOMEPAGES.md](HOMEPAGES.md) records what each homepage is built from · [README.md](../README.md) has the day-to-day commands.
**Goal:** One coherent color scheme controls the entire template. No text ever blends into its background, in any scheme, anywhere.

---

## Root cause

The theme had **two disconnected color systems**:

1. A **global** system (`settings.color_scheme` → dark / light / warm / custom) emitted as CSS variables in `snippets/css-variables.liquid`.
2. A **per-section** system: 27 sections each hardcoded their own `light` / `dark` / `warm` hex palettes inside their own `<style>` block, ignoring the global scheme entirely.

So picking "Light / Ivory" globally repainted the body but left every section, the header, the quick-view modal and the cart at their hardcoded dark values — dark text on dark surfaces, invisible navigation, a black popup on a light page.

Additional confirmed defects, all stemming from scheme-blind hardcoded values or missing implementations:

| # | Defect | Cause |
|---|---|---|
| 1 | Sections ignore global scheme | 27 sections hardcode hex palettes |
| 2 | Base Font Size slider does nothing | `--fs-base` only set `html{font-size}`; every text size in the theme is hardcoded `px`/`clamp()`, so nothing consumes it |
| 3 | Navbar unreadable, gradient background | `.site-header` hardcodes `rgba(10,10,10,…)` (pure black) in transparent + scrolled states regardless of scheme; nav text uses `--cream`, which is *dark* in light scheme → dark-on-black |
| 4 | Cart type "Notification" does nothing | Never implemented. `addToCart()` always opens the drawer, and the drawer section isn't rendered outside drawer mode → silent no-op |
| 5 | Quick-view popup dark on light theme | Modal defaults to a dark palette; only `[data-qv-scheme="light"|"warm"]` overrides exist, and sections pass their own (now meaningless) scheme value |

---

## The fix: one semantic token ladder

`css-variables.liquid` becomes the single source of truth. For **every** global scheme it emits a four-step **tonal ladder**, each step carrying its own guaranteed-contrast foreground:

| Role | Meaning | Token prefix |
|---|---|---|
| `base` | Page background | `--s1-*` |
| `soft` | Subtle raised / alternate band | `--s2-*` |
| `deep` | Richest tone of the scheme | `--s3-*` |
| `contrast` | Deliberate inverted band | `--s4-*` |

Each role exposes `-bg`, `-fg`, `-mut`, `-bdr`.

**Critical property:** within a scheme, *every* rung stays on the same side of the light/dark divide. In Light/Ivory all four rungs are light with dark text; in Dark Luxury all four are dark with cream text. A section can never produce an unreadable pairing, because the background and its foreground always ship as a matched pair.

### Section scheme values become tonal roles

Stored template values are preserved (no template rewrites needed), but their *meaning* changes from a fixed color to a step on the active scheme's ladder:

| Stored value | New meaning |
|---|---|
| `theme` | `base` |
| `light` | `soft` |
| `warm` | `deep` |
| `dark` | `base` (richest tone — **not** forced dark) |

Schema labels are relabelled to match ("Primary surface", "Alternate", "Deep", "Follow theme").

---

## Phases

- [x] **Phase 1 — Token foundation.** Rewrite `css-variables.liquid`: full tonal ladder for all four schemes, plus header, overlay, modal, card and state tokens. Custom scheme derives its ladder from the pickers.
- [x] **Phase 2 — Header & navigation.** Scheme-aware, flat (non-gradient) backgrounds; correct contrast in transparent-over-hero, scrolled and solid states; nav links, icons, badges, mega menu, mobile drawer.
- [x] **Phase 3 — Sections.** Convert all 27 scheme-aware sections to reference global tokens; relabel schema options.
- [x] **Phase 4 — Components.** Quick-view modal, cart drawer, product cards, footer, toasts, buttons, forms — all token-driven.
- [x] **Phase 5 — Typography.** Make Base Font Size actually scale body copy.
- [x] **Phase 6 — Cart.** Implement Notification and Page cart types.
- [x] **Phase 7 — Audit.** Sweep for surviving hardcoded colors; contrast-check every scheme; validate; push.
- [x] **Phase 8 — Homepages #1–#4.** Convert the 12 sections that have no scheme select and were missed by Phase 3.
- [x] **Phase 9 — Re-audit.** Verify every section on all five homepages; record what is left.
- [x] **Phase 10 — On-photo controls.** Stop UI drawn over photography from following the page surface.
- [x] **Phase 11 — Filter-free tokens.** Remove every Liquid colour filter from the `:root` block.
- [x] **Phase 12 — Component polish.** Cart drawer, quick view and count badge, each contrast-measured.
- [x] **Phase 13 — Verification pass.** Re-check every claim against the code; fix a mangled selector the tokeniser left behind.

---

## Progress log

**Phase 1 — done.** `css-variables.liquid` rewritten. Emits `--s1..s4` (bg/fg/mut/bdr) per scheme plus header, modal, drawer, card, field, button, image-scrim and `--on-gold` tokens, and `--fs-scale`. Legacy `--black`/`--charcoal`/`--cream` aliases were re-pointed at the ladder, so several hundred existing rules became scheme-correct with no edit.

> **Superseded by Phase 11.** This version derived its alphas and its on-gold colour at render time with `color_modify` / `color_brightness` / `color_lighten`. That turned out to be the single point of failure described in Phase 11 and has been replaced with literal values. The token *contract* above is unchanged — only how the values are produced.

**Phase 2 — done.** Header no longer hardcodes `rgba(10,10,10,…)`. Transparent state is a flat translucent wash of the header surface (gradient removed, as requested) with blur; scrolled state uses the same hue, so scrolling can no longer flip the bar to a color its text cannot sit on. Logo, nav links, icons and count badges follow header tokens.

**Phase 3 — done.** 27 sections, 108 scheme selectors (106 rule blocks — `campaign-noir` groups three selectors into one), 542 declarations converted to ladder tokens. Stored template values still work but now mean tonal roles. Schema label renamed "Surface tone" with role-based options. Also tokenised on-gold text, on-image text and glass pills inside section bodies (29 declarations).

**Phase 4 — done.** Quick-view modal shell/gallery were fixed dark (`#111`, `#0d0d0d`) — now `--modal-bg`/`--modal-surface`. **Deleted 89 lines** of `[data-qv-scheme="light"|"warm"]` overrides, which only existed to patch the modal per-section and could never cover every case. Product-card palettes (`.pcard--light/dark/warm/theme`) were hardcoded too and now follow the ladder.

**Phase 5 — done.** `--fs-base` previously only set `html{font-size}` while every size in the theme was literal `px`/`clamp()`, so the slider did nothing. `html` is left at the browser default (respecting user accessibility settings); `body` takes the setting directly, and **460 font-size declarations** (95 in `theme.css`, 365 in sections) are wrapped in `calc(… * var(--fs-scale))`. Heading declarations already governed by `--heading-scale` were deliberately skipped to avoid double-scaling.

**Phase 6 — done.** Notification mode was never implemented — `addToCart()` always opened the drawer, and the drawer isn't rendered outside drawer mode, so it was a silent no-op. `addToCart()` now branches on `cart_type`: drawer (unchanged), **notification** (new token-driven popover under the cart icon showing the added item, running total, View bag / Continue shopping), and **page** (adds, then redirects to `/cart`). `cart_type` is exposed via `window.theme_settings`. Quick view auto-closes in notification mode so the popover isn't hidden behind it.

**Phase 7 — done.** Contrast audited programmatically across all four schemes (body, muted and accent text on every rung). The audit **caught two real failures**: muted text on Light `s2`/`s3` measured 4.44:1 and 4.29:1 — below AA — because the light muted alpha was 0.60. Solved for the minimum passing value and set it to **0.66** (worst case now 5.14:1). All four schemes now pass WCAG AA. Remaining literal colors in `theme.css` are only photographic scrims, shadows and the error red, all intentional.

### Verification
- 64 section schemas, 33 templates, both configs parse.
- 498 `calc()` expressions balanced after Liquid rendering.
- Range settings valid; `theme.js` passes `node --check`.
- Live homepage: 10 sections, all types resolve.

---

**Phase 8 — done. Homepages #1–#4.**

Phases 1–7 were verified against Home #5 and the global components only. Auditing the other four homepages exposed a real gap: Phase 3 converted the 27 sections that *have* a "Surface tone" select, but **12 sections have no such select and were never touched** — and Home #1 Classic is built entirely from those 12:

`blog-posts, brand-logos, campaign-banner, collection-list, featured-products, hero-banner, image-with-text, marquee, newsletter, newsletter-split, stats-row, testimonials`

Findings and fixes:

- **`newsletter-split` (Homes #2/#3/#4) — the significant one.** Its panel set its background with an inline `style="background:var(--ivory)"` and then re-coloured text with `[style*="var(--ivory)"]` attribute selectors — background and foreground chosen in two unrelated places, which is exactly how they drift apart. Replaced with role classes (`--black/--charcoal/--ivory/--gold`) that set the background *and* the paired `--nls-fg/--nls-mut/--nls-bdr` together. **All 14 `[style*=…]` selectors removed.**
- **Image placeholders** (`#cbbfa9`, `#2a221a`, `#2a2a2a`, `#1a1612`, `#15110d`, `#e7e0d4` across 9 sections) now use a new `--img-placeholder` token. These deliberately stay dark: they stand in for photographs and always carry `--on-image` (white) captions, so making them follow the scheme would make that text vanish on a light scheme. The token records that intent.
- **Text on the gold accent** (`campaign-noir`, `campaign-banner`) → `--on-gold`.
- **White-on-photo text** across `hero-lookbook`, `lookbook-gallery`, `runway-strip`, `lookbook-scroll`, `campaign-noir`, `editorial-rows` → `--on-image` / `--on-image-mut`.

**Phase 9 — done.** Re-audited every section used by all five homepages, excluding legitimately fixed values (photographic scrims, shadows, `var(--x, #fallback)` fallbacks, the error red). Result: **all five homepages clean.**

---

**Phase 10 — done. On-photo controls.**

Phase 4 pointed controls that sit *on top of product photography* at the page-surface tokens. On the light scheme `--s1-bg` is `#FFFFFF`, so the card's add-to-bag bar, wishlist and quick-view icon buttons and badges rendered white on white and disappeared over pale garment shots. The quick-view popup lost its edge entirely for the same reason, because `--modal-scrim` was also derived from the surface — a white scrim behind a white modal on a white page has no boundary at all.

**The rule this established:** UI drawn over photography must never follow the page surface, because the image behind it is photographic, not themed.

- Added `--onphoto-light` / `--onphoto-light-fg` and `--onphoto-dark` / `--onphoto-dark-fg` — opaque, mutually high-contrast pairs that are deliberately scheme-independent. Card icons and badges use the light pair; the add-to-bag bar uses the dark pair, restoring the original design. Same fix applied to the overlay pills in `hero-lumiere`, `product-vitrine` and `shop-the-look`.
- `--modal-scrim` is hardcoded dark again. A scrim's job is to dim the page behind a modal, so deriving it from the surface was wrong in principle, not only in the light scheme.
- The quick-view panel gained a token border plus elevation so it reads against the scrim in every scheme.

**Phase 11 — done. The token block is now filter-free.**

Symptom: the colour scheme setting stopped having any effect, everything rendered dark and text was unreadable.

Cause: the `:root` block built every colour by *deriving* it at render time with `color_modify` / `color_brightness` / `color_lighten`. When that derivation failed the entire block was lost, so no token resolved. Compounding it, the literal fallbacks added defensively in Phase 10 are **dark-scheme values**, so with the tokens gone they repainted the whole site dark regardless of the setting — which is exactly why changing the scheme appeared to do nothing. Those fallbacks turned a visible failure into a silent one and made the cause harder to find.

Fix: `css-variables.liquid` was rebuilt with **no colour filters at all**. Each scheme emits one `:root` block of literal values, followed by a shared `:root` for aliases, scrims, on-photo colours, type and layout. Only the custom scheme interpolates settings, and it derives its tints with CSS `color-mix()` in the browser rather than Liquid filters at render time — so nothing colour-related can fail while the page is being built.

Verified by simulating the Liquid render for all four schemes: each produces balanced braces, two `:root` blocks and zero empty declarations, and every core token is present in every branch, so the dark fallbacks cannot fire.

**Phase 12 — done. Component polish, all contrast-measured.**

| Fix | Measurement |
|---|---|
| Light-scheme `--on-gold` / `--btn-primary-fg` | black on `#9B7B3F` is 5.00:1 vs white's 3.96:1 — switched to black |
| Cart drawer "Continue Shopping" | was `--cream` at `opacity .6` = **4.44:1**, under AA. Now full drawer foreground with an underline: 15.85 / 16.38 / 13.09 across light / dark / warm |
| Cart/wishlist count badge | badge used `--gold`; on light that is a deep bronze giving **5.00:1** for 8.5px type in a 15px circle. Added a dedicated `--badge-bg` / `--badge-fg` pair; light now uses the lighter gold at **8.82:1**, matching dark |

Also non-colour but recorded here for completeness: the cart drawer's type scale was pulled back from editorial to UI sizes (item titles 17px serif → 13px body; drawer title 22 → 16; empty state 28 → 19; subtotal 22 → 18; item price left at 14px), and the quick-view modal's empty band above the image was removed — its grid reserved an `auto` row holding only the close button, so both columns started ~52px down. The close button is now absolutely positioned and the grid is a single row.

---

**Phase 13 — done. Verification pass against the code.**

Re-checked every factual claim in this document against the repository rather than trusting it. Three counts had drifted and one real defect surfaced:

| Claim | Was | Verified |
|---|---|---|
| Scheme variant blocks | 107 | **108 selectors / 106 blocks.** "Blocks" was ambiguous: `campaign-noir` groups three selectors into one rule, so the two counts legitimately differ. The doc now states both |
| `--fs-scale` font-sizes in `theme.css` | 92 | **95** — three more were added later with the cart-notification styles |
| Total `--fs-scale` font-sizes | 457 | **460** |

**Defect found and fixed.** The Phase 3 tokeniser had mangled one selector in `sections/campaign-noir.liquid`: `#section-{{ section.id }}.cno--dark` became `#section-{  }}.cno--dark`. This matters more than it looks — in CSS a single invalid selector invalidates the **entire rule**, so `.cno--light`, `.cno--dark` and `.cno--warm` were all silently losing their `--acc` declaration. Repaired, then swept the whole theme for the same signature: **831 `#section-` selectors checked, zero malformed**.

This is the second time a scripted bulk edit introduced damage that every schema/JSON/JS check passed over — the first being the white-on-white regression in Phase 10. Bulk edits need a targeted scan afterwards for the specific shape of damage the script could produce, not just a validity check.

---

## What's left

Nothing outstanding for the color system on the homepages. Known scope boundaries, stated plainly:

| Item | Status |
|---|---|
| Homepages #1–#5, header, footer, cart drawer, cart notification, quick view, product cards | Audited clean across all four schemes |
| Inner pages (product, collection, blog, cart, …) | **Not yet designed, now scheduled.** The templates are scaffold — 1–3 `main-*` sections each — and the alternate templates (`collection.list.json`, `product.wide.json`, …) are identical stubs. They inherit the tokens and `theme.css`, so they follow the scheme, but there is no bespoke design to audit yet. Scope and build order are in **[ROADMAP.md](ROADMAP.md)**; every new section must follow the conventions in [HOMEPAGES.md](HOMEPAGES.md), and each phase needs a colour audit of its own |
| Contrast | Verified numerically for body/muted/accent on every rung of all four schemes (WCAG AA). Not verified for text over photographs, which depends on the merchant's images |
| Custom scheme | Ladder derives from the pickers; a merchant choosing two similar colors can still produce low contrast. Consider a warning in the editor |
| Visual/browser check | All verification here is static analysis. Phases 10–12 exist because static analysis **passed** on defects the browser then exposed — a white button on a white photo and a white modal on a white scrim are both valid CSS. Treat a real browser pass as required, not optional |
| Regression risk from fallbacks | `theme.css` and the sections carry literal `var(--token, fallback)` values, and those fallbacks are **dark-scheme** colours. They are inert while the token block renders, but if it ever fails again the site goes dark rather than obviously broken. Phase 11 removed the failure mode; keep the block filter-free |
