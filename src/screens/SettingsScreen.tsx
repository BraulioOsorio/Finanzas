import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconModeSelector } from '../components/IconModeSelector';
import { colors } from '../theme';

export function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.subtitle}>
          Elige cómo ves el icono en movimientos, historial, calendario y plan. En Cuentas siempre verás el
          logo del banco.
        </Text>

        <Text style={styles.section}>Iconos en movimientos</Text>
        <IconModeSelector />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pagos recurrentes</Text>
          <Text style={styles.cardBody}>
            En Registrar puedes marcar «Repetir» al guardar (quincena, suscripciones, arriendo). También
            créalos en la pestaña Plan; alimentan la proyección del calendario.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  section: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 8 },
  card: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});