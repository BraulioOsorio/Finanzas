# Base inspirada en NEKO (sin copiar su código)

NEKO ([nekomoney.app](https://www.nekomoney.app/es)) es una app **cerrada** (iOS/Android). **No tenemos acceso a su código fuente**, solo a:

- Tu **export CSV** (columnas y tipos de movimiento)
- La **documentación pública** (cuentas, categorías, calendario, importación, datos en el teléfono)

## Qué replica esta app (modelo Neko)

| Concepto NEKO | En Finanzas |
|---------------|-------------|
| Cuentas (Bancolombia, Efectivo, Nu, Deudas…) | Saldo por cuenta sumando `signedAmount` |
| Grupo de categoría + categoría | `CATEGORY_TREE` en `src/domain/nekoCatalog.ts` |
| Tipos: Gasto, Ingreso, Pago, Transferencia… | Mismos tipos al registrar e importar |
| Historial de transacciones | Pestaña Historial |
| Importar CSV | Pestaña Importar |
| Transferencias no son “gasto” | `kind: transfer` excluido del flujo ingreso/gasto |
| Varios saldos | Pestaña Cuentas |

## Qué NO está aún (premium / complejo en NEKO)

- Calendario con **saldo proyectado** día a día
- Pagos recurrentes y quincena
- Presupuesto por categoría
- Tarjetas/préstamos con lógica de corte
- Widgets, Siri, sincronización nube
- Import PDF / IA

Esos módulos se pueden planificar después sobre esta base de datos local.

## Fuente del catálogo

`DEFAULT_ACCOUNTS` y `CATEGORY_TREE` se derivaron de `samples/neko_transactions_20261122_8537.csv`. Si cambias de plan en Neko, edita ese archivo o añadimos pantalla de configuración.