# Ingeniería inversa NEKO 8.8.2

## Local (no en Git)

| Ruta | Contenido |
|------|-----------|
| `reference/neko-pulled/` | APK base + splits del móvil |
| `reference/native/` | `libapp.so`, `libflutter.so` |
| `reference/jadx-out/` | Java/Kotlin (plugins) |
| `reference/tools/blutter/` | Herramienta Blutter |
| `reference/blutter-out/` | Salida si Blutter termina OK |

## Comandos

```bash
bash scripts/adb-pull-neko-apks.sh
unzip -p reference/neko-pulled/split_config.arm64_v8a.apk lib/arm64-v8a/libapp.so > reference/native/libapp.so
unzip -p reference/neko-pulled/split_config.arm64_v8a.apk lib/arm64-v8a/libflutter.so > reference/native/libflutter.so
bash scripts/run-blutter.sh    # requiere venv + pyelftools + requests
```

**Blutter:** si falla en `_kDartVmSnapshotData`, el binario está strippeado; usamos `strings libapp.so`, `neko/tool/neko_symbols.txt` y stubs en `neko/lib/reverse_engineered/`.

## App editable

```bash
cd neko
bash tool/run_android.sh
```

Si usas `flutter run` a mano, con **JDK 17** (`export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`). Java 25 rompe Gradle con error `25.0.4`.

Edita `lib/app.dart`, blocs en `lib/reverse_engineered/`, SQLite según `lib/data/neko_schema.dart`.