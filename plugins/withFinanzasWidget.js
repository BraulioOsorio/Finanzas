const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Marca la app para empaquetar widget (el código Kotlin vive en widgets/android).
 * Ejecutar: npx expo prebuild && copiar provider al módulo android/.
 */
function withFinanzasWidget(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) {
      return cfg;
    }
    app['meta-data'] = app['meta-data'] ?? [];
    const exists = app['meta-data'].some(
      (m) => m.$?.['android:name'] === 'com.finanzas.WIDGET_SNAPSHOT',
    );
    if (!exists) {
      app['meta-data'].push({
        $: {
          'android:name': 'com.finanzas.WIDGET_SNAPSHOT',
          'android:value': 'widget-snapshot.json',
        },
      });
    }
    return cfg;
  });
}

module.exports = withFinanzasWidget;