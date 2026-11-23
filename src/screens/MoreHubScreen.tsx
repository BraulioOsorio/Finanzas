import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MoreStackParamList } from '../navigation/moreTypes';
import { colors } from '../theme';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

const LINKS: { key: keyof MoreStackParamList; title: string; desc: string }[] = [
  { key: 'Informe', title: 'Informe', desc: 'Patrimonio, flujo y categorías' },
  { key: 'Historial', title: 'Historial', desc: 'Buscar y editar movimientos' },
  { key: 'Cuentas', title: 'Cuentas', desc: 'Bancos, tarjetas, saldos' },
  { key: 'Deudas', title: 'Deudas', desc: 'Préstamos y amortización' },
  { key: 'Categorias', title: 'Categorías', desc: 'Árbol Neko y presupuestos' },
  { key: 'Importar', title: 'Importar / exportar', desc: 'Copia de seguridad de datos' },
  { key: 'Ajustes', title: 'Ajustes', desc: 'Iconos, recordatorios, PIN' },
];

export function MoreHubScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Más</Text>
        <Text style={styles.subtitle}>Cuentas, historial, informe y ajustes — estilo NEKO sin barra saturada.</Text>
        {LINKS.map((item) => (
          <Pressable
            key={item.key}
            style={styles.row}
            onPress={() => navigation.navigate(item.key)}
          >
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowDesc}>{item.desc}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 10 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  rowDesc: { color: colors.textMuted, fontSize: 12 },
});