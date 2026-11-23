# CSV Neko + extensiones Finanzas

## Formato original Neko (8 columnas)

```text
Posted Date,Transaction Type,Description,Amount,Account,Category Group,Category,Notes
```

Finanzas importa y exporta esto sin cambios para **compatibilidad**.

## Extensiones opcionales (cuotas)

Añade columnas **después** de `Notes` (el encabezado de las 8 primeras debe coincidir con Neko):

| Columna | Ejemplo | Uso |
|---------|---------|-----|
| `Installment Meta` | `3/12` o `12 cuotas` | Cuota actual y total, o solo total |
| `Purchase Total` | `1200000` | Total de la compra (si `Amount` es una cuota) |
| `Installment Current` | `3` | Cuota actual (alternativa a Meta) |

Ejemplo con compra a meses:

```csv
Posted Date,Transaction Type,Description,Amount,Account,Category Group,Category,Notes,Installment Meta,Purchase Total
2026-05-03,Compra a meses,Gasolina,-43000,RappiCard,Transporte,Moto,,1/6,258000
```

Reglas:

- Sin columnas extra → la app **estima** cuotas y marca «Revisa cuotas» (como el export Neko actual).
- Con `Installment Meta` y/o `Purchase Total` → plan de cuotas **exacto** al importar.
- Exportar desde Finanzas incluye las columnas extra si algún movimiento las tiene.

Puedes preparar tu CSV en Excel/Sheets y volver a importar con **combinar**.