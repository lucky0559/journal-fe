import type { Entry } from '@/domain/types';

/** Boundary to the server. Implementations: `localOnlyGateway` (tests/offline) and `createApiSharingGateway`. */
export interface SharingGateway {
  /** Uploads the page (and any new files). Returns the entry with the remote file keys filled in. */
  publish(entry: Entry): Promise<Entry>;
  unpublish(entryId: string): Promise<void>;
}

export const localOnlyGateway: SharingGateway = {
  publish: async (entry) => entry,
  unpublish: async () => {},
};
