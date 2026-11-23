import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { BrandDef } from '../domain/brands/types';
import { DEFAULT_BRAND } from '../domain/brands/brandCatalog';

const DARK_TEXT_BRANDS = new Set([
  'bancolombia',
  'exito',
  'd1',
  'mercadolibre',
  'mcdonalds',
  'pichincha',
  'homecenter',
  'pricesmart',
]);

type Props = {
  brand?: BrandDef;
  size?: number;
};

export function BrandIcon({ brand = DEFAULT_BRAND, size = 40 }: Props) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = brand.logoUrl && !logoFailed;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: showLogo ? '#ffffff' : brand.color,
        },
      ]}
    >
      {showLogo ? (
        <Image
          source={{ uri: brand.logoUrl }}
          style={{ width: size - 8, height: size - 8 }}
          contentFit="contain"
          transition={150}
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.32 },
            DARK_TEXT_BRANDS.has(brand.id) && styles.initialsDark,
          ]}
          numberOfLines={1}
        >
          {brand.shortLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  initials: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  initialsDark: { color: '#0f1419' },
});