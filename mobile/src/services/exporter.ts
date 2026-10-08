import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { summarizeEntry } from '@/domain/entrySummary';
import type { Entry } from '@/domain/types';
import { VIS } from '@/domain/visibility';
import { fmtLong } from '@/lib/dates';
import { useLock } from '@/state/lockStore';
import { colors, ramp } from '@/theme/tokens';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Text-only export: photos and voice notes are listed in the meta line but not embedded. Oldest page first. */
export function buildExportHtml(entries: Entry[], name: string): string {
  const title = name.trim() ? `${esc(name.trim())}’s journal` : 'My journal';
  const ordered = [...entries].sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
  const pages = ordered
    .map((e) => {
      const s = summarizeEntry(e);
      return `<section>
  <h2>${esc(fmtLong(e.date))} · ${esc(e.time)}</h2>
  <p class="meta">${esc(s.moodLabel)} · ${esc(VIS[e.vis].label)}</p>
  ${e.prompt ? `<p class="prompt">${esc(e.prompt)}</p>` : ''}
  <p>${esc(s.text).replace(/\n/g, '<br/>')}</p>
  ${s.meta ? `<p class="meta">${esc(s.meta)}</p>` : ''}
</section>`;
    })
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
body{font-family:Georgia,serif;color:${colors.text};padding:32px;line-height:1.5}
h1{font-size:28px}h2{font-size:16px;margin:0}section{margin:24px 0;page-break-inside:avoid}
.meta{color:${ramp.neutral[700]};font-size:12px;margin:2px 0}.prompt{font-style:italic;color:${ramp.accent[700]}}
</style></head><body><h1>${title}</h1>${pages || '<p>No pages yet.</p>'}</body></html>`;
}

export async function exportPages(entries: Entry[], name: string): Promise<'shared' | 'unavailable'> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const { uri } = await Print.printToFileAsync({ html: buildExportHtml(entries, name) });
  await useLock.getState().withoutRelock(() => Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Export my pages' }));
  return 'shared';
}
