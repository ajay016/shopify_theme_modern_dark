#!/usr/bin/env python3
"""Render the real collection and search sections (sections/main-collection,
sections/main-search) with the real product cards, Shopify filters, sort and
view toggle, into pages that load the real theme CSS/JS. Fixtures come from
scripts/card-check.py.

    python3 scripts/collection-check.py OUTDIR && node scripts/collection-test.js OUTDIR
"""
import os, re, shutil, sys, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
rc = load('rc', 'scripts/render-check.py')
cc = load('cc', 'scripts/card-check.py')

def src(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)
    s = re.sub(r'\{%-?\s*paginate[^%]*%\}', '', s)
    return re.sub(r'\{%-?\s*endpaginate\s*-?%\}', '', s)

NAMES = ('product-card', 'swatch-style', 'mn-icons', 'mn-compare', 'mn-wishlist', 'collection-filters', 'collection-filter-groups',
         'collection-filter-values', 'collection-sort', 'collection-view-toggle', 'icon-close', 'icon-chevron-down', 'icon-search', 'mn-pagination')
snips = {n: src(f'snippets/{n}.liquid') for n in NAMES if os.path.exists(f'snippets/{n}.liquid')}
env = Environment(loader=DictLoader(snips))
for k, f in cc.env.filters.items():
    env.filters.setdefault(k, f)
for k in ('image_url', 'image_tag', 'placeholder_svg_tag', 'money', 't', 'json'):
    env.filters[k] = cc.env.filters[k]
env.filters['money_without_currency'] = lambda v, *a, **k: format(int(v or 0) / 100, '.2f')
env.filters['money_without_trailing_zeros'] = lambda v, *a, **k: '$' + format(int(v or 0) / 100, ',.0f')
env.filters['date'] = lambda v, *a, **k: 'September 20, 2026'
env.filters['highlight'] = lambda v, *a, **k: v
ICONS = env.from_string(snips['mn-icons']).render()

P = cc.P * 2
def val(label, count, active=False, param='filter.v.option'):
    return {'label': label, 'value': label, 'count': count, 'active': active, 'param_name': param, 'swatch': None,
            'url_to_add': '/collections/women?' + param + '=' + label, 'url_to_remove': '/collections/women'}
def filters(active=False):
    return [
        {'label': 'Availability', 'type': 'list', 'values': [val('In stock', 10, param='filter.v.availability'), val('Out of stock', 2, param='filter.v.availability')], 'active_values': []},
        {'label': 'Colour', 'type': 'list', 'values': [val(c, n, active and c == 'Black') for c, n in (('Black', 4), ('Ivory', 3), ('Wine', 2), ('Camel', 2), ('Sand', 1), ('Navy', 1), ('Olive', 1))],
         'active_values': [val('Black', 4, True)] if active else []},
        {'label': 'Size', 'type': 'list', 'values': [val(s, n, active and s == 'M') for s, n in (('XS', 2), ('S', 4), ('M', 4), ('L', 3), ('XL', 0))], 'active_values': [val('M', 4, True)] if active else []},
        {'label': 'Brand', 'type': 'list', 'values': [val('Maison Noir', 6), val('Halden', 2), val('Ossa', 4)], 'active_values': []},
        {'label': 'Price', 'type': 'price_range', 'range_min': 0, 'range_max': 189000, 'min_value': {'value': None, 'param_name': 'filter.v.price.gte'},
         'max_value': {'value': None, 'param_name': 'filter.v.price.lte'}, 'values': [], 'active_values': [], 'url_to_remove': '/collections/women'},
    ]
SORT = [{'name': n, 'value': v} for n, v in (('Featured', 'manual'), ('Best selling', 'best-selling'), ('Alphabetically, A-Z', 'title-ascending'), ('Price, low to high', 'price-ascending'), ('Price, high to low', 'price-descending'), ('Date, new to old', 'created-descending'))]
PAGINATE = {'pages': 3, 'current_page': 1, 'previous': None, 'next': {'url': '/collections/women?page=2', 'title': 'Next'},
            'parts': [{'is_link': False, 'title': '1'}, {'is_link': True, 'title': '2', 'url': '?page=2'}, {'is_link': True, 'title': '3', 'url': '?page=3'}]}
DEF = {'sidebar_position': 'left', 'filter_style': 'sidebar', 'grid_columns': '3', 'view_default': 'grid', 'pagination_style': 'numbered', 'title_style': 'style-1',
       'products_per_page': 24, 'container_style': 'boxed', 'scheme': 'theme', 'show_demo_when_empty': True, 'builtin_filters': True, 'swatch_style': 'list',
       'show_banner': False, 'banner_image': None, 'banner_height': 40, 'banner_text_position': 'center', 'banner_eyebrow': 'Collection', 'banner_show_count': True,
       'show_bestsellers': False, 'bestsellers_collection': None, 'bestsellers_heading': 'Best sellers', 'bestsellers_count': 4, 'bestsellers_position': 'above'}

def collection(products=P, active=False, app=True, **s):
    return {'title': 'Women', 'handle': 'women', 'url': '/collections/women', 'products': products, 'products_count': len(products) * 3 if products else 0,
            'filters': filters(active) if app else [], 'all_tags': [], 'description': '<p>Considered pieces in silk, cashmere and leather, cut to be worn for years.</p>',
            'image': None, 'sort_options': SORT, 'sort_by': '', 'default_sort_by': 'manual'}

