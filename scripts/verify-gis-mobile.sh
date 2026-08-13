#!/usr/bin/env bash
set -euo pipefail

url="${1:-http://localhost:3000/#territorio}"
output="${2:-/home/ubuntu/webdev-static-assets/regularizando-gis-mobile-375.png}"

mkdir -p "$(dirname "$output")"
chromium \
  --headless \
  --no-sandbox \
  --disable-gpu \
  --hide-scrollbars \
  --virtual-time-budget=3000 \
  --window-size=375,812 \
  --screenshot="$output" \
  "$url"

test -s "$output"
printf 'Validação móvel registrada em %s\n' "$output"
