#!/usr/bin/env bash
# Decompila APK NEKO a reference/jadx-out (Java/Kotlin + manifest).
set -euo pipefail
APK="${1:-$HOME/Descargas/Neko-8.8.2.apk}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/reference/jadx-out"
JADX="${JADX_BIN:-}"

if [[ -z "$JADX" ]]; then
  if [[ -x /tmp/jadx-extract/bin/jadx ]]; then
    JADX=/tmp/jadx-extract/bin/jadx
  elif command -v jadx >/dev/null; then
    JADX=jadx
  else
    echo "Instala jadx o descomprime en /tmp/jadx-extract (ver INGENIERIA-INVERSA-NEKO.md)." >&2
    exit 1
  fi
fi

[[ -f "$APK" ]] || { echo "No hay APK: $APK" >&2; exit 1; }
mkdir -p "$OUT"
rm -rf "$OUT"/*
"$JADX" -q -d "$OUT" "$APK"
echo "Listo: $OUT"