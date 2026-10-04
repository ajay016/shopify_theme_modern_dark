#!/usr/bin/env python3
"""Render the real product card (snippets/product-card.liquid) for six
fixture products in every Product cards setting that changes its look, plus
the compare tray / table and the wishlist drawer, into pages that load the
real theme CSS/JS. Also renders templates/product.mn-data.liquid for each
product (data/<handle>.json), which scripts/card-test.js serves as
/products/<handle>?view=mn-data.

    python3 scripts/card-check.py OUTDIR && node scripts/card-test.js OUTDIR
"""
import json, os, re, shutil, sys, zlib, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)
spec = importlib.util.spec_from_file_location('rc', 'scripts/render-check.py')
rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)

def src(path):
    s = open(path, encoding='utf-8').read()
    return re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)

snips = {n: src(f'snippets/{n}.liquid') for n in ('product-card', 'swatch-style', 'mn-icons', 'mn-compare', 'mn-wishlist')}
env = Environment(loader=DictLoader(snips))
TONE = {'black': '151515', 'ivory': 'E9E2D3', 'wine': '5A1F2B', 'sand': 'C9B89A', 'camel': '9A7350', 'gold': 'B48A3C', 'charcoal': '3A3A3A', 'navy': '1F2A44', 'olive': '5B5B3A', 'rose': 'C99A9A'}
def svg(c, alt=False):
    c2 = c if not alt else ''.join(format(max(0, int(c[i:i + 2], 16) - 40), '02x') for i in (0, 2, 4))
    return f'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect width=%223%22 height=%224%22 fill=%22%23{c2}%22/%3E%3C/svg%3E'
class Img(dict):
    def __str__(self): return self['src']
def img(c, alt='', second=False): return Img(src=svg(c, second), alt=alt)
env.filters['image_url'] = lambda v, *a, **k: v['src'] if isinstance(v, dict) else str(v)
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "")}" class="{k.get("class", "")}" loading="{k.get("loading", "lazy")}">'
env.filters['placeholder_svg_tag'] = lambda v, *a, **k: f'<svg class="{a[0] if a else ""}" viewBox="0 0 10 10"></svg>'
env.filters['money'] = lambda v, *a, **k: '$' + format(int(v) / 100, ',.2f').replace('.00', '')
env.filters['t'] = rc._translate
def _json(v, *a, **k):
    if isinstance(v, Img): v = v['src']
    if hasattr(v, '__html__') or type(v).__name__ in ('Markup',): v = str(v)
    return json.dumps(v, default=lambda o: str(o))
env.filters['json'] = _json

def product(handle, title, vendor, price, colours=(), sizes=(), out=(), compare=0, rating=0, count=0, tags=(), stock=None, available=True, images=2, material='', origin='', care=''):
    opts, ov = [], []
    if colours: opts.append({'name': 'Colour', 'values': list(colours)})
    if sizes: opts.append({'name': 'Size', 'values': list(sizes)})
    variants, vid = [], 1000 * (zlib.crc32(handle.encode()) % 9000 + 1000)  # stable, distinct per handle
    combos = [(c, s) for c in (colours or [None]) for s in (sizes or [None])]
    for k, (c, s) in enumerate(combos):
        o = [x for x in (c, s) if x]
        av = available and s not in out
        variants.append({'id': vid + k, 'title': ' / '.join(o) or 'Default Title', 'option1': o[0] if o else 'Default Title', 'option2': o[1] if len(o) > 1 else None, 'option3': None,
                         'options': o or ['Default Title'], 'available': av, 'price': price, 'compare_at_price': compare or 0,
                         'inventory_management': 'shopify' if stock is not None else None, 'inventory_quantity': (stock if stock is not None else 0) if av else 0,
                         'featured_image': img(TONE[c.lower()]) if c else None})
    base = TONE[(colours[0] if colours else 'sand').lower()]
    ims = [img(base, (colours[0] if colours else title))] + ([img(base, 'back', True)] if images > 1 else [])
    if colours:
        ims += [img(TONE[c.lower()], c) for c in colours[1:]]
    first = next((v for v in variants if v['available']), variants[0])
    return {'id': vid, 'handle': handle, 'title': title, 'vendor': vendor, 'type': 'Dress', 'url': '/products/' + handle, 'price': price, 'price_min': price, 'price_varies': False,
            'compare_at_price': compare or 0, 'available': any(v['available'] for v in variants), 'tags': list(tags), 'published_at': '2026-09-20',
            'description': f'<p>{title}, cut and finished in Italy. A short description for the list view.</p>', 'featured_image': ims[0], 'images': ims,
            'options': [o['name'] for o in opts] or ['Title'], 'options_with_values': opts, 'variants': variants,
            'first_available_variant': first, 'selected_or_first_available_variant': first, 'has_only_default_variant': not opts,
            'metafields': {'reviews': {'rating': {'value': rating} if rating else None, 'rating_count': {'value': count}}, 'custom': {'material': {'value': material} if material else None, 'origin': {'value': origin} if origin else None, 'care': {'value': care} if care else None}}}

