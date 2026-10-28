import { sampleEntries } from '../../test/sampleEntries';
import type { Entry } from '@/domain/types';
import { buildExportHtml } from './exporter';

const base = sampleEntries('2026-10-08');

it('lists pages oldest first with date, time, mood and audience', () => {
  const html = buildExportHtml(base, 'Maya');
  expect(html).toContain('Maya’s journal');
  expect(html.indexOf('Sunday, 20 September')).toBeGreaterThan(-1);
  expect(html.indexOf('Sunday, 20 September')).toBeLessThan(html.indexOf('Wednesday, 7 October'));
  expect(html).toContain('3:45 pm');
  expect(html).toContain('Bright');
  expect(html).toContain('Friends');
});

it('escapes user text so a page can never inject markup', () => {
  const evil: Entry = { ...base[0], text: '<script>alert("x")</script> & "q" \'s', prompt: '<b>p</b>' };
  const html = buildExportHtml([evil], '<i>Name</i>');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<b>p</b>');
  expect(html).not.toContain('<i>Name</i>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&amp;');
  expect(html).toContain('&quot;q&quot;');
});

it('keeps line breaks, the prompt, and "No words, just moments." for media-only pages', () => {
  const multi: Entry = { ...base[0], text: 'one\ntwo', prompt: 'Who?' };
  expect(buildExportHtml([multi], '')).toMatch(/one<br\s*\/?>two/);
  expect(buildExportHtml([multi], '')).toContain('Who?');
  const stickerOnly: Entry = { ...base[0], text: '', prompt: '', stickers: ['calm'] };
  expect(buildExportHtml([stickerOnly], '')).toContain('No words, just moments.');
});

it('handles an empty journal and a missing name', () => {
  const html = buildExportHtml([], '');
  expect(html).toContain('My journal');
  expect(html).toContain('No pages yet.');
});
