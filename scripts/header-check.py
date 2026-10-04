#!/usr/bin/env python3
"""Render the real announcement bar + header (design build) in every style x
mega layout x images, with a three-level menu, into pages that load the real
theme CSS/JS, for scripts/header-test.js.

    python3 scripts/header-check.py OUTDIR      (copy assets/* into OUTDIR too)
"""
import os, re, sys, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
spec = importlib.util.spec_from_file_location('rc', 'scripts/render-check.py')
rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)

def src(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)
    s = re.sub(r"\{%-?\s*form\s+'(\w+)',\s*id:\s*'(\w+)',\s*class:\s*'([\w-]+)'\s*-?%\}", r'<form id="\2" class="\3" data-form="\1">', s)
    return re.sub(r'\{%-?\s*endform\s*-?%\}', '</form>', s)

snips = {n: src(f'snippets/{n}.liquid') for n in ('mn-mega', 'mn-social', 'mn-localization', 'mn-icons')}
env = Environment(loader=DictLoader(snips))
SVG = 'data:image/svg+xml,' + '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect width=%223%22 height=%224%22 fill=%22%23B9A88E%22/%3E%3C/svg%3E'
env.filters['image_url'] = lambda v, *a, **k: SVG
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "")}">'
env.filters['money'] = lambda v, *a, **k: '$' + format(int(v) / 100, ',.0f')
env.filters['t'] = rc._translate

def link(title, children=(), img=False):
    h = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    return {'title': title, 'url': '/collections/' + h, 'handle': h, 'active': False, 'child_active': False,
            'links': list(children), 'type': 'collection_link' if img else 'http_link',
            'object': {'image': 'i.jpg', 'featured_image': 'i.jpg'} if img else None}

MENU = {'links': [
    link('New In'),
    link('Women', [
        link('Ready-to-wear', [link(x) for x in ('Dresses', 'Knitwear', 'Coats & jackets', 'Tailoring', 'Skirts', 'Shirts & tops')], img=True),
        link('Shoes', [link(x) for x in ('Mules', 'Ankle boots', 'Loafers', 'Pumps', 'Sandals')], img=True),
        link('Bags', [link(x) for x in ('Shoulder bags', 'Totes', 'Clutches', 'Small leather goods')], img=True),
        link('Edits', [link(x) for x in ('The Silk Edition', 'Evening', 'The Winter Coat', 'Gifts under $500')], img=True),
    ], img=True),
    link('Men', [link('Ready-to-wear', [link(x) for x in ('Coats', 'Knitwear', 'Shirts')], img=True), link('Shoes', [link(x) for x in ('Loafers', 'Boots')], img=True)], img=True),
    link('Accessories', [link('Jewellery', [link(x) for x in ('Earrings', 'Rings')], img=True), link('Gift cards')], img=True),
    link('Journal'), link('Stores')]}
PRODUCTS = [{'title': t, 'url': '/products/x', 'price': p, 'featured_media': 'm.jpg'} for t, p in
            (('Silk Charmeuse Camisole', 42000), ('Cashmere Wrap Coat', 189000), ('Leather Slingback Mule', 64000), ('Pleated Satin Midi Skirt', 56000))]
ICONS = env.from_string(snips['mn-icons']).render()

