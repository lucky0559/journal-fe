import { useEffect } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii, ramp } from '@/theme/tokens';
import { themedStyles } from '@/theme/themedStyles';
import { heading } from '@/theme/type';

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(visible ? 1 : 0, { duration: 280, easing: Easing.bezier(0.3, 0.9, 0.4, 1) });
  }, [visible, p]);
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * 520 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  if (!visible) return null;
  const styles = getStyles();
  // A Modal, not an in-tree overlay: sheets are mounted inside scrolling screens, where an absolute fill only spans the scroll content.
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* The Modal is its own window, which no longer resizes for the keyboard under edge-to-edge, so lift the panel above it (as WriteScreen does). */}
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        </Animated.View>
        <Animated.View style={[styles.panel, panel]}>
          <View style={styles.handle} />
          {title ? <Text style={heading(22)}>{title}</Text> : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = themedStyles(() => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  panel: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingTop: 12, paddingHorizontal: 22, paddingBottom: 26, gap: 16 },
  handle: { width: 40, height: 5, borderRadius: 999, backgroundColor: ramp.neutral[400], alignSelf: 'center' },
}));
