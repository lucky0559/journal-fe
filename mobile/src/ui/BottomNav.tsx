import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon, type IconName } from './Icon';

const ICONS: Record<string, IconName> = { index: 'house', timeline: 'calendar', friends: 'users', me: 'user' };

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ height: layout.navHeight + bottom, paddingBottom: bottom, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center' }}>
      {state.routes.map((route: { key: string; name: string; params?: object }, i: number) => {
        const focused = state.index === i;
        const label = descriptors[route.key].options.title ?? route.name;
        const fg = focused ? ramp.accent[900] : ramp.neutral[700];
        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: layout.hitTarget }}
          >
            <View style={{ width: 60, height: 32, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? ramp.accent[300] : 'transparent' }}>
              <Icon name={ICONS[route.name] ?? 'house'} size={22} color={fg} />
            </View>
            <Text style={[body(12, focused ? 'bold' : 'semi'), { color: fg }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
