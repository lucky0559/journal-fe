import { Text, View } from 'react-native';
import { colors, ramp, shadows } from '@/theme/tokens';
import { body } from '@/theme/type';
import { PhotoTile } from '@/ui/PhotoTile';

/** A photo stuck on the page: white border, a wider strip underneath, a slight tilt and a bit of tape. */
export function Polaroid({ uri, label, index }: { uri: string; label?: string; index: number }) {
  const right = index % 2 === 1;
  return (
    <View style={{ width: '82%', alignSelf: right ? 'flex-end' : 'flex-start', transform: [{ rotate: `${right ? 2.2 : -2.2}deg` }], marginTop: 6 }}>
      <View style={[{ backgroundColor: colors.paper, padding: 10, paddingBottom: 34, borderRadius: 3 }, shadows.md]}>
        <PhotoTile height={210} radius={2} uri={uri} label={label} />
        {uri && label ? <Text numberOfLines={1} style={[body(12), { color: ramp.neutral[700], marginTop: 8 }]}>{label}</Text> : null}
      </View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -9, alignSelf: 'center', width: 74, height: 22, borderRadius: 2, backgroundColor: ramp.accent[300], opacity: 0.72, transform: [{ rotate: right ? '3deg' : '-3deg' }] }}
      />
    </View>
  );
}
