/**
 * Copied from react-boilerplate and adapted. The three repositories are
 * separate remotes, so the token source and its tooling are duplicated rather
 * than published as a package. react-boilerplate holds the copy to change
 * first.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

/**
 * Generates this repository's token files from the shared source.
 *
 * Two outputs, for a reason. `src/core/theme/tokens.ts` is imported by runtime
 * code — `useTheme`, `themeColors`, `theme/utils` — and by the existing SCSS
 * generator, so it has to stay a TypeScript module rather than become CSS.
 * The neutral scale and the focus ring live in `design-system.scss` beside
 * component styles, so they are emitted separately and imported from there.
 *
 * `scripts/generate-theme-scss.ts` still runs afterwards, unchanged. It reads
 * the tokens.ts this script writes.
 */

type Token = { $value: string; $type?: string };

const SOURCE = resolve(process.cwd(), 'tokens/tokens.json');
const TOKENS_TS = resolve(process.cwd(), 'src/core/theme/tokens.ts');
const NEUTRAL_SCSS = resolve(process.cwd(), 'src/assets/scss/generated/ds-neutral.scss');

const source: unknown = JSON.parse(readFileSync(SOURCE, 'utf8'));

function flatten(node: unknown, path: string[] = [], out = new Map<string, Token>()): Map<string, Token> {
  if (typeof node !== 'object' || node === null) return out;

  const record = node as Record<string, unknown>;

  if ('$value' in record) {
    out.set(path.join('.'), record as unknown as Token);
    return out;
  }

  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith('$')) continue;
    flatten(value, [...path, key], out);
  }

  return out;
}

const tokens = flatten(source);

function resolveValue(path: string): string {
  const start = tokens.get(path);

  if (start === undefined) throw new Error(`Unknown token: ${path}`);

  let value: string = start.$value;

  for (let hops = 0; value.startsWith('{'); hops += 1) {
    if (hops > 10) throw new Error(`Reference cycle at ${path}`);

    const target = value.slice(1, -1);
    const next = tokens.get(target);

    if (next === undefined) throw new Error(`${path} references unknown token ${target}`);

    value = next.$value;
  }

  return value;
}

const NEWLINE = String.fromCharCode(10);
const QUOTE = String.fromCharCode(34);

/** Members of a group, as `[leafName, resolvedValue]`, in source order. */
function members(group: string): [string, string][] {
  return [...tokens.keys()]
    .filter((path) => path.startsWith(`${group}.`))
    .map((path) => [path.slice(group.length + 1), resolveValue(path)]);
}

/**
 * A value goes in double quotes unless it already contains them. The font stack
 * quotes its family names, so wrapping it again would produce a broken literal.
 */
function literal(value: string): string {
  return value.includes(QUOTE) ? `'${value}'` : `${QUOTE}${value}${QUOTE}`;
}

function tsObject(name: string, group: string, asConst: boolean): string {
  const body = members(group)
    .map(([key, value]) => `  ${/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : key}: ${literal(value)},`)
    .join(NEWLINE);

  return `export const ${name} = {${NEWLINE}${body}${NEWLINE}}${asConst ? ' as const' : ''};`;
}

/**
 * `colorKeys` is ordered independently of the theme objects: it lists the
 * accent roles only, and in a different order. `getThemeColors` maps over it to
 * build a swatch list, so the order is visible on screen. It comes from the
 * source's `$extensions` rather than being derived, because deriving it would
 * silently reorder that list.
 */
const themeExtensions = (source as {
  theme?: { $extensions?: { colorKeys?: { value?: string[] } } };
}).theme?.$extensions?.colorKeys?.value;

if (themeExtensions === undefined) throw new Error('tokens.json is missing theme.$extensions.colorKeys');

const accentKeys = themeExtensions;

const parts = [
  '// AUTO-GENERATED from tokens/tokens.json. Do not edit.',
  '// Regenerate: npm run tokens:build',
  '',
  `export const colorKeys = [${NEWLINE}${accentKeys.map((key) => `  ${QUOTE}${key}${QUOTE},`).join(NEWLINE)}${NEWLINE}] as const;`,
  '',
  tsObject('darkTheme', 'theme.dark', false),
  '',
  tsObject('lightTheme', 'theme.light', false),
  '',
  tsObject('spacingTokens', 'ds.spacing', true),
  '',
  tsObject('radiusTokens', 'ds.radius', true),
  '',
  tsObject('shadowTokens', 'ds.shadow', true),
  '',
  tsObject('typographyTokens', 'ds.typography', true),
  '',
  tsObject('zIndexTokens', 'ds.zIndex', true),
  '',
  [
    'export const designTokens = {',
    '  radius: radiusTokens,',
    '  shadow: shadowTokens,',
    '  spacing: spacingTokens,',
    '  typography: typographyTokens,',
    '  zIndex: zIndexTokens,',
    '} as const;',
  ].join(NEWLINE),
  '',
];

export function renderOutputs(): Map<string, string> {
  const neutral = members('ds.colorNeutral')
    .map(([key, value]) => `  --ds-color-neutral-${key}: ${value};`)
    .join(NEWLINE);

  const scss = [
    '// AUTO-GENERATED from tokens/tokens.json. Do not edit.',
    '// Regenerate: npm run tokens:build',
    '',
    ':root {',
    neutral,
    `  --ds-focus-ring: ${resolveValue('ds.focusRing')};`,
    '}',
    '',
  ].join(NEWLINE);

  return new Map([
    [TOKENS_TS, parts.join(NEWLINE)],
    [NEUTRAL_SCSS, scss],
  ]);
}

const isEntryPoint = process.argv[1]?.endsWith('build-tokens.ts') ?? false;

if (isEntryPoint) {
  for (const [path, content] of renderOutputs()) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf8');
    console.log(`[tokens] ${basename(path)}`);
  }
}
