# Fashion Theme Shopify Modern Dark

A Shopify theme with **five interchangeable homepage designs** and one global colour system that drives the entire storefront.

---

## Switching the homepage

Shopify renders whatever is in `templates/index.json` at `/`. Each design lives in its own file, so switching is a copy — nothing is ever overwritten or lost.

### The easy way

```sh
./scripts/use-home.sh noir
```

Then restart `shopify theme dev` (or just reload — the CLI usually picks it up).

Run it with no arguments to see the list:

```sh
./scripts/use-home.sh
```

The script validates the JSON and checks that every section in `order` actually exists before installing it, so a typo can't leave you with a blank homepage.

**On Windows:** run it from Git Bash. If you get "permission denied", run `chmod +x scripts/use-home.sh` once.

### The manual way

Copy the file you want over `templates/index.json`:

```sh
cp templates/index.noir.json templates/index.json      # macOS / Linux / Git Bash
copy templates\index.noir.json templates\index.json    # Windows CMD
```

That's genuinely all it does. The `/* auto-generated */` banner at the top is only a note from Shopify — it isn't required, and the theme works with or without it.

---

## The five homepages

| # | Name | File | Sections | Character |
|---|------|------|----------|-----------|
| 1 | **Classic** | `templates/index.classic.json` | 10 | The original. Dark + gold, stacked editorial sections, stats, blog, testimonials. |
| 2 | **Blanc** | `templates/index.blanc.json` | 7 | Light ivory. Overlay hero, editorial rows, lookbook gallery, campaign banner. |
| 3 | **Atelier** | `templates/index.atelier.json` | 10 | Warm sand. Arch category cards, duo spotlight, runway strip, social gallery. |
| 4 | **Noir** | `templates/index.noir.json` | 8 | High-contrast architectural. Split-slab hero, expanding category panels, staggered product grid, drag lookbook. |
| 5 | **Lumière** | `templates/index.lumiere.json` | 10 | Magazine issue. Masthead hero + triptych, cover-style categories, sticky product vitrine, cursor-reveal directory, reviews ticker. |

Commands:

```sh
./scripts/use-home.sh classic
./scripts/use-home.sh blanc
./scripts/use-home.sh atelier
./scripts/use-home.sh noir
./scripts/use-home.sh lumiere
```

---

## Adding a sixth homepage

1. Build the sections you need in `sections/` (or reuse existing ones).
2. Create `templates/index.<yourname>.json` following the shape of any existing variant:

```json
{
  "sections": {
    "hero":       { "type": "hero-noir",       "settings": { "scheme": "theme" } },
    "products":   { "type": "product-noir",    "settings": { "scheme": "light" } },
    "newsletter": { "type": "newsletter-split","settings": {} }
  },
  "order": ["hero", "products", "newsletter"]
}
```

- Keys in `sections` are yours to name; `type` **must** match a filename in `sections/` (without `.liquid`).
- `order` controls the top-to-bottom sequence and must only reference keys that exist in `sections`.
3. `./scripts/use-home.sh <yourname>` — it appears in the list automatically.

---

## Colour schemes

Set globally in **Theme settings → Colors → Color scheme**: `Dark Luxury`, `Light / Ivory`, `Warm Taupe`, or `Custom`.

Every section, the header, cart, quick view and product cards derive from that one setting. Each section's **Surface tone** dropdown picks a *step* on the active scheme's ladder (Primary / Alternate / Deep) rather than a fixed colour — so a section can't fight the scheme, and text always ships paired with the background it sits on.

See `docs/COLOR-SYSTEM.md` for the token contract and the reasoning.

---

## Working alongside Claude's commits

You test locally; Claude pushes fixes to the same repo. There is exactly **one file** you both touch: `templates/index.json`. Here is how to keep that painless.

### Recommended: test locally, don't commit the switch

Switching the homepage is a one-command local experiment. You don't need it in git history.

```sh
# before pulling, throw away your local homepage switch
git restore templates/index.json
git pull origin main

# switch again and keep testing
./scripts/use-home.sh lumiere
```

This never conflicts, because you never committed a competing version.

### If you *do* want to commit a switch

Fine — just expect `templates/index.json` to be the one place git may complain. When it does:

```sh
git pull origin main
# CONFLICT (content): Merge conflict in templates/index.json

# Claude's code is authoritative, so take the incoming file, then re-switch:
git checkout --theirs templates/index.json
git add templates/index.json
git commit --no-edit

./scripts/use-home.sh noir     # put your test homepage back
```

You never have to hand-merge it — the file is generated, so **overwrite and re-run the script**.

### Careful with `config/settings_data.json`

This holds your Theme Settings (colour scheme, cart type, fonts, logo, favicon). The **Shopify admin writes to it directly** and pushes its own commits, so it changes from two directions.

- If you change settings in the **admin**, let Shopify commit them — don't also edit the file by hand.
- If you hit a conflict here, keep the version with the settings you actually want; there's no hidden logic in it.

### The short version

| File | Who owns it | On conflict |
|---|---|---|
| `templates/index.json` | you, while testing | take incoming, re-run `use-home.sh` |
| `templates/index.*.json` | Claude | take incoming |
| `sections/`, `snippets/`, `assets/` | Claude | take incoming |
| `config/settings_data.json` | you / Shopify admin | keep the settings you want |

**Always `git pull origin main` before you start testing.** That alone avoids most of it.

---

## Running locally

```sh
git pull origin main
shopify theme dev
```

Demo products with images appear on every product section until you connect a real collection, so the homepages look complete on a store with no products yet.
