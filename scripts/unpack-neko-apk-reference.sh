#!/usr/bin/env bash
# Desempaqueta el APK completo en reference/ (gitignored) para ingeniería inversa manual.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK="${1:-$HOME/Descargas/Neko-8.8.2.apk}"
OUT="$ROOT/reference/neko-8.8.2-unpacked"
[[ -f "$APK" ]] || { echo "No hay APK: $APK" >&2; exit 1; }
rm -rf "$OUT"
mkdir -p "$OUT"
unzip -q -o "$APK" -d "$OUT"
echo "APK en: $OUT ($(du -sh "$OUT" | cut -f1))"