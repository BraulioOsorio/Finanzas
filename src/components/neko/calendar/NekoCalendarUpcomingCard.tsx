import type { UpcomingItem } from '../../../domain/upcoming';
import type { AccountBalance } from '../../../domain/summaries';
import { NekoProximoList } from '../NekoProximoList';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme';

type Props = {
  items: UpcomingItem[];
  accountBalances: AccountBalance[];
  expanded: boolean;
  onToggle: () => void;
};

export function NekoCalendarUpcomingBlock({
  items,
  accountBalances,
  expanded,
  onToggle,
}: Props) {
  if (!items.length) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.head} onPress={onToggle}>
        <Text style={styles.title}>Próximo · {items.length}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {expanded ? <NekoProximoList items={items} accountBalances={accountBalances} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});