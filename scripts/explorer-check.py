"""
Layout explorer (snippets/demo-explorer.liquid) dropped into pages that are
already rendered by the other harnesses: a homepage and the product page
(whose sticky add-to-bag bar the phone pill must clear).
    python3 scripts/home-check.py OUT/hm && python3 scripts/pdp-check.py OUT/t_pdp
    python3 scripts/explorer-check.py OUT && node scripts/r2-test.js OUT
"""
import os, re, sys, glob
from liquid import Environment, DictLoader

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
src = lambda p: open(p, encoding='utf-8').read()
env = Environment(loader=DictLoader({os.path.basename(f)[:-7]: src(f) for f in glob.glob('snippets/demo-explorer*.liquid')}))
PRODUCT = {'url': '/products/slip-dress', 'handle': 'slip-dress'}
ctx = dict(collections={'all': {'products': [PRODUCT]}}, blogs={'news': {'url': '/blogs/news'}}, pages={'about': {'url': '/pages/about'}, 'contact': {'url': '/pages/contact'}},
           template={'name': 'index', 'suffix': ''}, routes={'root_url': '/'}, settings={})
LXP = env.from_string("{% render 'demo-explorer' %}").render(**ctx)

for sub, page in (('hm', 'hm_default'), ('t_pdp', 'pdp_default')):
    f = os.path.join(OUT, sub, page + '.html')
    html = src(f)
    open(os.path.join(OUT, sub, page.split('_')[0] + '_lxp.html'), 'w').write(html.replace('</body>', LXP + '</body>'))
print('explorer pages written:', len(LXP), 'bytes of markup')
