import { useRouter, usePathname } from 'expo-router';
import { useEntries } from '@/state';
import { useTimelineUi } from '@/state/timelineStore';
import { defaultDateForNewPage } from '@/domain/draft';
import { todayIso } from '@/lib/dates';

export function useNewPage(): () => void {
  const router = useRouter();
  const pathname = usePathname();
  return () => {
    const { mode, selDay } = useTimelineUi.getState();
    const date = defaultDateForNewPage({
      route: pathname.startsWith('/timeline') ? 'timeline' : 'today',
      mode, selDay, today: todayIso(),
      selDayHasEntries: useEntries.getState().entries.some((e) => e.date === selDay),
    });
    router.push({ pathname: '/write', params: { date } });
  };
}
