# Fashion Theme Shopify Modern Dark

A Shopify theme with **five interchangeable homepage designs** and one global colour system that drives the entire storefront.

---

## First, the thing you need to know

This repository is connected to Shopify through the **GitHub integration**, on the `main` branch.

- **Shopify reads your theme from `main`.** Whatever is on `main` is what your store shows.
- **Changes only reach the store when you push.** Saving a file locally does nothing on its own.
- **Shopify pushes back to `main` too.** When you change something in the admin theme editor, Shopify commits it here by itself — those are the commits authored by `shopify[bot]`.

So: *yes, you have to push.* Unless you use the local preview (Method B below), which needs no push at all.

---

## Where do I type these commands?

Open a terminal **inside the project folder**:

- **Windows** — open the `shopify_theme_modern_dark` folder in File Explorer, right-click empty space, choose **Git Bash Here**
- **macOS** — open Terminal, type `cd ` (with a space), drag the folder onto the window, press Enter
- **VS Code, any OS** — open the folder, then menu **Terminal → New Terminal**

Check you're in the right place:

```sh
ls
```

You should see `sections`, `templates`, `assets`, `snippets`, `README.md`. If you don't, you're in the wrong folder.

---

## Switching the homepage

One command:

```sh
./scripts/use-home.sh noir
```

Run it with no name to see the list:

```sh
./scripts/use-home.sh
```

All it does is copy `templates/index.<name>.json` over `templates/index.json` — the file Shopify renders at `/`. Every design stays in its own file, so switching never destroys another one. It refuses to install a template that isn't valid JSON or that references a section which doesn't exist, so a typo can't leave you with a blank homepage.

> **Windows:** run it from Git Bash. If you see "permission denied", run `chmod +x scripts/use-home.sh` once.
>
> **Prefer doing it by hand?** `cp templates/index.noir.json templates/index.json` is the whole operation.

### The five homepages

| # | Name | Command | Sections | Character |
|---|------|---------|----------|-----------|
| 1 | **Classic** | `./scripts/use-home.sh classic` | 10 | Dark + gold, stacked editorial, stats, blog, testimonials |
| 2 | **Blanc** | `./scripts/use-home.sh blanc` | 7 | Light ivory, overlay hero, editorial rows, lookbook gallery |
| 3 | **Atelier** | `./scripts/use-home.sh atelier` | 10 | Warm sand, arch category cards, duo spotlight, runway strip |
| 4 | **Noir** | `./scripts/use-home.sh noir` | 8 | High-contrast architectural, split-slab hero, expanding panels |
| 5 | **Lumière** | `./scripts/use-home.sh lumiere` | 10 | Magazine issue, masthead hero + triptych, sticky vitrine |

---

## Method A — test on your real store

Use this to see a design on the actual storefront.

```sh
git pull origin main
./scripts/use-home.sh noir
git add templates/index.json
git commit -m "switch homepage to noir"
git push origin main
```

Wait about a minute, then reload your store — Shopify syncs from `main` on its own.

To try the next one, repeat with a different name at step 2.

## Method B — preview locally (faster, no push)

Use this while comparing designs. Nothing touches your live store.

```sh
git pull origin main
shopify theme dev
```

That prints a preview URL. **Leave it running.** Open a *second* terminal in the same folder and switch freely:

```sh
./scripts/use-home.sh lumiere
./scripts/use-home.sh atelier
```

The preview refreshes in a few seconds each time. When you've decided, push that one with Method A.

---

## If `git pull` reports a conflict

Only `templates/index.json` can realistically conflict, because it's the one file we both change. Nothing is broken. That file is **generated**, so never merge it by hand — take the incoming version and re-run the script:

```sh
git checkout --theirs templates/index.json
git add templates/index.json
git commit --no-edit
./scripts/use-home.sh noir
```

If a pull ever leaves you stuck and you have no local work worth keeping, this puts you back to exactly what's on GitHub:

```sh
git fetch origin main
git reset --hard origin/main
```

### Who owns which file

| File | Owner | If it conflicts |
|---|---|---|
| `templates/index.json` | you, when switching | `git checkout --theirs`, then re-run the script |
| `templates/index.*.json` | Claude | `git checkout --theirs` |
| `sections/`, `snippets/`, `assets/` | Claude | `git checkout --theirs` |
| `config/settings_data.json` | you, via the Shopify admin | keep whichever version has the settings you want |

Two habits avoid nearly all of this: **pull before you start**, **push when you're done**.

---

## Adding a sixth homepage

1. Build any new sections you need in `sections/`, or reuse existing ones.
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

- Keys inside `sections` are yours to name freely.
- `type` **must** match a filename in `sections/` without the `.liquid`.
- `order` sets the top-to-bottom sequence and may only list keys that exist in `sections`.

3. `./scripts/use-home.sh <yourname>` — it shows up in the list automatically.

---

## Colour schemes

Set globally in **Theme settings → Colors → Color scheme**: `Dark Luxury`, `Light / Ivory`, `Warm Taupe`, or `Custom`.

Every section, plus the header, cart, quick view and product cards, derives from that one setting. Each section's **Surface tone** dropdown picks a *step* on the active scheme's ladder (Primary / Alternate / Deep) rather than a fixed colour — so a section can't fight the scheme, and text always ships paired with the background it sits on.

See `docs/COLOR-SYSTEM.md` for the token contract and the reasoning behind it.

---

## Notes

- Demo products with images appear in every product section until you connect a real collection, so the homepages look complete on a store with no products yet.
- `sections/hero-modern.liquid` and `sections/featured-collection-slider.liquid` aren't used by any of the five designs, but they work and can be added from the theme editor.
