import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UpcomingItem } from '../../domain/upcoming';
import type { AccountBalance } from '../../domain/summaries';
import { colors, tokens } from '../../theme';
import { NekoProximoList } from './NekoProximoList';

type Props = {
  items: UpcomingItem[];
  title?: string;
  accountBalances?: AccountBalance[];
  onPressItem?: (item: UpcomingItem) => void;
  onOpenFull?: () => void;
};

/** Bloque «Próximo» al estilo NEKO (fechas + tarjetas + saldo cuenta). */
export function NekoUpcomingSection({
  items,
  title = 'Próximo',
  accountBalances = [],
  onPressItem,
  onOpenFull,
}: Props) {
  if (!items.length) {
    return null;
  }

  const preview = items.slice(0, 5);

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onOpenFull} hitSlop={10} accessibilityLabel="Ver todo Próximo">
          <Ionicons name="list-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
      <NekoProximoList items={preview} accountBalances={accountBalances} onPressItem={onPressItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...tokens.font.title, fontSize: 18, color: colors.text },
});