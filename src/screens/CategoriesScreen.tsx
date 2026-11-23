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

import { CategoryEditModal } from '../components/CategoryEditModal';
import { CategoryPickChip } from '../components/CategoryPickChip';
import { useTransactions } from '../context/TransactionsContext';
import { useNekoCatalog } from '../hooks/useNekoCatalog';
import { colors } from '../theme';
import { tokens } from '../tokens';
import { formatCurrency } from '../utils/format';

type EditState =
  | { type: 'group'; group: string }
  | { type: 'category'; group: string; category: string }
  | { type: 'budget'; id: string; label: string; limit: number }
  | null;

export function CategoriesScreen() {
  const {
    addCategoryGroup,
    addCategoryToGroup,
    renameCategoryGroup,
    removeCategoryGroup,
    renameCategoryInGroup,
    removeCategoryInGroup,
    moveCategoryGroup,
    moveCategoryInGroup,
    budgets,
    addBudget,
    updateBudget,
    removeBudget,
    budgetProgress,
  } = useTransactions();
  const { categoryTree, categoriesForGroup } = useNekoCatalog();
  const [newGroup, setNewGroup] = useState('');
  const [newCatByGroup, setNewCatByGroup] = useState<Record<string, string>>({});
  const [budgetGroup, setBudgetGroup] = useState('Comida y Bebida');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [edit, setEdit] = useState<EditState>(null);

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

  const onAddBudget = async () => {
    const limit = Number(budgetLimit.replace(/[^\d]/g, ''));
    if (!limit || limit <= 0) {
      Alert.alert('Monto', 'Escribe un tope mensual en COP.');
      return;
    }
    await addBudget({
      categoryGroup: budgetGroup,
      category: budgetCategory.trim(),
      monthlyLimit: limit,
      active: true,
    });
    setBudgetLimit('');
  };

  const onAddCategory = async (group: string) => {
    const cat = (newCatByGroup[group] ?? '').trim();
    if (!cat) {
      return;
    }
    await addCategoryToGroup(group, cat);
    setNewCatByGroup((prev) => ({ ...prev, [group]: '' }));
  };

  const confirmRemoveGroup = (group: string) => {
    Alert.alert(
      'Eliminar grupo',
      'Se quita del árbol; los movimientos conservan el nombre antiguo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => void removeCategoryGroup(group) },
      ],
    );
  };

  const confirmRemoveCat = (group: string, category: string) => {
    Alert.alert('Eliminar categoría', 'Los movimientos no cambian.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => void removeCategoryInGroup(group, category),
      },
    ]);
  };

  const onEditSave = async (value: string) => {
    if (!edit) {
      return;
    }
    if (edit.type === 'group') {
      await renameCategoryGroup(edit.group, value);
    } else if (edit.type === 'category') {
      await renameCategoryInGroup(edit.group, edit.category, value);
    } else if (edit.type === 'budget') {
      const limit = Number(value.replace(/[^\d]/g, ''));
      if (limit > 0) {
        await updateBudget(edit.id, limit);
      }
    }
    setEdit(null);
  };

  const editModal =
    edit && edit.type !== 'budget' ? (
      <CategoryEditModal
        visible
        title={edit.type === 'group' ? 'Renombrar grupo' : 'Renombrar categoría'}
        initial={edit.type === 'group' ? edit.group : edit.category}
        onClose={() => setEdit(null)}
        onSave={(v) => void onEditSave(v)}
      />
    ) : edit?.type === 'budget' ? (
      <CategoryEditModal
        visible
        title={`Tope: ${edit.label}`}
        initial={String(edit.limit)}
        onClose={() => setEdit(null)}
        onSave={(v) => void onEditSave(v)}
      />
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, tokens.font.title]}>Categorías</Text>
        <Text style={styles.subtitle}>
          Edita, reordena y presupuesta por grupo/categoría (como NEKO).
        </Text>

        {editModal}

        <View style={styles.groupCard}>
          <Text style={styles.groupTitle}>Presupuesto mensual</Text>
          <Text style={styles.budgetHint}>
            Toca un presupuesto para cambiar el tope. Progreso en Inicio e Informe.
          </Text>
          <Text style={styles.label}>Grupo</Text>
          <View style={styles.chipWrap}>
            {Object.keys(categoryTree).map((g) => (
              <Pressable
                key={g}
                style={[styles.miniChip, budgetGroup === g && styles.miniChipActive]}
                onPress={() => {
                  setBudgetGroup(g);
                  setBudgetCategory('');
                }}
              >
                <Text style={[styles.miniChipText, budgetGroup === g && styles.miniChipTextActive]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Categoría (vacío = todo el grupo)</Text>
          <View style={styles.chipWrap}>
            <Pressable
              style={[styles.miniChip, !budgetCategory && styles.miniChipActive]}
              onPress={() => setBudgetCategory('')}
            >
              <Text style={[styles.miniChipText, !budgetCategory && styles.miniChipTextActive]}>
                Todo el grupo
              </Text>
            </Pressable>
            {categoriesForGroup(budgetGroup).map((c) => (
              <Pressable
                key={c}
                style={[styles.miniChip, budgetCategory === c && styles.miniChipActive]}
                onPress={() => setBudgetCategory(c)}
              >
                <Text
                  style={[styles.miniChipText, budgetCategory === c && styles.miniChipTextActive]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex]}
              keyboardType="number-pad"
              value={budgetLimit}
              onChangeText={setBudgetLimit}
              placeholder="Tope COP / mes"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable style={styles.addBtn} onPress={onAddBudget}>
              <Text style={styles.addBtnText}>Añadir</Text>
            </Pressable>
          </View>
          {budgets.length > 0 ? (
            <View style={styles.budgetList}>
              {budgetProgress.map((p) => (
                <View key={p.budget.id} style={styles.budgetRow}>
                  <Pressable
                    style={styles.budgetMain}
                    onPress={() =>
                      setEdit({
                        type: 'budget',
                        id: p.budget.id,
                        label: p.label,
                        limit: p.budget.monthlyLimit,
                      })
                    }
                  >
                    <Text style={styles.budgetLabel} numberOfLines={1}>
                      {p.label}
                    </Text>
                    <Text style={styles.budgetAmount}>
                      {formatCurrency(p.effectiveSpent)} / {formatCurrency(p.limit)}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => removeBudget(p.budget.id)}>
                    <Text style={styles.budgetRemove}>Quitar</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

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
            <View style={styles.groupHead}>
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.toolRow}>
                <Pressable onPress={() => void moveCategoryGroup(group, -1)}>
                  <Text style={styles.tool}>↑</Text>
                </Pressable>
                <Pressable onPress={() => void moveCategoryGroup(group, 1)}>
                  <Text style={styles.tool}>↓</Text>
                </Pressable>
                <Pressable onPress={() => setEdit({ type: 'group', group })}>
                  <Text style={styles.tool}>✎</Text>
                </Pressable>
                <Pressable onPress={() => confirmRemoveGroup(group)}>
                  <Text style={[styles.tool, styles.toolDanger]}>✕</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.chipWrap}>
              {cats.map((cat) => (
                <View key={cat} style={styles.catWrap}>
                  <CategoryPickChip
                    label={cat}
                    active={false}
                    onPress={() => setEdit({ type: 'category', group, category: cat })}
                    categoryGroup={group}
                    category={cat}
                  />
                  <View style={styles.catTools}>
                    <Pressable onPress={() => void moveCategoryInGroup(group, cat, -1)}>
                      <Text style={styles.catTool}>‹</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmRemoveCat(group, cat)}>
                      <Text style={[styles.catTool, styles.toolDanger]}>×</Text>
                    </Pressable>
                    <Pressable onPress={() => void moveCategoryInGroup(group, cat, 1)}>
                      <Text style={styles.catTool}>›</Text>
                    </Pressable>
                  </View>
                </View>
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
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  toolRow: { flexDirection: 'row', gap: 10 },
  tool: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  toolDanger: { color: colors.expense },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catWrap: { gap: 2, alignItems: 'center' },
  catTools: { flexDirection: 'row', gap: 6 },
  catTool: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  emptyCat: { color: colors.textMuted, fontSize: 13 },
  budgetHint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  miniChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  miniChipTextActive: { color: colors.white },
  budgetList: { gap: 8, marginTop: 8 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetMain: { flex: 1, gap: 2 },
  budgetLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  budgetAmount: { color: colors.textMuted, fontSize: 11 },
  budgetRemove: { color: colors.expense, fontSize: 12, fontWeight: '600' },
});