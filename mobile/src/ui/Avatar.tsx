import { Pressable, Text } from 'react-native';
import { ramp } from '@/theme/tokens';
import { heading } from '@/theme/type';

export function Avatar({ initial, color = ramp.accent2[300], size = 40, onPress }: { initial: string; color?: string; size?: number; onPress?: () => void }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={`Avatar ${initial}`}
      hitSlop={Math.max(0, (44 - size) / 2)}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={[heading(Math.round(size * 0.4), 1), { color: ramp.accent2[900] }]}>{initial}</Text>
    </Pressable>
  );
}
