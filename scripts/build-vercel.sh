#!/usr/bin/env bash
set -euo pipefail

# Собирает финальный статический сайт в ./public для Vercel.
# Копируем только опубликованные страницы и ассеты: файлы окружения,
# отчёты и служебные каталоги никогда не должны попадать в outputDirectory.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="public"

SITE_ORIGIN="${SITE_URL:-${VERCEL_PROJECT_PRODUCTION_URL:-https://honeymontana-github-io.vercel.app}}"
if [[ "$SITE_ORIGIN" != http://* && "$SITE_ORIGIN" != https://* ]]; then
  SITE_ORIGIN="https://$SITE_ORIGIN"
fi
export SITE_URL="$SITE_ORIGIN"

rm -rf "$OUT"
mkdir -p "$OUT"

# 1) Собираем блог
pushd astro-blog >/dev/null
npm ci
npm run build
popd >/dev/null

# 2) Копируем корневые лендинги и их ассеты по белому списку.
STATIC_PATHS=(
  index.html
  robots.txt
  favicon.png
  favicon-16x16.png
  favicon-32x32.png
  apple-touch-icon.png
  android-chrome-192x192.png
  android-chrome-512x512.png
  content
  course
  img
  minicourse
  pythonbackend
  qa
  reviews
  sa
)

for path in "${STATIC_PATHS[@]}"; do
  cp -R "$path" "$OUT/"
done

# 3) Кладём собранный блог под /blog/
mkdir -p "$OUT/blog"
cp -R astro-blog/dist/. "$OUT/blog/"

# 4) Подставляем канонический origin текущего Vercel-проекта и проверяем output.
node scripts/configure-site-url.mjs "$OUT" "$SITE_ORIGIN"
node scripts/check-vercel-build.mjs "$OUT"

echo "Build done: $OUT ($SITE_ORIGIN)"
