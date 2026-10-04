#!/usr/bin/env python3
"""Render the real header + cart drawer (design build) for several cart
states, into pages that load the real theme CSS/JS, plus cart_mock.json: the
Section Rendering HTML and line items of every state, which
scripts/cart-test.js serves as the /cart/add.js, /cart/change.js and
?sections= responses.

    python3 scripts/cart-check.py OUTDIR && node scripts/cart-test.js OUTDIR
"""
import json, os, re, shutil, sys, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
spec = importlib.util.spec_from_file_location('rc', 'scripts/render-check.py')
rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)

def src(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)
    s = re.sub(r"\{%-?\s*form\s+'(\w+)',\s*id:\s*'(\w+)',\s*class:\s*'([\w-]+)'\s*-?%\}", r'<form id="\2" class="\3" data-form="\1">', s)
    return re.sub(r'\{%-?\s*endform\s*-?%\}', '</form>', s)

snips = {n: src(f'snippets/{n}.liquid') for n in ('mn-mega', 'mn-social', 'mn-localization', 'mn-icons', 'mn-payments', 'product-card', 'swatch-style')}
env = Environment(loader=DictLoader(snips))
TONES = {'scarf': '%23E9E2D3', 'hoops': '%23B48A3C', 'dress': '%23151515', 'coat': '%238A6A4A'}
def svg(c): return f'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect width=%223%22 height=%224%22 fill=%22{c}%22/%3E%3C/svg%3E'
env.filters['image_url'] = lambda v, *a, **k: svg(TONES.get(str(v), '%23B9A88E'))
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "")}" class="{k.get("class", "")}">'
env.filters['money'] = lambda v, *a, **k: '$' + format(int(v) / 100, ',.2f').replace('.00', '')
env.filters['t'] = rc._translate

def item(k, title, options, qty, unit, was=None, mx=None, props=(), disc=()):
    return {'key': k, 'url': '/products/' + k, 'image': k, 'quantity': qty, 'vendor': 'Maison Noir', 'product_id': abs(hash(k)) % 1000, 'unit_price_measurement': None,
            'product': {'title': title, 'has_only_default_variant': not options},
            'variant': {'options': list(options), 'inventory_management': 'shopify' if mx else None, 'inventory_policy': 'deny' if mx else 'continue', 'inventory_quantity': mx or 0},
            'final_price': unit, 'final_line_price': unit * qty, 'original_line_price': (was or unit) * qty,
            'selling_plan_allocation': None, 'properties': [list(p) for p in props],
            'line_level_discount_allocations': [{'discount_application': {'title': d}} for d in disc]}

SCARF = lambda q=1: item('scarf', 'Silk Twill Scarf', ('Ivory', 'One size'), q, 24000, mx=2)
HOOPS = lambda q=1: item('hoops', 'Gold Vermeil Hoops', ('Gold', 'One size'), q, 29000)
DRESS = lambda q=1: item('dress', 'Washed Silk Slip Dress', ('Black', 'S'), q, 89000)
STATES = {
    'two': [SCARF(), HOOPS()],
    'scarf2': [SCARF(2), HOOPS()],
    'hoops': [HOOPS()],
    'dress': [DRESS(), SCARF(), HOOPS()],
    'empty': [],
    'disc': [item('coat', 'Cashmere Wrap Coat', ('Camel', 'M'), 1, 189000, was=236000, props=(('Monogram', 'A.G.'), ('_hidden', 'x')), disc=('WINTER20',)), HOOPS()],
}

def cart(items, extra=None):
    c = {'item_count': sum(i['quantity'] for i in items), 'total_price': sum(i['final_line_price'] for i in items), 'items_subtotal_price': sum(i['final_line_price'] for i in items), 'items': items, 'note': '',
         'cart_level_discount_applications': [], 'taxes_included': True}
    c.update(extra or {})
    return c
CART_EXTRA = {'disc': {'cart_level_discount_applications': [{'title': 'First order', 'total_allocated_amount': 5000}], 'total_price': 189000 + 29000 - 5000}}

SETTINGS = {'header_style': 'v1', 'mega_menu_style': 'v1', 'mega_menu_images': True, 'header_transparent_home': False, 'header_sticky': True,
            'header_hide_on_scroll': False, 'menu': 'main-menu', 'logo': '', 'logo_width': 140, 'logo_text': 'Maison Noir', 'wishlist_enabled': True,
            'cart_type': 'drawer', 'cart_free_shipping_bar': True, 'cart_free_shipping_threshold': '500',
            'social_instagram': '', 'social_tiktok': '', 'social_pinterest': '', 'social_youtube': '', 'social_facebook': '', 'social_twitter': ''}
ROUTES = {'root_url': '/', 'account_url': '/account', 'account_login_url': '/account/login', 'cart_url': '/cart', 'search_url': '/search',
          'predictive_search_url': '/search/suggest', 'all_products_collection_url': '/collections/all'}
