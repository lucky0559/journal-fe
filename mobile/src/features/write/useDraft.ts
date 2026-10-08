import { useMemo, useReducer } from 'react';
import { draftReducer, editDraft, newDraft, type DraftAction } from '@/domain/draft';
import type { Entry } from '@/domain/types';
import { newId } from '@/lib/id';
import { useEntries } from '@/state';
import { useCheckin } from '@/state/checkinStore';

interface Params { entryId?: string; prompt?: string; date?: string }

export function useDraft(params: Params): { original: Entry | null; initial: Entry; draft: Entry; dispatch: (a: DraftAction) => void } {
  // Snapshot once: later changes to the stored list must not rewrite what the user is typing.
  const { original, initial } = useMemo(() => {
    const found = params.entryId ? useEntries.getState().entries.find((e) => e.id === params.entryId) ?? null : null;
    const { mood, feelings } = useCheckin.getState();
    const first = found
      ? editDraft(found)
      : newDraft({ id: newId(), now: new Date(), mood, feelings, date: params.date, prompt: params.prompt });
    return { original: found, initial: first };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [draft, dispatch] = useReducer(draftReducer, initial);
  return { original, initial, draft, dispatch };
}
