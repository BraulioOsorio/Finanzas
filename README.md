# Finanzas — rama `neko` (proyecto limpio)

Rama **aislada** de `main`: partimos de **cero** para clonar **tu referencia** [NEKO 8.8.2](https://www.nekomoney.app/es) y construir **tu app propia** (Expo + React Native).

## Qué hay ahora

- Shell con **5 tabs** como NEKO: Inicio, Calendario, Análisis, Cuentas, Historial.
- **Fuentes e imágenes** extraídas del APK local (`assets/fonts/`, `assets/neko/`).
- Sin código heredado del `main` antiguo.

## Qué no es posible copiar tal cual

NEKO en el APK es **Flutter** (`com.tuxedolab.paycheckbuddy`). El binario Dart **no** viene en texto; en muchos APK faltan las librerías `.so`. La copia literal es **reimplementación** pantalla a pantalla + el mismo modelo SQLite que exporta NEKO.

## Requisitos

- Node 20+
- APK en `~/Descargas/Neko-8.8.2.apk` (o ruta que pases al script)

## Arrancar

```bash
git checkout neko
npm install
npm start
```

## Scripts

```bash
./scripts/extract-neko-apk-assets.sh          # fuentes + assets visuales
./scripts/unpack-neko-apk-reference.sh       # APK completo en reference/ (gitignored)
```

## Documentación

- [`docs/CLON-NEKO.md`](docs/CLON-NEKO.md) — plan de paridad y límites legales/técnicos.

## Ramas

| Rama | Contenido |
|------|-----------|
| **`neko`** | Tu clon NEKO desde cero |
| **`main`** | Código anterior de Finanzas (otra línea) |