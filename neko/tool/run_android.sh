#!/usr/bin/env bash
# Compila con JDK 17 (evita fallo Gradle + Java 25).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
FLUTTER="${FLUTTER:-$ROOT/../reference/tools/flutter/bin/flutter}"
cd "$ROOT"
"$FLUTTER" pub get
"$FLUTTER" run "$@"