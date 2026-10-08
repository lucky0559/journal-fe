import { Text, View } from 'react-native';
import { colors, ramp, radii } from '@/theme/tokens';
import { body } from '@/theme/type';
import { useToast } from '@/state/toastStore';

export function ToastHost() {
  const message = useToast((s) => s.message);
  if (!message) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 92, alignItems: 'center', zIndex: 20 }}>
      <View accessibilityLiveRegion="polite" style={{ backgroundColor: ramp.neutral[900], paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.pill }}>
        <Text style={[body(13, 'semi'), { color: colors.bg }]}>{message}</Text>
      </View>
    </View>
  );
}
