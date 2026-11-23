#!/usr/bin/env bash
# Extrae base + splits de NEKO instalado en el móvil (com.tuxedolab.paycheckbuddy).
set -euo pipefail
PKG=com.tuxedolab.paycheckbuddy
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/reference/neko-pulled"
mkdir -p "$OUT"

if ! adb devices | rg -q 'device$'; then
  echo "Conecta el Android con depuración USB y que 'adb devices' muestre 'device'." >&2
  exit 1
fi

if ! adb shell pm path "$PKG" >/tmp/neko_paths.txt 2>/dev/null; then
  echo "NEKO no instalado ($PKG)." >&2
  exit 1
fi

i=0
while read -r line; do
  path="${line#package:}"
  name=$(basename "$path")
  echo "Pull $path → $OUT/$name"
  adb pull "$path" "$OUT/$name"
  i=$((i + 1))
done </tmp/neko_paths.txt

echo "Descargados $i APK(s) en $OUT"
echo "Siguiente: ./scripts/verify-neko-apk-has-libapp.sh $OUT/*.apk"