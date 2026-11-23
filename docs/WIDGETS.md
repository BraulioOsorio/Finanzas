# Widgets (EAS)

## Qué hay hoy

- **En app**: `WidgetSnapshotSync` actualiza disponible + tarjetas «sin intereses».
- **Ajustes**: vista previa del widget.
- **Archivo**: `cache/widget-snapshot.json` (misma caché que usa la app con `expo-file-system`).
- **Plugin**: `plugins/withFinanzasWidget.js` (meta-data Android tras `prebuild`).

## Build con widget nativo (siguiente paso manual)

```bash
npm install
npx expo prebuild --platform android
# Añadir SafeToSpendWidgetProvider en android/ (ver widgets/android/README.md)
npx eas-cli build --platform android --profile preview
```

Perfil **development** en `eas.json` para `expo-dev-client` si enlazáis módulos custom.

Expo Go **no** muestra widgets de inicio; hace falta APK/AAB.