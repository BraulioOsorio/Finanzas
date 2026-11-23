# Estado NEKO vs Finanzas

## Listo para probar (Expo Go)

Con `main` actual puedes usar **Expo Go** para el flujo completo NEKO + mejoras Colombia:

- Inicio, Calendario, Plan, Registrar, Más (Informe, Historial, Cuentas, Deudas, Categorías, Buscar, Importar, Ajustes)
- CSV Neko import/export, categorías editables, presupuestos, disponible v2, crédito CO, deudas, PIN, recordatorios 7/2/1
- Tema **oscuro** + acento **morado**

## Paridad con NEKO (núcleo)

| NEKO | Finanzas |
|------|----------|
| Cuentas y saldos | Sí |
| Tipos y transferencias | Sí |
| Categorías y presupuesto | Sí (editor completo) |
| Historial y búsqueda | Sí |
| Calendario + plan | Sí |
| Informe mes/trimestre/año | Sí |
| Deudas / cuotas | Sí (revisar cuotas tras CSV) |
| Datos locales | Sí |

## Extra Colombia (no NEKO estándar)

Corte, EA, mínimo redondeado, días hábiles en vencimiento, IVA 19% en interés estimado, amortización con tasa de préstamo.

## No incluido (NEKO premium / infra)

- Widget en pantalla de inicio del teléfono → requiere **APK/AAB** (snapshot interno ya preparado)
- Nube y multi-dispositivo
- Modo claro / tipografías NEKO
- Multi-moneda, PDF/IA, fotos, reglas automáticas, Siri
- Extracto bancario al céntimo (siempre orientativo)

## En Expo Go puede fallar o ir limitado

- Recordatorios locales: suele ir bien en dispositivo físico
- PIN / huella: mejor en dev client o build; en web no aplica
- Widget de escritorio: no visible en Expo Go

**Conclusión:** para uso diario tipo NEKO con tus reglas CO, **sí está lista para probar en Expo Go**; lo que falta es sobre todo **premium, nube y APK (widget)**.