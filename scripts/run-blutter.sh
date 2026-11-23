#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIBDIR="${1:-$ROOT/reference/native}"
OUT="${2:-$ROOT/reference/blutter-out}"
BLUTTER="$ROOT/reference/tools/blutter"
[[ -d "$BLUTTER" ]] || { echo "Ejecuta: git clone https://github.com/worawit/blutter $BLUTTER"; exit 1; }
[[ -f "$LIBDIR/libapp.so" ]] || { echo "Falta libapp.so en $LIBDIR"; exit 1; }
mkdir -p "$OUT"
VENV="$ROOT/reference/tools/blutter-venv"
if [[ ! -x "$VENV/bin/python" ]]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q pyelftools requests
fi
cd "$BLUTTER"
"$VENV/bin/python" blutter.py "$LIBDIR" "$OUT" "${@:3}"
echo "Salida: $OUT (asm/, pp.txt, blutter_frida.js)"