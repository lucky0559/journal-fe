import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, ramp, radii } from '@/theme/tokens';
import { body, heading } from '@/theme/type';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  height?: number;
  fontSize?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', height, fontSize, disabled, accessibilityLabel, testID, style }: Props) {
  const h = height ?? (variant === 'ghost' ? 48 : 56);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { height: h, minHeight: 44 },
        variant === 'primary' && { backgroundColor: pressed ? ramp.accent[600] : colors.accent },
        variant === 'ghost' && { backgroundColor: pressed ? ramp.accent[100] : 'transparent' },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.divider, backgroundColor: pressed ? ramp.neutral[200] : 'transparent' },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text
        style={
          variant === 'primary'
            ? [heading(fontSize ?? 18, 1), { color: colors.bg }]
            : [body(fontSize ?? 15, 'semi'), { color: variant === 'ghost' ? ramp.accent[700] : colors.text }]
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
});
