#!/usr/bin/env python3
"""Render the real product section (sections/main-product.liquid and its
snippets) with a fixture product in many setting combinations, plus the
header, cart drawer and quick view template, into pages that load the real
theme CSS/JS. Writes mock responses for scripts/pdp-test.js:
  mock/pickup-<variant>.html   (sections/mn-pickup.liquid)
  mock/quick-<handle>.html     (templates/product.mn-quick.liquid)
  mock/cart.html               (cart drawer after adding)

    python3 scripts/pdp-check.py OUTDIR && node scripts/pdp-test.js OUTDIR
"""
import json, os, re, shutil, sys, zlib, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(os.path.join(OUT, 'mock'), exist_ok=True)
spec = importlib.util.spec_from_file_location('rc', 'scripts/render-check.py')
rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)

def src(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)
    s = re.sub(r'\{%-?\s*layout\s+none\s*-?%\}', '', s)
    # Shopify form tags → plain forms
    s = re.sub(r"\{%-?\s*form\s+'product',\s*product,\s*id:\s*form_id,\s*class:\s*'([\w-]+)'[^%]*-?%\}", r'<form id="{{ form_id }}" class="\1" action="/cart/add" method="post">', s)
    s = re.sub(r"\{%-?\s*form\s+'contact',\s*id:\s*'(\w+)',\s*class:\s*'([\w-]+)',\s*([\w-]+):\s*''\s*-?%\}", r'<form id="\1" class="\2" \3 action="/contact" method="post">', s)
    s = re.sub(r"\{%-?\s*form\s+'contact',\s*class:\s*'([\w-]+)',\s*([\w-]+):\s*''\s*-?%\}", r'<form class="\1" \2 action="/contact" method="post">', s)
    s = re.sub(r"\{%-?\s*form\s+'(\w+)',\s*id:\s*'(\w+)',\s*class:\s*'([\w -]+)'\s*-?%\}", r'<form id="\2" class="\3" data-form="\1">', s)
    s = re.sub(r'\{%-?\s*endform\s*-?%\}', '</form>', s)
    s = s.replace('{{ form | payment_button }}', '<div class="shopify-payment-button"><button type="button" class="shopify-payment-button__button shopify-payment-button__button--unbranded">Buy it now</button></div>')
    s = s.replace('product.gift_card?', 'false')
    return s

SN = ['mn-pdp-gallery', 'mn-pdp-details', 'mn-pdp-strings', 'mn-product-json', 'mn-payments', 'swatch-style', 'mn-icons', 'product-card', 'mn-social', 'mn-localization', 'mn-mega', 'mn-compare', 'mn-wishlist']
env = Environment(loader=DictLoader({n: src(f'snippets/{n}.liquid') for n in SN}))
TONE = {'black': '151515', 'ivory': 'E9E2D3', 'wine': '5A1F2B', 'sand': 'C9B89A', 'camel': '9A7350', 'gold': 'B48A3C', 'charcoal': '3A3A3A'}
def svg(c, k=0):
    shade = ''.join(format(max(0, min(255, int(c[i:i + 2], 16) + (k * 18 - 30))), '02x') for i in (0, 2, 4))
    return f'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 5%22%3E%3Crect width=%224%22 height=%225%22 fill=%22%23{shade}%22/%3E%3Ccircle cx=%222%22 cy=%221.6%22 r=%220.7%22 fill=%22%23ffffff%22 fill-opacity=%220.25%22/%3E%3C/svg%3E'
class Img(dict):
    def __str__(self): return self['src']
def img(c, alt='', k=0): return Img(src=svg(c, k), alt=alt, aspect_ratio=0.8)
def _iu(v, *a, **k):
    if not v: return ''
    if isinstance(v, dict) and 'src' not in v and 'preview_image' in v: v = v['preview_image']
    return v['src'] if isinstance(v, dict) else str(v)
