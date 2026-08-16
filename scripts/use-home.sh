#!/bin/sh
# ---------------------------------------------------------------
# Switch the live homepage.
#
#   ./scripts/use-home.sh noir
#
# Copies templates/index.<name>.json over templates/index.json,
# which is the file Shopify actually renders at "/". Every design
# is kept in its own file, so switching never destroys another one.
# ---------------------------------------------------------------
set -e

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
NAME="$1"

list_available() {
  echo "Available homepages:"
  for f in "$ROOT"/templates/index.*.json; do
    b=$(basename "$f" .json); b=${b#index.}
    printf '  %s\n' "$b"
  done
}

if [ -z "$NAME" ]; then
  echo "Usage: ./scripts/use-home.sh <name>"
  echo
  list_available
  exit 1
fi

SRC="$ROOT/templates/index.$NAME.json"
DST="$ROOT/templates/index.json"

if [ ! -f "$SRC" ]; then
  echo "No such homepage: $NAME"
  echo
  list_available
  exit 1
fi

# Shopify writes an auto-generated banner at the top of index.json. Strip any
# banner from the source, then write a fresh one, so the result is consistent
# no matter which variant file was used as the source.
{
  printf '/*\n'
  printf ' * ------------------------------------------------------------\n'
  printf ' * IMPORTANT: The contents of this file are auto-generated.\n'
  printf ' *\n'
  printf ' * This file may be updated by the Shopify admin theme editor\n'
  printf ' * or related systems. Please exercise caution as any changes\n'
  printf ' * made to this file may be overwritten.\n'
  printf ' * ------------------------------------------------------------\n'
  printf ' */\n'
  awk 'NR==1 && $0 ~ /^\/\*/ {inc=1} inc && $0 ~ /^ \*\// {inc=0; next} inc {next} {print}' "$SRC"
} > "$DST.tmp"

# Refuse to install a broken template.
if command -v node >/dev/null 2>&1; then
  node -e "
    const fs=require('fs');
    const raw=fs.readFileSync('$DST.tmp','utf8').replace(/\/\*[\s\S]*?\*\//,'');
    const j=JSON.parse(raw);
    if(!j.order||!j.order.length) throw new Error('template has no sections');
    j.order.forEach(id=>{ if(!j.sections[id]) throw new Error('order references missing section: '+id); });
    console.log('  ' + j.order.length + ' sections: ' + j.order.join(', '));
  " || { rm -f "$DST.tmp"; echo "ABORTED — $SRC is not valid JSON"; exit 1; }
fi

mv "$DST.tmp" "$DST"
echo "Homepage is now: $NAME"
echo "Run 'shopify theme dev' (or restart it) to see the change."
