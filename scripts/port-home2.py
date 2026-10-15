"""
Port Claude Design's homepage 2 stylesheet (docs/claude_design_ref_home2/styles.css)
to assets/mn-home2.css, unchanged in values, so the Shopify sections match it.

What changes, and why:
  - every class gets the `mh-` prefix: several design names (.btn, .eyebrow, .h2,
    .wrap, .lb__*, .pr__*) already exist in the theme;
  - the reveal class `.rv` becomes `.mh-reveal`, so the theme's motion checks see it;
  - design-only variables get the `--mh-` prefix; the colour tokens keep their
    names (--c-base, --c-text, ...), which are the theme's own token names, so
    the store's product cards and quick view inside these sections take the
    palette while staying the store's components;
  - fonts come from the store's font variables (--ff-display / --ff-body / --ff-mono);
  - the header, footer, skip link and product-card (.pc) blocks are dropped: the
    store's own header, footer and product card are used;
  - element resets are scoped to the sections with zero specificity (:where),
    so they never override the theme's components inside them;
  - Motion Off and Strict follow the theme's motion settings.
    python3 scripts/port-home2.py
"""
import re, os

SRC = 'docs/claude_design_ref_home2/styles.css'
OUT = 'assets/mn-home2.css'
css = open(SRC, encoding='utf-8').read()

KEEP = {'is-in', 'is-active', 'is-paused', 'is-swap', 'is-out', 'is-dragging', 'is-added', 'is-live', 'is-bump', 'is-error', 'visually-hidden'}
RENAME = {'rv': 'reveal'}
VARS = ['--f-display', '--f-sans', '--f-mono', '--wrap', '--gut', '--hd', '--sec', '--rail-pad', '--ease-out', '--ease', '--focus',
        '--line-strong', '--line-inv', '--line', '--muted-inv', '--t1', '--t2', '--t3', '--t4', '--t5', '--t6', '--ph', '--sw',
        '--x', '--y', '--l', '--w', '--r', '--h', '--d']
DROP_BLOCKS = ('Header (placeholder', 'Footer (placeholder', 'Product card (shared')


def split_rules(s):
    """Top-level rules: (prelude, body) pairs; nested blocks keep their raw body."""
    out, i, n = [], 0, len(s)
    while i < n:
        j = s.find('{', i)
        if j < 0: break
        pre = s[i:j]
        depth, k = 1, j + 1
        while depth:
            if s[k] == '{': depth += 1
            elif s[k] == '}': depth -= 1
            k += 1
        out.append((pre, s[j + 1:k - 1]))
        i = k
    return out


def cls(m):
    name = m.group(1)
    if name in KEEP: return '.' + name
    return '.mh-' + RENAME.get(name, name)


def selector(sel):
    sel = sel.strip()
    sel = re.sub(r'\.(-?[a-zA-Z_][\w-]*)', cls, sel)
    return sel


def vars_(body):
    for v in VARS:  # longest first where they share a prefix (listed that way)
        body = re.sub(re.escape(v) + r'(?![\w-])', '--mh-' + v[2:], body)
    body = re.sub(r'\b(tk-scroll|hd-bump|sl-ring|sp-in)\b', r'mh-\1', body)
    return body


BASE = {  # element resets: zero specificity, inside the sections only
    'h1,h2,h3,p,ul,ol,dl,dd,figure,blockquote': ':where(.mh) :where(h1,h2,h3,p,ul,ol,dl,dd,figure,blockquote)',
    'ul,ol': ':where(.mh) :where(ul,ol)',
    'a': ':where(.mh) :where(a)',
    'a:hover': ':where(.mh) :where(a:not(.card *)):hover',
    'button,input': ':where(.mh) :where(button,input)',
    'button': ':where(.mh) :where(button)',
    ':focus-visible': ':where(.mh) :focus-visible',
}
SKIP_SEL = {'*,*::before,*::after', 'html', 'body', '[hidden]', '.visually-hidden', '.skip', '.skip:focus'}


def port_rules(text, depth=0):
    out = []
    for pre, body in split_rules(text):
        p = pre.strip()
        comment = ''
        mcom = re.match(r'(?s)(\s*/\*.*?\*/\s*)+', pre)
        if mcom:
            comment = mcom.group(0).strip()
            p = pre[mcom.end():].strip()
        if comment and depth == 0:
            out.append('\n' + comment)
        if p.startswith('@keyframes'):
            out.append(vars_(p) + '{' + body + '}')
            continue
        if p.startswith('@media'):
            inner = port_rules(body, depth + 1)
            if inner.strip(): out.append(p + '{' + inner + '}')
            continue
        if p == ':root':
            continue  # tokens are written by hand below
        if p in SKIP_SEL: continue
        if p in BASE:
            out.append(BASE[p] + '{' + vars_(body) + '}')
            continue
        sels = [s for s in p.split(',')]
        # selectors that address the design's own product card, header or footer
        sels = [s for s in sels if not re.search(r'\.(pc|hd|ft)(__|--|\b)', s) or re.search(r'\.(na__grid|bs__|sl__item)', s)]
        if not sels: continue
        sels = [selector(s).replace('.mh-pc', '.mh-na__item') for s in sels]
        out.append(','.join(sels) + '{' + vars_(body) + '}')
    return ''.join(out)


# drop whole blocks the store replaces (header, footer, product card)
blocks = re.split(r'(?=/\* -{10} )', css)
kept = [b for b in blocks if not any(t in b[:80] for t in DROP_BLOCKS)]
body = port_rules(''.join(kept))

