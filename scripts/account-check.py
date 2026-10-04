#!/usr/bin/env python3
"""Render the real account sections (login, register, activate, reset,
account, order, addresses) for several states into pages that load the real
theme CSS/JS. Shopify's {% form %} tags become plain <form>s, and each form's
`form` object comes from the fixtures below.

    python3 scripts/account-check.py OUTDIR && node scripts/account-test.js OUTDIR
"""
import os, re, shutil, sys, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
rc = load('rc', 'scripts/render-check.py')

def src(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)
    s = re.sub(r'\{%-?\s*(end)?paginate[^%]*%\}', '', s)
    s = s.replace('posted_successfully?', 'posted_successfully')
    def form(m):
        kind, rest = m.group(1), m.group(2) or ''
        obj = re.match(r'\s*,\s*([\w.]+)\s*(?:,|$)', rest)
        target = obj.group(1) if obj and ':' not in obj.group(1) else f'forms.{kind}'
        cls = re.search(r"class:\s*'([^']*)'", rest)
        return (f'{{%- assign form = {target} -%}}<form method="post" action="/account" data-form="{kind}"'
                + (f' class="{cls.group(1)}"' if cls else '') + '>')
    s = re.sub(r"\{%-?\s*form\s+'(\w+)'((?:\s*,[^%]*)?)\s*-?%\}", form, s)
    return re.sub(r'\{%-?\s*endform\s*-?%\}', '</form>', s)

NAMES = ('mn-icons', 'mn-password', 'mn-account-nav', 'address-fields', 'mn-pagination', 'mn-wishlist')
env = Environment(loader=DictLoader({n: src(f'snippets/{n}.liquid') for n in NAMES}))
TONE = {'dress': '151515', 'scarf': 'E9E2D3', 'hoops': 'B48A3C'}
def svg(c): return f'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect width=%223%22 height=%224%22 fill=%22%23{c}%22/%3E%3C/svg%3E'
env.filters['image_url'] = lambda v, *a, **k: svg(TONE.get(str(v), 'B9A88E'))
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "")}" class="{k.get("class", "")}">'
env.filters['money'] = lambda v, *a, **k: '$' + format(int(v) / 100, ',.2f').replace('.00', '')
env.filters['money_with_currency'] = lambda v, *a, **k: env.filters['money'](v) + ' USD'
env.filters['t'] = rc._translate
env.filters['default_errors'] = lambda v, *a, **k: '<ul>' + ''.join(f'<li>{e}</li>' for e in (v or [])) + '</ul>'
env.filters['date'] = lambda v, *a, **k: {'o1': 'September 28, 2026', 'o2': 'August 3, 2026'}.get(str(v), 'September 30, 2026')
def fmt(a, *x, **k):
    if not a: return ''
    lines = [a.get('name'), a.get('company'), a.get('address1'), a.get('address2'), f"{a.get('city')} {a.get('province_code', '')} {a.get('zip')}".strip(), a.get('country')]
    return '<br>'.join(l for l in lines if l)
env.filters['format_address'] = fmt
ICONS = env.from_string(src('snippets/mn-icons.liquid')).render()

COUNTRIES = ('<option value="Italy" data-provinces="[]">Italy</option>'
             '<option value="United States" data-provinces="[[&quot;California&quot;,&quot;California&quot;],[&quot;New York&quot;,&quot;New York&quot;]]">United States</option>'
             '<option value="Canada" data-provinces="[[&quot;Ontario&quot;,&quot;Ontario&quot;],[&quot;Quebec&quot;,&quot;Quebec&quot;]]">Canada</option>')
ROUTES = {'root_url': '/', 'account_url': '/account', 'account_login_url': '/account/login', 'account_register_url': '/account/register', 'account_logout_url': '/account/logout',
          'account_addresses_url': '/account/addresses', 'account_recover_url': '/account/login#recover', 'all_products_collection_url': '/collections/all'}
def addr(i, name, a1, city, country, zip_, prov='', company='', phone=''):
    return {'id': i, 'name': name, 'first_name': name.split()[0], 'last_name': name.split()[-1], 'company': company, 'address1': a1, 'address2': '', 'city': city,
            'province': prov, 'province_code': prov[:2].upper() if prov else '', 'zip': zip_, 'country': country, 'phone': phone, 'errors': None}
