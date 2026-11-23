import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { loadWidgetSnapshot, type WidgetSnapshot } from '../storage/widgetSnapshot';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

export function WidgetPreviewCard() {
  const [snap, setSnap] = useState<WidgetSnapshot | null>(null);

  useEffect(() => {
    void loadWidgetSnapshot().then(setSnap);
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Vista previa widget (EAS)</Text>
      <Text style={styles.body}>
        Al abrir la app se guarda un snapshot en el dispositivo. El módulo Android en{' '}
        <Text style={styles.mono}>widgets/android</Text> lo lee tras{' '}
        <Text style={styles.mono}>npx expo prebuild</Text>.
      </Text>
      {snap ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Disponible ({snap.horizonLabel})</Text>
          <Text style={styles.previewValue}>{formatCurrency(snap.safeToSpend)}</Text>
          <Text style={styles.previewMeta}>
            Actualizado {formatShortDate(snap.updatedAt.slice(0, 10))} · hasta{' '}
            {formatShortDate(snap.throughDate)}
          </Text>
          {snap.cardsPayInFull[0] ? (
            <Text style={styles.previewMeta}>
              Tarjeta {snap.cardsPayInFull[0].account}: sin intereses ~
              {formatCurrency(snap.cardsPayInFull[0].amount)}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.meta}>Aún no hay snapshot; abre Inicio un momento.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  preview: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  previewLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  previewValue: { color: colors.text, fontSize: 28, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
  previewMeta: { color: colors.textMuted, fontSize: 11 },
  meta: { color: colors.textMuted, fontSize: 13 },
});