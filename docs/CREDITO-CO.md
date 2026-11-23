# Crédito rotativo Colombia (Finanzas)

Modelo orientativo para tarjetas en Colombia: **corte de extracto**, **fecha límite de pago**, **tasa EA** y **compras a meses** en el extracto. No sustituye el PDF del banco; corrige el hueco que suele dejar Neko al tratar la tarjeta como cuenta corriente sin ciclo.

## Conceptos

| Concepto | En la app |
|--------|-----------|
| Día de corte | `statementCloseDay` — cierra el periodo facturado |
| Pago | `paymentDueDay` y/o `paymentDueOffsetDays` (días tras el corte) |
| Saldo rotativo | `interestRateEA` — EA % mensualizado con $(1+EA)^{1/12}-1$ |
| Cuotas diferidas | `installmentInterestEA` — 0% si la promo es sin interés |
| Pago mínimo | `minimumPaymentPercent` sobre extracto estimado + cuotas del corte |

## Compras a meses en tarjeta

1. Registro **Compra a meses** con cuenta de crédito configurada.
2. `billingMode: card_statement` — cada cuota en el **día de corte**, no en la fecha de compra.
3. Por defecto **`statementLagMonths: 1`**: primera cuota en el **extracto siguiente** al que contiene la compra (habitual en emisoras colombianas).
4. Si `installmentInterestEA` > 0, el monto de cuota usa amortización con EA; si es 0, divide el capital.

## Plantillas por nombre

Al crear/editar cuenta tipo crédito: **Valores típicos Colombia**. Coincidencias aproximadas: RappiCard, Nu, Bancolombia, Davivienda, AmEx, Addi. **Revisa** corte y EA en tu extracto o app del banco.

## Inicio y próximos días

- **Tarjetas y crédito**: extracto estimado del periodo abierto, mínimo orientativo, interés rotativo si no pagas todo.
- **Próximos 14 días**: cortes, pagos con monto estimado, cuotas en extracto.

## Limitaciones (v1)

- No modela avances, seguros, IVA de intereses, ni día hábil exacto del banco.
- Los pagos de tarjeta del CSV deben ser tipo **Pago de Tarjeta** en ambas cuentas para restar del periodo.
- Tras importar CSV o con el botón en Importar, se crean planes desde tipo **Compra a meses** (cuotas estimadas; edítalas en Plan).
- Recordatorios locales opcionales en Ajustes (un día antes de corte/pago/cuota).
- Bloque **Hoy** en Inicio con movimientos del día y vista de mañana.