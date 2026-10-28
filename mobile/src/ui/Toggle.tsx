import { Pressable, View } from 'react-native';
import { colors, ramp } from '@/theme/tokens';

export function Toggle({ value, onChange, accessibilityLabel }: { value: boolean; onChange: (v: boolean) => void; accessibilityLabel: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={6}
      style={{ width: 52, height: 32, borderRadius: 16, backgroundColor: value ? ramp.accent2[600] : ramp.neutral[400], justifyContent: 'center' }}
    >
      <View style={{ position: 'absolute', top: 4, left: value ? 24 : 4, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text }} />
    </Pressable>
  );
}
