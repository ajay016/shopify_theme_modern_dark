#!/usr/bin/env python3
"""Render every homepage template (templates/index*.json) as saved: each
section with its schema defaults, the template's settings and blocks, the
store's theme settings (config/settings_data.json) and their CSS variables,
into pages that load the real theme CSS/JS. Products, collections and the
journal come from the fixtures in scripts/card-check.py and
scripts/content-check.py.

    python3 scripts/home-check.py OUTDIR && node scripts/home-test.js OUTDIR
"""
import glob, json, os, re, shutil, sys, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
cc = load('cc', 'scripts/card-check.py')
ct = load('ct', 'scripts/content-check.py.__nomain__') if False else None
rc = load('rc', 'scripts/render-check.py')

def jload(p): return json.loads(re.sub(r'^\s*/\*.*?\*/', '', open(p, encoding='utf-8').read(), flags=re.S))
def schema(path):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}', s, re.S)
    return json.loads(m.group(1)) if m else {}
def src(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)
    s = re.sub(r'\{%-?\s*(end)?(paginate|javascript|stylesheet)[^%]*%\}', '', s)
    s = s.replace('posted_successfully?', 'posted_successfully').replace('performed?', 'performed').replace('comments_enabled?', 'comments_enabled')
    s = re.sub(r"\{%-?\s*form\s+'(\w+)'[^%]*%\}", r'{%- assign form = forms.\1 -%}<form method="post" data-form="\1">', s)
    return re.sub(r'\{%-?\s*endform\s*-?%\}', '</form>', s)

# theme settings: schema defaults, then the store's saved values
SETTINGS = {}
for grp in jload('config/settings_schema.json'):
    for x in grp.get('settings', []):
        if 'id' in x and 'default' in x: SETTINGS[x['id']] = x['default']
        elif 'id' in x: SETTINGS[x['id']] = None
cur = jload('config/settings_data.json')['current']
SETTINGS.update({k: v for k, v in cur.items() if k not in ('sections', 'content_for_index', 'blocks')})
SETTINGS.update(logo=None, favicon=None)

snips = {os.path.basename(f)[:-7]: src(f) for f in glob.glob('snippets/*.liquid')}
env = Environment(loader=DictLoader(snips))
class Img(cc.Img): pass
def image_url(v, *a, **k):
    if isinstance(v, dict) and 'src' in v: return v['src']
    return cc.svg('B9A88E')
env.filters.update(cc.env.filters)
env.filters['image_url'] = image_url
env.filters['img_url'] = image_url
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "")}" class="{k.get("class", "")}" loading="{k.get("loading", "lazy")}">'
passthru = ('handleize', 'handle', 'url_encode', 'url_escape', 'within', 'link_to', 'time_tag', 'structured_data', 'file_url', 'file_img_url', 'shopify_asset_url',
            'inline_asset_content', 'metafield_tag', 'metafield_text', 'default_errors', 'format_address', 'highlight', 'payment_type_svg_tag', 'payment_type_img_url',
            'font_url', 'font_face', 'stylesheet_tag', 'script_tag', 'customer_login_link', 'placeholder_svg_tag', 'money_without_currency', 'external_video_tag', 'video_tag', 'media_tag')
for f in passthru: env.filters.setdefault(f, lambda v, *a, **k: '' if v is None else str(v))
env.filters['placeholder_svg_tag'] = lambda v, *a, **k: f'<svg class="{a[0] if a else ""}" viewBox="0 0 10 10" style="background:#d8d2c4"></svg>'
env.filters['asset_url'] = lambda v, *a, **k: '/' + str(v)
env.filters['money_without_trailing_zeros'] = lambda v, *a, **k: '$' + format(int(v or 0) / 100, ',.0f')
env.filters['money_with_currency'] = lambda v, *a, **k: env.filters['money'](v) + ' USD'
env.filters['date'] = lambda v, *a, **k: 'September 20, 2026'
env.filters['font_modify'] = lambda v, *a, **k: v
env.filters['color_brightness'] = lambda v, *a, **k: (lambda h: (int(h[0:2],16)*299+int(h[2:4],16)*587+int(h[4:6],16)*114)/1000)(str(v).lstrip('#')[:6].ljust(6,'0')) if str(v).startswith('#') else 200
env.filters['color_to_rgb'] = lambda v, *a, **k: str(v)
env.filters['color_modify'] = lambda v, *a, **k: str(v)
env.filters['color_mix'] = lambda v, *a, **k: str(v)
env.filters['t'] = rc._translate

class Coll(dict):
    def __getitem__(self, k):
        if dict.__contains__(self, k): return dict.__getitem__(self, k)
        return {'id': 1, 'handle': str(k or 'all'), 'title': str(k or 'New arrivals').replace('-', ' ').title(), 'url': f'/collections/{k or "all"}', 'products': cc.P,
                'products_count': len(cc.P), 'image': None, 'featured_image': None, 'description': 'Considered pieces in silk, cashmere and leather.'}
    def get(self, k, d=None): return self[k]
    def __contains__(self, k): return True
