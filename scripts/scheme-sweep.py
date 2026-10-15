#!/usr/bin/env python3
"""Colour-scheme sweep. Takes pages the other harnesses render and writes one
copy per theme colour scheme, each carrying the <html> attributes and CSS
variables the store emits for that scheme (snippets/mn-html-attrs,
snippets/css-variables with config/settings_data.json). Run the harnesses
first, then:

    python3 scripts/scheme-sweep.py ROOT && node scripts/scheme-test.js ROOT

ROOT holds the harness output folders (hm, t_collection, t_pdp, t_cart,
t_account, t_content, t_header, t_footer, t_card). Copies are written next to
their source page as sw_<scheme>__<page>.html so relative asset paths hold.
"""
import os, re, sys, importlib.util

ROOT = sys.argv[1]
spec = importlib.util.spec_from_file_location('hc', 'scripts/home-check.py')
hc = importlib.util.module_from_spec(spec); sys.argv = sys.argv[:1] + [os.path.join(ROOT, 'hm')]; spec.loader.exec_module(hc)

SCHEMES = ('olive', 'maison', 'light', 'ivory-wine', 'dark', 'warm', 'custom')
PAGES = {
    'hm': ['hm_default', 'hm_atelier', 'hm_blanc', 'hm_classic', 'hm_lumiere', 'hm_noir', 'hm_page_about-v1', 'hm_list-collections'],
    't_collection': ['cl_sidebar', 'cl_active', 'cl_panel', 'cl_title2', 'sr_results', 'sr_empty'],
    't_pdp': ['pdp_default', 'pdp_det_tabs', 'pdp_countdown'],
    't_cart': ['cp_two', 'cp_disc', 'cp_empty'],
    't_account': ['ac_login', 'ac_register_error', 'ac_account', 'ac_order', 'ac_addresses'],
    't_content': ['ct_blog', 'ct_article', 'ct_page_v2', 'ct_contact', 'ct_404', 'ct_password', 'ct_gift'],
    't_header': ['hd_classic_columns_img', 'hd_centred_columns_txt'],
    't_footer': ['ft_columns_base', 'ft_columns_contrast', 'ft_minimal_base'],
    't_card': ['cd_default'],
}
# pages from home-check.py already carry the store's own scheme variables
_, SAVED_VARS = hc.scheme_vars(hc.SETTINGS.get('color_scheme') or 'olive')
n = 0
for scheme in SCHEMES:
    attrs, vars_ = hc.scheme_vars(scheme)
    for d, pages in PAGES.items():
        for p in pages:
            f = os.path.join(ROOT, d, p + '.html')
            if not os.path.exists(f):
                print('missing', f); continue
            html = open(f, encoding='utf-8').read()
            html = html.replace(SAVED_VARS, '')
            html = re.sub(r'<html\b[^>]*>', '<html ' + attrs.strip() + '>', html, count=1)
            # the harness pages pin their own scheme on <html>; the store sets
            # it from Theme settings, so drop any page-level override
            html = html.replace('<head>', '<head>' + vars_, 1)
            open(os.path.join(ROOT, d, f'sw_{scheme}__{p}.html'), 'w', encoding='utf-8').write(html)
            n += 1
print(f'{n} pages written ({len(SCHEMES)} schemes)')