env.filters['image_url'] = _iu
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "") or ""}" class="{k.get("class", "")}" loading="{k.get("loading", "lazy")}">'
env.filters['placeholder_svg_tag'] = lambda v, *a, **k: f'<svg class="{a[0] if a else ""}" viewBox="0 0 10 10"></svg>'
env.filters['money'] = lambda v, *a, **k: '$' + format(int(v or 0) / 100, ',.2f').replace('.00', '')
env.filters['t'] = rc._translate
env.filters['url_for_vendor'] = lambda v, *a, **k: '/collections/vendors?q=' + str(v)
env.filters['url_encode'] = lambda v, *a, **k: str(v).replace(' ', '%20')
env.filters['video_tag'] = lambda v, *a, **k: '<video class="media__video" controls playsinline preload="none"></video>'
env.filters['external_video_tag'] = lambda v, *a, **k: '<iframe class="media__video"></iframe>'
env.filters['model_viewer_tag'] = lambda v, *a, **k: '<model-viewer></model-viewer>'
env.filters['format_address'] = lambda v, *a, **k: str(v)
def _json(v, *a, **k):
    if isinstance(v, Img): v = v['src']
    return json.dumps(v, default=lambda o: str(o))
env.filters['json'] = _json

def product(handle, title, price, colours, sizes, out=(), compare=0, stock=None, soldout_all=False, tags=('new',), video=True, model=True, desc=True):
    vid = 1000 * (zlib.crc32(handle.encode()) % 9000 + 1000)
    media, mid = [], vid * 10
    for c in colours or ['sand']:
        for k, lab in enumerate(('front', 'back', 'detail')):
            mid += 1
            media.append({'id': mid, 'media_type': 'image', 'alt': c.capitalize() if k == 0 else f'{c.capitalize()} {lab}', 'preview_image': img(TONE[c.lower()], c, k)})
    if video:
        mid += 1; media.insert(2, {'id': mid, 'media_type': 'video', 'alt': '', 'preview_image': img('3A3A3A', 'film', 2), 'duration': 24000})
    if model:
        mid += 1; media.append({'id': mid, 'media_type': 'model', 'alt': '', 'preview_image': img('C9B89A', '3d', 1)})
    by_colour = {c: next(m for m in media if m['alt'] == c.capitalize()) for c in colours}
    opts = ([{'name': 'Colour', 'values': list(colours), 'selected_value': colours[0]}] if colours else []) + ([{'name': 'Size', 'values': list(sizes), 'selected_value': sizes[0]}] if sizes else [])
    variants = []
    for ci, c in enumerate(colours or [None]):
        for si, s in enumerate(sizes or [None]):
            o = [x for x in (c, s) if x]
            av = not soldout_all and not (s in out)
            m = by_colour.get(c)
            variants.append({'id': vid + ci * 10 + si, 'title': ' / '.join(o) or 'Default Title', 'options': o or ['Default Title'], 'option1': o[0] if o else 'Default Title',
                             'option2': o[1] if len(o) > 1 else None, 'available': av, 'price': price, 'compare_at_price': compare,
                             'inventory_management': 'shopify' if stock is not None else None, 'inventory_policy': 'deny', 'inventory_quantity': (stock if av else 0) if stock is not None else 0,
                             'sku': f'MN-{handle[:4].upper()}-{ci}{si}', 'featured_media': m, 'featured_image': m['preview_image'] if m else None, 'unit_price_measurement': None, 'requires_selling_plan': False})
    first = next((v for v in variants if v['available']), variants[0])
    images = [m['preview_image'] for m in media if m['media_type'] == 'image']
    return {'id': vid, 'handle': handle, 'title': title, 'vendor': 'Maison Noir', 'type': 'Dress', 'url': '/products/' + handle, 'price': price, 'price_min': price, 'price_varies': False,
            'compare_at_price': compare, 'available': any(v['available'] for v in variants), 'tags': list(tags), 'published_at': '2026-09-20',
            'description': ('<p>Cut on the bias from 22-momme mulberry silk, then washed in Como until the surface turns soft and matte.</p><ul><li>100% mulberry silk, 22 momme</li><li>Bias cut with French seams</li><li>Made in Italy</li></ul>' if desc else ''),
            'featured_image': images[0], 'featured_media': media[0], 'images': images, 'media': media, 'options': [o['name'] for o in opts] or ['Title'], 'options_with_values': opts,
            'variants': variants, 'selected_or_first_available_variant': first, 'first_available_variant': first, 'has_only_default_variant': not opts,
            'requires_selling_plan': False, 'collections': [{'title': 'Dresses', 'url': '/collections/dresses'}],
            'metafields': {'reviews': {'rating': {'value': 4.8}, 'rating_count': {'value': 126}}, 'custom': {'material': {'value': '100% mulberry silk'}, 'origin': {'value': 'Made in Italy'}, 'care': {'value': 'Dry clean'}, 'summary': None}}}

