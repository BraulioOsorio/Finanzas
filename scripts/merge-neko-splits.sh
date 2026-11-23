#!/usr/bin/env bash
# Une splits NEKO en un solo APK con APKEditor (instalación manual).
# https://github.com/REAndroid/APKEditor/releases
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:-$ROOT/reference/neko-pulled}"
APKEDITOR="${APKEDITOR_BIN:-$ROOT/reference/tools/APKEditor.jar}"

if [[ ! -d "$DIR" ]]; then
  echo "Carpeta sin APKs: $DIR" >&2
  exit 1
fi
if [[ ! -f "$APKEDITOR" ]]; then
  cat >&2 <<EOF
Falta APKEditor.jar en $APKEDITOR
  curl -fsSL -o APKEditor.jar https://github.com/REAndroid/APKEditor/releases/latest/download/APKEditor.jar
EOF
  exit 1
fi

OUT="$DIR/neko-merged.apk"
java -jar "$APKEDITOR" merge -i "$DIR" -o "$OUT"
echo "Merged: $OUT"
./scripts/verify-neko-apk-has-libapp.sh "$OUT"