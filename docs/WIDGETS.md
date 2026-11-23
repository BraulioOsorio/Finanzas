# Widgets (pendiente — requiere build nativo)

NEKO ofrece widget de **Disponible para gastar** y **registro rápido** en pantalla de inicio/bloqueo + Siri.

En Finanzas (Expo):

1. Ya calculamos `computeSafeToSpend` y `liquidAvailable` en la app.
2. Un widget necesita **development build** (`expo prebuild` + módulo nativo) o config Android `AppWidget` / iOS WidgetKit fuera de Expo Go.
3. Recomendación: tras fijar el motor v2 en Inicio, exponer los mismos valores vía **App Group** / `SharedPreferences` desde un módulo nativo fino.

No implementado en v1 para no bloquear el resto del roadmap NEKO.