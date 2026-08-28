#!/usr/bin/env bash
set -euo pipefail

# Собирает финальный статический сайт в ./public для Vercel.
# Логика повторяет .github/workflows/deploy.yml (GitHub Pages) один-в-один,
# чтобы новая площадка отдавала ровно то же, что и текущий honeymontana.com.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="public"

rm -rf "$OUT"
mkdir -p "$OUT"

# 1) Собираем блог
pushd astro-blog >/dev/null
npm ci
npm run build
popd >/dev/null

# 2) Копируем корневые лендинги/ассеты в public/,
#    исключая то же, что исключает GitHub Actions workflow.
rsync -a \
  --exclude '.git' \
  --exclude '.github' \
  --exclude '.claude' \
  --exclude 'scripts' \
  --exclude 'public' \
  --exclude '_site' \
  --exclude 'astro-blog' \
  --exclude 'landing-qa' \
  --exclude 'presentation' \
  --exclude 'stories' \
  --exclude 'linux' \
  --exclude 'school' \
  --exclude 'node_modules' \
  --exclude '.DS_Store' \
  --exclude '*.swp' \
  --exclude '*.swo' \
  --exclude 'vercel.json' \
  --exclude '.vercelignore' \
  --exclude 'CNAME' \
  ./ "$OUT/"

# 3) Кладём собранный блог под /blog/
mkdir -p "$OUT/blog"
rsync -a astro-blog/dist/ "$OUT/blog/"

echo "Build done: $OUT"
