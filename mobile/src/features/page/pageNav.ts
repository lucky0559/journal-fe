import type { Entry } from '@/domain/types';

export interface PagePosition {
  entry: Entry;
  /** The page written before this one, or null for the first page of the journal. */
  older: Entry | null;
  /** The page written after this one, or null for the latest page. */
  newer: Entry | null;
  /** 1-based, counting from the first page ever written. */
  position: number;
  total: number;
}

/** Where a page sits in the journal. `entries` is newest first, as the store keeps it. */
export function pagePosition(entries: Entry[], id: string | undefined): PagePosition | null {
  const i = id ? entries.findIndex((e) => e.id === id) : -1;
  if (i < 0) return null;
  return { entry: entries[i], newer: entries[i - 1] ?? null, older: entries[i + 1] ?? null, position: entries.length - i, total: entries.length };
}

/** How many ruled lines fit behind `height` pixels of text, plus a couple of empty ones so the page doesn't stop abruptly. */
export const ruledLineCount = (height: number, lineHeight: number, extra = 2): number =>
  height <= 0 ? 0 : Math.ceil(height / lineHeight) + extra;
