#!/usr/bin/env python3
"""Render the real content sections and layouts (journal, article, page,
contact, 404, password, gift card) for several states into pages that load
the real theme CSS/JS. Uses the form handling of scripts/account-check.py and
the product fixtures of scripts/card-check.py.

    python3 scripts/content-check.py OUTDIR && node scripts/content-test.js OUTDIR
"""
import os, re, shutil, sys, importlib.util
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
ac = load('ac', 'scripts/account-check.py')
cc = load('cc', 'scripts/card-check.py')

def src(path):
    s = open(path, encoding='utf-8').read()
    s = s.replace('comments_enabled?', 'comments_enabled').replace('moderated?', 'moderated').replace("'new_comment', article,", "'new_comment',")
    s = re.sub(r'\{%-?\s*layout\s+none\s*-?%\}', '', s)
    return ac.src.__wrapped__(s) if hasattr(ac.src, '__wrapped__') else _forms(s)
def _forms(s):
    import tempfile
    with tempfile.NamedTemporaryFile('w', suffix='.liquid', delete=False) as f:
        f.write(s); tmp = f.name
    out = ac.src(tmp); os.unlink(tmp); return out

FONTS = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap" rel="stylesheet">'
NAMES = ('mn-icons', 'mn-password', 'mn-pagination', 'mn-article-card', 'product-card', 'swatch-style', 'mn-html-attrs', 'mn-wishlist')
loader = {n: src(f'snippets/{n}.liquid') for n in NAMES}
loader.update({'css-variables': '<style>:root{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}</style>', 'mn-fonts': FONTS})
env = Environment(loader=DictLoader(loader))
for k, f in cc.env.filters.items(): env.filters[k] = f
for k, f in ac.env.filters.items():
    if k not in ('image_url', 'image_tag', 'json'): env.filters[k] = f
def image_url(v, *a, **k):
    if isinstance(v, dict): return v['src']
    return ac.svg({'silk': 'C9B89A', 'atelier': '3A3A3A', 'coat': '8A6A4A', 'gift': '151515', 'hero': 'B9A88E'}.get(str(v), 'B9A88E'))
env.filters['image_url'] = image_url
env.filters['image_tag'] = lambda v, *a, **k: f'<img src="{v}" alt="{k.get("alt", "")}" class="{k.get("class", "")}" loading="{k.get("loading", "lazy")}">'
env.filters['money_without_trailing_zeros'] = lambda v, *a, **k: '$' + format(int(v) / 100, ',.0f')
env.filters['format_code'] = lambda v, *a, **k: ' '.join(str(v)[i:i + 4] for i in range(0, len(str(v)), 4))
env.filters['shopify_asset_url'] = lambda v, *a, **k: '/' + str(v).split('/')[-1]
env.filters['url_encode'] = lambda v, *a, **k: str(v).replace(' ', '+')
env.filters['handle'] = lambda v, *a, **k: str(v).lower().replace(' ', '-')
ICONS = ac.ICONS

LOREM = ('<p>Mulberry silk is the most forgiving fibre we work with, and the most misunderstood. Treated well it lasts for decades and softens with every wear.</p>'
         '<h2>Wash it cold, and briefly</h2><p>Hand wash in cool water with a pH-neutral soap. Do not wring: press the water out in a towel and dry flat, away from direct light.</p>'
         '<blockquote><p>The best care is less care. Silk rewards patience.</p></blockquote>'
         '<ul><li>Steam rather than iron</li><li>Store folded, never on a hanger</li><li>Keep away from perfume</li></ul>'
         '<h3>When to call a professional</h3><p>Structured pieces, linings and anything beaded belong with a specialist. <a href="/pages/care">Read our care guide</a>.</p>')
def art(i, title, tags, img, author='Clara Rossi', excerpt=''):
    return {'id': i, 'title': title, 'url': f'/blogs/journal/{i}', 'tags': list(tags), 'image': img, 'author': author, 'published_at': f'p{i}',
            'excerpt': excerpt, 'content': LOREM, 'comments_count': 0, 'comments': []}
ARTS = [art(1, 'Caring for silk, season after season', ('Care',), 'silk', excerpt='A short guide to washing, storing and steaming the fibre we love most.'),
        art(2, 'Inside the Como atelier', ('Atelier',), 'atelier'),
        art(3, 'The wrap coat, cut three ways', ('Style', 'Outerwear'), 'coat'),
        art(4, 'Notes on a capsule wardrobe', ('Style',), None, author='Maison Noir'),
        art(5, 'Gold vermeil, explained', ('Care',), 'hero')]
BLOG = {'title': 'Journal', 'url': '/blogs/journal', 'articles': ARTS, 'all_tags': ['Atelier', 'Care', 'Outerwear', 'Style'], 'comments_enabled': True, 'moderated': True,
        'previous_article': ARTS[2], 'next_article': ARTS[0]}
