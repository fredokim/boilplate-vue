/**
 * Copied from react-boilerplate and adapted. See scripts/build-tokens.ts for
 * why the token source and its tooling are duplicated across the three
 * repositories.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { renderOutputs } from './build-tokens';

/**
 * Fails when a generated file no longer matches `tokens/tokens.json`.
 *
 * It renders and compares rather than regenerating. `check:ci` already runs
 * `generate-theme-scss`, which overwrites its output — so a hand-edited
 * generated file is silently replaced and CI stays green while the committed
 * copy is wrong. Comparing is what turns that into a failure.
 */

const CR = String.fromCharCode(13);
const NEWLINE = String.fromCharCode(10);

function normalise(text: string): string {
  return text.split(CR).join('');
}

const failures: string[] = [];

for (const [path, expected] of renderOutputs()) {
  const name = basename(path);

  if (!existsSync(path)) {
    failures.push(`${name} is missing. Run: npm run tokens:build`);
    continue;
  }

  const actual = normalise(readFileSync(path, 'utf8'));
  const wanted = normalise(expected);

  if (actual === wanted) continue;

  const actualLines = actual.split(NEWLINE);
  const wantedLines = wanted.split(NEWLINE);
  const at = actualLines.findIndex((line, index) => line !== wantedLines[index]);

  failures.push(
    [
      `${name} does not match tokens/tokens.json`,
      `  line ${String(at + 1)}`,
      `  committed: ${actualLines[at] ?? '(end of file)'}`,
      `  generated: ${wantedLines[at] ?? '(end of file)'}`,
    ].join(NEWLINE),
  );
}

if (failures.length > 0) {
  console.error(failures.join(NEWLINE + NEWLINE));
  console.error(`${NEWLINE}Edit tokens/tokens.json, not the generated files, then run: npm run tokens:build`);
  process.exit(1);
}

console.log('[tokens] Generated files match tokens/tokens.json.');
