import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';

type Props = {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
};

export function NekoSheetTabs({ tabs, active, onChange }: Props) {
  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={styles.tab}>
            <Text style={[styles.label, on && styles.labelOn]}>{tab.label}</Text>
            {on ? <View style={styles.underline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 20, marginBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tab: { paddingBottom: 10, gap: 6 },
  label: { color: colors.textMuted, fontSize: 16, fontWeight: '600', fontFamily: 'HankenGrotesk-Medium' },
  labelOn: { color: colors.accent },
  underline: { height: 2, borderRadius: 1, backgroundColor: colors.accent },
});