import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { fontFamily } from '../theme/typography';
import { colors } from '../theme';

export function NekoFontGate({ children }: { children: React.ReactNode }) {
  const [loaded] = useFonts({
    [fontFamily.regular]: require('../../assets/fonts/HankenGrotesk-Regular.ttf'),
    [fontFamily.medium]: require('../../assets/fonts/HankenGrotesk-Medium.ttf'),
    [fontFamily.semibold]: require('../../assets/fonts/HankenGrotesk-SemiBold.ttf'),
    [fontFamily.bold]: require('../../assets/fonts/HankenGrotesk-Bold.ttf'),
  });

  if (!loaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});