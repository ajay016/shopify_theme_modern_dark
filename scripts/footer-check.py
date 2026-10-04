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

def src(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'\{%\s*schema\s*%\}.*?\{%\s*endschema\s*%\}', '', s, flags=re.S)
    s = re.sub(r"\{%-?\s*form\s+'(\w+)',\s*id:\s*'(\w+)',\s*class:\s*'([\w -]+)'\s*-?%\}", r'<form id="\2" class="\3" data-form="\1">', s)
    s = re.sub(r'\{%-?\s*endform\s*-?%\}', '</form>', s)
    return s.replace('form.posted_successfully?', 'form_ok').replace('form.errors', 'form_errors')
snips = {n: src(f'snippets/{n}.liquid') for n in ('mn-social', 'mn-localization', 'mn-icons')}
env = Environment(loader=DictLoader(snips))
env.filters['t'] = rc._translate
env.filters['image_url'] = lambda v, *a, **k: ''
env.filters['image_tag'] = lambda v, *a, **k: ''
env.filters['payment_type_svg_tag'] = lambda v, *a, **k: f'<svg viewBox="0 0 38 24" class="payment-icon"><rect width="38" height="24" rx="3" fill="#ddd"/><text x="5" y="16" font-size="9">{v[:4]}</text></svg>'

SRC = src('sections/footer.liquid')

def links(*titles):
    return {'title': 'Menu', 'links': [{'title': t, 'url': '/pages/' + t.lower().replace(' ', '-'), 'active': False} for t in titles]}
MENUS = {'footer': links('New in', 'Women', 'Men', 'Accessories', 'The Silk Edition'),
         'care': links('Contact us', 'Shipping', 'Returns & exchanges', 'Size guide', 'Caring for silk'),
         'maison': links('Our story', 'Ateliers', 'Materials', 'Careers', 'Press'),
         'stores': links('Milan', 'Paris', 'London', 'New York', 'Book an appointment')}
LOC = {'available_countries': [{'iso_code': c, 'name': n, 'currency': {'iso_code': cur, 'symbol': sym}} for c, n, cur, sym in
        (('US', 'United States', 'USD', '$'), ('GB', 'United Kingdom', 'GBP', '£'), ('FR', 'France', 'EUR', '€'), ('JP', 'Japan', 'JPY', '¥'))],
       'country': {'iso_code': 'US'},
       'available_languages': [{'iso_code': 'en', 'endonym_name': 'English'}, {'iso_code': 'fr', 'endonym_name': 'français'}],
       'language': {'iso_code': 'en'}}
SCHEME = {'light': 'light', 'ivory-wine': 'wine', 'dark': 'dark', 'warm': 'warm'}
ICONS = env.from_string(snips['mn-icons']).render()
CSS = ''.join(f'<link rel="stylesheet" href="{c}">' for c in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-product.css', 'mn-footer.css', 'mn-motion.css', 'mn-shopify.css'))

def page(style, tone, scheme='light'):
    settings = {'footer_style': style, 'footer_tone': tone, 'footer_newsletter': True,
                'footer_newsletter_heading': 'Join the list', 'footer_newsletter_text': 'New collections, private sales and notes from Florence, twice a month.',
                'footer_band_title': 'Letters from <em>the atelier</em>', 'footer_newsletter_note': 'Unsubscribe at any time. Read our privacy policy.',
                'footer_newsletter_done': 'Thank you. Your first letter arrives on Friday.', 'footer_copyright': '© 2026 Maison Noir S.r.l.',
                'footer_wordmark': '', 'logo_text': 'Maison Noir', 'footer_logo': '', 'logo': '',
                'footer_description': '<p>Ready-to-wear in silk, cashmere and leather, made in limited runs in Florence and Porto since 2011.</p>',
                'footer_menu_1': 'footer', 'footer_menu_1_title': 'Shop', 'footer_menu_2': 'care', 'footer_menu_2_title': 'Client care',
                'footer_menu_3': 'maison', 'footer_menu_3_title': 'Maison', 'footer_menu_4': 'stores', 'footer_menu_4_title': 'Stores',
                'social_instagram': 'https://instagram.com/x', 'social_pinterest': 'https://pinterest.com/x', 'social_tiktok': 'https://tiktok.com/@x',
                'social_youtube': 'https://youtube.com/x', 'social_facebook': '', 'social_twitter': '',
                'footer_show_localization': True, 'footer_show_payment_icons': True, 'footer_back_to_top': True}
    html = env.from_string(SRC).render(settings=settings, linklists=MENUS, routes={'root_url': '/'},
        shop={'name': 'Maison Noir', 'enabled_payment_types': ['visa', 'master', 'american_express', 'paypal', 'apple_pay', 'shopify_pay']},
        localization=LOC, form_ok=False, form_errors=None)
    attrs = f'data-scheme="{SCHEME[scheme]}" data-corners="soft" data-buttons="default" data-motion="full" data-footer="{style}"'
    fonts = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
    return (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{fonts}{CSS}'
            f'<style>:root{{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}}</style></head><body data-scroll-reveal="false">{ICONS}'
            f'<main id="MainContent" tabindex="-1" style="height:1400px;padding:40px">Page</main>{html}'
            f'<script src="theme.js"></script><script src="mn.js"></script></body></html>')

n = 0
for style in ('columns', 'statement', 'minimal'):
    for tone in ('base', 'soft', 'deep', 'contrast'):
        open(os.path.join(OUT, f'ft_{style}_{tone}.html'), 'w').write(page(style, tone)); n += 1
for scheme in ('dark', 'light', 'ivory-wine', 'warm'):
    for tone in ('soft', 'contrast'):
        open(os.path.join(OUT, f'ft_scheme_{scheme}_{tone}.html'), 'w').write(page('columns', tone, scheme)); n += 1
import shutil
for js in ('theme.js', 'mn.js'):
    shutil.copy(os.path.join('assets', js), OUT)
print(f'{n} pages written to {OUT}')
