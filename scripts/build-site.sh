#!/usr/bin/env bash
# Assemble the GitHub Pages site into _site/: the landing page from site/, and
# the Next.js app as a static export under /demo/.
#
# The landing page's detail shots are committed under site/screenshots/ (cut by
# scripts/site-images.mjs); the hero map and the social preview are the same
# files the app itself uses. So the Pages runner needs Node, not a browser.
#
#   scripts/build-site.sh            # build _site/
#   scripts/build-site.sh --serve    # build, then serve on 0.0.0.0:8000
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/_site"

VERSION="$(node -p "require('$ROOT/package.json').version")"
DOMAIN="$(tr -d '[:space:]' < "$ROOT/site/CNAME")"
# Full W3C datetime: Google reads <lastmod> for scheduling, date-only is coarser.
BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"

rm -rf "$OUT" "$ROOT/out"
mkdir -p "$OUT/screenshots"

# -- the demo: the app itself, as plain files under /demo ------------------
( cd "$ROOT" && STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/demo NEXT_PUBLIC_SITE_URL="https://$DOMAIN" npx next build >/dev/null )
mv "$ROOT/out" "$OUT/demo"

# -- the landing page -------------------------------------------------------
cp "$ROOT"/site/*.css "$ROOT"/site/*.js "$ROOT"/site/*.svg "$ROOT"/site/*.png "$OUT/"
cp "$ROOT/site/CNAME" "$OUT/"
cp "$ROOT"/site/screenshots/* "$OUT/screenshots/"
cp -R "$ROOT/site/fonts" "$OUT/fonts"
cp "$ROOT/public/posters/example-dark.png" "$OUT/screenshots/"

for file in index.html 404.html robots.txt sitemap.xml; do
  sed -e "s/__VERSION__/$VERSION/g" -e "s|__BUILD_DATE__|$BUILD_DATE|g" -e "s/__DOMAIN__/$DOMAIN/g" \
      "$ROOT/site/$file" > "$OUT/$file"
done

# Any placeholder left behind would ship to production, so fail loudly instead.
if grep -rq "__VERSION__\|__BUILD_DATE__\|__DOMAIN__" "$OUT"/*.html "$OUT"/*.txt "$OUT"/*.xml; then
  echo "unsubstituted placeholder left in _site" >&2
  exit 1
fi

# A file referenced but never copied would 404 in production, where nobody looks.
missing=0
while read -r asset; do
  [ -z "$asset" ] && continue
  case "$asset" in */) asset="${asset}index.html" ;; esac
  [ -f "$OUT/$asset" ] || { echo "referenced but missing: $asset" >&2; missing=1; }
done < <(grep -ho '\(src\|href\)="[^":#]*"' "$OUT/index.html" "$OUT/404.html" \
         | sed 's/.*="//; s/"$//; s|^/||' | sort -u)
[ "$missing" -eq 0 ] || exit 1

echo "built _site for version $VERSION on $DOMAIN ($(du -sh "$OUT" | cut -f1))"

if [ "${1:-}" = "--serve" ]; then
  port="${2:-8000}"
  echo "serving on http://0.0.0.0:$port"
  cd "$OUT"
  exec python3 -m http.server "$port" --bind 0.0.0.0
fi
