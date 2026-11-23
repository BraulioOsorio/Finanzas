# Importar «Neko - My Data» (SQLite)

NEKO permite exportar una copia local de tu presupuesto. En el repo suele llamarse **`Neko - My Data`** (SQLite 3, ~12 MB).

## En la app (Expo Go)

1. Descarga **`Neko - My Data`** a la memoria del teléfono (GitHub, Drive, etc.) — no abras solo el enlace web.
2. **Más → Importar**.
3. Pulsa **la primera opción morada**: **«Elegir Neko - My Data (SQLite) y reemplazar»** (no el botón de CSV).
4. En el selector de archivos, elige el archivo sin extensión o renómbralo a `Neko-My-Data.db` si no aparece.
4. Tras importar, revisa **Inicio**, **Calendario** y **Plan**.

### Qué trae respecto al CSV

| Dato | CSV Neko | SQLite My Data |
|------|----------|----------------|
| Movimientos publicados | Sí | Sí (~800+ entradas → ~1000 líneas con transferencias) |
| Cuentas y límites TC | Parcial | Sí (24 cuentas en el backup de referencia) |
| Compras a meses | Solo filas gasto | Planes en `tbl_installment_plan` |
| Recurrentes / quincena | No | `tbl_recurring_transaction` |

## En desarrollo (PC)

```bash
# Descargar desde tu GitHub (ejemplo)
curl -fsSL -o /tmp/Neko-My-Data \
  "https://github.com/BraulioOsorio/Finanzas/raw/main/Neko%20-%20My%20Data"

npm run verify:neko-sqlite -- /tmp/Neko-My-Data
```

## Privacidad

El SQLite contiene **toda** tu vida financiera. No lo subas a repos **públicos** si no quieres exponerlo; en GitHub mejor un repo privado o solo en tu máquina.

## Tablas mapeadas

- `tbl_transaction_entry` → historial (mismo criterio que CSV).
- `tbl_account` → cuentas (tipo, corte, límite).
- `tbl_installment_plan` → compras a meses.
- `tbl_recurring_transaction` → Plan (ingresos/gastos recurrentes).