tokens = open(SRC, encoding='utf-8').read()
root = re.search(r':root\{(.*?)\n\}', tokens, re.S).group(1)
palette = ';'.join(x.strip() for x in re.findall(r'(--c-[\w-]+:#[0-9A-Fa-f]{6})', root))

HEAD = f'''/* =====================================================================
   Maison homepage: ported from docs/claude_design_ref_home2/styles.css by
   scripts/port-home2.py. Do not edit by hand; change the port script.
   Sections: sections/mh-*.liquid. Behaviour: assets/mn-home2.js.
   ===================================================================== */

/* ---------- Tokens ----------
   .mh--own carries the design's palette (section setting "Colours: Maison
   palette"); without it a section uses the store's colour scheme. Both cases
   define the three extra tokens the design needs. */
.mh{{--c-muted:color-mix(in oklab,var(--c-text) 62%,var(--c-base));--c-on-contrast:var(--c-base);--c-accent-ink:var(--c-accent)}}
.mh.mh--own{{{palette}}}
/* the store-wide Maison scheme carries the same three tokens exactly */
[data-scheme=maison] .mh{{--c-muted:#5D5850;--c-on-contrast:#EEE9DE;--c-accent-ink:#8A3A1C}}
.mh{{
--mh-line:color-mix(in oklab,var(--c-text) 14%,transparent);--mh-line-strong:color-mix(in oklab,var(--c-text) 34%,transparent);
--mh-muted-inv:color-mix(in oklab,var(--c-on-contrast) 72%,var(--c-contrast));--mh-line-inv:color-mix(in oklab,var(--c-on-contrast) 20%,transparent);
--mh-t1:color-mix(in oklab,var(--c-deep),var(--c-text) 10%);--mh-t2:color-mix(in oklab,var(--c-deep),var(--c-accent) 38%);--mh-t3:color-mix(in oklab,var(--c-contrast),var(--c-deep) 22%);
--mh-t4:color-mix(in oklab,var(--c-soft),var(--c-accent) 14%);--mh-t5:color-mix(in oklab,var(--c-deep),var(--c-contrast) 45%);--mh-t6:color-mix(in oklab,var(--c-accent-ink),var(--c-contrast) 35%);
--mh-f-display:var(--ff-display,"Newsreader",Georgia,serif);--mh-f-sans:var(--ff-body,"Geist",system-ui,sans-serif);--mh-f-mono:var(--ff-mono,"Geist Mono",ui-monospace,monospace);
--mh-wrap:1360px;--mh-gut:clamp(20px,4vw,56px);--mh-hd:var(--header-h,68px);--mh-sec:clamp(88px,10vw,168px);--mh-rail-pad:max(var(--mh-gut),(100% - var(--mh-wrap))/2);
--mh-ease:cubic-bezier(.2,.7,.2,1);--mh-ease-out:cubic-bezier(.16,1,.3,1);--mh-focus:var(--c-accent-ink);
background:var(--c-base);color:var(--c-text);font:400 15px/1.6 var(--mh-f-sans);letter-spacing:normal;-webkit-font-smoothing:antialiased;text-wrap:pretty;overflow-x:clip}}
.mh *,.mh *::before,.mh *::after{{box-sizing:border-box}}
.mh :where(button){{background:none;border:0;padding:0;cursor:pointer;color:inherit;font:inherit;letter-spacing:inherit}}
.mh :where(input){{font:inherit;color:inherit;letter-spacing:inherit}}
/* the theme's global h1–h6 type (display face, -0.01em, 1.05) stays out of
   these sections: same weight as that rule, so this later one wins, while
   the design's classes and the store's product cards keep theirs */
:where(.mh) :is(h1,h2,h3,h4,h5,h6):where(:not(.card *)){{font-family:inherit;font-weight:inherit;line-height:inherit;letter-spacing:normal}}

/* photo slots: the image fills its frame; the design's toned placeholder
   shows only when a slot has no image */
.mh-ph>img,.mh-ph>picture>img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.mh-ph>img{{display:block}}
'''

TAIL = '''

/* ---------- Store product cards inside the design's layouts ---------- */
.mh-na__item,.mh-bs__card{min-width:0}
/* Shop the look: the card as a row, as in the design (image 104px, text beside) */
.mh-sl__item .card{display:grid;grid-template-columns:104px minmax(0,1fr);gap:20px;align-items:center}
.mh-sl__item .card__media{aspect-ratio:3/4}
.mh-sl__item .card__badges,.mh-sl__item .card__actions,.mh-sl__item .card__swatches,.mh-sl__item .card__sizes,.mh-sl__item .card__add{display:none}
.mh-sl__item .card__title{font-size:21px}

/* ---------- Theme motion settings ----------
   Motion Off: everything visible and still (the theme stops transitions).
   Strict + the device's reduce-motion switch: the same. */
[data-motion=reduced] .mh-reveal{opacity:1!important;transform:none!important}
[data-motion=reduced] .mh-tk__track{animation:none!important}
@media (prefers-reduced-motion:reduce){html.motion-strict .mh-reveal{opacity:1!important;transform:none!important;transition:none!important}}
/* theme editor: sections re-render often; never leave them hidden */
.shopify-design-mode .mh-reveal{opacity:1;transform:none}
'''

open(OUT, 'w', encoding='utf-8').write(HEAD + body.strip() + TAIL)
print(f'{OUT}: {len(HEAD + body + TAIL)} bytes')
