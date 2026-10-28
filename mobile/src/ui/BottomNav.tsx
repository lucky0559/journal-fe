import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon, type IconName } from './Icon';

const ICONS: Record<string, IconName> = { index: 'house', timeline: 'calendar', friends: 'users', me: 'user' };
const TIMING = { duration: 240, easing: Easing.out(Easing.ease) };

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ height: layout.navHeight + bottom, paddingBottom: bottom, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center' }}>
      {state.routes.map((route: { key: string; name: string; params?: object }, i: number) => {
        const focused = state.index === i;
        const label = descriptors[route.key].options.title ?? route.name;
        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return <NavItem key={route.key} name={route.name} label={label} focused={focused} onPress={onPress} />;
      })}
    </View>
  );
}

/** One tab: the pill grows in behind the icon, and icon and label colours cross-fade, in both directions. */
function NavItem({ name, label, focused, onPress }: { name: string; label: string; focused: boolean; onPress: () => void }) {
  const p = useSharedValue(focused ? 1 : 0); // starts at its target so the first render doesn't animate
  useEffect(() => {
    p.value = withTiming(focused ? 1 : 0, TIMING);
  }, [focused, p]);

  const pill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scaleX: 0.4 + 0.6 * p.value }] }));
  const iconOn = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 3 }] }));
  const iconOff = useAnimatedStyle(() => ({ opacity: 1 - p.value }));
  const text = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [ramp.neutral[700], ramp.accent[900]]) }));
  const icon = ICONS[name] ?? 'house';

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: layout.hitTarget }}
    >
      <View style={{ width: 60, height: 32, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View testID={`nav-pill-${name}`} style={[StyleSheet.absoluteFill, { borderRadius: radii.pill, backgroundColor: ramp.accent[300] }, pill]} />
        <Animated.View style={[styles.layer, iconOff]}><Icon name={icon} size={22} color={ramp.neutral[700]} /></Animated.View>
        <Animated.View style={[styles.layer, iconOn]}><Icon name={icon} size={22} color={ramp.accent[900]} /></Animated.View>
      </View>
      <Animated.Text style={[body(12, focused ? 'bold' : 'semi'), text]}>{label}</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
