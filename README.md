# Finanzas (app móvil)

App móvil personal para registrar **ingresos y gastos**, ver **saldo** y consultar el **historial**. Construida con **Expo** y **React Native** (iOS y Android).

## Requisitos

- Node.js 20+
- [Expo Go](https://expo.dev/go) en el teléfono (la forma más rápida de probar)
- Para builds nativas: Android Studio o Xcode (macOS)

## Cómo ejecutarla

```bash
npm install
npm start
```

Escanea el código QR con **Expo Go** (Android) o la cámara / Expo Go (iOS).

Atajos:

```bash
npm run android   # emulador Android
npm run ios       # simulador iOS (macOS)
npm run web       # vista web (desarrollo)
```

## Funciones actuales

- Resumen: saldo, total ingresos y gastos
- Registrar movimientos con categoría y nota
- Historial con eliminación
- Datos guardados en el dispositivo (AsyncStorage)

## Publicar en tiendas

Más adelante se puede usar [EAS Build](https://docs.expo.dev/build/introduction/) para generar APK/AAB y el binario de iOS.

## Repositorio en GitHub

Código pensado para vivir en [BraulioOsorio/Finanzas](https://github.com/BraulioOsorio/Finanzas):

```bash
git remote add finanzas https://github.com/BraulioOsorio/Finanzas.git
git push -u finanzas cursor/finanzas-mobile-1e31:main
```

(Ajusta la rama según vuestro flujo.)