A1 = addr(11, 'Ajay Ghosh', 'Via della Spiga 12', 'Milan', 'Italy', '20121', phone='+39 02 1234 5678')
A2 = addr(12, 'Ajay Ghosh', '210 Spring Street', 'New York', 'United States', '10012', prov='New York', company='Studio Noir')
NEW = {'id': None, 'errors': None, 'first_name': '', 'last_name': '', 'company': '', 'address1': '', 'address2': '', 'city': '', 'province': '', 'zip': '', 'country': '', 'phone': ''}
def order(name, oid, fin, ful, lines, **kw):
    sub = sum(l['final_line_price'] for l in lines)
    o = {'name': name, 'id': oid, 'created_at': oid, 'customer_url': f'/account/orders/{oid}', 'financial_status': fin, 'financial_status_label': fin.replace('_', ' ').title(),
         'fulfillment_status': ful, 'fulfillment_status_label': ful.replace('_', ' ').title(), 'line_items': lines, 'line_items_subtotal_price': sub,
         'cart_level_discount_applications': [], 'shipping_methods': [{'title': 'Express', 'price': 2500}], 'tax_lines': [{'title': 'VAT', 'rate': 0.22, 'price': 21300}],
         'total_price': sub + 2500, 'total_refunded_amount': 0, 'shipping_address': A1, 'billing_address': A1, 'note': '', 'cancelled': False}
    o.update(kw); return o
def line(k, title, variant, qty, unit, was=None, fulfilled=False, disc=()):
    return {'url': '/products/' + k, 'image': k, 'vendor': 'Maison Noir', 'title': title, 'variant_title': variant, 'sku': 'MN-' + k.upper(), 'quantity': qty,
            'final_price': unit, 'final_line_price': unit * qty, 'original_line_price': (was or unit) * qty, 'properties': [],
            'product': {'title': title, 'url': '/products/' + k, 'has_only_default_variant': not variant},
            'line_level_discount_allocations': [{'discount_application': {'title': d}, 'amount': 5000} for d in disc],
            'fulfillment': {'created_at': 'x', 'tracking_url': 'https://track.example/1Z999', 'tracking_number': '1Z999'} if fulfilled else None}
O1 = order('#1042', 'o1', 'paid', 'fulfilled', [line('dress', 'Washed Silk Slip Dress', 'Black / S', 1, 89000, was=112000, fulfilled=True), line('scarf', 'Silk Twill Scarf', '', 2, 24000, disc=('WELCOME10',))],
           cart_level_discount_applications=[{'title': 'First order', 'total_allocated_amount': 5000}], note='Please gift wrap the scarf.')
O2 = order('#1031', 'o2', 'pending', 'unfulfilled', [line('hoops', 'Gold Vermeil Hoops', 'Gold', 1, 29000)], shipping_address=A2, billing_address=A2)
O3 = order('#1017', 'o3', 'refunded', 'unfulfilled', [line('hoops', 'Gold Vermeil Hoops', 'Gold', 1, 29000)], cancelled=True, cancelled_at='x', cancel_reason_label='Customer changed their mind', total_refunded_amount=31500)

def customer(orders=(O1, O2, O3), addresses=(A1, A2)):
    return {'first_name': 'Ajay', 'email': 'client@example.com', 'orders': list(orders), 'orders_count': len(orders), 'addresses': list(addresses), 'addresses_count': len(addresses),
            'default_address': addresses[0] if addresses else None, 'new_address': NEW}

