# Cuándo probar la app `neko/`

## Ya puedes probar **ahora** (datos iguales a NEKO)

**Qué está listo**

- 5 pestañas + FAB (misma estructura que NEKO).
- **Importación** del archivo `Neko - My Data` (el mismo export que usa NEKO).
- **Cuentas**, **historial**, **ingresos/gastos del mes** y **líquido disponible** leídos del SQLite real (`tbl_account`, `tbl_transaction_entry`).

**Pasos**

```bash
cd ~/finanzas/neko
git pull
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
bash tool/run_android.sh
```

1. En el Xiaomi: el backup suele estar en **Descargas → `Neko - My Data`** (lo sacaste de NEKO).
2. En la app fork: **Inicio → menú ☰ → Importar → elegir ese archivo**.
3. Compara con NEKO oficial:
   - **Cuentas** (nombres y saldos en `tbl_account.balance`).
   - **Historial** (últimos movimientos).
   - **Inicio** (líquido = suma tipos efectivo/banco/ahorro).

Si los saldos de cuentas coinciden, **los datos son los de NEKO**, no demo.

---

## Qué falta para decir «igual que NEKO» en todo

| Área | Estado |
|------|--------|
| Datos SQLite | ✅ con import |
| UI píxel a píxel | 🟡 en progreso |
| «Disponible para gastar» = misma fórmula que NEKO | 🟡 siguiente (ledger completo) |
| Calendario día a día | 🟡 |
| Registrar / editar movimientos | ❌ |
| Sync nube / premium NEKO | ❌ (no es vuestro objetivo) |

Avísame cuando hayas importado y si **algún número** no cuadra con NEKO (pantalla + cifra); afinamos la fórmula en Dart.

---

## Build Android

- **JDK 17** obligatorio (`JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`).
- NDK **27.0.12077973** ya en `android/app/build.gradle.kts`.