P = [
    product('slip-dress', 'Washed Silk Slip Dress', 'Maison Noir', 89000, ('Black', 'Ivory', 'Wine'), ('XS', 'S', 'M', 'L', 'XL'), out=('XL',), compare=112000, rating=4.8, count=191, tags=('new',), material='100% mulberry silk', origin='Made in Italy', care='Dry clean'),
    product('silk-scarf', 'Silk Twill Scarf', 'Maison Noir', 24000, rating=4.9, count=156, images=1, material='100% silk twill', origin='Made in Italy', care='Dry clean'),
    product('wrap-coat', 'Cashmere Wrap Coat', 'Halden', 189000, ('Camel', 'Black'), ('S', 'M', 'L'), available=False, rating=4.9, count=64, material='100% cashmere', origin='Made in Italy', care='Dry clean'),
    product('hoops', 'Gold Vermeil Hoops', 'Ossa', 29000, ('Gold',), stock=3, rating=4.6, count=88, material='18k gold vermeil', origin='Made in Portugal', care='Store dry'),
    product('shoulder-bag', 'Croissant Leather Bag', 'Ossa', 98000, ('Black', 'Camel', 'Sand', 'Wine', 'Navy', 'Olive'), rating=4.7, count=97, material='Calf leather', origin='Made in Italy'),
    product('cardigan', 'Merino Rib Cardigan', 'Maison Noir', 42000, ('Charcoal', 'Ivory'), ('S', 'M', 'L'), out=('L',)),
]

SET = {'wishlist_enabled': True, 'quickview_enabled': True, 'product_card_style': 'atelier', 'product_card_image_ratio': 'portrait', 'product_card_media_hover': 'second_image',
       'product_card_quickadd_style': 'slide_up', 'product_card_text_align': 'left', 'product_card_radius': 'theme', 'product_card_title_font': 'body',
       'product_card_show_vendor': True, 'product_card_show_category': False, 'product_card_show_number': False, 'product_card_show_wishlist': True,
       'product_card_show_quickview': True, 'product_card_show_compare': True, 'product_card_show_price_compare': True, 'product_card_show_sizes': True,
       'product_card_show_material': False, 'product_card_show_swatches': True, 'product_card_show_rating': True, 'product_card_show_low_stock': True,
       'product_card_low_stock_threshold': 5}
CARD = snips['product-card']
ICONS = env.from_string(snips['mn-icons']).render()

def cards(settings, products=P, **kw):
    out = []
    for i, p in enumerate(products):
        out.append(env.from_string('{%- render "product-card", product: product, number: number -%}').render(settings=settings, product=p, number=i + 1, shop={'name': 'Maison Noir'}))
    return ''.join(out)

