"""
D8b: one page in the reference's default configuration, built from the
real theme sections the other harnesses already render:
  announcement (ticker) + classic header  <- t_header/hd_classic_columns_img.html
  product page (light, soft, gallery left) <- t_pdp/pdp_ref.html
  footer (columns, deep)                    <- t_footer/ft_columns_deep.html
    python3 scripts/header-check.py OUT/t_header && python3 scripts/pdp-check.py OUT/t_pdp
    python3 scripts/footer-check.py OUT/t_footer && python3 scripts/d8b-check.py OUT
    node scripts/d8b-compare.js OUT
"""
import os, re, sys, shutil
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
rd = lambda *p: open(os.path.join(OUT, *p), encoding='utf-8').read()
hd, pdp, ft = rd('t_header', 'hd_classic_columns_img.html'), rd('t_pdp', 'pdp_ref.html'), rd('t_footer', 'ft_columns_deep.html')

head_chunk = hd[hd.index('>', hd.index('<body')) + 1: hd.index('<div class="shopify-section"><section style="height:480px')]
foot_chunk = ft[ft.index('</main>') + len('</main>'): ft.index('<script')]
body_open = pdp.index('>', pdp.index('<body')) + 1
page = pdp[:body_open] + head_chunk + pdp[pdp.index('<main'):]
page = page.replace('<div style="height:900px"></div></main>', '</main>' + foot_chunk, 1)
page = re.sub(r'<html[^>]*>', '<html lang="en" data-scheme="light" data-corners="soft" data-buttons="default" data-motion="full" data-header="classic" '
              'data-announce="ticker" data-mega="columns" data-mega-images="on" data-footer="columns">', page, count=1)
os.makedirs(os.path.join(OUT, 'd8b'), exist_ok=True)
open(os.path.join(OUT, 'd8b', 'ours.html'), 'w').write(page)
for f in os.listdir(os.path.join(OUT, 't_pdp')):
    if f.endswith(('.css', '.js')): shutil.copy(os.path.join(OUT, 't_pdp', f), os.path.join(OUT, 'd8b', f))
shutil.copytree(os.path.join(OUT, 't_pdp', 'mock'), os.path.join(OUT, 'd8b', 'mock'), dirs_exist_ok=True)
print('d8b/ours.html written')
