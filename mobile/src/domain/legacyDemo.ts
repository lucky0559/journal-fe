import type { Entry } from './types';

/**
 * Earlier builds put eight sample pages (ids `demo-1`…`demo-8`, marked as already synced) into development
 * installs. They were never real writing and never reached the server, so they are cleared away on start.
 */
export const isLegacyDemoEntry = (e: Pick<Entry, 'id' | 'publishedAt'>): boolean => /^demo-\d+$/.test(e.id) && e.publishedAt === 1;
