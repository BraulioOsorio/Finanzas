import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NekoGroupCard } from '../components/neko/NekoGroupCard';
import { NekoListRow } from '../components/neko/NekoListRow';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { NekoSectionLabel } from '../components/neko/NekoSectionLabel';
import type { MoreStackParamList } from '../navigation/moreTypes';
import { useRootNav } from '../navigation/useRootNav';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import { colors } from '../theme';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

export function MoreHubScreen() {
  const navigation = useNavigation<Nav>();
  const { openPlan, openRegistrar, goBackRoot } = useRootNav();

  const go = (screen: keyof MoreStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NekoScreenHeader
        title="Más"
        subtitle="Datos en tu teléfono · compatible con export Neko"
        actions={[
          {
            icon: 'close-outline',
            accessibilityLabel: 'Cerrar',
            onPress: () => goBackRoot(),
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>F</Text>
          </View>
          <Text style={styles.brandHint}>Finanzas · COP · sin nube</Text>
        </View>

        <NekoSectionLabel>GENERAL</NekoSectionLabel>
        <NekoGroupCard>
          <NekoListRow
            icon="pie-chart-outline"
            title="Análisis"
            subtitle="Patrimonio, flujo y categorías del período"
            onPress={() => go('Informe')}
          />
          <NekoListRow
            icon="time-outline"
            title="Historial"
            subtitle="Transacciones, filtros y edición"
            onPress={() => go('Historial')}
          />
          <NekoListRow
            icon="search-outline"
            title="Buscar"
            subtitle="Texto en descripción, cuenta o categoría"
            onPress={() => go('Buscar')}
          />
          <NekoListRow
            icon="wallet-outline"
            title="Cuentas"
            subtitle="Débito, crédito, préstamos y saldos"
            onPress={() => go('Cuentas')}
          />
          <NekoListRow
            icon="layers-outline"
            title="Categorías"
            subtitle="Árbol Neko y presupuestos mensuales"
            onPress={() => go('Categorias')}
          />
          <NekoListRow
            icon="card-outline"
            title="Deudas"
            subtitle="Préstamos y amortización (Colombia)"
            onPress={() => go('Deudas')}
          />
        </NekoGroupCard>

        <NekoSectionLabel>PLANIFICACIÓN</NekoSectionLabel>
        <NekoGroupCard>
          <NekoListRow
            icon="repeat-outline"
            title="Transacciones recurrentes"
            subtitle="Quincena, arriendo, suscripciones → calendario"
            onPress={() => openPlan()}
          />
          <NekoListRow
            icon="add-circle-outline"
            title="Registrar movimiento"
            subtitle="Gasto, ingreso, transferencia…"
            onPress={() => openRegistrar()}
          />
        </NekoGroupCard>

        <NekoSectionLabel>HERRAMIENTAS DE DATOS</NekoSectionLabel>
        <NekoGroupCard>
          <NekoListRow
            icon="cloud-download-outline"
            title="Importar / exportar"
            subtitle="CSV Neko y copia de seguridad"
            onPress={() => go('Importar')}
          />
        </NekoGroupCard>

        <NekoSectionLabel>PREFERENCIAS</NekoSectionLabel>
        <NekoGroupCard>
          <NekoListRow
            icon="settings-outline"
            title="Ajustes"
            subtitle="Iconos, recordatorios, PIN y modo seguro"
            onPress={() => go('Ajustes')}
          />
        </NekoGroupCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: TAB_BAR_BOTTOM_INSET },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Regular',
  },
  brandHint: { color: colors.textMuted, fontSize: 13, flex: 1, fontFamily: 'HankenGrotesk-Regular' },
});