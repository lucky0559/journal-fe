import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { ramp } from '@/theme/tokens';
import { Icon } from './Icon';

interface Props { size?: number; height?: number; radius: number; label?: string; uri?: string; rotate?: number; onRemove?: () => void }

export function PhotoTile({ size, height, radius, label = '', uri, rotate = 0, onRemove }: Props) {
  const w = size ?? '100%';
  const h = size ?? height;
  return (
    <View style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden', transform: [{ rotate: `${rotate}deg` }], justifyContent: 'flex-end' }}>
      {uri ? (
        <Image accessibilityLabel="Photo" source={{ uri }} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      ) : (
        <>
          <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs>
              <Pattern id="stripes" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                <Rect width={8} height={16} fill={ramp.neutral[200]} />
                <Rect x={8} width={8} height={16} fill={ramp.neutral[300]} />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#stripes)" />
          </Svg>
          {label ? <Text style={{ padding: size ? 10 : 12, fontFamily: 'monospace', fontSize: size ? 9.5 : 10, color: ramp.neutral[800] }}>{label}</Text> : null}
        </>
      )}
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          onPress={onRemove}
          hitSlop={10}
          style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: ramp.neutral[100], alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" size={13} />
        </Pressable>
      ) : null}
    </View>
  );
}
