import { ImageBackground, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { nekoTheme } from '@/constants/nekoTheme';

type Props = ViewProps & {
  title: string;
  subtitle?: string;
};

export function NekoScreenShell({ title, subtitle, style, children, ...rest }: Props) {
  return (
  <ImageBackground
      source={require('@/assets/neko/images/background_dark.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}>
      <View style={[styles.inner, style]} {...rest}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: nekoTheme.background },
  bgImage: { opacity: 0.35, resizeMode: 'cover' },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: {
    fontFamily: nekoTheme.fontSemiBold,
    fontSize: 28,
    color: nekoTheme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: nekoTheme.fontRegular,
    fontSize: 15,
    color: nekoTheme.textMuted,
    marginBottom: 20,
  },
});