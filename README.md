# NEKO fork — rama `neko`

Clon **propio** de NEKO (APK + ingeniería inversa). **Sin** el front del viejo Finanzas en `main`.

| Parte | Dónde |
|--------|--------|
| UI mínima (reconstruir NEKO) | `app/` Expo Router |
| Motor datos (ledger, SQLite) | `src/domain/`, `src/import/` |
| Fork Flutter | `neko_app/` |
| Binarios APK | `reference/` (local) |

```bash
git checkout neko
npm install
npm start
```

Ver `docs/RAMA-NEKO.md`.