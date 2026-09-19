#!/usr/bin/env bash
# Runs checks 1-5 of the definition of done in docs/ROADMAP.md.
# Check 6 (responsive, in a browser) is not automatable and is not attempted here.
#
#   ./scripts/check-page.sh              all page sections
#   ./scripts/check-page.sh main-cart    one section
set -uo pipefail
cd "$(dirname "$0")/.."
python3 scripts/check_page.py "$@"
