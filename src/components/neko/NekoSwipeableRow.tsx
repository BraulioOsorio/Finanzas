import { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { colors } from '../../theme';

type Action = { key: string; label: string; color: string; onPress: () => void };

type Props = {
  children: React.ReactNode;
  actions: Action[];
  style?: ViewStyle;
};

/** Fila con acciones al deslizar (sin deps extra). */
export function NekoSwipeableRow({ children, actions, style }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const dragStart = useRef(0);
  const openWidth = actions.length * 76;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragStart.current = (translateX as Animated.Value & { __getValue?: () => number }).__getValue
          ? (translateX as unknown as { _value: number })._value
          : 0;
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(-openWidth, dragStart.current + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const current = Math.min(0, Math.max(-openWidth, dragStart.current + g.dx));
        const shouldOpen = g.dx < -40 || current < -openWidth / 2;
        Animated.spring(translateX, {
          toValue: shouldOpen ? -openWidth : 0,
          useNativeDriver: true,
          friction: 8,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            style={[styles.actionBtn, { backgroundColor: a.color }]}
            onPress={() => {
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
              a.onPress();
            }}
          >
            <Text style={styles.actionText}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: 16 },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionBtn: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionText: { color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});