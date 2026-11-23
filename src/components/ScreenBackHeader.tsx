import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../theme';

/** Una sola fila «← Más» (estilo NEKO, sin doble barra nativa). */
export function ScreenBackHeader() {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) {
    return null;
  }
  return (
    <Pressable onPress={() => navigation.goBack()} style={styles.wrap} hitSlop={12}>
      <Text style={styles.text}>← Más</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 4 },
  text: { color: colors.accent, fontSize: 15, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
});