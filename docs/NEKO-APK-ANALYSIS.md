# Análisis técnico de `Neko-8.8.2.apk` (referencia)

Archivo en GitHub: `BraulioOsorio/Finanzas` rama `main`.  
**No es código nuestro** — solo referencia para orientar Finanzas. No descompilamos ni redistribuimos lógica Dart.

## Stack real de NEKO (según el APK)

| Pieza | Evidencia en el APK |
|-------|---------------------|
| UI | **Flutter** (`assets/flutter_assets/`, plugins Flutter) |
| Paquete Android | `com.tuxedolab.paycheckbuddy` |
| Tipografías | **Hanken Grotesk** + **Space Grotesk** (bundled) |
| Backend / sync | **Firebase** (Firestore, Auth, Remote Config, Messaging, Crashlytics) |
| Monetización | Google Play Billing |
| Widgets | `AddExpenseWidgetReceiver`, `SafeToSpendWidgetReceiver` |
| Android extras | App Functions (`getUpcomingBills`), biometric, secure storage |

Nuestra app **Finanzas** usa **Expo + React Native** a propósito: mismo producto conceptual, distinta implementación (sin copiar su app).

## Qué sí aprovechamos

- Nombre de conceptos: **“Disponible para gastar”**, calendario, cuentas, import CSV (ya alineado).
- Jerarquía de datos (cuenta → tipo → grupo/categoría) desde tu export.
- Roadmap: widget de gasto rápido, proyección de facturas (`UpcomingBill`), sync opcional más adelante.

## Qué no hacemos con el APK

- No extraemos fuentes/imagenes del APK al repo (licencia).
- No publicamos ingeniería inversa del binario Dart.
- No sustituimos NEKO: construimos **Finanzas** propia compatible con tu CSV.

## Aviso legal

Subir el APK de NEKO en un repo **público** puede infringir los términos del desarrollador. Mejor guardarlo en privado o solo en tu máquina; en el repo de código conviene **solo** el proyecto Finanzas + tu CSV de ejemplo.

## Versión analizada

- **8.8.2** (nombre del archivo que subiste).
- Tamaño ~24 MB; lógica compilada en snapshot Flutter (sin `libapp.so` útil en este entorno de análisis, pero plugins y assets confirman Flutter).