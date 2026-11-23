import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  initial: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function CategoryEditModal({ visible, title, initial, onClose, onSave }: Props) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (visible) {
      setValue(initial);
    }
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            autoFocus
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.row}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={styles.save}
              onPress={() => {
                const t = value.trim();
                if (t) {
                  onSave(t);
                }
                onClose();
              }}
            >
              <Text style={styles.saveText}>Guardar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancel: { paddingVertical: 10, paddingHorizontal: 14 },
  cancelText: { color: colors.textMuted, fontWeight: '700' },
  save: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveText: { color: colors.white, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
});