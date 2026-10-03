#!/usr/bin/env python3
"""Corners & Shape: render the real css-variables snippet at every setting
value and build a page of the shared components for scripts/radius-test.js.

    python3 scripts/radius-check.py OUTDIR
"""
import os, re, sys
from liquid import Environment

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
SRC = open('snippets/css-variables.liquid', encoding='utf-8').read()
env = Environment()
for f in ('color_modify', 'color_brightness', 'font_face', 'font_modify', 'font_url'):
    env.filters[f] = lambda v, *a, **k: str(v) if v is not None else ''

def tokens(**s):
    base = {'color_scheme': 'light', 'font_pairing': 'dm_serif_dm_sans', 'type_body_size': 14}
    base.update(s)
    css = env.from_string(SRC).render(settings=base)
    return dict(re.findall(r'(--r-[a-z-]+):\s*([^;]+);', css)), css

CASES = {
    'sharp':   dict(corner_radius='sharp'),
    'subtle':  dict(corner_radius='subtle'),
    'soft':    dict(),                                  # the default
    'rounded': dict(corner_radius='rounded'),
    'pill':    dict(button_shape='pill'),
    'circle':  dict(pagination_shape='circle'),
}
EXPECT = {
    'sharp':   {'--r-sm': '0px', '--r-lg': '0px', '--r-btn': '0px', '--r-pill': '0px', '--r-page': '0px'},
    'subtle':  {'--r-sm': '4px', '--r-lg': '8px', '--r-btn': '4px', '--r-pill': '999px'},
    'soft':    {'--r-xs': '4px', '--r-sm': '8px', '--r-md': '12px', '--r-lg': '16px', '--r-btn': '8px', '--r-page': '8px'},
    'rounded': {'--r-sm': '12px', '--r-lg': '24px', '--r-btn': '12px'},
    'pill':    {'--r-btn': '999px', '--r-sm': '8px'},
    'circle':  {'--r-page': '50%', '--r-page-wide': '999px'},
}

COMPONENTS = '''
<div style="padding:40px;display:grid;gap:22px;max-width:900px">
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <a class="btn-primary" href="#">Add to cart</a><a class="btn-ghost" href="#">View</a>
    <a class="btn-dark" href="#">Dark</a><button class="toolbar-btn">Filters</button>
  </div>
  <div style="display:flex;gap:12px"><input placeholder="Email address" style="max-width:280px">
    <div class="input-group" style="max-width:380px"><input placeholder="Subscribe"><button class="btn-primary">Join</button></div></div>
  <div style="display:flex;gap:8px"><span class="cfilter-pill">S</span><span class="cfilter-pill">M</span>
    <span class="filter-chip">Black ×</span><span class="pcard__badge" style="position:static">Sale</span></div>
  <nav class="pagination"><a class="pagination__item pagination__item--prev">Prev</a><a class="pagination__item">1</a>
    <span class="pagination__item pagination__item--current">2</span><a class="pagination__item">3</a>
    <a class="pagination__item pagination__item--next">Next</a></nav>
  <div class="toast is-visible" style="position:static;opacity:1;transform:none">Added to cart</div>
  <div class="quick-view-modal" style="position:static;transform:none;height:160px;max-width:520px"><div></div><div></div></div>
</div>'''

fail = 0
for name, s in CASES.items():
    got, css = tokens(**s)
    bad = {k: (got.get(k), v) for k, v in EXPECT[name].items() if got.get(k) != v}
    print(f'{name:8s} ' + ('ok  ' if not bad else f'FAIL {bad}  ') + ' '.join(f'{k}={v}' for k, v in sorted(got.items())))
    fail += bool(bad)
    root = re.search(r'<style>(.*)</style>', css, re.S).group(1)
    page = ('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="theme.css">'
            f'<style>{root}</style><style>body{{margin:0;background:var(--s1-bg);color:var(--s1-fg)}}'
            '.pagination{--cp-acc:var(--gold);--cp-fg:var(--s1-fg);--cp-mut:var(--s1-mut);--cp-bdr:var(--s1-bdr)}'
            '.filter-chip,.cfilter-pill{--f-bdr:var(--s1-bdr);--f-acc:var(--gold);border:1px solid var(--s1-bdr)}</style>'
            f'</head><body>{COMPONENTS}</body></html>')
    open(os.path.join(OUT, f'radius_{name}.html'), 'w').write(page)
sys.exit(1 if fail else 0)
