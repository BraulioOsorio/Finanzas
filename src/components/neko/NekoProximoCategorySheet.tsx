import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  toggleProximoCategoryGroup,
  toggleProximoCategoryPair,
  type ProximoFilters,
} from '../../domain/dashboardFilters';
import { UNCATEGORIZED_GROUP } from '../../domain/nekoCatalog';
import type { CategoryTreeMap } from '../../domain/nekoCatalog';
import { colors, tokens } from '../../theme';
import { NekoBottomSheet } from './NekoBottomSheet';

type Props = {
  visible: boolean;
  tree: CategoryTreeMap;
  value: ProximoFilters;
  onClose: () => void;
  onApply: (next: ProximoFilters) => void;
};

export function NekoProximoCategorySheet({ visible, tree, value, onClose, onApply }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const groups = [...Object.keys(tree), UNCATEGORIZED_GROUP].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );

  const todosOn = !draft.categoryGroups.length && !draft.categoryPairs.length;

  return (
    <NekoBottomSheet visible={visible} title="Próximo" onClose={onClose}>
      <View style={styles.head}>
        <Text style={styles.subtitle}>Categorías</Text>
        <Pressable
          onPress={() =>
            setDraft({ ...draft, categoryGroups: [], categoryPairs: [] })
          }
          style={styles.clearBtn}
        >
          <Text style={styles.clearText}>Limpiar</Text>
        </Pressable>
      </View>

      <Chip
        label="Todos"
        active={todosOn}
        onPress={() => setDraft({ ...draft, categoryGroups: [], categoryPairs: [] })}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {groups.map((group) => {
          const cats = tree[group] ?? [];
          const groupOn = draft.categoryGroups.includes(group);
          return (
            <View key={group} style={styles.groupBlock}>
              <Pressable
                style={styles.groupHead}
                onPress={() => setDraft(toggleProximoCategoryGroup(group, draft))}
              >
                <View style={[styles.checkbox, groupOn && styles.checkboxOn]}>
                  {groupOn ? <Ionicons name="checkmark" size={14} color="#0b1118" /> : null}
                </View>
                <Text style={styles.groupTitle}>{group}</Text>
              </Pressable>
              {cats.length ? (
                <View style={styles.pillRow}>
                  {cats.map((cat) => {
                    const key = `${group}::${cat}`;
                    const on = draft.categoryPairs.includes(key);
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setDraft(toggleProximoCategoryPair(group, cat, draft))}
                        style={[styles.subPill, on && styles.subPillOn]}
                      >
                        <Text style={[styles.subPillText, on && styles.subPillTextOn]}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <Pressable style={styles.apply} onPress={() => { onApply(draft); onClose(); }}>
        <Text style={styles.applyText}>Aplicar</Text>
      </Pressable>
    </NekoBottomSheet>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  subtitle: { color: colors.text, fontSize: 17, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  chipTextOn: { color: '#0b1118', fontWeight: '700' },
  scroll: { maxHeight: 360, marginBottom: 8 },
  groupBlock: { marginBottom: 16, gap: 8 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  groupTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1, fontFamily: 'HankenGrotesk-Medium' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 34 },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  subPillOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  subPillText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  subPillTextOn: { color: colors.accent, fontWeight: '600' },
  apply: {
    backgroundColor: colors.accent,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  applyText: { color: '#0b1118', fontSize: 17, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
});