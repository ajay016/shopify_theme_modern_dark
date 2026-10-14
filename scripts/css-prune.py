#!/usr/bin/env python3
"""Find (and with --write, remove) rules in a stylesheet whose selectors can
never match: every comma-separated selector names at least one class that
appears in no template, snippet, section, layout, script or setting.

A class counts as used when its name appears as a word anywhere in those
files (so classes built in JS strings or Liquid count), or when it starts
with a prefix that Liquid completes at render time (`foo--{{ ... }}`).

    python3 scripts/css-prune.py assets/theme.css            # report
    python3 scripts/css-prune.py assets/theme.css --write    # rewrite
"""
import glob, re, sys

path = sys.argv[1]; write = '--write' in sys.argv
corpus = ''
for pat in ('layout/*.liquid', 'sections/*.liquid', 'snippets/*.liquid', 'templates/**/*.liquid', 'templates/**/*.json', 'config/*.json', 'assets/*.js', 'locales/en.default.json'):
    for f in glob.glob(pat, recursive=True):
        corpus += open(f, encoding='utf-8').read() + '\n'
# styles inside .liquid files are not "uses" of a class
markup = re.sub(r'<style[^>]*>.*?</style>', ' ', corpus, flags=re.S)
words = set(re.findall(r'[A-Za-z_][\w-]*', markup))
prefixes = set(re.findall(r'([A-Za-z_][\w-]*?[-_])\{\{', markup)) | set(re.findall(r"""['"]([A-Za-z_][\w-]*?[-_])['"]\s*\+""", markup))
prefixes |= set(re.findall(r'([A-Za-z_][\w-]*[-_])\$\{', markup))
SHOPIFY = ('shopify-', 'spr-', 'jdgm', 'klaviyo', 'model-viewer')  # classes Shopify or apps add at runtime
def used(cls):
    if cls.startswith(SHOPIFY): return True
    return cls in words or any(cls.startswith(p) for p in prefixes)
def live(sel):
    sel = re.sub(r'\x00\d+\x00', '', sel)
    sel = re.sub(r':(not|is|where|has)\((?:[^()]|\([^()]*\))*\)', '', sel)   # classes inside :not() etc. never make a selector dead
    classes = re.findall(r'\.(-?[A-Za-z_][\w-]*)', sel)
    return all(used(c) for c in classes)

raw = open(path, encoding='utf-8').read()
comments = []
def stash(m):
    comments.append(m.group(0)); return '\x00%d\x00' % (len(comments) - 1)
src = re.sub(r'/\*.*?\*/', stash, raw, flags=re.S)
restore = lambda t: re.sub(r'\x00(\d+)\x00', lambda m: comments[int(m.group(1))], t)
out, i, n = [], 0, len(src)
removed = []
def parse_block(s, start, depth):
    """Return (rewritten text, index after block content) for rules until a closing brace at this depth."""
    res, i = [], start
    while i < len(s):
        if s[i] == '}':
            if depth == 0:
                res.append('}'); i += 1; continue
            return ''.join(res), i
        j = s.find('{', i)
        k = s.find('}', i)
        if j == -1 or (k != -1 and k < j):
            res.append(s[i:k if k != -1 else len(s)]); i = k if k != -1 else len(s); continue
        head = s[i:j]
        if head.strip().startswith('@'):
            if re.match(r'\s*@(media|supports|container|layer)', head):
                inner, end = parse_block(s, j + 1, depth + 1)
                if inner.strip() and re.search(r'\{', inner):
                    res.append(head + '{' + inner + '}')
                else:
                    removed.append(head.strip() + ' (emptied)')
                i = end + 1; continue
            # @keyframes, @font-face etc: copy verbatim (balanced)
            d, m = 0, j
            while True:
                if s[m] == '{': d += 1
                elif s[m] == '}':
                    d -= 1
                    if d == 0: break
                m += 1
            res.append(s[i:m + 1]); i = m + 1; continue
        end = s.index('}', j)
        body = s[j:end + 1]
        lead = re.match(r'(?:\s|\x00\d+\x00)*', head).group(0)
        parts = [p for p in head.strip().split(',')]
        keep = [p for p in parts if live(p)]
        if not keep:
            removed.append(re.sub(r'\x00\d+\x00', '', head).strip().replace('\n', ' ')[:100])
            res.append(lead)
        elif len(keep) < len(parts):
            removed.extend('  part: ' + re.sub(r'\x00\d+\x00', '', p).strip()[:90] for p in parts if p not in keep)
            res.append(lead + ',\n'.join(re.sub(r'^(?:\s|\x00\d+\x00)*', '', p).strip() for p in keep) + ' ' + body)
        else:
            res.append(head + body)
        i = end + 1
    return ''.join(res), i

text, _ = parse_block(src, 0, 0)
text = restore(text)
# a comment left directly before nothing (its rule removed) goes too
text = re.sub(r'/\*[^*]*(?:\*(?!/)[^*]*)*\*/\s*(?=\n\s*(?:/\*|$|\}))', '', text)
text = re.sub(r'\n{3,}', '\n\n', text)
print(f'{len(removed)} rules or selector parts unreachable; {len(raw.splitlines())} -> {len(text.splitlines())} lines')
for r in removed: print('  -', r)
if write:
    open(path, 'w', encoding='utf-8').write(text)
