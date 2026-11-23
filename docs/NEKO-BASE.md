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
| Editar árbol de categorías | Pestaña Categorías |
| Onboarding inicial | Primera apertura (omitir o 3 pasos) |
| Tokens visuales propios | `src/tokens.ts` (paleta Finanzas) |
| Editar movimiento | Historial → tocar fila o «Editar» |
| Filtros historial | Buscar, mes, cuenta, grupo |
| Transferencia en pareja | Registrar → Transferencia |
| Sugerir Plan tras import | Importar (quincena, Netflix, Claro…) |
| Compras a meses + cuotas en calendario/corte | Plan + CSV extendido Finanzas |
| Deudas / préstamos en Inicio | Bloque «Deudas y préstamos» |
| CSV con cuotas (`Installment Meta`) | [NEKO-CSV-EXTENDED.md](./NEKO-CSV-EXTENDED.md) |
| Crédito Colombia (corte, EA, mínimo) | Cuentas + [CREDITO-CO.md](./CREDITO-CO.md) |
| Hoy / próximos pagos | Inicio |
| Filtro historial por tipo Neko | Historial |
| Informe / patrimonio / top categorías | Pestaña **Informe** (selector de mes) |
| Presupuesto en detalle del calendario | Calendario (día seleccionado) |
| Editar meta de cuotas en movimiento | Historial → editar Compra a meses |
| Crear plan desde un movimiento | Historial → **Plan** en «Compra a meses» |
| Pantalla **Deudas** (préstamos, amortización) | Pestaña Deudas; capital en cuenta tipo préstamo |
| Recordatorio abono préstamo | Cuentas → día de abono + Ajustes → recordatorios |

## Qué NO está aún (premium / complejo en NEKO)

- Presupuesto por categoría (v1 en Categorías + barras en Inicio)
- Tarjetas: cupo, corte y día de pago (v1 en editar cuenta tipo crédito)
- Widgets, Siri, sincronización nube
- Import PDF / IA

Esos módulos se pueden planificar después sobre esta base de datos local.

## Fuente del catálogo

Cuentas y categorías persisten en AsyncStorage; el seed sale de tu CSV Neko.