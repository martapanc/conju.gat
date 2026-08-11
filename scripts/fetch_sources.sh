#!/usr/bin/env bash
# Fetch the upstream language data. Both sources are copyleft (GPL-2.0 /
# LGPL-2.1); they are downloaded rather than vendored, so the repo carries our
# derived dataset and the code that builds it, not someone else's dictionary.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p data/raw

echo "→ verbecc (template di coniugazione, GPL-2.0)"
base="https://raw.githubusercontent.com/bretttolbert/verbecc/main/verbecc/data/xml"
curl -fsSL -o data/raw/conj-ca.xml "$base/conjugations/conjugations-ca.xml"
curl -fsSL -o data/raw/verbs-ca.xml "$base/verbs/verbs-ca.xml"

echo "→ Softcatalà catalan-dictionary (verità di riferimento, GPL-2.0 / LGPL-2.1)"
tmp="$(mktemp -d)"
curl -fsSL -o "$tmp/data.zip" \
  "https://huggingface.co/datasets/softcatala/catalan-dictionary/resolve/main/data.zip"
unzip -oq "$tmp/data.zip" -d "$tmp"
mv "$tmp/diccionari.txt" data/raw/softcatala-diccionari.txt
rm -rf "$tmp"

echo
ls -lh data/raw
echo
echo "Fatto. Ora: npm run data"
