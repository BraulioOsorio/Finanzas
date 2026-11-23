#!/usr/bin/env bash
# Volcado legible de símbolos NEKO en reference/symbols/ (gitignored vía reference/).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIBAPP="${1:-$ROOT/reference/native/libapp.so}"
OUT="$ROOT/reference/symbols"
mkdir -p "$OUT"
strings "$LIBAPP" | rg 'package:neko/' | sort -u >"$OUT/package_paths.txt" || true
strings "$LIBAPP" | rg 'CREATE TABLE|create table' | sort -u >"$OUT/sql_fragments.txt"
strings "$LIBAPP" | rg -o '[A-Z][a-zA-Z]+(Bloc|Service)' | sort -u >"$OUT/blocs_services.txt"
echo "Escrito en $OUT"