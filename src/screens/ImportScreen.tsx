import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';

const NEKO_FORMAT = `Posted Date,Transaction Type,Description,Amount,Account,Category Group,Category,Notes`;

export function ImportScreen() {
  const { importNekoCsv, transactionCount } = useTransactions();
  const [busy, setBusy] = useState(false);

  const runImport = async (csv: string, mode: 'replace' | 'merge') => {
    setBusy(true);
    try {
      const result = await importNekoCsv(csv, mode);
      const errorPreview = result.errors.slice(0, 3).join('\n');
      const extraErrors =
        result.errors.length > 3 ? `\n… y ${result.errors.length - 3} más` : '';

      Alert.alert(
        'Importación terminada',
        [
          `Registros nuevos: ${result.imported}`,
          `Omitidos (duplicados): ${result.skipped}`,
          result.errors.length ? `Advertencias: ${result.errors.length}` : null,
          errorPreview ? `\n${errorPreview}${extraErrors}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo importar el archivo.');
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (mode: 'replace' | 'merge') => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['text/comma-separated-values', 'text/csv', 'text/plain', 'application/vnd.ms-excel'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) {
      return;
    }

    const uri = picked.assets[0].uri;
    const file = new File(uri);
    if (!file.exists) {
      Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
      return;
    }
    const csv = await file.text();
    if (mode === 'replace' && transactionCount > 0) {
      Alert.alert(
        'Reemplazar todos los datos',
        `Se borrarán los ${transactionCount} movimientos actuales y se cargará solo el CSV. ¿Continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reemplazar', style: 'destructive', onPress: () => runImport(csv, mode) },
        ],
      );
      return;
    }
    await runImport(csv, mode);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Importar Neko</Text>
        <Text style={styles.subtitle}>
          Carga un export CSV de Neko con el mismo formato de columnas que ya usas.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Formato esperado</Text>
          <Text style={styles.mono}>{NEKO_FORMAT}</Text>
          <Text style={styles.hint}>
            Tipos soportados: Gasto, Ingreso, Pago, Transferencia, Pago de Tarjeta, Reembolso, Compra
            a meses, Pago de Préstamo y Fondos del préstamo. Las transferencias no alteran el saldo
            (solo ingresos y gastos reales).
          </Text>
        </View>

        <Pressable
          style={[styles.button, styles.buttonPrimary, busy && styles.buttonDisabled]}
          onPress={() => pickFile('replace')}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonPrimaryText}>Elegir CSV y reemplazar todo</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonSecondary, busy && styles.buttonDisabled]}
          onPress={() => pickFile('merge')}
          disabled={busy}
        >
          <Text style={styles.buttonSecondaryText}>Elegir CSV y combinar (sin duplicar)</Text>
        </Pressable>

        <Text style={styles.footer}>
          Movimientos en la app: {transactionCount}. Tras importar, revisa Inicio e Historial.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  mono: { color: colors.textMuted, fontSize: 11, lineHeight: 16, fontFamily: 'monospace' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonSecondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  buttonSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  footer: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8 },
});