# Widget Android — Disponible para gastar

1. En la app, `WidgetSnapshotSync` escribe `widget-snapshot.json` en cache y AsyncStorage `@finanzas/widget_snapshot_v1`.
2. Tras `npx expo prebuild`, copia o enlaza un `AppWidgetProvider` que lea ese JSON (o SharedPreferences sincronizado por un módulo nativo fino).
3. Build interno: `npx eas-cli build --platform android --profile preview` (ver `eas.json`).

Plantilla Kotlin (referencia, no compilada en Expo Go):

```kotlin
// SafeToSpendWidgetProvider.kt — leer /data/data/<app>/cache/widget-snapshot.json
```

iOS requiere WidgetKit + target en Xcode (`@bacons/apple-targets` en roadmap).