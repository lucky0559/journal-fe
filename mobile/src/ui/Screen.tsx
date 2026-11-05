import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme/tokens';
import { usePullRefresh } from './pullRefresh';
import { ScreenFade } from './ScreenFade';

interface Props { children: React.ReactNode; scroll?: boolean; topPad?: number; bottomPad?: number; gap?: number; /** Pull down to run this; the spinner shows until it settles. */ onRefresh?: () => Promise<unknown> | void }

const nothing = () => {};

export function Screen({ children, scroll = true, topPad = 14, bottomPad = 110, gap = 24, onRefresh }: Props) {
  const refreshControl = usePullRefresh(onRefresh ?? nothing);
  const { top } = useSafeAreaInsets();
  const pad = { paddingTop: top + topPad, paddingHorizontal: layout.screenPadding, gap };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade>
        {scroll ? (
          <ScrollView refreshControl={onRefresh ? refreshControl : undefined} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ ...pad, paddingBottom: bottomPad }}>
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, ...pad }}>{children}</View>
        )}
      </ScreenFade>
    </View>
  );
}
