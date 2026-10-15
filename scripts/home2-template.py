"""
Build the Maison homepage template from the sections' own presets, in the
design's order (docs/claude_design_ref_home2/index.html).
    python3 scripts/home2-template.py            -> templates/index.maison.json
    python3 scripts/home2-template.py --default  -> also templates/index.json (the home at "/")
The previous default home is kept in templates/index.aureline.json.
"""
import json, re, sys, os

ORDER = ['mh-hero', 'mh-ticker', 'mh-categories', 'mh-new-arrivals', 'mh-editorial', 'mh-best-sellers', 'mh-shop-the-look',
         'mh-limited-drop', 'mh-spotlight', 'mh-atelier', 'mh-lookbook', 'mh-press', 'mh-journal', 'mh-community',
         'mh-services', 'mh-newsletter']
HEADER = '''/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin theme editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */
'''

sections, order = {}, []
for name in ORDER:
    path = f'sections/{name}.liquid'
    if not os.path.exists(path): continue
    schema = json.loads(re.search(r'\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}', open(path, encoding='utf-8').read(), re.S).group(1))
    preset = (schema.get('presets') or [{}])[0]
    key = name.replace('mh-', '')
    sec = {'type': name, 'settings': preset.get('settings', {})}
    blocks = preset.get('blocks', [])
    if blocks:
        sec['blocks'], sec['block_order'] = {}, []
        for i, b in enumerate(blocks, 1):
            bid = f'{b["type"]}-{i}'
            sec['blocks'][bid] = {'type': b['type'], 'settings': b.get('settings', {})}
            sec['block_order'].append(bid)
    sections[key] = sec
    order.append(key)

tpl = HEADER + json.dumps({'sections': sections, 'order': order}, indent=2, ensure_ascii=False) + '\n'
open('templates/index.maison.json', 'w', encoding='utf-8').write(tpl)
if '--default' in sys.argv:
    open('templates/index.json', 'w', encoding='utf-8').write(tpl)
print(f'{len(order)} sections:', ', '.join(order))
