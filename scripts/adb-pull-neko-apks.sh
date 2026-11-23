#!/usr/bin/env bash
set -euo pipefail
PKG=com.tuxedolab.paycheckbuddy
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/reference/neko-pulled"
mkdir -p "$OUT"
adb devices | rg -q 'device$' || { echo "Conecta el móvil (adb devices)"; exit 1; }
while read -r line; do
  path="${line#package:}"
  adb pull "$path" "$OUT/$(basename "$path")"
done < <(adb shell pm path "$PKG")
echo "OK → $OUT"