DRESS = product('slip-dress', 'Washed Silk Slip Dress', 89000, ('Black', 'Ivory', 'Wine'), ('XS', 'S', 'M', 'L', 'XL'), out=('L',), compare=112000, stock=3)
COAT = product('wrap-coat', 'Cashmere Wrap Coat', 189000, ('Camel',), ('S', 'M'), soldout_all=True, video=False, model=False)
SCARF = product('silk-scarf', 'Silk Twill Scarf', 24000, (), (), video=False, model=False, tags=())

SECTION = src('sections/main-product.liquid')
SCHEMA = json.loads(re.search(r'\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}', open('sections/main-product.liquid').read(), re.S).group(1))
DEF = {s['id']: s.get('default') for s in SCHEMA['settings'] if 'id' in s}
BDEF = {b['type']: {s['id']: s.get('default') for s in b.get('settings', []) if 'id' in s} for b in SCHEMA['blocks'] if 'settings' in b}
ORDER = ['title', 'price', 'summary', 'badges', 'urgency', 'variants', 'quantity', 'terms', 'buy', 'pickup', 'offer', 'shipping', 'trust', 'actions', 'details']
SETTINGS = {'product_card_show_compare': True, 'wishlist_enabled': True, 'quickview_enabled': True, 'header_style': 'v4', 'mega_menu_style': 'v1', 'mega_menu_images': True,
            'header_sticky': True, 'menu': 'main-menu', 'logo': '', 'logo_width': 140, 'logo_text': 'Maison Noir', 'cart_type': 'drawer', 'cart_free_shipping_bar': True, 'cart_free_shipping_threshold': '500',
            'social_instagram': '', 'social_tiktok': '', 'social_pinterest': '', 'social_youtube': '', 'social_facebook': '', 'social_twitter': '',
            'quickview_colour_type': 'colour', 'quickview_size_type': 'text', 'quickview_buy_now': True, 'quickview_show_description': True, 'quickview_show_shipping': True,
            'quickview_ship_title': 'Complimentary express delivery', 'quickview_ship_text': 'Arrives in 2–4 business days', 'quickview_return_title': 'Free returns within 30 days', 'quickview_return_text': 'Collected from your door',
            'product_card_low_stock_threshold': 5}
class Blk(dict):
    def __getattr__(self, k): return self.get(k)
def section_ctx(p, over=None, blocks=None, bover=None):
    ss = dict(DEF); ss.update(over or {})
    bl = []
    for k in (blocks or ORDER):
        bs = dict(BDEF.get(k, {})); bs.update((bover or {}).get(k, {}))
        bl.append(Blk(type=k, settings=bs, shopify_attributes=f'data-block="{k}"'))
    return dict(section={'id': 'pdp', 'settings': ss, 'blocks': bl}, product=p, settings=SETTINGS, cart={'taxes_included': True, 'item_count': 0, 'total_price': 0, 'items': []},
                shop={'url': 'https://shop.test', 'name': 'Maison Noir', 'taxes_included': True, 'enabled_payment_types': ['visa', 'master', 'american_express', 'paypal', 'apple_pay', 'shopify_pay'], 'shipping_policy': {'body': 'x', 'url': '/policies/shipping-policy'}},
                routes={'root_url': '/', 'cart_url': '/cart', 'all_products_collection_url': '/collections/all', 'product_recommendations_url': '/recommendations/products'}, collection=None, request={'design_mode': False})

