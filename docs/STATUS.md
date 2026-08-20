# Where the work is right now

**This file is the recovery point.** It is rewritten as work proceeds, not at phase boundaries. If a session is lost, compacted, or restarted, this is the first file to read — it says what was being done, how far it got, and what the next concrete step is.

`ROADMAP.md` says what the phases *are*. This file says where inside them the work actually stands.

---

## Current position

**Phase:** A0 — Layout Explorer · **complete**
**Last completed:** Phase A0 (before it, Phase G — homepage #6 and the Ivory / Wine scheme)
**Next up:** Phase A — collection layouts and filters
**Blocked on:** nothing

**Working state:** clean. Nothing half-finished. Everything committed and pushed to `main` and `claude/maison-noir-shopify-theme-2cxtip`. Published homepage is Aureline.

---

## In-flight detail

*Filled in while a phase is running. Empty between phases.*

| Field | Value |
|---|---|
| Files touched so far | — |
| Done within the phase | — |
| Next concrete step | Begin Phase A: turn `main-collection` into a settings-driven section, then add the thin `?view=` templates |
| Known-incomplete | — |
| Not yet verified | Phase A0 has not been opened in a browser — see "Not verified" below |

---

## What is done

| Phase | Scope | State |
|---|---|---|
| 1–14 | Colour system, tokens, header, cart modes, font scaling, on-photo controls, component polish | done |
| G | Homepage #6 (Aureline) + Ivory / Wine scheme | done, out of order |
| **A0** | **Layout Explorer panel + Demo theme setting** | **done** |

## What is left

| Phase | Scope |
|---|---|
| **A** | Collection layouts + filters — **next** |
| B | Product card styles + card features |
| C | Product detail layouts + thumbnails |
| D | Product features + boost-sale |
| E | Blog + post layouts |
| F | Pages, navbar styles, mega-menu rebuild (3 layouts × with/without images, 3 levels, per-child images) |
| H | Demo package — menu export, setup guide, ThemeForest checklist |

---

## Phase A0 — what was built

| File | Purpose |
|---|---|
| `snippets/demo-explorer.liquid` | The panel: edge tab, slide-out drawer, grouped layout links, own CSS and JS |
| `snippets/demo-explorer-group.liquid` | Renders one group; parses `Label\|url\|template\|suffix\|state` entries |
| `layout/theme.liquid` | Renders the panel on every page, gated by the setting |
| `config/settings_schema.json` | New **Demo** group → *Show layout explorer*, default on |
| `snippets/css-variables.liquid` | New `--z-explorer: 300` |

Three decisions worth remembering:

- **Stacking.** `--z-explorer: 300` sits above the header (`--z-nav: 100`) and the page overlay (150) but **below** the cart drawer (400) and quick view (500), so the demo panel can never cover a real interaction.
- **"You are here" comes from Shopify's own `template` object,** not from parsing the URL. Liquid cannot read a query string, but when `?view=list` renders `collection.list.json`, `template.suffix` is `list`. So the highlight is exact and needs no JavaScript.
- **Stub entries are listed, not hidden.** Layouts whose template exists but still renders the default carry a *Not yet styled* badge. This keeps the panel complete by construction — each phase flips its entries from `stub` to `ready` rather than someone remembering to add them.

**Groups self-hide when their target does not exist** — no Product group without a product, no Blog group without a blog, no About link without an About page. So no entry in the panel can 404.

### Carried forward into later phases

When a phase makes a layout real, flip its entries in `snippets/demo-explorer.liquid` from `stub` to `ready`:

| Phase | Entries to flip |
|---|---|
| A | Shop → List view, Wide container, No sidebar (+ add the new grid/filter/title entries) |
| C | Product → Wide, Gradient, Digital |
| E | Blog → Sidebar left, Sidebar right |

---

## Not verified

Everything below is static analysis. **Nothing in Phase A0 has been opened in a browser.** Specifically unverified:

- the edge tab's position and vertical text rendering across browsers
- the slide-out transition, and the `hidden` → `requestAnimationFrame` → transform sequence
- whether `blogs` is iterable in this store's Liquid (there is a `blogs.news` fallback if it is not)
- the panel against the cart drawer and quick view at the same time
- appearance in all five colour schemes

---

## Interrupt log

Homepage bugs reported mid-phase, so a fix never gets lost and the phase can be resumed exactly.

| # | Reported | What | Where it belongs | Status |
|---|---|---|---|---|
| 1 | after #6 shipped | Category cards go square on wide monitors — fixed `min-height` with a full-bleed container, so shape drifts with screen width. Not a bug, a shape choice; fix is `aspect-ratio` or a width cap | `sections/category-showcase.liquid` | **Deferred by you** — revisit after homepage testing |

---

## How interruptions are handled

1. **Commit whatever is in flight first**, even if half-done, so the phase work is never mixed into a homepage fix.
2. Log the report in the table above.
3. Fix it, commit it on its own.
4. Update **In-flight detail** and carry on from **Next concrete step**.

Homepage fixes and phase work usually touch different files, so they rarely collide. The exception is **shared** code — `assets/theme.css`, `assets/theme.js`, `snippets/product-card.liquid`, `snippets/css-variables.liquid`. A change there affects every page at once, so those fixes get committed on their own and re-checked against the phase in progress before continuing.

---

## Rules for keeping this honest

- Update it **when work changes state**, not at the end. A file written only at the end is the file that is always stale.
- "Done" means committed and pushed. Anything else is "in progress", however close it looks.
- Record what has **not** been verified. Everything here is static analysis unless it explicitly says a browser was used.
