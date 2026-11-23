import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { IconDisplayMode } from '../types';

const OPTIONS: { mode: IconDisplayMode; title: string; detail: string }[] = [
  {
    mode: 'category',
    title: 'Categoría Neko',
    detail: 'Grupo y categoría (Salidas, Suscripciones, Moto…). Como en NEKO.',
  },
  {
    mode: 'description',
    title: 'Descripción / comercio',
    detail: 'Netflix, Rappi, D1… según el texto del movimiento.',
  },
  {
    mode: 'account',
    title: 'Banco / cuenta',
    detail: 'Bancolombia, Nu, RappiCard… según la cuenta.',
  },
];

type Props = {
  draftMode: IconDisplayMode;
  onSelectDraft: (mode: IconDisplayMode) => void;
};

export function IconModeSelector({ draftMode, onSelectDraft }: Props) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((opt) => {
        const active = draftMode === opt.mode;
        return (
          <Pressable
            key={opt.mode}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onSelectDraft(opt.mode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.radioOuter}>{active ? <View style={styles.radioInner} /> : null}</View>
            <View style={styles.textCol}>
              <Text style={[styles.title, active && styles.titleActive]}>{opt.title}</Text>
              <Text style={styles.detail}>{opt.detail}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  option: {
    flexDirection: 'row',
  alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: 'rgba(59, 130, 246, 0.08)' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  textCol: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  titleActive: { color: colors.accent },
  detail: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});