ICONS = env.from_string(src('snippets/mn-icons.liquid')).render()
HEAD_SRC = src('sections/header.liquid')
DRAWER = src('sections/cart-drawer.liquid')
def header():
    ctx = dict(settings=dict(SETTINGS, announcement_enabled=False), section={'settings': {'search_field_text': 'Search', 'search_chips': '', 'search_trending': None, 'search_collections_menu': 'qc', 'search_pages_menu': 'qp'}, 'blocks': []},
               request={'page_type': 'product'}, template={'name': 'product'}, linklists={'main-menu': {'links': []}, 'qc': {'links': []}, 'qp': {'links': []}}, routes={'root_url': '/', 'account_url': '/account', 'account_login_url': '/account/login', 'cart_url': '/cart', 'search_url': '/search', 'predictive_search_url': '/search/suggest'},
               shop={'name': 'Maison Noir', 'customer_accounts_enabled': True}, cart={'item_count': 0}, customer=None, collections={}, localization={'available_countries': [], 'available_languages': [], 'country': {'iso_code': 'US'}, 'language': {'iso_code': 'en'}})
    return env.from_string(HEAD_SRC).render(**ctx)
def drawer(items):
    lines = [{'key': f'k{v["id"]}', 'url': p['url'], 'image': p['featured_image'], 'quantity': 1, 'product': {'title': p['title'], 'has_only_default_variant': p['has_only_default_variant']},
              'variant': {'options': v['options'], 'inventory_management': None, 'inventory_policy': 'continue', 'inventory_quantity': 0}, 'final_price': v['price'], 'final_line_price': v['price'], 'original_line_price': v['price'],
              'selling_plan_allocation': None, 'properties': [], 'line_level_discount_allocations': []} for p, v in items]
    cart = {'item_count': len(lines), 'total_price': sum(l['final_price'] for l in lines), 'items': lines, 'cart_level_discount_applications': [], 'taxes_included': True}
    return env.from_string(DRAWER).render(settings=SETTINGS, cart=cart, shop={'taxes_included': True}, routes={'cart_url': '/cart', 'all_products_collection_url': '/collections/all'})

