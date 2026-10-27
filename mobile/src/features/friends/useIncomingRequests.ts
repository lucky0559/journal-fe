import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiUser } from '@/api/types';
import { useToast } from '@/state/toastStore';

interface Social {
  incoming(): Promise<ApiUser[]>;
  accept(id: string): Promise<unknown>;
  decline(id: string): Promise<unknown>;
}

export const UPDATE_FAILED = 'Couldn’t update that. Try again.';

export function useIncomingRequests(social: Social, onChanged?: () => void) {
  const [items, setItems] = useState<ApiUser[]>([]);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const reload = useCallback(async () => {
    try {
      const list = await social.incoming();
      if (alive.current) setItems(list);
    } catch {
      // requests are secondary; the feed screen handles its own errors
    }
  }, [social]);

  useEffect(() => { void reload(); }, [reload]);

  const answer = async (user: ApiUser, accept: boolean) => {
    try {
      await (accept ? social.accept(user.id) : social.decline(user.id));
      setItems((l) => l.filter((u) => u.id !== user.id));
      if (accept) {
        useToast.getState().show(`You and ${user.givenName} are now friends`);
        onChanged?.();
      }
    } catch {
      useToast.getState().show(UPDATE_FAILED);
    }
  };

  return { items, reload, accept: (u: ApiUser) => answer(u, true), decline: (u: ApiUser) => answer(u, false) };
}
