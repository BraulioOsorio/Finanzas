import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryPickChip } from '../components/CategoryPickChip';
import { useTransactions } from '../context/TransactionsContext';
import { useNekoCatalog } from '../hooks/useNekoCatalog';
import { colors } from '../theme';
import { tokens } from '../tokens';

export function CategoriesScreen() {
  const { addCategoryGroup, addCategoryToGroup } = useTransactions();
  const { categoryTree } = useNekoCatalog();
  const [newGroup, setNewGroup] = useState('');
  const [newCatByGroup, setNewCatByGroup] = useState<Record<string, string>>({});

  const onAddGroup = async () => {
    const trimmed = newGroup.trim();
    if (!trimmed) {
      return;
    }
    if (categoryTree[trimmed]) {
      Alert.alert('Ya existe', 'Ese grupo ya está en tu árbol.');
      return;
    }
    await addCategoryGroup(trimmed);
    setNewGroup('');
  };

  const onAddCategory = async (group: string) => {
    const cat = (newCatByGroup[group] ?? '').trim();
    if (!cat) {
      return;
    }
    await addCategoryToGroup(group, cat);
    setNewCatByGroup((prev) => ({ ...prev, [group]: '' }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, tokens.font.title]}>Categorías</Text>
        <Text style={styles.subtitle}>
          Grupos y categorías como en Neko. Sirven al registrar, importar y elegir iconos.
        </Text>

        <View style={styles.addBlock}>
          <Text style={styles.label}>Nuevo grupo</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex]}
              value={newGroup}
              onChangeText={setNewGroup}
              placeholder="Ej. Viajes"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable style={styles.addBtn} onPress={onAddGroup}>
              <Text style={styles.addBtnText}>Añadir</Text>
            </Pressable>
          </View>
        </View>

        {Object.entries(categoryTree).map(([group, cats]) => (
          <View key={group} style={styles.groupCard}>
            <Text style={styles.groupTitle}>{group}</Text>
            <View style={styles.chipWrap}>
              {cats.map((cat) => (
                <CategoryPickChip
                  key={cat}
                  label={cat}
                  active={false}
                  onPress={() => {}}
                  categoryGroup={group}
                  category={cat}
                />
              ))}
              {cats.length === 0 ? (
                <Text style={styles.emptyCat}>Sin categorías — añade una abajo.</Text>
              ) : null}
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex]}
                value={newCatByGroup[group] ?? ''}
                onChangeText={(v) => setNewCatByGroup((p) => ({ ...p, [group]: v }))}
                placeholder="Nueva categoría"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.addBtn} onPress={() => onAddCategory(group)}>
                <Text style={styles.addBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: tokens.space.lg, paddingBottom: 40, gap: tokens.space.md },
  title: { color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  addBlock: { gap: 8 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: { color: colors.white, fontWeight: '800' },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: tokens.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  groupTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emptyCat: { color: colors.textMuted, fontSize: 13 },
});