DRAWER = src('sections/cart-drawer.liquid')
HEADER = src('sections/header.liquid')
CARTPAGE = src('sections/main-cart.liquid').replace('recommendations.performed?', 'recommendations.performed')
CP_DEF = {'show_note': True, 'show_shipping_bar': True, 'show_express': True, 'show_payments': True, 'show_recommendations': True, 'recs_heading': 'You may <em>also like</em>', 'recs_count': 4}
def cartpage(state, **s):
    c = ctx(state, **s); c['section'] = {'id': 'main', 'settings': CP_DEF}
    c['shop'] = dict(c['shop'], enabled_payment_types=['visa', 'master', 'paypal', 'shopify_pay'])
    c['settings'] = dict(c['settings'], cart_show_recommendations=True)
    c['recommendations'] = {'performed': False, 'products_count': 0, 'products': []}
    return env.from_string(CARTPAGE).render(**c)

def ctx(state, **s):
    st = dict(SETTINGS, **s)
    return dict(settings=st, section={'settings': {'search_field_text': 'Search', 'search_chips': '', 'search_trending': None, 'search_collections_menu': 'qc', 'search_pages_menu': 'qp'}, 'blocks': []},
                request={'page_type': 'product'}, template={'name': 'product'}, linklists={'main-menu': {'links': []}, 'qc': {'links': []}, 'qp': {'links': []}}, routes=ROUTES,
                shop={'name': 'Maison Noir', 'customer_accounts_enabled': True, 'taxes_included': True},
                cart=cart(STATES[state], CART_EXTRA.get(state)), customer=None, collections={},
                localization={'available_countries': [], 'available_languages': [], 'country': {'iso_code': 'US'}, 'language': {'iso_code': 'en'}})

def drawer(state, **s):
    return env.from_string(DRAWER).render(**ctx(state, **s))

ICONS = env.from_string(snips['mn-icons']).render()
def page(state, cart_type='drawer', scheme='light', cartpage_body=False, **s):
    c = ctx(state, cart_type=cart_type, **s)
    if cartpage_body: c['template'] = {'name': 'cart'}
    hd = env.from_string(HEADER).render(**c)
    dr = '' if cart_type == 'page' else f'<div id="shopify-section-cart-drawer" class="shopify-section cart-drawer-section">{drawer(state, cart_type=cart_type, **s)}</div>'
    attrs = f'data-scheme="{scheme}" data-corners="soft" data-buttons="default" data-motion="full" data-header="classic" data-announce="static" data-mega="columns" data-mega-images="on" data-footer="columns"'
    fonts = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
    css = ''.join(f'<link rel="stylesheet" href="{c}">' for c in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css'))
    content = ''.join(f'<section style="height:420px;margin:0 48px;border-bottom:1px solid #ddd;display:grid;place-items:center;color:#999;font:28px serif">Content {i}</section>' for i in range(3))
    if cartpage_body: content = f'<div id="shopify-section-main" class="shopify-section">{cartpage(state, cart_type=cart_type, **s)}</div>'
    return (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{fonts}{css}'
            f'<style>:root{{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}}</style></head>'
            f'<body class="template-product" data-scroll-reveal="false">{ICONS}{hd}<main id="MainContent" class="content-for-layout">{content}</main>{dr}'
            '<script>window.MN_STRINGS={cart_only_left:"Only __N__ available",cart_error:"Something went wrong. Please try again.",cart_demo:"Demo product"};'
            f'window.routes={{cart_url:"/cart",cart_add_url:"/cart/add",cart_change_url:"/cart/change",search_url:"/search"}};window.theme_settings={{cart_type:"{cart_type}",money_format:"${{{{amount}}}}"}}</script>'
            '<script src="theme.js"></script><script src="mn.js"></script></body></html>')

pages = {'ct_drawer': page('two'), 'ct_notify': page('two', 'notification'), 'ct_page': page('two', 'page'),
         'ct_empty': page('empty'), 'ct_disc': page('disc'), 'ct_dark': page('two', scheme='dark'), 'ct_hoops': page('hoops'),
         'cp_two': page('two', cartpage_body=True), 'cp_disc': page('disc', cartpage_body=True), 'cp_empty': page('empty', cartpage_body=True),
         'cp_pagemode': page('two', 'page', cartpage_body=True), 'cp_dark': page('two', scheme='dark', cartpage_body=True)}
for n, h in pages.items():
    open(os.path.join(OUT, n + '.html'), 'w').write(h)
mock = {k: {'html': f'<div id="shopify-section-cart-drawer" class="shopify-section">{drawer(k)}</div>',
            'page': f'<div id="shopify-section-main" class="shopify-section">{cartpage(k)}</div>',
            'items': [{'key': i['key'], 'quantity': i['quantity'], 'product_title': i['product']['title'], 'variant_title': ' / '.join(i['variant']['options'])} for i in v],
            'item_count': sum(i['quantity'] for i in v)} for k, v in STATES.items()}
json.dump(mock, open(os.path.join(OUT, 'cart_mock.json'), 'w'))
for f in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css', 'theme.js', 'mn.js'):
    shutil.copy(os.path.join('assets', f), OUT)
print(f'{len(pages)} pages and {len(mock)} cart states written to {OUT}')
