#!/usr/bin/env python3
"""Render a section with python-liquid and report what it emits.

Static checks pass on Liquid that renders nothing. This actually runs the
template against a mock context, which is how the demo filter values were
found to be overwritten by their own defaults four lines later.

    pip install python-liquid
    python3 scripts/render-check.py
"""
import re, sys, json
from liquid import Environment, DictLoader

SNIPPETS = {
    'collection-filters': 'snippets/collection-filters.liquid',
    'swatch-style': 'snippets/swatch-style.liquid',
    'collection-filter-groups': 'snippets/collection-filter-groups.liquid',
    'collection-filter-values': 'snippets/collection-filter-values.liquid',
    'icon-close': None,
    'product-card': None, 'collection-sort': None,
    'collection-view-toggle': None, 'icon-chevron-down': None,
}

def build_env():
    loader = {}
    for name, path in SNIPPETS.items():
        loader[name] = open(path, encoding='utf-8').read() if path else '<span></span>'
    env = Environment(loader=DictLoader(loader))
    # Shopify-only filters the engine does not know
    for f in ('money', 'money_without_currency', 'handleize', 'json',
              'image_url', 'image_tag', 'default_errors', 'payment_button'):
        env.filters[f] = lambda v, *a, **k: str(v) if v is not None else ''
    env.filters['t'] = _translate
    return env


def _locale():
    """Shopify writes a /* ... */ banner into locale files; strip it to parse."""
    raw = open('locales/en.default.json', encoding='utf-8').read()
    return json.loads(re.sub(r'^\s*/\*.*?\*/\s*', '', raw, flags=re.S))


_LOCALE = None


def _translate(key, *a, **kw):
    """Resolve a translation the way Shopify does.

    Stubbing this to echo the key hid real faults: a missing key renders as
    'Translation missing: ...' on the store, and `| t | default: 'Min'` does
    NOT rescue it, because that string is not blank.
    """
    global _LOCALE
    if _LOCALE is None:
        _LOCALE = _locale()
    node = _LOCALE
    for part in str(key).split('.'):
        if not isinstance(node, dict) or part not in node:
            return f'Translation missing: en.{key}'
        node = node[part]
    if isinstance(node, dict):            # pluralised key
        count = kw.get('count')
        if count is None:
            return f'Translation missing: en.{key}'
        form = 'one' if count == 1 else 'other'
        node = node.get(form, node.get('other', ''))
    return str(node).replace('{{ count }}', str(kw.get('count', ''))).strip()

def strip(src):
    src = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', src, flags=re.S)
    src = re.sub(r'\{%-?\s*paginate[^%]*%\}', '', src)
    src = re.sub(r'\{%-?\s*endpaginate\s*-?%\}', '', src)
    return src

def simple_store(n=6):
    return [{'price': 89000, 'compare_at_price': 0, 'available': True,
             'vendor': 'Maison Noir', 'type': '', 'tags': [],
             'options_with_values': [{'name': 'Title', 'values': ['Default Title']}],
             'variants': [], 'published_at': '2026-01-01', 'metafields': {},
             'title': 'P', 'url': '/p', 'id': 1} for _ in range(n)]

def run(products, label):
    env = build_env()
    src = strip(open('sections/main-collection.liquid', encoding='utf-8').read())
    ctx = {
      'section': {'id': 'x', 'settings': {
          'sidebar_position': 'left', 'filter_style': 'sidebar', 'grid_columns': '3',
          'view_default': 'grid', 'pagination_style': 'numbered', 'title_style': 'style-1',
          'products_per_page': 24, 'container_style': 'boxed', 'scheme': 'theme',
          'show_demo_when_empty': True, 'builtin_filters': True,
          'show_banner': False, 'show_bestsellers': False,
          'bestsellers_position': 'above', 'bestsellers_count': 4}},
      'collection': {'title': 'All', 'url': '/c', 'products': products,
                     'products_count': len(products), 'filters': [], 'all_tags': [],
                     'description': '', 'image': None},
      'collections': {}, 'settings': {}, 'paginate': {'pages': 1, 'parts': []},
    }
    out = env.from_string(src).render(**ctx)
    groups = [g.strip() for g in re.findall(r'filter-group__toggle"[^>]*>\s*([A-Za-z ]+)', out)]
    print('%-28s sidebar=%-5s panel=%-5s groups=%s' % (
        label, 'collection-sidebar' in out, 'class="cfilter"' in out, groups))
    return groups

if __name__ == '__main__':
    run(simple_store(), 'simple products, no app')
    run([], 'empty collection')
