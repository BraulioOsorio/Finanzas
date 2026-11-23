#!/usr/bin/env bash
# Comprueba si algún APK contiene libapp.so (Dart AOT).
set -euo pipefail
found=0
for apk in "$@"; do
  [[ -f "$apk" ]] || continue
  echo "=== $(basename "$apk") ==="
  if unzip -l "$apk" 2>/dev/null | rg -q 'lib/.*/libapp\.so'; then
    unzip -l "$apk" | rg 'lib/.*/lib(app|flutter)\.so'
    found=1
    echo "OK: libapp.so presente"
  else
    echo "Sin libapp.so (¿solo base APK?)"
    unzip -l "$apk" 2>/dev/null | rg 'requiredSplitTypes|split' || true
  fi
  aapt2 dump badging "$apk" 2>/dev/null | rg "package:|split" | head -5 || true
  echo
done
if [[ $found -eq 0 ]]; then
  echo "Ningún archivo tiene libapp.so — necesitas splits ABI (ver docs/INGENIERIA-INVERSA-NEKO.md)." >&2
  exit 1
fi