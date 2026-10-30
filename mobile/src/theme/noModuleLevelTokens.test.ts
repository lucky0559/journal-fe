/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// The colours change when the theme does, so a value read from them while a file loads would keep the first theme's
// colours forever. This catches the usual ways of doing that: a top-level constant or StyleSheet built from tokens.
// Read tokens while rendering instead (or use themedStyles); a function that returns them is fine.

const ROOTS = [join(__dirname, '..'), join(__dirname, '..', '..', 'app')];
const TOKEN = /\b(colors|ramp|shadows)\.|\bMOOD_COLORS\b|\bmoodColor\(|\bheading\(|\bbody\(/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
}

/** Top-level statements: a line at column 0 plus everything indented under it, up to the next column-0 line. */
function topLevelStatements(src: string): { line: number; text: string }[] {
  const lines = src.split('\n');
  const out: { line: number; text: string }[] = [];
  let cur: { line: number; text: string } | null = null;
  lines.forEach((l, i) => {
    if (/^\S/.test(l) && !/^[}\])]/.test(l)) {
      if (cur) out.push(cur);
      cur = { line: i + 1, text: l };
    } else if (cur) {
      cur.text += '\n' + l;
    }
  });
  if (cur) out.push(cur);
  return out;
}

it('reads no theme colours while a file loads (use them while rendering, or via themedStyles)', () => {
  const offenders = ROOTS.flatMap(files)
    .filter((f) => !f.includes(join('src', 'theme')))
    // lib/mood.ts owns MOOD_COLORS: one array, refilled in place by the theme listener (tested in mood.test.ts)
    .filter((f) => !f.endsWith(join('src', 'lib', 'mood.ts')))
    .flatMap((f) =>
      topLevelStatements(readFileSync(f, 'utf8'))
        // `const x = ...` or `export const x = ...` only; functions, components, imports and types are not evaluated at load
        .filter((s) => /^(export )?(const|let|var) /.test(s.text))
        // an arrow function or function expression is only evaluated when called
        .filter((s) => !/^(export )?(const|let|var) [\w$]+(: [^=]+)? = (async )?(\([^)]*\)|[\w$]+)(: [^=]+)? =>/.test(s.text.split('\n')[0]) && !/= (async )?function\b/.test(s.text.split('\n')[0]))
        // themedStyles(() => ...) defers the colours until it is called
        .filter((s) => !/themedStyles\(/.test(s.text))
        .filter((s) => TOKEN.test(s.text))
        .map((s) => `${f.split('/mobile/')[1] ?? f}:${s.line}  ${s.text.split('\n')[0].trim()}`),
    );
  expect(offenders).toEqual([]);
});
