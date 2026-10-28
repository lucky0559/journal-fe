import type { Entry } from '@/domain/types';

/** Boundary to the server. Implementations: `localOnlyGateway` (tests/offline) and `createApiSharingGateway`. */
export interface SharingGateway {
  /**
   * Saves the page to the account (and uploads any new files), whatever its visibility. Returns the entry with the remote
   * file keys filled in, and `publishedAt` set to the server's time when it knows it.
   */
  publish(entry: Entry): Promise<Entry>;
  /** Deletes the page from the account. */
  unpublish(entryId: string): Promise<void>;
  /** The account's whole journal, as the server has it. Files are still remote links until `localize`d. */
  restore(): Promise<Entry[]>;
  /** Saves a restored page's photos and voice notes onto the phone. A file that can't be downloaded keeps its link. */
  localize(entry: Entry): Promise<Entry>;
}

export const localOnlyGateway: SharingGateway = {
  publish: async (entry) => entry,
  unpublish: async () => {},
  restore: async () => [],
  localize: async (entry) => entry,
};
