#!/usr/bin/env bash
# Regenera stubs Dart desde libapp.so (símbolos Bloc/Service).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIBAPP="${1:-$ROOT/reference/native/libapp.so}"
OUT="$ROOT/neko/lib/reverse_engineered"
[[ -f "$LIBAPP" ]] || { echo "Falta $LIBAPP — adb-pull + split arm64"; exit 1; }
mkdir -p "$OUT"
while read -r sym; do
  f=$(echo "$sym" | sed -E 's/(Service|Bloc)$//' | sed 's/\([A-Z]\)/_\L\1/g' | tr '[:upper:]' '[:lower:]')
  dart="$OUT/${f}.dart"
  [[ -f "$dart" ]] && continue
  cat >"$dart" <<EOF
// Símbolo en libapp.so: $sym — reimplementación propia.
class $sym {
  const $sym();
}
EOF
done < <(strings "$LIBAPP" | rg -o '[A-Z][a-zA-Z]+(Bloc|Service)' | sort -u | rg 'Account|Safe|Credit|Financial|Backup|User|AppCommand')
echo "Revisa $OUT"