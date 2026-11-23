# Finanzas (app móvil)

App móvil personal para registrar **ingresos y gastos**, ver **saldo** y consultar el **historial**. Construida con **Expo** y **React Native** (iOS y Android).

## Requisitos

- Node.js 20+
- [Expo Go](https://expo.dev/go) en el teléfono (la forma más rápida de probar)
- Para builds nativas: Android Studio o Xcode (macOS)

## Cómo ejecutarla

```bash
npm install
npm start
```

Escanea el código QR con **Expo Go** (Android) o la cámara / Expo Go (iOS).

Atajos:

```bash
npm run android   # emulador Android
npm run ios       # simulador iOS (macOS)
npm run web       # vista web (desarrollo)
```

## Inspiración NEKO

El modelo de datos y pantallas siguen la lógica de **[NEKO: Control de Gastos](https://www.nekomoney.app/es)** (cuentas, tipos de movimiento, categorías, import CSV). No usamos su código — solo tu export y la documentación pública. Detalle en [`docs/NEKO-BASE.md`](docs/NEKO-BASE.md). Si subes el APK de NEKO solo como referencia, léete [`docs/NEKO-APK-ANALYSIS.md`](docs/NEKO-APK-ANALYSIS.md) (no lo mezclamos con el código de la app).

## Funciones actuales

- Inicio al estilo NEKO: disponible aproximado, flujo del mes, cuentas principales
- Pestaña **Plan**: quincena, arriendo, suscripciones (mensual / quincenal / semanal)
- Pestaña **Calendario**: saldo por día + proyección futura según el Plan
- Pestaña **Cuentas**: saldo por cuenta según movimientos
- Resumen: saldo, total ingresos y gastos
- Registrar movimientos con categoría y nota
- Historial con eliminación
- **Importar y exportar CSV de Neko** (pestaña Importar): mismo formato de columnas que el export de NEKO
- **Compra a meses** (Registrar): divide el total en cuotas mensuales; aparecen en Plan y Calendario
- **Próximos 14 días** en Inicio: plan, cuotas y recordatorio de pago de tarjeta (sin push todavía)
- Campos guardados: fecha, tipo, descripción, cuenta, grupo/categoría, notas
- Las transferencias y pagos de tarjeta se listan pero **no mueven el saldo** (como en un libro mayor)
- **Iconos configurables** en Ajustes: categoría Neko (default), comercio por descripción, o banco/cuenta; pestaña Cuentas siempre muestra el banco
- **Recurrencia**: Plan + interruptor «Repetir» al registrar (quincena, suscripciones…)
- Datos guardados en el dispositivo (AsyncStorage)

Ampliar marcas en `src/domain/brands/brandCatalog.ts` o PNG en `assets/brands/` (ver README ahí). Tras importar tu CSV de Neko, revisa cobertura con `npm run brands:from-csv`.

### Verificar un CSV (desarrollo)

```bash
npx tsx scripts/verify-neko-import.ts samples/neko_transactions_20261122_8537.csv
```

## Publicar en tiendas

APK interno con EAS (requiere cuenta Expo):

```bash
npx eas-cli build --platform android --profile preview
```

Perfiles en `eas.json`.

## Repositorio en GitHub

Código pensado para vivir en [BraulioOsorio/Finanzas](https://github.com/BraulioOsorio/Finanzas):

```bash
git remote add finanzas https://github.com/BraulioOsorio/Finanzas.git
git push -u finanzas cursor/finanzas-mobile-1e31:main
```

(Ajusta la rama según vuestro flujo.)