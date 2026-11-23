import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NekoCalendarTxCard } from '../components/neko/calendar/NekoCalendarTxCard';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { ScreenBackHeader } from '../components/ScreenBackHeader';
import { balanceAfterTransaction as nekoBalanceAfterTx } from '../domain/calendarDayBalances';
import { useTransactions } from '../context/TransactionsContext';
import { EMPTY_HISTORY_FILTER } from '../domain/historyFilters';
import { searchTransactions } from '../domain/searchTransactions';
import type { MoreStackParamList } from '../navigation/moreTypes';
import { colors } from '../theme';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

export function SearchScreen() {
  const { transactions, accounts, setHistoryFilterSeed } = useTransactions();
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchTransactions(transactions, query), [transactions, query]);

  const openHistorial = () => {
    if (query.trim().length >= 2) {
      setHistoryFilterSeed({ ...EMPTY_HISTORY_FILTER, query: query.trim() });
    }
    navigation.navigate('Historial');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackHeader />
      <View style={styles.header}>
        <NekoScreenHeader title="Buscar" subtitle="En todo tu historial" />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Descripción, cuenta, categoría…"
          placeholderTextColor={colors.textMuted}
          autoFocus
          returnKeyType="search"
        />
        {query.trim().length >= 2 ? (
          <Pressable onPress={openHistorial}>
            <Text style={styles.link}>Abrir en Historial con este filtro</Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>Escribe al menos 2 caracteres.</Text>
        )}
      </View>
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.length >= 2
            ? () => <Text style={styles.empty}>Sin coincidencias.</Text>
            : undefined
        }
        renderItem={({ item }) => (
          <NekoCalendarTxCard
            item={item}
            runningBalance={nekoBalanceAfterTx(transactions, accounts, item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, gap: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.text,
    fontSize: 16,
  },
  hint: { color: colors.textMuted, fontSize: 13 },
  link: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
});