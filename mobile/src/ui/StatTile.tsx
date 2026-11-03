import { Text, View } from 'react-native';
import { radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { CountUp } from './CountUp';

interface Props { label: string; value: string | number; sub?: string; dot?: string }

/** A small bento tile: a quiet label, one big value, an optional line under it and an optional mood dot. */
export function StatTile({ label, value, sub, dot }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
      style={[{ flex: 1, backgroundColor: ramp.neutral[100], borderRadius: radii.card, padding: 16, gap: 6 }, shadows.sm]}
    >
      <Text style={[body(11, 'bold'), { color: ramp.neutral[600], letterSpacing: 1, textTransform: 'uppercase' }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {dot ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dot }} /> : null}
        {typeof value === 'number' ? <CountUp value={value} style={heading(28, 1.05)} /> : <Text style={heading(28, 1.05)}>{value}</Text>}
      </View>
      {sub ? <Text style={[body(12), { color: ramp.neutral[700] }]}>{sub}</Text> : null}
    </View>
  );
}
