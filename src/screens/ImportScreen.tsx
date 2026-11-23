import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { suggestInstallmentsFromTransactions } from '../domain/suggestInstallmentsFromTransactions';
import { suggestRecurringFromTransactions } from '../domain/suggestRecurringFromTransactions';
import { useTransactions } from '../context/TransactionsContext';
import { transactionsToNekoCsv } from '../export/nekoCsvExport';
import { colors } from '../theme';

const NEKO_FORMAT = `Posted Date,Transaction Type,Description,Amount,Account,Category Group,Category,Notes`;

export function ImportScreen() {
  const {
    importNekoCsv,
    transactionCount,
    transactions,
    scheduledPayments,
    addScheduledPayment,
    installmentPlans,
    accounts,
    addInstallmentPlansBatch,
  } = useTransactions();
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

      if (result.imported > 0) {
        offerPlanSuggestions(result.transactionsAfter);
        offerInstallmentSuggestions(result.transactionsAfter);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo importar el archivo.');
    } finally {
      setBusy(false);
    }
  };

  const offerInstallmentSuggestions = (source: typeof transactions = transactions) => {
    const suggestions = suggestInstallmentsFromTransactions(source, accounts, installmentPlans);
    if (!suggestions.length) {
      return;
    }
    const preview = suggestions
      .slice(0, 5)
      .map((s) => `• ${s.title} (${s.installmentCount} cuotas, ${s.reason})`)
      .join('\n');
    Alert.alert(
      '¿Sincronizar compras a meses?',
      `Desde tu CSV (tipo Compra a meses). Ajusta cuotas en Plan si no coinciden con el banco:\n\n${preview}${suggestions.length > 5 ? `\n… y ${suggestions.length - 5} más` : ''}`,
      [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Crear planes',
          onPress: async () => {
            const n = await addInstallmentPlansBatch(
              suggestions.map(({ reason: _r, fingerprint: _f, ...draft }) => draft),
            );
            Alert.alert('Listo', `${n} compras a meses en Plan (con corte de tarjeta si aplica).`);
          },
        },
      ],
    );
  };

  const offerPlanSuggestions = (source: typeof transactions = transactions) => {
    const plannedTitles = new Set(scheduledPayments.map((p) => p.title.toLowerCase()));
    const suggestions = suggestRecurringFromTransactions(source).filter(
      (s) => !plannedTitles.has(s.title.toLowerCase()),
    );
    if (!suggestions.length) {
      return;
    }
    const preview = suggestions
      .slice(0, 5)
      .map((s) => `• ${s.title} (${s.frequency}, ${s.reason})`)
      .join('\n');
  Alert.alert(
      '¿Añadir al Plan?',
      `Detectamos posibles pagos recurrentes:\n\n${preview}${suggestions.length > 5 ? `\n… y ${suggestions.length - 5} más` : ''}`,
      [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Añadir al Plan',
          onPress: async () => {
            for (const { reason: _r, ...draft } of suggestions) {
              await addScheduledPayment(draft);
            }
            Alert.alert('Listo', `${suggestions.length} ítems en la pestaña Plan.`);
          },
        },
      ],
    );
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

  const exportCsv = async () => {
    if (!transactionCount) {
      Alert.alert('Sin datos', 'No hay movimientos para exportar.');
      return;
    }
    setBusy(true);
    try {
      const csv = transactionsToNekoCsv(transactions);
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `finanzas_transactions_${stamp}.csv`;
      const outFile = new File(Paths.cache, fileName);
      outFile.create({ overwrite: true });
      await outFile.write(csv);

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
        Alert.alert('Exportado', `${transactionCount} filas descargadas.`);
        return;
      }

      const shared = await Share.share({
        title: fileName,
        message: csv.length < 60000 ? csv : `Export Neko: ${fileName}`,
        url: outFile.uri,
      });
      if (shared.action === Share.sharedAction) {
        Alert.alert('Exportado', `${transactionCount} movimientos en formato Neko.`);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo exportar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Importar / exportar Neko</Text>
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

        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => offerPlanSuggestions()}
          disabled={busy || transactionCount === 0}
        >
          <Text style={styles.buttonSecondaryText}>Sugerir recurrentes al Plan (desde historial)</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => offerInstallmentSuggestions()}
          disabled={busy || transactionCount === 0}
        >
          <Text style={styles.buttonSecondaryText}>Sincronizar compras a meses (CSV / historial)</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonPrimary, busy && styles.buttonDisabled]}
          onPress={exportCsv}
          disabled={busy || transactionCount === 0}
        >
          <Text style={styles.buttonPrimaryText}>Exportar CSV (formato Neko)</Text>
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