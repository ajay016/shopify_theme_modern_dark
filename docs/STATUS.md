# Where the work is right now

**This file is the recovery point.** It is rewritten as work proceeds, not at phase boundaries. If a session is lost, compacted, or restarted, this is the first file to read — it says what was being done, how far it got, and what the next concrete step is.

`ROADMAP.md` says what the phases *are*. This file says where inside them the work actually stands.

---

## Current position

**Phase:** none in progress
**Last completed:** Phase G — Homepage #6 (Aureline) and the Ivory / Wine colour scheme
**Next up:** Phase A0 — Layout Explorer, then Phase A — collection layouts
**Blocked on:** nothing

**Working state:** clean. Everything committed and pushed to `main` and `claude/maison-noir-shopify-theme-2cxtip`. The published homepage is Aureline.

---

## In-flight detail

*Filled in while a phase is running. Empty between phases.*

| Field | Value |
|---|---|
| Files touched so far | — |
| Done within the phase | — |
| Next concrete step | Start Phase A0: `snippets/demo-explorer.liquid` + theme setting |
| Known-incomplete | — |
| Not yet verified | — |

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