def page(style, mega, images, extra='', settings_extra=None, home=False):
    settings = {'header_style': {'classic': 'v1', 'centred': 'v2', 'minimal': 'v3', 'floating': 'v4'}[style],
                'mega_menu_style': {'columns': 'v1', 'visual': 'v2', 'flyout': 'v3'}[mega], 'mega_menu_images': images,
                'header_transparent_home': home, 'header_sticky': True, 'header_hide_on_scroll': False, 'menu': 'main-menu',
                'logo': '', 'logo_width': 140, 'logo_text': 'Maison Noir', 'wishlist_enabled': True, 'cart_type': 'drawer',
                'announcement_enabled': True, 'announcement_style': 'ticker',
                'announcement_text_1': 'Complimentary express shipping on orders over $500 ✦ Free returns within 30 days',
                'announcement_text_2': 'The Silk Edition: washed in Como, cut in Florence', 'announcement_text_3': '', 'announcement_text_4': '',
                'announcement_link': '/collections/silk', 'announcement_link_text': 'Shop the Silk Edition', 'announcement_surface': 'invert',
                'social_instagram': 'https://instagram.com', 'social_tiktok': 'https://tiktok.com', 'social_pinterest': '', 'social_youtube': 'https://youtube.com', 'social_facebook': '', 'social_twitter': ''}
    settings.update(settings_extra or {})
    section = {'settings': {'search_field_text': 'Search silk, cashmere, coats', 'nav_tag_item': 'New In', 'nav_tag_text': 'NEW',
                            'search_chips': 'Silk, Slip dress, Cashmere, Bordeaux, Leather bag', 'search_trending': {'products': PRODUCTS},
                            'search_collections_menu': 'qc', 'search_pages_menu': 'qp'},
               'blocks': [{'type': 'mega_menu_item', 'settings': {'menu_item': 'Women', 'featured_image': 'f.jpg', 'featured_label': 'New season',
                                                                  'featured_title': 'The Silk Edition', 'featured_cta': 'Shop the edit', 'featured_link': '/collections/silk'}}]}
    ctx = dict(settings=settings, section=section, request={'page_type': 'index' if home else 'product'},
               linklists={'main-menu': MENU, 'qc': {'links': [link(x) for x in ('Dresses', 'Knitwear', 'Coats')]}, 'qp': {'links': [link(x) for x in ('Size guide', 'Shipping & returns')]}},
               routes={'root_url': '/', 'account_url': '/account', 'account_login_url': '/account/login', 'cart_url': '/cart', 'search_url': '/search', 'predictive_search_url': '/search/suggest'},
               shop={'name': 'Maison Noir', 'customer_accounts_enabled': True}, cart={'item_count': 2}, customer=None,
               collections={'all': {'products': PRODUCTS}},
               localization={'available_countries': [{'iso_code': 'US', 'name': 'United States', 'currency': {'iso_code': 'USD', 'symbol': '$'}}, {'iso_code': 'GB', 'name': 'United Kingdom', 'currency': {'iso_code': 'GBP', 'symbol': '£'}}],
                             'country': {'iso_code': 'US'}, 'available_languages': [], 'language': {'iso_code': 'en'}})
    ann = env.from_string(src('sections/announcement-bar.liquid')).render(**ctx)
    hd = env.from_string(src('sections/header.liquid')).render(**ctx)
    hero = '<div class="shopify-section"><section style="height:620px;background:linear-gradient(160deg,#8a7a66,#3d342b)"></section></div>' if home else ''
    content = ''.join(f'<div class="shopify-section"><section style="height:480px;margin:0 48px;border-bottom:1px solid #ddd;display:grid;place-items:center;color:#999;font:28px serif">Content {i}</section></div>' for i in range(5))
    attrs = f'data-scheme="light" data-corners="soft" data-buttons="default" data-motion="full" data-header="{style}" data-announce="{settings["announcement_style"] if settings["announcement_style"] != "rotating" else "rotate"}" data-mega="{mega}" data-mega-images="{"on" if images else "off"}" data-footer="columns"'
    fonts = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
    css = ''.join(f'<link rel="stylesheet" href="{c}">' for c in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css'))
    return (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{fonts}{css}'
            f'<style>:root{{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}}</style></head>'
            f'<body class="template-{"index" if home else "product"}" data-scroll-reveal="false">{ICONS}{ann}{hd}<main id="MainContent" class="content-for-layout">{hero}{content}</main>{extra}'
            f'<script>window.MN_STRINGS={{products:"Products",collections:"Collections",pages:"Pages",view_all_results:"View all results for “__TERMS__”",no_results:"No results for “__TERMS__”."}};window.routes={{search_url:"/search"}}</script>'
            f'<script src="theme.js"></script><script src="mn.js"></script></body></html>')

n = 0
for style in ('classic', 'centred', 'minimal', 'floating'):
    for mega in ('columns', 'visual', 'flyout'):
        for images in (True, False):
            open(os.path.join(OUT, f'hd_{style}_{mega}_{"img" if images else "txt"}.html'), 'w').write(page(style, mega, images)); n += 1
for a in ('rotating', 'static'):
    open(os.path.join(OUT, f'hd_announce_{a}.html'), 'w').write(page('classic', 'columns', True, settings_extra={'announcement_style': a})); n += 1
open(os.path.join(OUT, 'hd_transparent.html'), 'w').write(page('floating', 'columns', True, home=True)); n += 1
open(os.path.join(OUT, 'hd_hide.html'), 'w').write(page('classic', 'columns', True, settings_extra={'header_hide_on_scroll': True})); n += 1
print(f'{n} pages written to {OUT}')
