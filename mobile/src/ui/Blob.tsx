import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { blobPath, type Radii } from '@/lib/blob';

export function Blob({
  radii, size, color, rotate = 0, children,
}: { radii: Radii; size: number; color: string; rotate?: number; children?: React.ReactNode }) {
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: `${rotate}deg` }] }} pointerEvents="none">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Path d={blobPath(radii, size)} fill={color} />
      </Svg>
      {children ? <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{children}</View> : null}
    </View>
  );
}
