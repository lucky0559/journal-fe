/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = [join(__dirname, '..'), join(__dirname, '..', '..', 'app')];
const HEX = /#[0-9a-fA-F]{6}\b/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
}

it('has no hex colours outside src/theme (use tokens)', () => {
  const offenders = ROOTS.flatMap(files)
    .filter((f) => !f.includes(join('src', 'theme')))
    .filter((f) => HEX.test(readFileSync(f, 'utf8')));
  expect(offenders).toEqual([]);
});
