import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { colors, ramp } from '@/theme/tokens';

/** The pull-down-to-refresh control for a ScrollView: spins while `refresh` runs, and a failed refresh just stops quietly. */
export function usePullRefresh(refresh: () => Promise<unknown> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      // offline: leave what is on screen
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);
  return <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={ramp.neutral[100]} />;
}