def section(name, settings=None, **ctx):
    s = src(f'sections/{name}.liquid')
    defaults = {'heading': 'Welcome <em>back</em>', 'side_heading': 'Join <em>Maison Noir</em>', 'perk_1': 'Track orders and returns in one place', 'perk_2': 'Save addresses for a faster checkout',
                'perk_3': 'Early access to new collections', 'image': None, 'show_marketing': True, 'marketing_label': 'Email me about new collections and private sales', 'marketing_checked': False,
                'terms': '<p>By creating an account you agree to our <a href="/policies/privacy-policy">privacy policy</a>.</p>',
                'help_text': '<p>Questions about an order? Write to our client care team.</p>'}
    c = dict(section={'id': 'main', 'settings': dict(defaults, **(settings or {}))}, routes=ROUTES, settings={'wishlist_enabled': True}, shop={'checkout': {'guest_login': False}},
             forms={k: {'errors': None, 'posted_successfully': False} for k in ('customer_login', 'recover_customer_password', 'guest_login', 'create_customer', 'activate_customer_password', 'reset_customer_password')},
             all_country_option_tags=COUNTRIES, paginate={'pages': 1}, customer=customer())
    c.update(ctx)
    return env.from_string(s).render(**c)

def page(name, body, scheme='light'):
    attrs = f'data-scheme="{scheme}" data-corners="soft" data-buttons="default" data-motion="full"'
    fonts = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
    css = ''.join(f'<link rel="stylesheet" href="/{c}">' for c in CSS)
    wish = env.from_string('{% render "mn-wishlist" %}').render(settings={'wishlist_enabled': True})
    html = (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{fonts}{css}'
            f'<style>:root{{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}}</style></head>'
            f'<body data-scroll-reveal="false">{ICONS}<header style="height:64px;border-bottom:1px solid var(--line)"></header><main id="MainContent">{body}</main>{wish}'
            '<script>window.MN_STRINGS={cmp:{},wish:{title:"Wishlist",empty:"Nothing saved yet.",browse:"Browse",remove:"Remove"}};window.routes={root_url:"/",cart_url:"/cart",cart_add_url:"/cart/add",cart_change_url:"/cart/change"};'
            'window.theme_settings={cart_type:"none",money_format:"${{amount}}"};window.theme_strings={}</script>'
            '<script src="/theme.js"></script><script src="/mn.js"></script></body></html>')
    open(os.path.join(OUT, name + '.html'), 'w').write(html)

CSS = ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css', 'mn-collection.css', 'mn-pages.css')
err = lambda *e: {'errors': list(e), 'posted_successfully': False}
F = lambda **kw: {k: dict({'errors': None, 'posted_successfully': False}, **kw.get(k, {})) for k in ('customer_login', 'recover_customer_password', 'guest_login', 'create_customer', 'activate_customer_password', 'reset_customer_password')}
if __name__ == '__main__':
    page('ac_login', section('main-login'))
    page('ac_login_guest', section('main-login', shop={'checkout': {'guest_login': True}}))
    page('ac_login_error', section('main-login', forms=F(customer_login=err('Incorrect email or password.'))))
    page('ac_login_sent', section('main-login', forms=F(recover_customer_password={'posted_successfully': True})))
    page('ac_login_image', section('main-login', {'image': 'dress'}))
    page('ac_register', section('main-register', {'heading': 'Create an <em>account</em>', 'side_heading': 'Already a <em>client?</em>'}))
    page('ac_register_error', section('main-register', {'heading': 'Create an <em>account</em>'}, forms=F(create_customer=err('Email has already been taken.', 'Password is too short (minimum is 5 characters)'))))
    page('ac_activate', section('main-activate-account', {'heading': 'Activate your <em>account</em>'}))
    page('ac_reset', section('main-reset-password', {'heading': 'Choose a new <em>password</em>'}))
    page('ac_account', section('main-account'))
    page('ac_account_empty', section('main-account', customer=customer((), ())))
    page('ac_order', section('main-order', order=O1))
    page('ac_order_cancelled', section('main-order', order=O3))
    page('ac_addresses', section('main-addresses'))
    page('ac_addresses_empty', section('main-addresses', customer=customer(addresses=())))
    page('ac_addresses_error', section('main-addresses', customer=dict(customer(), new_address=dict(NEW, errors=['Address1 can’t be blank']))))
    page('ac_account_dark', section('main-account'), scheme='dark')
    page('ac_login_dark', section('main-login'), scheme='dark')
    for f in CSS + ('theme.js', 'mn.js'):
        shutil.copy(os.path.join('assets', f), OUT)
    print(f'18 pages written to {OUT}')
