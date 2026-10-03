#!/usr/bin/env python3
"""Render the real header section (every style x mega layout x images) with a
three-level menu, wrapped in a page with the real theme.css and theme.js, for
scripts/header-test.js.

    python3 scripts/header-check.py OUTDIR
"""
import os, re, sys, json, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
spec = importlib.util.spec_from_file_location('rc', 'scripts/render-check.py')
rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)

snips = {}
for name in ('header-logo', 'header-nav', 'mega-menu', 'header-actions'):
    snips[name] = open(f'snippets/{name}.liquid', encoding='utf-8').read()
for f in os.listdir('snippets'):
    if f.startswith('icon-'):
        snips[f[:-7]] = open('snippets/' + f, encoding='utf-8').read()
env = Environment(loader=DictLoader(snips))
SVG = 'data:image/svg+xml,' + '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect width=%223%22 height=%224%22 fill=%22%23B9A88E%22/%3E%3C/svg%3E'
env.filters['image_url'] = lambda v, *a, **k: SVG
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "")}">'
env.filters['t'] = rc._translate
for f in ('json', 'handleize'):
    env.filters[f] = lambda v, *a, **k: str(v)

def link(title, children=(), img=False):
    h = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    d = {'title': title, 'url': '/collections/' + h, 'handle': h, 'active': False, 'child_active': False,
         'links': list(children), 'type': 'collection_link' if img else 'http_link',
         'object': {'image': 'img.jpg', 'featured_image': 'img.jpg'} if img else None}
    return d

MENU = {'links': [
    link('New In'),
    link('Women', [
        link('Clothing', [link(x) for x in ('Dresses', 'Knitwear', 'Coats & Jackets', 'Trousers', 'Shirts')], img=True),
        link('Shoes', [link(x) for x in ('Boots', 'Loafers', 'Sandals')], img=True),
        link('Bags', [link(x) for x in ('Totes', 'Shoulder bags', 'Mini bags')], img=True),
        link('Accessories', [link(x) for x in ('Scarves', 'Belts', 'Jewellery')], img=True),
        link('Gift cards'),
    ], img=True),
    link('Men', [
        link('Clothing', [link(x) for x in ('Suits', 'Shirts', 'Outerwear')], img=True),
        link('Shoes', [link(x) for x in ('Derbies', 'Sneakers')], img=True),
    ], img=True),
    link('Collections', [link(x, img=True) for x in ('Autumn / Winter', 'Resort', 'Essentials')]),
    link('Journal'),
    link('Sale'),
]}

HEADER = open('sections/header.liquid', encoding='utf-8').read()
HEADER = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', HEADER, flags=re.S)
VARS = env.from_string(open('snippets/css-variables.liquid', encoding='utf-8').read()).render(
    settings={'color_scheme': 'light', 'font_pairing': 'dm_serif_dm_sans', 'type_body_size': 14})

def page(style, mega, images, hide=False, transparent=False):
    settings = {'header_style': style, 'mega_menu_style': mega, 'mega_menu_images': images,
                'header_transparent_home': transparent, 'header_sticky': True, 'header_hide_on_scroll': hide,
                'menu': 'main-menu', 'logo': '', 'logo_width': 140, 'logo_text': 'MAISON·NOIR',
                'wishlist_enabled': True, 'cart_type': 'drawer'}
    html = env.from_string(HEADER).render(
        settings=settings, linklists={'main-menu': MENU}, section={'blocks': []},
        request={'page_type': 'index' if transparent else 'collection'}, routes={'root_url': '/', 'account_url': '/account',
        'account_login_url': '/account/login', 'cart_url': '/cart', 'search_url': '/search'},
        shop={'name': 'Maison Noir', 'customer_accounts_enabled': True}, cart={'item_count': 2}, customer=None)
    body_cls = 'template-index' if transparent else 'template-collection'
    content = ''.join(f'<section style="height:520px;margin:0 var(--side-padding);border-bottom:1px solid #ddd;display:grid;place-items:center;font:28px serif;color:#999">Content {i}</section>' for i in range(6))
    return (f'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<link rel="stylesheet" href="theme.css">{VARS}</head>'
            f'<body class="{body_cls}" data-scroll-reveal="false">{html}<main class="content-for-layout">'
            f'<div style="height:{"560px;background:#8a7a66" if transparent else "0"}"></div>{content}</main>'
            f'<script src="theme.js"></script></body></html>')

n = 0
for style in ('v1', 'v2', 'v3', 'v4'):
    for mega in ('v1', 'v2', 'v3'):
        for images in (True, False):
            open(os.path.join(OUT, f'hd_{style}_{mega}_{"img" if images else "txt"}.html'), 'w').write(page(style, mega, images)); n += 1
open(os.path.join(OUT, 'hd_hide.html'), 'w').write(page('v1', 'v1', True, hide=True))
open(os.path.join(OUT, 'hd_transparent.html'), 'w').write(page('v1', 'v1', True, transparent=True))
print(f'{n + 2} pages written to {OUT}')
