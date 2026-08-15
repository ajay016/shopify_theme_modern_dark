# Color System & Theme Settings Overhaul

**Status:** In progress
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
| `dark` | `deep` (richest tone — **not** forced dark) |

Schema labels are relabelled to match ("Primary surface", "Alternate", "Deep", "Follow theme").

---

## Phases

- [ ] **Phase 1 — Token foundation.** Rewrite `css-variables.liquid`: full tonal ladder for all four schemes, plus header, overlay, modal, card and state tokens. Custom scheme derives its ladder from the pickers.
- [ ] **Phase 2 — Header & navigation.** Scheme-aware, flat (non-gradient) backgrounds; correct contrast in transparent-over-hero, scrolled and solid states; nav links, icons, badges, mega menu, mobile drawer.
- [ ] **Phase 3 — Sections.** Convert all 27 scheme-aware sections to reference global tokens; relabel schema options.
- [ ] **Phase 4 — Components.** Quick-view modal, cart drawer, product cards, footer, toasts, buttons, forms — all token-driven.
- [ ] **Phase 5 — Typography.** Make Base Font Size actually scale body copy.
- [ ] **Phase 6 — Cart.** Implement Notification and Page cart types.
- [ ] **Phase 7 — Audit.** Sweep for surviving hardcoded colors; contrast-check every scheme; validate; push.

---

## Progress log

_Updated as each phase completes._
