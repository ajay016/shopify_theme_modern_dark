# Where the work is right now

**This file is the recovery point.** It is rewritten as work proceeds, not at phase boundaries. If a session is lost, compacted, or restarted, this is the first file to read — it says what was being done, how far it got, and what the next concrete step is.

`ROADMAP.md` says what the phases *are*. This file says where inside them the work actually stands.

---

## Current position

**Phase:** A — collection layouts and filters · **complete**
**Last completed:** Phase A (before it, A0 — Layout Explorer; G — homepage #6 and Ivory / Wine)
**Next up:** Phase B — product card styles
**Blocked on:** nothing

**Working state:** clean. Nothing half-finished. Everything committed and pushed to `main` and `claude/maison-noir-shopify-theme-2cxtip`. Published homepage is Aureline.

---

## In-flight detail

*Filled in while a phase is running. Empty between phases.*

| Field | Value |
|---|---|
| Files touched so far | — |
| Done within the phase | — |
| Next concrete step | Begin Phase B: product card styles (4–5 variants) driven by a global setting with a per-section override |
| Known-incomplete | — |
| Not yet verified | Phases A0 and A have not been opened in a browser — see "Not verified" |

---

## What is done

| Phase | Scope | State |
|---|---|---|
| 1–14 | Colour system, tokens, header, cart modes, font scaling, on-photo controls, component polish | done |
| G | Homepage #6 (Aureline) + Ivory / Wine scheme | done, out of order |
| A0 | Layout Explorer panel + Demo theme setting | done |
| **A** | **Collection layouts, filters, list view, pagination** | **done** |

## What is left

| Phase | Scope |
|---|---|
| **B** | Product card styles + card features — **next** |
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
| ~~A~~ | ~~Shop entries~~ — **done**, and five Shop groups added |
| C | Product → Wide, Gradient, Digital |
| E | Blog → Sidebar left, Sidebar right |

---

## Phase A — what was built

**The headline finding: most of the collection page was wired to markup that did not exist.** Four separate controls rendered correctly and did nothing when clicked. This was not visible in any schema or JSON check — only in comparing selectors against markup.

| Broken | Why | Fixed |
|---|---|---|
| Grid/list view toggle | JS targeted `.view-btn[data-grid]`, swapping `grid-cols-*` classes. The snippet renders `.view-toggle__btn[data-view]` and the grid reads a `data-view` attribute | `initViewToggle` rewritten to the real markup; honours the section default, then a stored preference |
| List view itself | CSS existed but was keyed to `.grid-list`, which the section never emits | Re-keyed to `[data-view="list"]`, both selectors kept |
| Filter group accordion | JS targeted `.filter-group__title[data-toggle-filter]`; the section renders `.filter-group__toggle` | Rewritten, and now drives `aria-expanded` as well as the collapsed class |
| Sidebar position | CSS defined `.collection-layout--right-sidebar`; the section emits `--sidebar-right` | Added the matching rules, plus a mobile collapse |
| Load more | Button rendered; no JS at all | Implemented — fetches, appends, re-reads the next URL, removes itself at the end |
| Infinite scroll | Sentinel rendered; no JS at all | Implemented with `IntersectionObserver`, 400px rootMargin, stops on error rather than hammering |
| `container_style` | Set by every collection template, read by nothing — so "wide" and "boxed" were identical | Added as a real setting with boxed / wide / full CSS |

**New in the section:** 6-column option, working `toggle` filter style (groups collapsed unless they hold an active value), and demo products on an empty collection so the layouts can be reviewed on a store with no catalogue.

**23 collection templates**, every setting validated against the schema. Previously four templates carried values the section could not honour — `grid_columns: "list"`, `pagination_style: "paginate"`, and `container_style` on all four.

### Correction to an earlier claim

I previously recorded the collection templates as "identical stubs". That was wrong — they carried different settings. The check behind it grouped templates by section *type* only. What was true is that the differences largely did not work, for the reasons above.

---

## Not verified

Everything below is static analysis. **Nothing in Phase A0 or Phase A has been opened in a browser.** Specifically unverified:

**A0** — the edge tab's position and vertical text; the slide transition; whether `blogs` is iterable on this store (there is a `blogs.news` fallback); the panel alongside the cart drawer and quick view; appearance in all five schemes.

**A** — list view row proportions; load-more and infinite scroll against a real paginated collection (both need more products than one page); the filter panel, which needs Shopify's Search & Discovery app installed before `collection.filters` is populated at all; sidebar-right ordering; the 6-column grid on a narrow screen.

---

## Interrupt log

Homepage bugs reported mid-phase, so a fix never gets lost and the phase can be resumed exactly.

| # | Reported | What | Where it belongs | Status |
|---|---|---|---|---|
| 1 | after #6 shipped | Category cards go square on wide monitors — fixed `min-height` with a full-bleed container, so shape drifts with screen width. Not a bug, a shape choice; fix is `aspect-ratio` or a width cap | `sections/category-showcase.liquid` | **Deferred by you** — revisit after homepage testing |

---

## The working agreement

Set deliberately, and it holds until changed:

1. **Work continues phase by phase without waiting.** Implementation does not pause for review — testing happens alongside it, whenever there is time.
2. **Every phase ends with a handover**, written in chat and mirrored here: what was built, which files changed, **what to look at and where**, what was fixed, and what is still outstanding. The handover is the thing that makes reviewing possible in spare moments.
3. **Reports arrive whenever they arrive.** A bug or a suggestion — about the phase just delivered or about any homepage — is fixed next, ahead of new work, then the phases resume from the recorded point.
4. **Every report is written down** in the interrupt log below at the time it arrives, whether fixed immediately or deferred. Nothing lives only in the conversation.
5. **Docs and plan are updated after every piece of work**, not at the end of a phase — this file, plus `ROADMAP.md`, `HOMEPAGES.md` and `COLOR-SYSTEM.md` when what they describe changes.
6. **A report only needs the page and the section** — "Lumière, sticky vitrine, cards overlap on tablet" is enough to act on.

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
