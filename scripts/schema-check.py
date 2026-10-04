#!/usr/bin/env python3
"""Check every section schema and template against rules Shopify enforces on
upload, so a file is never rejected (and the old one silently kept):
valid JSON, no empty-string defaults, range steps ≤ 101 and defaults on a
step, select defaults among the options, richtext defaults wrapped in a
block tag, inline_richtext defaults using only allowed tags, and every
template setting / block known to its section.

    python3 scripts/schema-check.py      (exit 1 on any problem)
"""
import glob, json, re, sys
bad, warn = [], []
schemas = {}
for f in sorted(glob.glob('sections/*.liquid')):
    m = re.search(r'\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}', open(f, encoding='utf-8').read(), re.S)
    if not m:
        continue
    try:
        sc = json.loads(m.group(1))
    except Exception as e:
        bad.append(f'{f}: schema is not valid JSON ({e})'); continue
    schemas[f[9:-7]] = sc
    def chk(sets, where):
        ids = set()
        for s in sets:
            t, d, i = s.get('type'), s.get('default'), s.get('id')
            if i:
                if i in ids: bad.append(f'{f} {where}: duplicate id {i}')
                ids.add(i)
            if d == '': bad.append(f'{f} {where}: {i} has an empty default')
            if t == 'range':
                st = s.get('step', 1)
                if (s['max'] - s['min']) / st > 101: bad.append(f'{f} {where}: {i} range has more than 101 steps')
                if d is not None and (abs(((d - s['min']) / st) - round((d - s['min']) / st)) > 1e-9 or not s['min'] <= d <= s['max']):
                    bad.append(f'{f} {where}: {i} range default is off the scale')
            if t in ('select', 'radio') and d is not None and d not in [o['value'] for o in s.get('options', [])]:
                bad.append(f'{f} {where}: {i} default is not an option')
            if t == 'richtext' and d and not re.match(r'^\s*<(p|ul|ol|h[1-6])\b', d):
                bad.append(f'{f} {where}: {i} richtext default must start with a block tag')
            if t == 'inline_richtext' and d and re.search(r'<(?!/?(em|strong|b|i|a)\b)', d):
                bad.append(f'{f} {where}: {i} inline_richtext default uses a tag that is not allowed')
    if len(sc.get('name', '')) > 25: bad.append(f'{f}: section name longer than 25 characters')
    for b in sc.get('blocks', []):
        if b.get('name') and len(b['name']) > 25: bad.append(f'{f}: block {b.get("type")} name "{b["name"]}" is longer than 25 characters')
    for pr in sc.get('presets', []):
        if len(pr.get('name', '')) > 25: bad.append(f'{f}: preset name "{pr.get("name")}" is longer than 25 characters')
    chk(sc.get('settings', []), 'settings')
    for b in sc.get('blocks', []):
        chk(b.get('settings', []), 'block ' + b.get('type', ''))
for f in sorted(glob.glob('templates/*.json')):
    try:
        d = json.loads(re.sub(r'^\s*/\*.*?\*/', '', open(f, encoding='utf-8').read(), flags=re.S))
    except Exception as e:
        bad.append(f'{f}: not valid JSON ({e})'); continue
    for k, sec in d.get('sections', {}).items():
        sc = schemas.get(sec.get('type'))
        if sc is None:
            if not str(sec.get('type', '')).startswith('apps'): bad.append(f'{f}: section {k} uses unknown type {sec.get("type")}')
            continue
        ids = {s['id'] for s in sc.get('settings', []) if 'id' in s}
        for sk in sec.get('settings', {}):
            if sk not in ids: warn.append(f'{f}: section {k} has unknown setting {sk} (Shopify ignores it)')
        bt = {b['type']: {s['id'] for s in b.get('settings', []) if 'id' in s} for b in sc.get('blocks', [])}
        for bk, b in sec.get('blocks', {}).items():
            if b.get('type') not in bt and '@app' not in bt:
                bad.append(f'{f}: block {bk} has unknown type {b.get("type")}'); continue
            for sk in b.get('settings', {}):
                if b.get('type') in bt and sk not in bt[b['type']]: bad.append(f'{f}: block {bk} has unknown setting {sk}')
for x in warn: print('warning:', x)
for x in bad: print(x)
print(f'{len(bad)} problem(s) in {len(schemas)} sections')
sys.exit(1 if bad else 0)
