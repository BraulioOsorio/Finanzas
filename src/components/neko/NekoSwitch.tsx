import { Switch, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function NekoSwitch({ value, onValueChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { transform: [{ scaleX: 0.92 }, { scaleY: 0.88 }] },
});