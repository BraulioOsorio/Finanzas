# Iconos de marca locales (opcional)

La app resuelve iconos por **palabras clave** en `src/domain/brands/brandCatalog.ts`.

Si quieres un PNG propio (mejor que Wikimedia):

1. Guarda `nombre-id.png` (ej. `bancolombia.png`) aquí.
2. Registra el id en `LOCAL_BRAND_IMAGES` dentro de `BrandIcon.tsx` (mapa `require`).

No subas logos con licencia restrictiva sin permiso. Para ampliar el catálogo sin imágenes, solo añade entradas con `color` + `keywords` en el catálogo.