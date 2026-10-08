import { Pressable, Text } from 'react-native';
import { colors, ramp, radii } from '@/theme/tokens';
import { body } from '@/theme/type';

export function Chip({ label, selected, onPress, height = 36, fill = false }: { label: string; selected: boolean; onPress: () => void; height?: number; fill?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: Math.max(0, (44 - height) / 2), bottom: Math.max(0, (44 - height) / 2) }}
      style={{
        height, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
        alignSelf: fill ? 'stretch' : 'auto',
        backgroundColor: selected ? ramp.accent2[600] : 'transparent',
        borderColor: selected ? ramp.accent2[600] : colors.divider,
      }}
    >
      <Text style={[body(height >= 56 ? 15 : 13, 'semi'), { color: selected ? ramp.neutral[100] : ramp.neutral[800] }]}>{label}</Text>
    </Pressable>
  );
}
