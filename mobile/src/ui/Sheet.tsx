import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii, ramp } from '@/theme/tokens';
import { heading } from '@/theme/type';

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(visible ? 1 : 0, { duration: 280, easing: Easing.bezier(0.3, 0.9, 0.4, 1) });
  }, [visible, p]);
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * 520 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
      </Animated.View>
      <Animated.View style={[styles.panel, panel]}>
        <View style={styles.handle} />
        {title ? <Text style={heading(22)}>{title}</Text> : null}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingTop: 12, paddingHorizontal: 22, paddingBottom: 26, gap: 16 },
  handle: { width: 40, height: 5, borderRadius: 999, backgroundColor: ramp.neutral[400], alignSelf: 'center' },
});