def page(name, body, scheme='light', settings=None):
    st = dict(SET, **(settings or {}))
    ov = env.from_string('{% render "mn-compare" %}{% render "mn-wishlist" %}').render(settings=st)
    attrs = f'data-scheme="{scheme}" data-corners="soft" data-buttons="default" data-motion="full"'
    fonts = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
    css = ''.join(f'<link rel="stylesheet" href="/{c}">' for c in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css'))
    html = (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{fonts}{css}'
            f'<style>:root{{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}} .demo{{padding:32px 48px}} .demo h2{{font:500 12px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:28px 0 14px}} .demo .product-grid{{display:grid;gap:24px}}</style></head>'
            f'<body data-scroll-reveal="false">{ICONS}<header style="display:flex;justify-content:flex-end;gap:16px;padding:12px 48px"><button class="icon-btn" data-open="ov-wish" id="wishBtn" style="position:relative"><svg class="icon"><use href="#i-heart"></use></svg><span class="count-dot header-wishlist-count" id="wishCount"></span></button><span class="count-dot" id="cartCount" data-cart-count></span></header>'
            f'<main class="demo">{body}</main>{ov}'
            '<script>window.MN_STRINGS={add:"Add to bag",choose:"Choose options",cart_error:"Something went wrong.",cmp:{added:"Added to compare",max:"You can compare up to 4 pieces",remove:"Remove __T__",count:"__N__ of 4 pieces",diff:"Highlight differences",empty:"Nothing to compare yet. Use the compare icon on any product.",add_title:"Add a piece to compare",add_hint:"Use the compare icon on any product, or pick one below.",price:"Price",rating:"Rating",material:"Material",origin:"Origin",care:"Care",colours:"Colours",sizes:"Sizes",availability:"Availability",in_stock:"In stock",sold_out:"Sold out",only_left:"Only __N__ left",reviews:"__N__ reviews"},wish:{title:"Wishlist",title_count:"Wishlist (__N__)",empty:"Nothing saved yet. Tap the heart on any piece to keep it here.",browse:"Browse the collection",remove:"Remove"}};'
            'window.routes={root_url:"/",cart_url:"/cart",cart_add_url:"/cart/add",cart_change_url:"/cart/change",all_products_url:"/collections/all"};window.theme_settings={cart_type:"none",money_format:"${{amount}}",quickview_enabled:true};window.theme_strings={wishlist_added:"Saved to your wishlist",wishlist_removed:"Removed from your wishlist"}</script>'
            '<script src="/theme.js"></script><script src="/mn.js"></script></body></html>')
    open(os.path.join(OUT, name + '.html'), 'w').write(html)

grid = lambda c, inner, view='grid': f'<div class="product-grid" data-view="{view}" style="grid-template-columns:repeat({c},minmax(0,1fr))">{inner}</div>'
page('cd_default', '<h2>Design defaults</h2>' + grid(6, cards(SET)))
body = ''
for style in ('minimal', 'overlay', 'bordered', 'plaque'):
    body += f'<h2>Style: {style}</h2>' + grid(6, cards(dict(SET, product_card_style=style)), )
page('cd_styles', body)
page('cd_variants', '<h2>Centre · heading title · square · rounded · number · category · material</h2>' + grid(6, cards(dict(SET, product_card_text_align='center', product_card_title_font='heading', product_card_image_ratio='square', product_card_radius='rounded', product_card_show_number=True, product_card_show_category=True, product_card_show_material=True)))
     + '<h2>Landscape · no radius · zoom · always visible add</h2>' + grid(6, cards(dict(SET, product_card_image_ratio='landscape', product_card_radius='none', product_card_media_hover='zoom', product_card_quickadd_style='always')))
     + '<h2>Carousel hover · minimal facts</h2>' + grid(6, cards(dict(SET, product_card_media_hover='carousel', product_card_show_vendor=False, product_card_show_rating=False, product_card_show_sizes=False, product_card_show_swatches=False, product_card_show_compare=False, product_card_show_wishlist=False, product_card_show_quickview=False))))
page('cd_list', '<h2>List view</h2>' + grid(1, cards(SET), 'list'))
page('cd_dark', '<h2>Dark scheme</h2>' + grid(6, cards(SET)), scheme='dark')
page('cd_phone', grid(2, cards(SET)))

DATA = re.sub(r'\{%-?\s*layout\s+none\s*-?%\}', '', src('templates/product.mn-data.liquid'))
for p in P:
    out = env.from_string(DATA).render(product=p, settings=SET)
    json.loads(out)
    open(os.path.join(OUT, 'data', p['handle'] + '.json'), 'w').write(out)
for f in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css', 'theme.js', 'mn.js'):
    shutil.copy(os.path.join('assets', f), OUT)
print(f'6 pages and {len(P)} product data files written to {OUT}')