ROUTES = dict(ac.ROUTES, search_url='/search')
FORMS = lambda **kw: {k: dict({'errors': None, 'posted_successfully': False}, **kw.get(k, {})) for k in ('new_comment', 'contact', 'customer', 'storefront_password')}

def render(name, settings, **ctx):
    c = dict(section={'id': 'main', 'settings': settings, 'blocks': ctx.pop('blocks', [])}, routes=ROUTES, settings=dict(cc.SET, logo=None, logo_text='Maison Noir'),
             shop={'name': 'Maison Noir', 'url': 'https://maison-noir.example', 'password_message': ''}, forms=FORMS(), blog=BLOG, collections={'all': {'id': 1, 'url': '/collections/all', 'products': cc.P[:4]}},
             paginate={'pages': 1, 'current_page': 1}, current_tags=None, powered_by_link='<a href="https://www.shopify.com">Powered by Shopify</a>')
    c.update(ctx)
    return env.from_string(src(f'sections/{name}.liquid')).render(**c)

def page(name, body, scheme='light', template='page'):
    attrs = f'data-scheme="{scheme}" data-corners="soft" data-buttons="default" data-motion="full"'
    css = ''.join(f'<link rel="stylesheet" href="/{c}">' for c in ac.CSS)
    wish = env.from_string('{% render "mn-wishlist" %}').render(settings={'wishlist_enabled': True})
    html = (f'<!doctype html><html {attrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{FONTS}{css}'
            f'<style>:root{{--ff-display:"Newsreader",Georgia,serif;--ff-body:"Geist",system-ui,sans-serif;--ff-mono:"Geist Mono",monospace}}</style></head>'
            f'<body class="template-{template}" data-scroll-reveal="false">{ICONS}<header style="height:64px;border-bottom:1px solid var(--line)"></header><main id="MainContent">{body}</main>{wish}'
            '<script>window.MN_STRINGS={cmp:{},wish:{}};window.routes={root_url:"/",cart_url:"/cart",cart_add_url:"/cart/add",cart_change_url:"/cart/change"};'
            'window.theme_settings={cart_type:"none",money_format:"${{amount}}"};window.theme_strings={}</script>'
            '<script src="/theme.js"></script><script src="/mn.js"></script></body></html>')
    open(os.path.join(OUT, name + '.html'), 'w').write(html)

BLOG_DEF = {'eyebrow': 'The journal', 'intro': '<p>Notes from the atelier, care guides and the stories behind each piece.</p>', 'layout': 'grid', 'feature_first': True, 'image_ratio': 'landscape',
            'show_tag_filter': True, 'show_sidebar': False, 'show_date': True, 'show_author': True, 'show_tags': True, 'show_excerpt': True, 'show_search': True, 'posts_per_page': 8}
ART_DEF = {'sidebar': 'none', 'width': 'narrow', 'show_excerpt': True, 'show_reading_time': True, 'show_share': True, 'show_comments': True, 'show_more': True, 'more_heading': 'Keep <em>reading</em>'}
CON_DEF = {'eyebrow': 'Client care', 'heading': 'Get in <em>touch</em>', 'use_page_title': False, 'intro': '<p>Questions about sizing, an order or a piece you have seen? We reply within one working day.</p>',
           'layout': 'split', 'show_phone': False, 'show_subject': True, 'show_order': True, 'textarea_rows': 6, 'note': 'We never share your details.'}
BLOCKS = [{'type': 'detail', 'shopify_attributes': '', 'settings': {'label': l, 'value': v, 'link': k, 'note': n}} for l, v, k, n in
          (('Email', 'care@maisonnoir.example', '', 'Monday to Friday, 9:00 to 18:00'), ('Phone', '+39 02 1234 5678', 'tel:+390212345678', ''), ('Atelier', 'Via della Spiga 12, Milan', '', 'Visits by appointment'))]
PAGE = {'title': 'Our story', 'content': LOREM}

page('ct_blog', render('main-blog', BLOG_DEF), template='blog')
page('ct_blog_list', render('main-blog', dict(BLOG_DEF, layout='list')), template='blog')
page('ct_blog_masonry', render('main-blog', dict(BLOG_DEF, layout='masonry', show_sidebar=True)), template='blog')
page('ct_blog_sidebar', render('main-blog', dict(BLOG_DEF, show_sidebar=True)), template='blog')
page('ct_blog_tag', render('main-blog', BLOG_DEF, current_tags=['Care']), template='blog')
page('ct_blog_empty', render('main-blog', BLOG_DEF, blog=dict(BLOG, articles=[], all_tags=[])), template='blog')
ART = dict(ARTS[0], comments_count=2, comments=[{'id': 1, 'author': 'Elena', 'created_at': 'c1', 'content': '<p>Thank you, this saved my favourite blouse.</p>'},
                                                {'id': 2, 'author': 'Marc', 'created_at': 'c2', 'content': '<p>Does the same apply to silk twill scarves?</p>'}])
