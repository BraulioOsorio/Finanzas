import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, tokens } from '../../theme';
import { NekoBottomSheet } from './NekoBottomSheet';

type IonName = ComponentProps<typeof Ionicons>['name'];

/** Textos alineados con el sheet «Agregar transacción» de NEKO 8.8.x. */
const TYPES: { type: string; title: string; desc: string; icon: IonName }[] = [
  {
    type: 'Gasto',
    title: 'Gasto',
    desc: 'Algo que ya pagaste: compras, restaurantes, peajes…',
    icon: 'cart-outline',
  },
  {
    type: 'Pago',
    title: 'Pago',
    desc: 'Algo que todavía no has pagado: arriendo, suscripciones, facturas…',
    icon: 'calendar-outline',
  },
  {
    type: 'Ingreso',
    title: 'Ingreso',
    desc: 'Salario, freelance, bonos u otro dinero que entra.',
    icon: 'trending-up-outline',
  },
  {
    type: 'Transferencia',
    title: 'Transferencia',
    desc: 'Mover dinero de una cuenta a otra (mismas dos patas que NEKO).',
    icon: 'swap-horizontal',
  },
  {
    type: 'Reembolso',
    title: 'Reembolso',
    desc: 'Devolución de una compra o reintegro recibido.',
    icon: 'arrow-undo-outline',
  },
  {
    type: 'Compra a meses',
    title: 'Compra a meses',
    desc: 'Compra en cuotas con tarjeta de crédito.',
    icon: 'grid-outline',
  },
  {
    type: 'Pago de Tarjeta',
    title: 'Pago de Tarjeta',
    desc: 'Abono al extracto de tu tarjeta de crédito.',
    icon: 'card-outline',
  },
  {
    type: 'Pago de Préstamo',
    title: 'Pago de Préstamo',
    desc: 'Cuota o abono a un préstamo o deuda.',
    icon: 'document-text-outline',
  },
  {
    type: 'Fondos del préstamo',
    title: 'Fondos del préstamo',
    desc: 'Desembolso o capital que entra por un préstamo.',
    icon: 'business-outline',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (nekoType: string) => void;
};

export function TransactionTypeSheet({ visible, onClose, onPick }: Props) {
  return (
    <NekoBottomSheet visible={visible} title="Agregar transacción" onClose={onClose}>
      <Text style={styles.hint}>Elige el tipo de movimiento (como en NEKO).</Text>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {TYPES.map((row, index) => (
          <Pressable
            key={`${row.type}-${index}`}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              onPick(row.type);
              onClose();
            }}
          >
            <View style={styles.iconBox}>
              <Ionicons name={row.icon} size={22} color={colors.accent} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowDesc}>{row.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </NekoBottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: tokens.fontFamily.medium,
  },
  scroll: { maxHeight: 520 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.accentMuted },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 3 },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-SemiBold',
  },
  rowDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'HankenGrotesk-Regular',
  },
});