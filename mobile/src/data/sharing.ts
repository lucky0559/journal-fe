import type { Entry } from '@/domain/types';

/** Boundary for the future backend. v1 ships local-only: nothing leaves the device. */
export interface SharingGateway {
  publish(entry: Entry): Promise<void>;
  unpublish(entryId: string): Promise<void>;
}

export const localOnlyGateway: SharingGateway = {
  publish: async () => {},
  unpublish: async () => {},
};
