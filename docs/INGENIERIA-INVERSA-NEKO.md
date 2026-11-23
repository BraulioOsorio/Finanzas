# Ingeniería inversa NEKO 8.8.2 — guía práctica

## Por qué tu `Neko-8.8.2.apk` “no tiene Dart”

El manifiesto declara:

```text
android:requiredSplitTypes="base__abi,base__density"
```

Es el **APK base** de Google Play. Las librerías nativas (`lib/arm64-v8a/libapp.so`, `libflutter.so`) van en **splits aparte** (`config.arm64_v8a.apk`, densidad, etc.). Sin esos ficheros **no hay** binario Dart que desensamblar.

| APK que tienes | Qué contiene |
|----------------|--------------|
| Base (24 MB) | `flutter_assets`, DEX, recursos XML |
| Split ABI | `libapp.so` ← **toda la lógica Flutter AOT** |

Subir solo el base a GitHub / Descargas = ingeniería inversa **bloqueada** hasta tener el paquete completo.

---

## Objetivo realista

| Expectativa | Realidad |
|-------------|----------|
| Recuperar `lib/` Dart y compilar NEKO otra vez | **No** (AOT ofuscado, sin fuentes) |
| App **igual** en uso (saldos, pantallas, import) | **Sí**, con **reimplementación** + backup SQLite + capturas |
| Sacar APIs, plugins, widgets, strings DEX | **Sí**, con jadx en APK completo |
| Pistas de clases/funciones Dart | **A veces**, con **blutter** sobre `libapp.so` (complemento, no clon automático) |

Para “igual que NEKO” lo más rápido suele ser: **SQLite «Neko - My Data»** (esquema + datos) + **assets** + pantallas hechas a mano (rama `neko` o Flutter nuevo). La RE sirve para **validar cálculos** y nombres internos.

---

## Fase 0 — APK completo (obligatorio)

### Opción A — Teléfono + USB (`adb`)

1. Activar **depuración USB** en Android.
2. Conectar y comprobar: `adb devices`
3. Ejecutar:

```bash
./scripts/adb-pull-neko-apks.sh
```

Genera `reference/neko-pulled/` con `base.apk` + splits.

4. Verificar:

```bash
./scripts/verify-neko-apk-has-libapp.sh reference/neko-pulled/*.apk
```

Tiene que listar `lib/arm64-v8a/libapp.so` (o `armeabi-v7a`).

### Opción B — App en el móvil (sin PC)

- **SAI** (Split APKs Installer) → exportar APK **completo** / XAPK de `Neko`.
- Copiar el `.xapk` o `.apks` al PC y descomprimir.

### Opción C — APKM / APKMirror bundle

Descargar el **bundle** 8.8.2 con **todos los splits**, no solo `base.apk`.

---

## Fase 1 — Java/Kotlin (plugins, Android)

Con cualquier APK (incluso el base):

```bash
./scripts/run-jadx-neko.sh ~/Descargas/Neko-8.8.2.apk
```

Salida en `reference/jadx-out/` (gitignored): Firebase, widgets Glance, `MainActivity`, billing, etc. **No** es la UI Flutter.

---

## Fase 2 — Dart AOT (solo con `libapp.so`)

Herramienta: [Blutter](https://github.com/worawits/blutter) (requiere CMake, LLVM según versión Flutter del binario).

Flujo resumido:

1. Extraer `libapp.so` del split ABI.
2. Detectar versión Flutter (blutter o strings en `libflutter.so`).
3. Ejecutar blutter → directorio con asm + metadatos Dart.
4. Anotar nombres de clases/métodos relacionados con ledger, calendario, safe-to-spend.
5. **Traducir** esa lógica a tu código (Dart/TS), no pegar código de NEKO en un repo público.

Si quieres stack Flutter propio:

```bash
flutter create finanzas_neko
# copiar assets desde scripts/extract-neko-apk-assets.sh
# implementar pantallas guiándote por blutter + SQLite backup
```

---

## Fase 3 — Modelo de datos (más útil que blutter para “igual”)

1. En NEKO: Ajustes → exportar **«Neko - My Data»** (SQLite).
2. Inspeccionar:

```bash
sqlite3 "Neko - My Data" ".schema"
sqlite3 "Neko - My Data" "SELECT name FROM sqlite_master WHERE type='table';"
```

Tablas clave: cuentas, movimientos, tipos, recurrentes, cuotas. Con eso replicas **números** igual que la app original.

---

## Fase 4 — Unir splits en un solo APK (opcional)

Para una sola entrada en jadx/blutter:

- [APKEditor](https://github.com/REAndroid/APKEditor) `merge`  
- o [BundleTool](https://developer.android.com/tools/bundletool) si tienes `.aab`

Script esqueleto: `scripts/merge-neko-splits.sh` (ver comentarios dentro).

---

## Aviso legal

NEKO es app de **Tuxedo Lab**. Ingeniería inversa para **uso personal** y aprendizaje puede ser distinta de **publicar** un clon en Play Store. No redistribuyas el APK ni el código desensamblado en repos públicos. En `neko` usamos assets solo como referencia de desarrollo; para publicar, iconos e imágenes propios.

---

## Checklist rápido

- [ ] APK completo con `libapp.so`
- [ ] jadx ejecutado (`reference/jadx-out`)
- [ ] Backup SQLite en mano
- [ ] blutter (opcional) sobre `libapp.so`
- [ ] Implementación en rama `neko` o proyecto Flutter nuevo
- [ ] Validar saldos con mismo backup y misma fecha que NEKO