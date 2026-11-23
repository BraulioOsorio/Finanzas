#!/usr/bin/env bash
# Extrae flutter_assets del APK NEKO → assets/fonts y assets/neko/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK="${1:-$HOME/Descargas/Neko-8.8.2.apk}"
[[ -f "$APK" ]] || { echo "No hay APK: $APK" >&2; exit 1; }
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -q -o "$APK" -d "$TMP"
SRC="$TMP/assets/flutter_assets/lib/assets"
mkdir -p "$ROOT/assets/fonts" "$ROOT/assets/neko/images" "$ROOT/assets/neko/svgs" "$ROOT/assets/neko/icon"
cp "$SRC/fonts/"*.ttf "$ROOT/assets/fonts/"
cp -r "$SRC/images/"* "$ROOT/assets/neko/images/"
cp -r "$SRC/svgs/"* "$ROOT/assets/neko/svgs/"
cp "$SRC/icon/"*.png "$ROOT/assets/neko/icon/" 2>/dev/null || true
echo "OK — fuentes: $(ls "$ROOT/assets/fonts" | wc -l), neko assets: $(find "$ROOT/assets/neko" -type f | wc -l)"