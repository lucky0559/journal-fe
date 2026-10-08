import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme/tokens';
import { ScreenFade } from './ScreenFade';

interface Props { children: React.ReactNode; scroll?: boolean; topPad?: number; bottomPad?: number; gap?: number }

export function Screen({ children, scroll = true, topPad = 14, bottomPad = 110, gap = 24 }: Props) {
  const { top } = useSafeAreaInsets();
  const pad = { paddingTop: top + topPad, paddingHorizontal: layout.screenPadding, gap };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade>
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ ...pad, paddingBottom: bottomPad }}>
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, ...pad }}>{children}</View>
        )}
      </ScreenFade>
    </View>
  );
}
