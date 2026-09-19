import re, sys, glob, json, os

CSS = open('assets/theme.css', encoding='utf-8').read()

# Liquid variable names leak into class="" via {{ }}; they are not classes.
NOISE = re.compile(r"""^('.*|.*'|if|endif|unless|endunless|for|endfor|case|when|endcase|else|elsif|and|or|contains|
scheme|columns|layout|align|rail|radius|current|key|feature|blank|nil|
[a-z_]+_class|[a-z_]+_style|[a-z_]+_position|[a-z_]+_mod|[a-z_]+_ratio|[a-z_]+_hover|[a-z_]+_width|
is_[a-z_]+|show_[a-z_]+|[a-z_]+_selected|[a-z_]+_ceil|[a-z_]+_rounded|[a-z_]+_available|[a-z_]+_sidebar|
group_open|thumb_position|card_style|text_align|img_width|render_as|product-card__json)$""", re.X)

# Literal colour is legitimate only for photographic scrims and on-photo controls.
ALLOWED_HEX_CONTEXT = re.compile(r'(scrim|veil|overlay|on-image|onphoto|placeholder|shadow|rgba\(10,\s*10,\s*11)', re.I)


def classes_of(src):
    out = set()
    for m in re.finditer(r'class="([^"]+)"', src):
        for c in m.group(1).split():
            if any(x in c for x in '{}.='):
                continue
            if NOISE.match(c):
                continue
            out.add(c)
    return out


def check(path):
    src = open(path, encoding='utf-8').read()
    inline = '\n'.join(re.findall(r'<style>(.*?)</style>', src, re.S))
    name = os.path.basename(path)
    fails = []

    # 1 — every rendered class has a rule
    missing = [c for c in sorted(classes_of(src)) if ('.' + c) not in CSS and ('.' + c) not in inline]
    if missing:
        fails.append('1 unstyled: ' + ', '.join(missing[:8]) + ('…' if len(missing) > 8 else ''))

    # 2 — surface tone in the schema
    m = re.search(r'\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}', src, re.S)
    if m:
        try:
            sch = json.loads(m.group(1))
            ids = [s.get('id') for s in sch.get('settings', []) or []]
            if 'scheme' not in ids:
                fails.append('2 no Surface tone setting')
        except Exception as e:
            fails.append('2 schema unparseable: %s' % e)

    # 3 — hardcoded colour on a themed surface
    bad_hex = []
    for line in inline.splitlines():
        if re.search(r'(background|color)\s*:\s*#[0-9A-Fa-f]{3,8}', line) and not ALLOWED_HEX_CONTEXT.search(line):
            bad_hex.append(line.strip()[:60])
    if bad_hex:
        fails.append('3 hardcoded colour: %d line(s)' % len(bad_hex))

    # 4 — body copy scales
    unscaled = [l.strip()[:60] for l in inline.splitlines()
                if 'font-size:' in l and 'fs-scale' not in l and 'heading-scale' not in l]
    if unscaled:
        fails.append('4 unscaled font-size: %d' % len(unscaled))

    return name, fails


targets = sys.argv[1:]
paths = sorted(glob.glob('sections/main-*.liquid')) if not targets else \
        [p for t in targets for p in glob.glob('sections/%s.liquid' % t)]

bad = 0
for p in paths:
    name, fails = check(p)
    if fails:
        bad += 1
        print('FAIL  %-32s %s' % (name, ' | '.join(fails)))
    else:
        print('ok    %s' % name)

print('\n%d of %d pages pass checks 1-4. Check 5 (contrast) and 6 (responsive) are separate.'
      % (len(paths) - bad, len(paths)))
sys.exit(1 if bad else 0)