page('ct_article', render('main-article', ART_DEF, article=ART), template='article')
page('ct_article_left', render('main-article', dict(ART_DEF, sidebar='left'), article=ART), template='article')
page('ct_article_right', render('main-article', dict(ART_DEF, sidebar='right', width='wide'), article=ART), template='article')
page('ct_article_posted', render('main-article', ART_DEF, article=dict(ARTS[1], comments=[]), forms=FORMS(new_comment={'posted_successfully': True})), template='article')
page('ct_article_noimg', render('main-article', dict(ART_DEF, show_comments=False), article=ARTS[3], blog=dict(BLOG, comments_enabled=False)), template='article')
page('ct_page', render('main-page', {'layout': 'v1', 'eyebrow': '', 'narrow': False}, page=PAGE))
page('ct_page_v2', render('main-page', {'layout': 'v2', 'eyebrow': 'Maison Noir', 'narrow': True}, page=PAGE))
page('ct_contact', render('main-contact', CON_DEF, blocks=BLOCKS, page={'title': 'Contact', 'content': ''}))
page('ct_contact_centered', render('main-contact', dict(CON_DEF, layout='centered'), blocks=BLOCKS, page={'title': 'Contact', 'content': ''}))
page('ct_contact_sent', render('main-contact', CON_DEF, blocks=BLOCKS, page={'title': 'Contact', 'content': ''}, forms=FORMS(contact={'posted_successfully': True})))
page('ct_contact_error', render('main-contact', CON_DEF, blocks=BLOCKS, page={'title': 'Contact', 'content': ''}, forms=FORMS(contact={'errors': ['Email is invalid.']})))
page('ct_404', render('main-404', {'heading': 'This page has <em>moved on</em>', 'show_search': True, 'show_products': True, 'collection': '', 'products_heading': 'Perhaps <em>these</em>'}), template='404')
page('ct_dark_article', render('main-article', ART_DEF, article=ART), scheme='dark', template='article')

# password and gift card are full layouts of their own
PW_DEF = {'eyebrow': 'Opening soon', 'heading': 'Something <em>considered</em> is coming', 'text': '<p>We are putting the finishing touches to the collection.</p>',
          'show_newsletter': True, 'newsletter_label': 'Be the first to know', 'image': None}
LAYOUT = src('layout/password.liquid')
SET = {'color_scheme': 'olive', 'corner_radius': 'soft', 'button_shape': 'default', 'header_style': 'v1', 'footer_style': 'columns', 'logo': None, 'logo_text': 'Maison Noir', 'favicon': ''}
def pw(name, **kw):
    sec = render('main-password', dict(PW_DEF, **kw.pop('s', {})), **kw)
    html = env.from_string(LAYOUT).render(settings=SET, shop={'name': 'Maison Noir'}, content_for_header='', content_for_layout=sec, request={'locale': {'iso_code': 'en'}})
    html = html.replace('"theme.css"', '"/theme.css"')
    open(os.path.join(OUT, name + '.html'), 'w').write(fix(html))
def fix(html):
    for c in ('theme.css', 'mn-core.css', 'mn-header.css', 'mn-motion.css', 'mn-shopify.css', 'mn-collection.css', 'mn-pages.css', 'theme.js', 'mn.js'):
        html = html.replace(f'"{c}"', f'"/{c}"')
    return re.sub(r'(href|src)="/?([\w.-]+\.(css|js))"', r'\1="/\2"', html)
env.filters['asset_url'] = lambda v, *a, **k: '/' + str(v)
env.filters['stylesheet_tag'] = lambda v, *a, **k: f'<link rel="stylesheet" href="{v}">'
pw('ct_password')
pw('ct_password_image', s={'image': 'hero'})
pw('ct_password_error', forms=FORMS(storefront_password={'errors': ['Password is incorrect']}))
pw('ct_password_subscribed', forms=FORMS(customer={'posted_successfully': True}))
GIFT = src('templates/gift_card.liquid')
def gift(name, **g):
    card = dict({'initial_value': 25000, 'balance': 25000, 'code': 'MNGIFT2026ABCD', 'enabled': True, 'expired': False, 'expires_on': None, 'qr_identifier': 'abc123', 'pass_url': None}, **g)
    html = env.from_string(GIFT).render(settings=SET, shop={'name': 'Maison Noir', 'url': '/'}, gift_card=card, content_for_header='', request={'locale': {'iso_code': 'en'}})
    open(os.path.join(OUT, name + '.html'), 'w').write(fix(html))
gift('ct_gift')
gift('ct_gift_used', balance=9000, expires_on='2027-12-31')
gift('ct_gift_expired', expired=True)
open(os.path.join(OUT, 'qrcode.js'), 'w').write('window.QRCode=function(el,o){var c=document.createElement("canvas");c.width=o.width;c.height=o.height;c.setAttribute("data-qr",o.text);el.appendChild(c);};')
for f in ac.CSS + ('theme.js', 'mn.js'):
    shutil.copy(os.path.join('assets', f), OUT)
print(f'{len([f for f in os.listdir(OUT) if f.startswith("ct_") and f.endswith(".html")])} pages written to {OUT}')
