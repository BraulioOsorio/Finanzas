#!/usr/bin/env bash
# Genera stubs Dart en neko_app/lib/ a partir de símbolos en libapp.so (editable por nosotros).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIBAPP="${1:-$ROOT/reference/native/libapp.so}"
OUT="$ROOT/neko_app/lib"
[[ -f "$LIBAPP" ]] || { echo "Falta $LIBAPP" >&2; exit 1; }

mkdir -p "$OUT"

# Blocs / servicios vistos en el binario
while read -r sym; do
  [[ -z "$sym" ]] && continue
  path=$(echo "$sym" | sed -E 's/(Service|Bloc|Repository|Cubit)$//' | tr '[:upper:]' '[:lower:]' | sed 's/\./\//g')
  # Simplificado: un archivo por nombre de clase
  file=$(echo "$sym" | sed 's/\./\//;s/Service/_service/;s/Bloc/_bloc/')
  dart="$OUT/reverse_engineered/${file}.dart"
  mkdir -p "$(dirname "$dart")"
  if [[ ! -f "$dart" ]]; then
    cat >"$dart" <<EOF
// Stub generado desde libapp.so — reimplementación propia, NO código de Tuxedo Lab.
// Símbolo: $sym

class $sym {
  const $sym();
  Future<void> initialize() async {
    throw UnimplementedError('$sym.initialize — implementar en finanzas_neko');
  }
}
EOF
  fi
done < <(strings "$LIBAPP" | rg -o '[A-Z][a-zA-Z]+(Bloc|Service|Repository|Cubit)' | sort -u)

echo "Stubs en $OUT/reverse_engineered/"
find "$OUT/reverse_engineered" -name '*.dart' 2>/dev/null | wc -l