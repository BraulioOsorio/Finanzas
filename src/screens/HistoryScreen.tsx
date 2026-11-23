import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '../components/TransactionRow';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';

export function HistoryScreen() {
  const { loading, transactions, removeTransaction } = useTransactions();

  const confirmDelete = (id: string) => {
    Alert.alert('Eliminar movimiento', '¿Quieres borrar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeTransaction(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>{transactions.length} movimientos</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.textMuted} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin historial todavía</Text>
              <Text style={styles.emptyBody}>Los movimientos que guardes aparecerán aquí.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TransactionRow item={item} onDelete={() => confirmDelete(item.id)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
});