import { Text, View } from 'react-native';

import { NekoScreenShell } from '@/components/NekoScreenShell';
import { nekoTheme } from '@/constants/nekoTheme';

export default function InicioScreen() {
  return (
    <NekoScreenShell
      title="Disponible para gastar"
      subtitle="Rama neko — clon propio desde APK 8.8.2 (shell inicial).">
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: nekoTheme.textMuted, fontFamily: nekoTheme.fontRegular, lineHeight: 22 }}>
          Código editable: src/domain/ y src/import/ (motor NEKO). Flutter: neko_app/lib/. Ver docs/CODIGO-EDITABLE.md
        </Text>
      </View>
    </NekoScreenShell>
  );
}