def page(name, p, over=None, blocks=None, bover=None, scheme='custom', corners='rounded', quick=False):
    body = env.from_string(SECTION).render(**section_ctx(p, over, blocks, bover))
    cards = ''.join(env.from_string('{%- render "product-card", product: product -%}').render(product=x, settings=dict(SETTINGS, product_card_show_vendor=True, product_card_show_rating=True, product_card_show_swatches=True, product_card_show_sizes=True, product_card_show_quickview=True, product_card_show_wishlist=True), shop={'name': 'Maison Noir'}) for x in (DRESS, COAT, SCARF))
    extra = f'<section class="mn-section"><div class="mn-container"><div class="row-cards">{cards}</div></div></section>' if quick else ''
    ov = env.from_string('{% render "mn-compare" %}{% render "mn-wishlist" %}').render(settings=SETTINGS)
    qv = ('<div class="overlay overlay--modal" id="ov-quick" role="dialog" aria-modal="true" aria-labelledby="ov-quick-t"><div class="overlay__scrim" data-close></div><div class="overlay__panel"><span class="sheet-handle"></span>'
          '<button type="button" class="icon-btn qv__close" data-close aria-label="Close"><svg class="icon"><use href="#i-close"></use></svg></button><div id="qvBody" style="min-height:0;display:flex;flex-direction:column"></div></div></div>')
    attrs = f'data-scheme="{scheme}" data-corners="{corners}" data-buttons="default" data-motion="full" data-header="floating" data-announce="static" data-mega="columns" data-mega-images="on" data-footer="columns"'
    fonts = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
    css = ''.join(f'<link rel="stylesheet" href="/{c}">' for c in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css'))
    cu = '<style>:root{--cu-base:#F2F1EA;--cu-text:#1F2620;--cu-accent:#55663F;--cu-sale:#8B1A1A;--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}</style>'
    html = (f'<!doctype html><html lang="en" {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{fonts}{css}{cu}</head>'
            f'<body class="template-product" data-scroll-reveal="false">{ICONS}{header()}<main id="MainContent" class="content-for-layout">{body}{extra}<div style="height:900px"></div></main>'
            f'<div id="shopify-section-cart-drawer" class="shopify-section">{drawer([])}</div>{ov}{qv}'
            '<script>window.MN_STRINGS={cart_only_left:"Only __N__ available",cart_error:"Something went wrong.",add:"Add to bag",choose:"Choose options",in_compare:"In compare",cmp:{added:"Added to compare",max:"Max 4"},wish:{title:"Wishlist",title_count:"Wishlist (__N__)",empty:"Empty",browse:"Browse",remove:"Remove"}};'
            'window.routes={root_url:"/",cart_url:"/cart",cart_add_url:"/cart/add",cart_change_url:"/cart/change",all_products_url:"/collections/all"};window.theme_settings={cart_type:"drawer",money_format:"${{amount}}",quickview_enabled:true};window.theme_strings={}</script>'
            '<script src="/theme.js"></script><script src="/mn.js"></script><script src="/mn-product.js"></script></body></html>')
    open(os.path.join(OUT, name + '.html'), 'w').write(html)

n = 0
page('pdp_default', DRESS, quick=True); n += 1
for g in ('left', 'right', 'top', 'bottom', 'none', 'grid-1', 'grid-2', 'grid-mix', 'slider-2', 'slider-full', 'slider-container'):
    page(f'pdp_gal_{g}', DRESS, {'gallery': g}); n += 1
for L in ('default', 'box', 'wide', 'digital', 'default-tab', 'inner', 'gradient', 'mixed'):
    page(f'pdp_lay_{L}', DRESS, {'layout': L}); n += 1
for ct in ('image', 'colour', 'radio', 'text', 'dropdown'):
    page(f'pdp_col_{ct}', DRESS, {'colour_type': ct, 'size_type': {'radio': 'radio', 'dropdown': 'dropdown'}.get(ct, 'text')}); n += 1
for ds in ('accordion', 'accordion-card', 'tabs', 'tabs-pill', 'tabs-vertical', 'open', 'drawer', 'per-section'):
    page(f'pdp_det_{ds}', DRESS, {'details_style': ds, 'details_place': 'below'}); n += 1
page('pdp_right', DRESS, {'details_place': 'right', 'details_style': 'accordion'}); n += 1
page('pdp_btn', DRESS, {'atc_style': 'accent', 'atc_icon': False, 'atc_anim': 'lift', 'qty_style': 'pill', 'atc_label': 'Reserve yours', 'after_add': 'notification', 'video': 'inline'}); n += 1
page('pdp_qtydrop', DRESS, {'qty_style': 'dropdown', 'atc_style': 'outline'}); n += 1
page('pdp_soldout', COAT); n += 1
page('pdp_single', SCARF, blocks=[b for b in ORDER if b != 'terms']); n += 1
page('pdp_countdown', DRESS, bover={'urgency': {'countdown_end': '2030-12-31 23:59', 'show_visitors': True}}); n += 1
page('pdp_dark', DRESS, scheme='dark'); n += 1

PICK = src('sections/mn-pickup.liquid')
for v in DRESS['variants']:
    sa = [{'pick_up_enabled': True, 'available': v['available'], 'pick_up_time': 'Usually ready in 2 hours', 'location': {'name': 'Maison Noir Milan', 'address': 'Via Montenapoleone 8, Milan'}},
          {'pick_up_enabled': True, 'available': False, 'pick_up_time': 'Usually ready in 2–4 days', 'location': {'name': 'Maison Noir Paris', 'address': 'Rue Saint-Honoré 211, Paris'}}]
    p2 = dict(DRESS, selected_or_first_available_variant=dict(v, store_availabilities=sa))
    open(os.path.join(OUT, 'mock', f'pickup-{v["id"]}.html'), 'w').write(env.from_string(PICK).render(product=p2))
QUICK = src('templates/product.mn-quick.liquid')
for p in (DRESS, COAT, SCARF):
    open(os.path.join(OUT, 'mock', f'quick-{p["handle"]}.html'), 'w').write(env.from_string(QUICK).render(product=p, settings=SETTINGS, routes={'root_url': '/'}))
v = DRESS['variants'][1]
open(os.path.join(OUT, 'mock', 'cart.html'), 'w').write(f'<div id="shopify-section-cart-drawer" class="shopify-section">{drawer([(DRESS, v)])}</div>')
json.dump({'dress': DRESS['variants'], 'scarf': SCARF['variants']}, open(os.path.join(OUT, 'mock', 'variants.json'), 'w'), default=str)
for f in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css', 'theme.js', 'mn.js', 'mn-product.js'):
    shutil.copy(os.path.join('assets', f), OUT)
print(f'{n} pages written to {OUT}')
