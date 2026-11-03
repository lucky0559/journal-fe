import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, ramp, radii } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Spinner } from './Spinner';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  height?: number;
  fontSize?: number;
  disabled?: boolean;
  /** Shows a spinner in place of the label (the button keeps its size) and ignores presses. */
  loading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', height, fontSize, disabled, loading, accessibilityLabel, testID, style }: Props) {
  const h = height ?? (variant === 'ghost' ? 48 : 56);
  const ink = variant === 'primary' ? colors.onAccent : variant === 'ghost' ? ramp.accent[700] : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { height: h, minHeight: 44 },
        variant === 'primary' && { backgroundColor: pressed ? ramp.accent[600] : colors.accent },
        variant === 'ghost' && { backgroundColor: pressed ? ramp.accent[100] : 'transparent' },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.divider, backgroundColor: pressed ? ramp.neutral[200] : 'transparent' },
        disabled && !loading && { opacity: 0.45 },
        style,
      ]}
    >
      <Text
        style={[
          variant === 'primary'
            ? heading(fontSize ?? 18, 1)
            : body(fontSize ?? 15, 'semi'),
          { color: ink },
          loading && { opacity: 0 }, // keeps the button's width while Lumi hops over it
        ]}
      >
        {label}
      </Text>
      {loading ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* on the amber button Lumi swaps colours so it still shows */}
            <Spinner size={Math.min(30, h - 18)} label={`${label}, please wait`} {...(variant === 'primary' ? { color: colors.onAccent, ink: colors.accent } : {})} />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
});