LOREM = '<p>Mulberry silk is the most forgiving fibre we work with. Treated well it lasts for decades and softens with every wear.</p>'
ARTS = [{'id': i, 'title': t, 'url': f'/blogs/journal/{i}', 'tags': [g], 'image': None, 'author': 'Clara Rossi', 'published_at': 'x', 'excerpt': '', 'content': LOREM}
        for i, (t, g) in enumerate((('Caring for silk, season after season', 'Care'), ('Inside the Como atelier', 'Atelier'), ('The wrap coat, cut three ways', 'Style')), 1)]
BLOG = {'title': 'Journal', 'url': '/blogs/journal', 'articles': ARTS, 'articles_count': 3}
class Blogs(dict):
    def __getitem__(self, k): return BLOG
    def get(self, k, d=None): return BLOG
ROUTES = {'root_url': '/', 'search_url': '/search', 'cart_url': '/cart', 'cart_add_url': '/cart/add', 'account_url': '/account', 'all_products_collection_url': '/collections/all',
          'collections_url': '/collections', 'product_recommendations_url': '/recommendations/products'}
FORMS = {k: {'errors': None, 'posted_successfully': False} for k in ('customer', 'contact', 'product', 'localization')}

def fill(defs, given):
    out = {x['id']: x.get('default') for x in defs if 'id' in x}
    out.update(given or {})
    return out
def section_html(key, sec):
    path = f'sections/{sec["type"]}.liquid'
    sch = schema(path)
    st = fill(sch.get('settings', []), sec.get('settings'))
    bdefs = {b['type']: b.get('settings', []) for b in sch.get('blocks', []) if 'type' in b}
    blocks = []
    for bid in sec.get('block_order', list((sec.get('blocks') or {}).keys())):
        b = sec['blocks'][bid]
        if b.get('disabled'): continue
        blocks.append({'id': bid, 'type': b['type'], 'settings': fill(bdefs.get(b['type'], []), b.get('settings')), 'shopify_attributes': f'data-block="{bid}"'})
    ctx = dict(section={'id': key, 'settings': st, 'blocks': blocks}, settings=SETTINGS, collections=Coll(), blogs=Blogs(), routes=ROUTES, forms=FORMS,
               shop={'name': 'Maison Noir', 'url': 'https://maison-noir.example', 'currency': 'USD', 'money_format': '${{amount}}'}, request={'page_type': 'index', 'design_mode': False},
               template={'name': 'index'}, linklists={}, cart={'item_count': 0, 'items': []}, localization={'available_countries': [], 'available_languages': []},
               all_products=Coll(), product=None, customer=None, canonical_url='/', powered_by_link='')
    try:
        body = env.from_string(src(path)).render(**ctx)
    except Exception as e:
        return f'<div class="render-error" style="padding:20px;background:#fdd;color:#900;font:13px monospace">{sec["type"]}: {e}</div>', str(e)
    tag = sch.get('tag', 'section'); cls = sch.get('class', '')
    return f'<{tag} id="shopify-section-{key}" class="shopify-section {cls}" data-section-type="{sec["type"]}">{body}</{tag}>', None

CSS = ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css', 'mn-collection.css', 'mn-pages.css')
EXTRA = [c for c in ('mn-home.css',) if os.path.exists('assets/' + c)]
FONTS = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
ICONS = env.from_string(snips['mn-icons']).render()
attrs = env.from_string(snips['mn-html-attrs']).render(settings=SETTINGS, request={'locale': {'iso_code': 'en'}})
VARS = env.from_string(snips['css-variables']).render(settings=SETTINGS)
errors = {}
names = sys.argv[2:] or [os.path.basename(f)[:-5] for f in sorted(glob.glob('templates/index*.json'))]
for name in names:
    t = jload(f'templates/{name}.json')
    parts = []
    for key in t['order']:
        sec = t['sections'][key]
        if sec.get('disabled'): continue
        html, err = section_html(key, sec)
        if err: errors[f'{name}/{key}'] = err
        parts.append(html)
    css = ''.join(f'<link rel="stylesheet" href="/{c}">' for c in CSS + tuple(EXTRA))
    page = (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{FONTS}{VARS}{css}</head>'
            f'<body class="template-index" data-scroll-reveal="false">{ICONS}<main id="MainContent" class="content-for-layout">{"".join(parts)}</main>'
            '<script>window.MN_STRINGS={cmp:{},wish:{}};window.routes={root_url:"/",cart_url:"/cart",cart_add_url:"/cart/add",cart_change_url:"/cart/change"};'
            'window.theme_settings={cart_type:"none",money_format:"${{amount}}"};window.theme_strings={}</script>'
            '<script src="/theme.js"></script><script src="/mn.js"></script><script src="/mn-product.js"></script></body></html>')
    open(os.path.join(OUT, f'hm_{name.replace("index.", "").replace("index", "default")}.html'), 'w').write(page)
for f in CSS + tuple(EXTRA) + ('theme.js', 'mn.js', 'mn-product.js'):
    shutil.copy(os.path.join('assets', f), OUT)
for k, e in errors.items(): print('RENDER ERROR', k, e[:300])
print(f'{len(names)} homepages written to {OUT}, {len(errors)} render errors')
