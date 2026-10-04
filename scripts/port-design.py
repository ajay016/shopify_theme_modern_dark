#!/usr/bin/env python3
"""Port the Claude Design reference CSS into theme assets.

    python3 scripts/port-design.py

Reads docs/claude_design_ref/mn/*.css and writes assets/mn-*.css. The design's
rules are kept as they are; only these changes are made, each for a Shopify
reason (see docs/DESIGN-BUILD.md):

  1. Class names that the existing theme already uses get an `mn-` prefix, so
     the new components never restyle older pages by accident (`.btn` ->
     `.mn-btn`, `.container` -> `.mn-container`, ...).
  2. `html[data-…]` selectors for *section* settings become `[data-…]`, so the
     product section carries its own layout / gallery / media-size settings
     on its root element and survives a theme-editor re-render.
  3. The design's row-height tokens `--header-h(-compact)` become
     `--hdr-row-h(-compact)`; the theme measures `--header-h` in JS for
     sticky offsets and the two would fight.
  4. Scroll reveal uses the theme's mechanism (`.reveal-armed` → `.is-visible`)
     so older sections that already use `.reveal` keep working.
  5. Overlay z-indexes are lifted above the theme's other layers.
  6. Editor-only chrome (the settings panel and spec sheet) and the demo hero
     preview are dropped.
"""
import re, pathlib

SRC = pathlib.Path('docs/claude_design_ref/mn')
OUT = pathlib.Path('assets')

PREFIX = ['btn', 'container', 'section', 'eyebrow', 'field', 'breadcrumb', 'toast',
          'cart-empty', 'cart-note', 'newsletter']
SECTION_ATTRS = ['layout', 'gallery', 'media-size', 'atc-anim']


def prefix_classes(css):
    for name in PREFIX:
        # `.btn`, `.btn--sm`, `.btn__x` but not `.btn-other` or `.section-title`
        css = re.sub(r'\.' + re.escape(name) + r'(?=--|__|[^\w-]|$)', '.mn-' + name, css)
    return css


def section_attrs(css):
    for a in SECTION_ATTRS:
        css = re.sub(r'html\[data-' + a + r'(?=[\]=^*$~|])', '[data-' + a, css)
    # html:is([data-gallery=…],…) → :is(…)
    css = re.sub(r'html:is\((\[data-(?:' + '|'.join(SECTION_ATTRS) + r')[^)]*)\)', r':is(\1)', css)
    # html[data-media-size=natural]:is([data-gallery=…]) → [data-media-size=natural]:is(…)
    return css


def tokens(css):
    css = css.replace('--header-h-compact', '--hdr-row-h-compact')
    css = re.sub(r'--header-h(?![\w-])', '--hdr-row-h', css)
    return css


def reveal(css):
    css = css.replace('.reveal.is-in', '.reveal.is-visible')
    css = re.sub(r'(?<![\w.-])\.reveal\{', '.reveal.reveal-armed{', css)
    return css


def drop_rules(css, pattern):
    """Remove top-level rules whose selector matches pattern."""
    out, i = [], 0
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        sel = m.group(1)
        if re.search(pattern, sel.split('\n')[-1]):
            out.append(css[i:m.start()] + sel[:len(sel) - len(sel.lstrip())])
        else:
            out.append(css[i:m.end()])
        i = m.end()
    out.append(css[i:])
    return ''.join(out)


HEAD = '/* Ported from docs/claude_design_ref/mn/{src} by scripts/port-design.py.\n   Edit the reference or the script, not this file. */\n'

for src, dst in [('theme.css', 'mn-core.css'), ('header.css', 'mn-header.css'),
                 ('product.css', 'mn-product.css'), ('footer.css', 'mn-footer.css'),
                 ('motion.css', 'mn-motion.css')]:
    css = (SRC / src).read_text(encoding='utf-8')
    if src == 'footer.css':
        css = css.split('/* ==== Spec sheet ==== */')[0]
    if src == 'header.css':
        css = re.sub(r'/\* ==== Homepage hero.*?/\* ==== Search overlay', '/* ==== Search overlay', css, flags=re.S)
    css = prefix_classes(css)
    css = section_attrs(css)
    css = tokens(css)
    css = reveal(css)
    if src == 'theme.css':
        # Fonts follow Theme settings → Typography; Newsreader + Geist is the default pairing.
        css = css.replace('--font-display:"Newsreader",Georgia,serif;--font-sans:"Geist",system-ui,sans-serif;--font-mono:"Geist Mono",ui-monospace,monospace;',
                          '--font-display:var(--ff-display,"Newsreader",Georgia,serif);--font-sans:var(--ff-body,"Geist",system-ui,sans-serif);--font-mono:var(--ff-mono,"Geist Mono",ui-monospace,monospace);')
        css = css.replace('.overlay{position:fixed;inset:0;z-index:100;', '.overlay{position:fixed;inset:0;z-index:420;')
        css = css.replace('.toast{position:fixed;left:50%;bottom:calc(24px + var(--sticky-h,0px));z-index:500;', '.mn-toast{position:fixed;left:50%;bottom:calc(24px + var(--sticky-h,0px));z-index:520;')
    if src == 'product.css':
        css = css.replace('.cart-notify{position:fixed;top:calc(var(--header-offset,76px) + 12px);right:16px;z-index:90;', '.cart-notify{position:fixed;top:calc(var(--header-offset,76px) + 12px);right:16px;z-index:415;')
    (OUT / dst).write_text(HEAD.format(src=src) + css, encoding='utf-8')
    print(f'{src:12s} -> assets/{dst}  {len(css):6d} bytes')
