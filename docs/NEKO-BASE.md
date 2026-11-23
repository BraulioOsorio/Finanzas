# Base inspirada en NEKO (sin copiar su código)

> Análisis del APK `Neko-8.8.2.apk` (stack Flutter, Firebase, widgets): ver [NEKO-APK-ANALYSIS.md](./NEKO-APK-ANALYSIS.md).

NEKO ([nekomoney.app](https://www.nekomoney.app/es)) es una app **cerrada** (iOS/Android). **No tenemos acceso a su código fuente**, solo a:

- Tu **export CSV** (columnas y tipos de movimiento)
- La **documentación pública** (cuentas, categorías, calendario, importación, datos en el teléfono)

## Qué replica esta app (modelo Neko)

| Concepto NEKO | En Finanzas |
|---------------|-------------|
| Cuentas (Bancolombia, Efectivo, Nu, Deudas…) | Saldo por cuenta sumando `signedAmount` |
| Grupo de categoría + categoría | `CATEGORY_TREE` en `src/domain/nekoCatalog.ts` |
| Icono del movimiento = categoría | `src/domain/categories/` (no por descripción del comercio) |
| Icono de la cuenta = banco | `src/domain/brands/` en pestaña Cuentas |
| Tipos: Gasto, Ingreso, Pago, Transferencia… | Mismos tipos al registrar e importar |
| Historial de transacciones | Pestaña Historial |
| Calendario con saldo por día | Pestaña **Calendario** (proyección histórica; futuro con pagos programados) |
| Importar CSV | Pestaña Importar |
| Transferencias no son “gasto” | `kind: transfer` excluido del flujo ingreso/gasto |
| Varios saldos | Pestaña Cuentas |
| Alta de cuentas (banco, efectivo, crédito, préstamo…) | Cuentas → «Nueva cuenta»; «Disponible para gastar» por cuenta |
| Editar movimiento | Historial → tocar fila o «Editar» |
| Filtros historial | Buscar, mes, cuenta, grupo |
| Transferencia en pareja | Registrar → Transferencia |
| Sugerir Plan tras import | Importar (quincena, Netflix, Claro…) |

## Qué NO está aún (premium / complejo en NEKO)

- Recordatorios y **pagos a meses** con lógica de tarjeta
- Presupuesto por categoría
- Tarjetas/préstamos con lógica de corte
- Widgets, Siri, sincronización nube
- Import PDF / IA

Esos módulos se pueden planificar después sobre esta base de datos local.

## Fuente del catálogo

Las cuentas iniciales salen de tu CSV; puedes editar tipo y si son líquidas en **Cuentas**. Las categorías siguen en `CATEGORY_TREE` (pantalla de categorías pendiente).