def wrap(body, scheme='light', template='collection'):
    attrs = f'data-scheme="{scheme}" data-corners="soft" data-buttons="default" data-motion="full"'
    st = dict(cc.SET)
    ov = env.from_string('{% render "mn-compare" %}{% render "mn-wishlist" %}').render(settings=st)
    fonts = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
    css = ''.join(f'<link rel="stylesheet" href="/{c}">' for c in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css', 'mn-collection.css'))
    return (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{fonts}{css}'
            f'<style>:root{{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}}</style></head>'
            f'<body class="template-{template}" data-scroll-reveal="false">{ICONS}<header style="height:64px;border-bottom:1px solid var(--line)"></header>'
            f'<main id="MainContent"><div id="shopify-section-main" class="shopify-section">{body}</div></main>{ov}'
            '<script>window.MN_STRINGS={add:"Add to bag",choose:"Choose options",cart_error:"Something went wrong.",cmp:{},wish:{}};'
            'window.routes={root_url:"/",cart_url:"/cart",cart_add_url:"/cart/add",cart_change_url:"/cart/change",search_url:"/search",all_products_url:"/collections/all"};'
            'window.theme_settings={cart_type:"none",money_format:"${{amount}}",quickview_enabled:true};window.theme_strings={}</script>'
            '<script src="/theme.js"></script><script src="/mn.js"></script></body></html>')

COLL = src('sections/main-collection.liquid')
def coll_page(name, scheme='light', products=P, active=False, app=True, paginate=PAGINATE, **s):
    c = collection(products, active, app)
    body = env.from_string(COLL).render(section={'id': 'main', 'settings': dict(DEF, **s)}, collection=c, collections={}, settings=cc.SET,
                                        paginate=paginate, routes={'root_url': '/', 'search_url': '/search'}, shop={'name': 'Maison Noir'}, request={'page_type': 'collection'})
    open(os.path.join(OUT, name + '.html'), 'w').write(wrap(body, scheme))

SEARCH = src('sections/main-search.liquid')
SDEF = {'results_per_page': 24, 'columns': '4', 'search_type': 'product,article,page', 'suggestions_menu': '', 'show_empty_products': True, 'empty_collection': '', 'empty_heading': 'Perhaps <em>these</em>'}
def search_page(name, terms='silk', results=None, scheme='light', **s):
    if results is None:
        results = [dict(p, object_type='product') for p in cc.P] + [
            {'object_type': 'article', 'title': 'Caring for silk', 'url': '/blogs/journal/silk', 'image': None, 'published_at': '2026-09-20', 'content': '<p>Silk lasts for decades when it is washed cold, dried flat and stored away from light.</p>', 'author': 'Maison Noir'},
            {'object_type': 'page', 'title': 'Silk sourcing', 'url': '/pages/silk', 'content': '<p>Our mulberry silk comes from two mills in Como that we have worked with since 2014.</p>'}]
    srch = {'performed': terms is not None, 'terms': terms or '', 'results': results, 'results_count': len(results), 'types': ['product', 'article', 'page']}
    body = env.from_string(SEARCH).render(section={'id': 'main', 'settings': dict(SDEF, **s)}, search=srch, settings=cc.SET, paginate=dict(PAGINATE, pages=1),
                                          routes={'root_url': '/', 'search_url': '/search', 'all_products_collection_url': '/collections/all'}, shop={'name': 'Maison Noir'},
                                          collections={'all': {'id': 1, 'url': '/collections/all', 'products': cc.P[:4]}},
                                          linklists={'sugg': {'links': [{'title': t, 'url': '/search?q=' + t} for t in ('Silk', 'Cashmere', 'Gold hoops', 'New in')]}})
    open(os.path.join(OUT, name + '.html'), 'w').write(wrap(body, scheme, 'search'))

pages = {
    'cl_sidebar': {}, 'cl_right': {'sidebar_position': 'right'}, 'cl_toggle': {'filter_style': 'toggle'}, 'cl_hidden': {'filter_style': 'hidden'},
    'cl_drawer': {'filter_style': 'drawer', 'sidebar_position': 'none', 'grid_columns': '4'}, 'cl_dropdown': {'filter_style': 'dropdown', 'sidebar_position': 'none', 'grid_columns': '4'},
    'cl_panel': {'filter_style': 'panel', 'sidebar_position': 'none', 'grid_columns': '4'}, 'cl_list': {'view_default': 'list'},
    'cl_title2': {'title_style': 'style-2'}, 'cl_title3': {'title_style': 'style-3'}, 'cl_title4': {'title_style': 'style-4'}, 'cl_title5': {'title_style': 'style-5'},
    'cl_loadmore': {'pagination_style': 'load_more', 'filter_style': 'drawer', 'sidebar_position': 'none'}, 'cl_wide': {'container_style': 'wide', 'grid_columns': '5', 'filter_style': 'drawer', 'sidebar_position': 'none'},
}
for n, s in pages.items():
    coll_page(n, **s)
coll_page('cl_active', active=True)
coll_page('cl_builtin', app=False)
coll_page('cl_empty', products=[], app=True, show_demo_when_empty=False)
coll_page('cl_dark', scheme='dark')
search_page('sr_results'); search_page('sr_empty', terms='zzz', results=[], suggestions_menu='sugg'); search_page('sr_start', terms=None, results=[]); search_page('sr_dark', scheme='dark')
for f in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css', 'mn-collection.css', 'theme.js', 'mn.js'):
    shutil.copy(os.path.join('assets', f), OUT)
print(f'{len(pages) + 8} pages written to {OUT}')
