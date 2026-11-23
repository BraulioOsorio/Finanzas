# Rama `neko` — clon NEKO

Fork propio a partir del APK del móvil (splits + `libapp.so`).

## Repo

| Ruta | Qué |
|------|-----|
| **`neko/`** | App **Flutter** editable (assets del APK, blocs desde RE) |
| **`scripts/`** | `adb-pull`, Blutter, símbolos → Dart |
| **`docs/INGENIERIA-INVERSA.md`** | Flujo local |

Binarios y Blutter → `reference/` (gitignored).

## Inicio rápido

```bash
git checkout neko
# móvil + USB
bash scripts/adb-pull-neko-apks.sh
cd neko
../reference/tools/flutter/bin/flutter pub get
../reference/tools/flutter/bin/flutter run
```

`main` no se usa.