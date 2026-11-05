import { Pressable, Text, View } from 'react-native';
import { radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { CountUp } from './CountUp';
import { Icon } from './Icon';

interface Props { label: string; value: string | number; sub?: string; dot?: string; onPress?: () => void; hint?: string }

/**
 * A small bento tile: a quiet label, one big value, an optional line under it and an optional mood dot.
 * With `onPress` the whole tile is a button, marked with a small arrow.
 */
export function StatTile({ label, value, sub, dot, onPress, hint }: Props) {
  const a11y = `${label}: ${value}${sub ? `, ${sub}` : ''}`;
  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[body(11, 'bold'), { color: ramp.neutral[600], letterSpacing: 1, textTransform: 'uppercase' }]}>{label}</Text>
        {onPress ? <Icon name="chevron-right" size={16} color={ramp.neutral[600]} /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {dot ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dot }} /> : null}
        {typeof value === 'number' ? <CountUp value={value} style={heading(28, 1.05)} /> : <Text style={heading(28, 1.05)}>{value}</Text>}
      </View>
      {sub ? <Text style={[body(12), { color: ramp.neutral[700] }]}>{sub}</Text> : null}
    </>
  );
  const tile = { flex: 1, borderRadius: radii.card, padding: 16, gap: 6 } as const;

  if (!onPress) {
    return <View accessible accessibilityLabel={a11y} style={[tile, { backgroundColor: ramp.neutral[100] }, shadows.sm]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [tile, { backgroundColor: pressed ? ramp.accent[100] : ramp.neutral[100] }, shadows.sm]}
    >
      {content}
    </Pressable>
  );
}
