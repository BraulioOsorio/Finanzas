# Código editable en el repo (fork NEKO)

## Qué SÍ está en Git (puedes modificar)

| Carpeta | Qué es |
|---------|--------|
| **`src/domain/`**, **`src/import/`** | Motor NEKO en **TypeScript** (ledger, safe-to-spend, import SQLite/CSV) — portado desde tu rama `main` para editar y usar con Expo |
| **`neko_app/lib/`** | Proyecto **Flutter** propio: `main.dart`, schema, stubs `reverse_engineered/*` (nombres sacados de `libapp.so`) |
| **`app/`** | UI Expo (tabs) — conectará a `src/` |
| **`assets/neko/`** | Gráficos del APK (reemplázalos antes de publicar) |

## Qué NO sube a Git (`.gitignore`)

| Ruta | Qué es |
|------|--------|
| `reference/neko-pulled/` | APKs sacados del móvil |
| `reference/native/libapp.so` | Binario Dart AOT de NEKO — solo referencia local |
| `reference/jadx-out/` | Java/Kotlin descompilado |

No es código fuente editable: es el programa **de ellos** compilado.

## Cómo seguir

### Opción A — Expo (ya en Linux, sin Flutter)

```bash
npm install
npm start
```

Edita `src/domain/nekoLedger.ts`, `src/import/parseNekoSqlite.ts`, pantallas en `app/`.

### Opción B — Flutter (`neko_app/`)

```bash
# cuando tengas Flutter SDK
cd neko_app && flutter pub get && flutter run
```

Regenerar stubs desde el binario:

```bash
bash scripts/generate-neko-dart-tree.sh
```

### Importar tus datos

Backup **«Neko - My Data»** → `src/import/parseNekoSqlite.ts` (ver `docs/NEKO-SQLITE-IMPORT.md`).