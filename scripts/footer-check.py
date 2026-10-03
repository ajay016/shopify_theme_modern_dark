#!/usr/bin/env python3
"""Render the real footer (3 styles x 4 surfaces, five colour schemes for the
contrast check) with menus, socials, newsletter, localization and payment
icons, wrapped in a page with the real theme.css / theme.js, for
scripts/footer-test.js.

    python3 scripts/footer-check.py OUTDIR
"""
import os, re, sys, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
spec = importlib.util.spec_from_file_location('rc', 'scripts/render-check.py')
rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)

snips = {'icon-social': open('snippets/icon-social.liquid', encoding='utf-8').read()}
env = Environment(loader=DictLoader(snips))
env.filters['t'] = rc._translate
env.filters['image_url'] = lambda v, *a, **k: ''
env.filters['image_tag'] = lambda v, *a, **k: ''
env.filters['payment_type_svg_tag'] = lambda v, *a, **k: f'<svg viewBox="0 0 38 24" class="payment-icon"><rect width="38" height="24" rx="3" fill="#ddd"/><text x="5" y="16" font-size="9">{v[:4]}</text></svg>'

SRC = open('sections/footer.liquid', encoding='utf-8').read()
SRC = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', SRC, flags=re.S)
# The Shopify-only {% form %} tag, as the HTML it produces.
SRC = re.sub(r"\{%-?\s*form\s+'(\w+)',\s*id:\s*'(\w+)',\s*class:\s*'([\w-]+)'\s*-?%\}", r'<form id="\2" class="\3" data-form="\1">', SRC)
SRC = re.sub(r'\{%-?\s*endform\s*-?%\}', '</form>', SRC)
SRC = SRC.replace('form.posted_successfully?', 'form_ok').replace('form.errors', 'form_errors')

def links(*titles):
    return {'title': 'Menu', 'links': [{'title': t, 'url': '/pages/' + t.lower().replace(' ', '-'), 'active': False} for t in titles]}
MENUS = {'footer': links('New arrivals', 'Clothing', 'Shoes', 'Bags', 'Sale'),
         'brand': links('Our story', 'Sustainability', 'Journal', 'Careers'),
         'help': links('Contact', 'Shipping & returns', 'Size guide', 'FAQ')}
LOC = {'available_countries': [{'iso_code': c, 'name': n, 'currency': {'iso_code': cur, 'symbol': sym}} for c, n, cur, sym in
        (('US', 'United States', 'USD', '$'), ('GB', 'United Kingdom', 'GBP', '£'), ('FR', 'France', 'EUR', '€'), ('JP', 'Japan', 'JPY', '¥'))],
       'country': {'iso_code': 'US'},
       'available_languages': [{'iso_code': 'en', 'endonym_name': 'English'}, {'iso_code': 'fr', 'endonym_name': 'français'}],
       'language': {'iso_code': 'en'}}
VARS = {}

def page(style, tone, scheme='light'):
    if scheme not in VARS:
        VARS[scheme] = Environment().from_string(open('snippets/css-variables.liquid', encoding='utf-8').read()).render(
            settings={'color_scheme': scheme, 'font_pairing': 'dm_serif_dm_sans', 'type_body_size': 14})
    settings = {'footer_style': style, 'footer_tone': tone, 'footer_newsletter': True,
                'footer_newsletter_heading': 'Join the list', 'footer_newsletter_text': 'New collections and private sales, twice a month at most.',
                'footer_wordmark': '', 'logo_text': 'MAISON·NOIR', 'footer_logo': '', 'logo': '',
                'footer_description': '<p>Luxury fashion with a considered approach to design and craft.</p>',
                'footer_menu_1': 'footer', 'footer_menu_1_title': 'Shop', 'footer_menu_2': 'brand', 'footer_menu_2_title': 'Brand',
                'footer_menu_3': 'help', 'footer_menu_3_title': 'Help',
                'social_instagram': 'https://instagram.com/x', 'social_pinterest': 'https://pinterest.com/x', 'social_tiktok': 'https://tiktok.com/@x',
                'social_facebook': '', 'social_twitter': 'https://x.com/x',
                'footer_show_localization': True, 'footer_show_payment_icons': True, 'footer_back_to_top': True}
    html = env.from_string(SRC).render(settings=settings, linklists=MENUS, routes={'root_url': '/'},
        shop={'name': 'Maison Noir', 'enabled_payment_types': ['visa', 'master', 'american_express', 'paypal', 'apple_pay']},
        localization=LOC, form_ok=False, form_errors=None)
    return (f'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<link rel="stylesheet" href="theme.css">{VARS[scheme]}</head><body data-scroll-reveal="false">'
            f'<main id="MainContent" tabindex="-1" style="height:1400px;padding:40px;background:var(--s1-bg)">Page</main>{html}'
            f'<script src="theme.js"></script></body></html>')

n = 0
for style in ('columns', 'statement', 'minimal'):
    for tone in ('base', 'soft', 'deep', 'contrast'):
        open(os.path.join(OUT, f'ft_{style}_{tone}.html'), 'w').write(page(style, tone)); n += 1
for scheme in ('dark', 'light', 'ivory-wine', 'warm'):
    for tone in ('soft', 'contrast'):
        open(os.path.join(OUT, f'ft_scheme_{scheme}_{tone}.html'), 'w').write(page('columns', tone, scheme)); n += 1
print(f'{n} pages written to {OUT}')
