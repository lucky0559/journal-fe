import { Pressable, Text } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radii, ramp, shadows } from '@/theme/tokens';
import { heading } from '@/theme/type';
import { useNewPage } from '@/features/write/useNewPage';
import { Icon } from './Icon';

export function Fab() {
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();
  const newPage = useNewPage();
  if (pathname !== '/' && !pathname.startsWith('/timeline')) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New page"
      onPress={newPage}
      style={({ pressed }) => [
        {
          position: 'absolute', right: layout.fabInset, bottom: layout.navHeight + bottom + layout.fabInset, height: layout.fabHeight,
          paddingLeft: 18, paddingRight: 22, borderRadius: radii.fab, flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: pressed ? ramp.accent[600] : colors.accent,
        },
        shadows.lg,
      ]}
    >
      <Icon name="pencil" size={20} color={colors.bg} />
      <Text style={[heading(16, 1), { color: colors.bg }]}>New page</Text>
    </Pressable>
  );
}
