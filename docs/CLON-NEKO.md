# Clonar NEKO → app propia (rama `neko`)

## Objetivo

Misma **experiencia** que NEKO 8.8.2 (navegación, números, SQLite), con **código tuyo** en este repositorio.

## Fuentes

| Fuente | Uso |
|--------|-----|
| APK `Neko-8.8.2.apk` | Assets Flutter empaquetados, manifiesto Android |
| Backup **Neko - My Data** | Esquema SQLite y datos de prueba |
| Capturas / tu uso diario | Validación UI |

## Orden sugerido

1. **SQLite** — leer `tbl_account`, `tbl_transaction_entry`, tipos y recurrentes.
2. **Motor de saldos** — apertura, «disponible para gastar», calendario día a día.
3. **Inicio + FAB + registrar** — sheet de tipos de movimiento.
4. **Import** reemplazo total desde backup NEKO.
5. **Calendario / Historial / Cuentas / Análisis** — paridad visual.
6. **Widgets / nube** — fase opcional (NEKO usa Firebase).

## Stack esta rama

- **Expo SDK 58** + **expo-router** (tabs).
- NEKO original = **Flutter**; no mezclamos su Dart compilado.

## Aviso

Assets gráficos del APK pueden estar sujetos a licencia del autor de NEKO. Para publicar en store, sustituye iconos/ilustraciones por diseño propio cuando la app esté estable.