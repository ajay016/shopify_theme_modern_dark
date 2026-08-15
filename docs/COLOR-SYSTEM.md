# Color System & Theme Settings Overhaul

**Status:** Complete for all five homepages and global components. Inner pages not yet audited — see "What's left".
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

---

## Progress log

**Phase 1 — done.** `css-variables.liquid` rewritten. Emits `--s1..s4` (bg/fg/mut/bdr) per scheme plus header, modal, drawer, card, field, button, image-scrim and `--on-gold` tokens, and `--fs-scale`. Muted alphas and on-gold text are *derived from measured brightness*, not assumed. Legacy `--black`/`--charcoal`/`--cream` aliases were re-pointed at the ladder, so several hundred existing rules became scheme-correct with no edit.

**Phase 2 — done.** Header no longer hardcodes `rgba(10,10,10,…)`. Transparent state is a flat translucent wash of the header surface (gradient removed, as requested) with blur; scrolled state uses the same hue, so scrolling can no longer flip the bar to a color its text cannot sit on. Logo, nav links, icons and count badges follow header tokens.

**Phase 3 — done.** 27 sections × 107 variant blocks × 542 declarations converted to ladder tokens. Stored template values still work but now mean tonal roles. Schema label renamed "Surface tone" with role-based options. Also tokenised on-gold text, on-image text and glass pills inside section bodies (29 declarations).

**Phase 4 — done.** Quick-view modal shell/gallery were fixed dark (`#111`, `#0d0d0d`) — now `--modal-bg`/`--modal-surface`. **Deleted 89 lines** of `[data-qv-scheme="light"|"warm"]` overrides, which only existed to patch the modal per-section and could never cover every case. Product-card palettes (`.pcard--light/dark/warm/theme`) were hardcoded too and now follow the ladder.

**Phase 5 — done.** `--fs-base` previously only set `html{font-size}` while every size in the theme was literal `px`/`clamp()`, so the slider did nothing. `html` is left at the browser default (respecting user accessibility settings); `body` takes the setting directly, and **457 font-size declarations** (92 in `theme.css`, 365 in sections) are wrapped in `calc(… * var(--fs-scale))`. Heading declarations already governed by `--heading-scale` were deliberately skipped to avoid double-scaling.

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

## What's left

Nothing outstanding for the color system on the homepages. Known scope boundaries, stated plainly:

| Item | Status |
|---|---|
| Homepages #1–#5, header, footer, cart drawer, cart notification, quick view, product cards | Audited clean across all four schemes |
| **Inner pages** (product, collection, blog, cart, search, account, 404) | **Not yet audited.** They share the same tokens and `theme.css`, so they inherit the fixes, but their section-specific styles have not been inspected the way the homepages were |
| Contrast | Verified numerically for body/muted/accent on every rung of all four schemes (WCAG AA). Not verified for text over photographs, which depends on the merchant's images |
| Custom scheme | Ladder derives from the pickers; a merchant choosing two similar colors can still produce low contrast. Consider a warning in the editor |
| Visual/browser check | All verification here is static analysis. Nothing has been rendered in a browser |
